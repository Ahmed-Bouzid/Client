/**
 * ═══════════════════════════════════════════════════════════════
 * App.jsx — ORCHESTRATEUR PRINCIPAL DU PARCOURS CLIENT
 * ═══════════════════════════════════════════════════════════════
 *
 * Machine à états (step) qui contrôle la navigation :
 *   "join" → "menu" → "addOn" → "orders" → "payment" → "tracking"
 *
 * Responsabilités :
 *   - Gère la connexion utilisateur (QR code / admin unlock)
 *   - Initialise les stores (table, commande, allergies, restaurant)
 *   - Route vers le bon écran selon le step actif
 *   - Coordonne la soumission de commande, le paiement et le reset session
 *   - Gère le mode fast-food (commande en attente locale avant envoi BDD)
 *
 * Parcours principal :
 *   1. WelcomeScreen → saisie prénom/téléphone, rejoint une table
 *   2. MenuScreen → consultation menu, ajout au panier
 *   3. OrderScreen → récapitulatif commande, validation
 *   4. Payment → paiement Stripe, ticket de caisse, avis Google
 *   5. OrderTrackingScreen → suivi temps réel (polling + WebSocket)
 *   6. Retour WelcomeScreen → nouveau cycle
 * ═══════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "./src/config/api";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import MenuScreen from "./src/screens/MenuScreen";
import OrderScreen from "./src/screens/OrderScreen";
import AddOn from "./src/components/menu/AddOn";
import Payment from "./src/screens/Payment";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import AdminUnlockScreen from "./src/screens/AdminUnlockScreen";
import AdminSelectionScreen from "./src/screens/AdminSelectionScreen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useCustomAlert } from "./src/utils/customAlert";
import { useClientTableStore } from "./src/stores/useClientTableStore";
import { useOrderStore } from "./src/stores/useOrderStore";
import { useAllergyStore } from "./src/stores/useAllergyStore";
import { useRestrictionStore } from "./src/stores/useRestrictionStore";
import { useRestaurantStore } from "./src/stores/useRestaurantStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUrlParams } from "./src/utils/getUrlParams";
import { Platform, View, StyleSheet, AppState } from "react-native";
import { ThemeProvider } from "./src/theme";
import { clientAuthService } from "shared-api/services/clientAuthService";
import { secureSessionStore } from "shared-api/utils/secureSessionStore";

export default function App() {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
}

// ⭐ Default IDs (utilisés en fallback si pas d'IDs en URL)
const DEFAULT_TABLE_ID = "DEFAULT";
const DEFAULT_RESTAURANT_ID = "DEFAULT";
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

function AppContent() {
	const appStateRef = useRef(AppState.currentState);
	// ── PARCOURS CLIENT : état de navigation principal ──
	const [step, setStep] = useState("join"); // join → menu → addOn → orders → payment → tracking → order-details
	const [trackingOrderId, setTrackingOrderId] = useState("");
	const [reservationId, setReservationId] = useState("");
	const [clientId, setClientId] = useState("");
	const [tableNumber, setTableNumber] = useState(null);
	
	// 🔍 Order lookup (Grillz: retrouver une commande par #XXX-XXX)
	const [lookupOrderData, setLookupOrderData] = useState(null);
	
	// 🔐 Admin unlock flow
	const [adminMode, setAdminMode] = useState(null); // null, "locked", "unlocked"
	const [adminUnlockToken, setAdminUnlockToken] = useState(null);
	const [forceRefresh, setForceRefresh] = useState(0); // Force remount après admin

	// 🍔 Fast-food: commande en attente (pas encore en BDD)
	const [fastFoodPending, setFastFoodPending] = useState(false);
	const autoSubmitPromiseRef = useRef(null);

	// Restaurant category
	const restaurantCategory = useRestaurantStore((state) => state.category);
	const isFastFood = restaurantCategory === "fast-food";

	// En production, tableId et restaurantId viennent du QR code (URL param)
	// Pas d'ID hardcodé - l'app doit être scannée via QR code

	// Stores
	const {
		tableId,
		restaurantId,
		userName,
		init: initTable,
		setUserName,
		joinTable,
	} = useClientTableStore();

	const {
		currentOrder,
		allOrders,
		activeOrderId,
		hasActiveOrder,
		init: initOrder,
		resetOrder,
		addToOrder,
		updateOrderQuantity,
		submitOrder: submitOrderToServer,
		markAsPaid,
		initCart,
		clearCart,
	} = useOrderStore();

	const { showAlert, AlertComponent } = useCustomAlert();

	const forceSecureLogout = async () => {
		await clientAuthService.revokeCurrentToken();
		await secureSessionStore.clearSensitiveSession();
		await AsyncStorage.multiRemove([
			"currentReservationId",
			"currentTableId",
			"currentTableNumber",
			"currentClientName",
			"currentClientPhone",
			"pseudo",
			"tableId",
			"restaurantId",
			"clientPhone",
			"clientToken",
		]);

		await useClientTableStore.getState().reset?.();
		resetOrder();
		await useOrderStore.getState().clearCart();
		useAllergyStore.getState().clear?.();
		useRestrictionStore.getState().clearRestrictions?.();

		setReservationId(null);
		setTableNumber(null);
		setUserName("");
		setClientId(null);
		setStep("join");
	};

	// 🔐 Initialisation admin mode au démarrage
	useEffect(() => {
		const checkAdminMode = async () => {
			const {
				restaurantId: urlRestaurantId,
				tableId: urlTableId,
				orderId: urlOrderId,
				isTrackingRoute,
			} = getUrlParams();

			if (isTrackingRoute && urlOrderId) {
				setTrackingOrderId(urlOrderId);
				setStep("tracking");
				setAdminMode(null);
				return;
			}
			const storedRestaurantId = await AsyncStorage.getItem("restaurantId");
			const storedTableId = await AsyncStorage.getItem("tableId");
			
			// Si pas d'IDs (URL ou AsyncStorage), on affiche le mode admin (mot de passe)
			if (!urlRestaurantId && !storedRestaurantId) {
				setAdminMode("locked");
			} else if (!urlTableId && !storedTableId) {
				setAdminMode("locked");
			} else {
				setAdminMode(null);
			}
		};
		
		checkAdminMode();
	}, []);

	// Initialisation au démarrage
	useEffect(() => {
		const initialize = async () => {
			// 🌐 Sur web : lire restaurantId + tableId depuis l'URL (/r/[restaurantId]/[tableId])
			const {
				restaurantId: urlRestaurantId,
				tableId: urlTableId,
				orderId: urlOrderId,
				isTrackingRoute,
			} = getUrlParams();

			if (isTrackingRoute && urlOrderId) {
				setTrackingOrderId(urlOrderId);
				setStep("tracking");
				await initOrder();
				await useAllergyStore.getState().init();
				await useRestrictionStore.getState().init();
				return;
			}

			// 🔐 Vérifier AsyncStorage d'abord (fallback du mode admin)
			const storedRestaurantId = await AsyncStorage.getItem("restaurantId");
			const storedTableId = await AsyncStorage.getItem("tableId");

			// IDs: URL > AsyncStorage > null
			const finalRestaurantId = urlRestaurantId || storedRestaurantId || null;
			const finalTableId = urlTableId || storedTableId || null;

			// ⭐ Si pas d'IDs, on ne fait rien (mode admin)
			if (!finalRestaurantId || !finalTableId) {
				return;
			}

			// Persister dans AsyncStorage pour que les stores y aient accès
			if (urlRestaurantId) {
				await AsyncStorage.setItem("restaurantId", urlRestaurantId);
			}
			if (urlTableId) {
				await AsyncStorage.setItem("tableId", urlTableId);
			}

			await initTable(finalTableId, finalRestaurantId);
			await initOrder();

			// ⭐ Initialiser les stores d'allergies et restrictions
			await useAllergyStore.getState().init();
			await useRestrictionStore.getState().init();

			// ⭐ Récupérer le numéro de table depuis l'API (si tableId disponible)
			if (finalTableId) {
				try {
					const response = await fetch(
						`${API_BASE_URL}/tables/${finalTableId}`,
					);
					if (response.ok) {
						const tableData = await response.json();
						setTableNumber(tableData.number || tableData.tableNumber || "?");
					}
				} catch (error) {
					console.error("Erreur récupération table:", error);
				}
			}
		};
		initialize();
	}, []);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", async (nextState) => {
			const previousState = appStateRef.current;

			if (previousState === "active" && /inactive|background/.test(nextState)) {
				await secureSessionStore.setString(
					secureSessionStore.keys.APP_BACKGROUND_AT,
					String(Date.now()),
				);
			}

			if (/inactive|background/.test(previousState) && nextState === "active") {
				const lastBackgroundRaw = await secureSessionStore.getString(
					secureSessionStore.keys.APP_BACKGROUND_AT,
				);
				const lastBackgroundAt = Number(lastBackgroundRaw || 0);
				const elapsed = Date.now() - lastBackgroundAt;

				if (lastBackgroundAt && elapsed >= INACTIVITY_TIMEOUT_MS) {
					await forceSecureLogout();
					showAlert(
						"Session expirée",
						"Session fermée après 15 minutes d'inactivité.",
						[{ text: "OK" }],
					);
				}
			}

			appStateRef.current = nextState;
		});

		return () => {
			subscription.remove();
		};
	}, [showAlert]);

	const navigateToTracking = (orderId) => {
		if (!orderId) return;

		setTrackingOrderId(orderId);
		setStep("tracking");

		if (Platform.OS === "web" && typeof window !== "undefined") {
			const targetPath = `/suivi/${orderId}`;
			if (window.location.pathname !== targetPath) {
				window.history.replaceState({}, "", targetPath);
			}
		}
	};

	// Initialiser le panier quand le userName change
	// Pour une nouvelle connexion, on nettoie le panier précédent
	useEffect(() => {
		if (userName) {
			// clearPrevious = true pour une nouvelle connexion
			initCart(userName, true);
		}
	}, [userName]);

	// Handler pour rejoindre une table
	const handleJoinTable = async (
		clientName,
		reservationId,
		tableIdParam,
		tableNumberParam,
		clientIdParam,
	) => {
		try {
			if (!tableIdParam || !restaurantId) {
				showAlert(
					"Erreur",
					"Contexte table/restaurant manquant. Re-scanner le QR code.",
					[{ text: "OK" }],
				);
				return;
			}

			// ⭐ Stocker toutes les infos
			setUserName(clientName);
			setReservationId(reservationId);
			setTableNumber(tableNumberParam);
			setClientId(clientIdParam);

			// ⭐ Mettre à jour le store avec les infos (sans rappeler /client/token)
			// Le token a déjà été obtenu dans WelcomeScreen
			const { setTable } = useClientTableStore.getState();
			await setTable(tableIdParam, restaurantId);
			useClientTableStore.setState({ userName: clientName });

			resetOrder();
			await clearCart();
			setStep("menu");
		} catch (error) {
			console.error("❌ [App] Erreur join table:", error);
		}
	};

	// ── PARCOURS : ajoute un article au panier (persisté automatiquement dans AsyncStorage) ──
	const handleAddOrder = (item) => {
		addToOrder(item, userName);
	};

	// Handler pour mettre à jour la quantité (useOrderStore persiste automatiquement)
	const handleUpdateQuantity = (item, quantity) => {
		updateOrderQuantity(item, quantity);
	};

	// ── PARCOURS : soumet la commande au serveur (crée l'order en BDD) ──
	// Appelé après validation du panier (MenuScreen) ou auto-submit fast-food (10s)
	const submitOrder = async ({ redirectToTracking = true, showSuccessAlert = true } = {}) => {
		if (currentOrder.length === 0) {
			showAlert(
				"Panier vide",
				"Veuillez ajouter des articles avant de commander.",
				[{ text: "OK" }],
			);
			return null;
		}

		// ⭐ VÉRIFIER qu'on a les infos nécessaires
		if (!reservationId) {
			showAlert(
				"Erreur",
				"Aucune réservation active. Veuillez rejoindre une table d'abord.",
				[{ text: "OK" }],
			);
			return null;
		}

		try {
			// 📱 Récupérer le téléphone depuis AsyncStorage
			const clientPhone = await AsyncStorage.getItem("clientPhone");

			// Préparer les données COMPLÈTES
			const orderData = {
				tableId: tableId || DEFAULT_TABLE_ID,
				restaurantId: restaurantId || DEFAULT_RESTAURANT_ID,
				reservationId: reservationId, // ⭐ DÉJÀ PRÉSENT
				clientId: clientId, // ⭐ AJOUTER
				clientName: userName, // ⭐ AJOUTER (userName vient du store)
				clientPhone: clientPhone || null, // 📱 AJOUTER LE TÉLÉPHONE
				items: currentOrder.map((item) => ({
					productId: item._id,
					name: item.name,
					price: item.price,
					quantity: item.quantity || 1,
				})),
				total: currentOrder.reduce(
					(sum, item) => sum + item.price * (item.quantity || 1),
					0,
				),
				status: "in_progress",
				origin: "client",
			};


			// ⭐ ENVOYER TOUTES LES DONNÉES (submitOrder nettoie le panier persisté)
			const createdOrder = await submitOrderToServer(orderData);

			const createdOrderId = createdOrder?._id || createdOrder?.id || null;

			if (redirectToTracking && createdOrderId) {
				navigateToTracking(createdOrderId);
			}

			if (showSuccessAlert) {
				showAlert(
					"✅ Commande envoyée",
					redirectToTracking && createdOrderId
						? "Votre commande est envoyée. Suivi en temps reel active."
						: "Votre commande a été envoyée avec succès !",
					[
						{
							text: "OK",
							onPress: () => {
								if (!redirectToTracking) {
									setStep("menu");
								}
							},
						},
					],
				);
			}

			return createdOrder;
		} catch (error) {
			console.error("Erreur création commande dans App.js:", error);
			showAlert(
				"Erreur",
				error.message || "Erreur lors de la création de la commande",
			);
			return null;
		}
	};

	// ── PARCOURS : transition Menu → OrderScreen (charge les commandes serveur) ──
	const handleValidateOrder = async () => {
		// 🍔 Fast-food: la commande n'est pas encore en BDD, on navigue directement
		if (isFastFood && currentOrder.length > 0) {
			setFastFoodPending(true);
			setStep("orders");
			return;
		}

		// Charger les commandes fraîches depuis le serveur
		if (reservationId) {
			try {
				await useOrderStore.getState().fetchOrdersByReservation(reservationId, clientId);
			} catch (error) {
				console.error("❌ Erreur chargement commandes:", error);
			}
		}

		// Vérifier qu'il y a des commandes à afficher
		const freshOrders = useOrderStore.getState().allOrders;
		if (!freshOrders || freshOrders.length === 0) {
			showAlert("Aucune commande", "Aucune commande trouvée pour cette réservation.", [
				{ text: "OK" },
			]);
			return;
		}
		setStep("orders");
	};

	// Handler pour compléter les add-ons
	const handleAddOnComplete = (addOns) => {
		addOns.forEach((item) => {
			const existing = currentOrder.find((o) => o._id === item._id);
			if (existing) {
				updateOrderQuantity(existing, existing.quantity + item.quantity);
			} else {
				addToOrder({ ...item, quantity: item.quantity }, userName);
			}
		});
		setStep("orders");
	};

	// ── PARCOURS : transition OrderScreen → Payment (soumet le panier restant puis navigue) ──
	const handlePayNow = async () => {
		if (!reservationId) {
			showAlert("Erreur", "Aucune réservation active", [{ text: "OK" }]);
			return;
		}

		try {
			if (autoSubmitPromiseRef.current) {
				await autoSubmitPromiseRef.current;
			}

			// If there is an in-progress cart, submit it first. If already submitted,
			// skip submission and only navigate to payment with fetched orders.
			if (currentOrder.length > 0) {
				const createdOrder = await submitOrder({
					redirectToTracking: false,
					showSuccessAlert: false,
				});
				if (!createdOrder) return;
			}
			
			// Puis charger les commandes et naviguer vers payment
			await useOrderStore
				.getState()
				.fetchOrdersByReservation(reservationId, clientId);

			setFastFoodPending(false);

			// Passer à l'écran de paiement
			setStep("payment");
		} catch (error) {
			console.error("❌ Erreur soumission commande:", error);
			showAlert("Erreur", "Impossible de soumettre la commande", [
				{ text: "OK" },
			]);
		}
	};

	// Navigation vers le paiement (ancien flow)
	const navigateToPayment = async () => {
		if (!reservationId) {
			showAlert("Erreur", "Aucune réservation active", [{ text: "OK" }]);
			return;
		}

		try {
			// ⭐ CHARGER LES COMMANDES DEPUIS L'API AVANT DE NAVIGUER
			await useOrderStore
				.getState()
				.fetchOrdersByReservation(reservationId, clientId);

			// Passer à l'écran de paiement
			setStep("payment");
		} catch (error) {
			console.error("❌ Erreur chargement commandes:", error);
			showAlert("Erreur", "Impossible de charger les commandes", [
				{ text: "OK" },
			]);
		}
	};

	// ── PARCOURS : nettoyage complet session après paiement validé ──
	// Reset AsyncStorage + stores + states locaux → retour écran d'accueil
	const handlePaymentSuccess = async () => {
		// Le paiement a déjà été effectué dans Payment.js
		// Nettoyer uniquement la session client; conserver le contexte table/restaurant
		try {
			await clientAuthService.revokeCurrentToken();
			await secureSessionStore.clearSensitiveSession();

			// Nettoyer AsyncStorage de session (garder tableId/restaurantId pour éviter le fallback DEFAULT)
			await AsyncStorage.multiRemove([
				"currentReservationId",
				"currentTableId",
				"currentTableNumber",
				"currentClientName",
				"currentClientPhone",
				"pseudo",
				"clientPhone",
				"clientToken",
			]);

			// Reset les stores métier (sans reset table store)
			resetOrder();
			await useOrderStore.getState().clearCart();
			useAllergyStore.getState().clearAllergies?.();
			useRestrictionStore.getState().clearRestrictions?.();
			useClientTableStore.getState().setUserName?.(null);

			// Reset les states locaux
			setReservationId(null);
			setUserName("");
			setClientId(null);

			// 🔧 Petit délai pour laisser Payment se démontrer proprement
			await new Promise((resolve) => setTimeout(resolve, 100));

			// On redirige vers join (écran de départ)
			setStep("join");

		} catch (error) {
			console.error("❌ Erreur nettoyage session:", error);
			// Même en cas d'erreur, on redirige
			setStep("join");
		}
	};

	return (
		<StripeProvider
			publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
			merchantIdentifier="merchant.com.orderit.app"
		>
			{/* Sur web tablette/desktop, centrer le contenu et limiter la largeur */}
			<View style={Platform.OS === "web" ? styles.webWrapper : { flex: 1 }}>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={Platform.OS === "web" ? [] : ["top", "left", "right"]}
			>
				{/* 🔐 Mode Admin: écran de déverrouillage */}
				{adminMode === "locked" && (
					<AdminUnlockScreen
						onUnlock={(token) => {
							setAdminUnlockToken(token);
							setAdminMode("unlocked");
						}}
					/>
				)}

				{/* 🔐 Mode Admin: sélection restaurant + table */}
				{adminMode === "unlocked" && (
					<AdminSelectionScreen
						adminToken={adminUnlockToken}
						onTableSelected={async (restaurantId, tableId) => {
							// Initialiser les stores avec les nouveaux IDs
							await initTable(tableId, restaurantId);
							
							// Forcer le remount de l'app
							setForceRefresh(prev => prev + 1);
							
							// Sortir du mode admin
							setAdminUnlockToken(null);
							setAdminMode(null);
						}}
					/>
				)}

				{/* 👥 Mode Normal: app client */}
				{adminMode === null && (
					<>
						{step === "join" && (
							<WelcomeScreen
								key={forceRefresh}
								tableId={tableId}
								tableNumber={tableNumber}
								onJoin={({ reservationId, clientId, userName, tableNumber: joinedTableNumber }) => {
									handleJoinTable(userName, reservationId, tableId, joinedTableNumber || tableNumber, clientId);
								}}
								onLookupOrder={(orderData) => {
									setLookupOrderData(orderData);
									setStep("order-details");
								}}
							/>
						)}

						{step === "menu" && (
							<MenuScreen
								userName={userName}
								restaurantId={restaurantId || DEFAULT_RESTAURANT_ID}
								tableId={tableId || DEFAULT_TABLE_ID}
								reservationId={reservationId}
								clientId={clientId}
								tableNumber={tableNumber}
								onAdd={handleAddOrder}
								onValidate={handleValidateOrder}
								onNavigateToOrders={handleValidateOrder}
								onNavigateToPayment={navigateToPayment}
								onBack={() => setStep("join")}
							/>
						)}

						{step === "addOn" && (
							<AddOn
								currentOrders={currentOrder}
								onComplete={handleAddOnComplete}
								onBack={() => setStep("menu")}
							/>
						)}

						{step === "orders" && (
							<OrderScreen
							allOrders={allOrders}
							orderId={activeOrderId}
							clientId={clientId}
							reservationId={reservationId}
							restaurantId={restaurantId || DEFAULT_RESTAURANT_ID}
							tableId={tableId || DEFAULT_TABLE_ID}
							tableNumber={tableNumber}
							userName={userName}
							pendingOrder={fastFoodPending}
							pendingItems={currentOrder}
								onBack={() => {
									setFastFoodPending(false);
									setStep("menu");
								}}
								onPayNow={handlePayNow}
								onReservationClosed={() => setStep("join")}
								onAutoSubmit={async () => {
									// 🍔 Fast-food: envoi automatique après 10s
									if (autoSubmitPromiseRef.current) {
										return;
									}

									autoSubmitPromiseRef.current = (async () => {
										try {
											const created = await submitOrder({
												redirectToTracking: false,
												showSuccessAlert: false,
											});
											if (created) {
												setFastFoodPending(false);
												// Recharger les commandes depuis le serveur
												await useOrderStore
													.getState()
													.fetchOrdersByReservation(reservationId, clientId);
											}
										} catch (e) {
											console.error("❌ Erreur auto-submit fast-food:", e);
										} finally {
											autoSubmitPromiseRef.current = null;
										}
									})();

									await autoSubmitPromiseRef.current;
								}}
								onCancelOrder={() => {
									if (fastFoodPending) {
										// 🍔 Fast-food pending: pas en BDD, juste reset local
										resetOrder();
										clearCart();
										setFastFoodPending(false);
										setStep("menu");
									} else {
										// Commande déjà en BDD : confirmation + annulation serveur
										showAlert("Annuler", "Voulez-vous vraiment annuler la commande ?", [
											{ text: "Non" },
											{
												text: "Oui",
												onPress: async () => {
													try {
														await useOrderStore.getState().cancelAllOrders();
													} catch (e) {
														console.error("❌ Erreur annulation:", e);
													}
													setStep("menu");
												},
											},
										]);
									}
								}}
							/>
						)}

						{step === "payment" && (
							<Payment
								allOrders={allOrders}
								orderId={activeOrderId}
								reservationId={reservationId}
								restaurantId={restaurantId || DEFAULT_RESTAURANT_ID}
								tableId={tableId || DEFAULT_TABLE_ID}
								tableNumber={tableNumber}
								clientId={clientId}
								userName={userName}
								onSuccess={handlePaymentSuccess}
								onBack={() => setStep("menu")}
								onReservationClosed={() => setStep("join")}
							/>
						)}

						{step === "tracking" && !!trackingOrderId && (
							<OrderTrackingScreen
								orderId={trackingOrderId}
								onBackToMenu={() => {
									if (Platform.OS === "web" && typeof window !== "undefined") {
										const nextPath = restaurantId && tableId
											? `/r/${restaurantId}/${tableId}`
											: "/";
										window.history.replaceState({}, "", nextPath);
									}
									setStep("menu");
								}}
							/>
						)}

						{step === "order-details" && (
							<OrderDetailsScreen
								orderData={lookupOrderData}
								onBack={() => {
									setLookupOrderData(null);
									setStep("join");
								}}
							/>
						)}
					</>
				)}

				<AlertComponent />
			</SafeAreaView>
			</View>
		</StripeProvider>
	);
}

const styles = StyleSheet.create({
	webWrapper: {
		flex: 1,
		height: "100%",
		// Sur web, centrer le contenu et limiter à la largeur mobile (480px)
		// pour un rendu optimal sur tablette et desktop
		alignSelf: "center",
		width: "100%",
		maxWidth: 480,
		backgroundColor: "whitesmoke",
	},
});
