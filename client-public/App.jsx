import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "./src/config/api";
import { Resto_id_key } from "./src/config/restaurantConfig";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import Menu from "./src/screens/Menu"; // Ancien menu (backup)
import MenuScreen from "./src/screens/MenuScreen"; // 🎨 NOUVEAU design
import OrderScreen from "./src/screens/OrderScreen"; // 🎨 NOUVEAU design orders
import AddOn from "./src/components/menu/AddOn";
import Payment from "./src/screens/Payment";
import OrderSummary from "./src/screens/OrderSummary";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import AdminUnlockScreen from "./src/screens/AdminUnlockScreen"; // 🔐 Admin password
import AdminSelectionScreen from "./src/screens/AdminSelectionScreen"; // 🔐 Restaurant + Table selection
import { StripeProvider } from "@stripe/stripe-react-native";
import { useCustomAlert } from "./src/utils/customAlert";
import { useClientTableStore } from "./src/stores/useClientTableStore";
import { useOrderStore } from "./src/stores/useOrderStore";
import { useCartStore } from "./src/stores/useCartStore";
import { useAllergyStore } from "./src/stores/useAllergyStore";
import { useRestrictionStore } from "./src/stores/useRestrictionStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUrlParams } from "./src/utils/getUrlParams";
import { Platform, View, StyleSheet } from "react-native";
import { ThemeProvider } from "./src/theme"; // 🎨 NOUVEAU: Theme Provider

export default function App() {
	// Wrapper with ThemeProvider
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
}

// ⭐ Default IDs (utilisés en fallback si pas d'IDs en URL)
const DEFAULT_TABLE_ID = "DEFAULT";
const DEFAULT_RESTAURANT_ID = "DEFAULT";

function AppContent() {
	const [step, setStep] = useState("join"); // join, menu, addOn, orders, payment, tracking
	const [trackingOrderId, setTrackingOrderId] = useState("");
	const [reservationId, setReservationId] = useState("");
	const [clientId, setClientId] = useState("");
	const [tableNumber, setTableNumber] = useState(null);
	
	// 🔐 Admin unlock flow
	const [adminMode, setAdminMode] = useState(null); // null, "locked", "unlocked"
	const [adminUnlockToken, setAdminUnlockToken] = useState(null);
	const [forceRefresh, setForceRefresh] = useState(0); // Force remount après admin

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
	} = useOrderStore();

	const {
		cart,
		initCart,
		addItem: addToCart,
		updateQuantity: updateCartQuantity,
		clearCart,
	} = useCartStore();

	const { showAlert, AlertComponent } = useCustomAlert();

	// 🔐 Initialisation admin mode au démarrage
	useEffect(() => {
		const checkAdminMode = async () => {
			console.log("🔐 [App] Vérification mode admin au démarrage");
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
			
			console.log("   - URL restaurantId:", urlRestaurantId);
			console.log("   - URL tableId:", urlTableId);
			console.log("   - Stored restaurantId:", storedRestaurantId);
			console.log("   - Stored tableId:", storedTableId);
			
			// Si pas d'IDs (URL ou AsyncStorage), on affiche le mode admin (mot de passe)
			if (!urlRestaurantId && !storedRestaurantId) {
				console.log("   → Mode admin LOCKED (pas de restaurantId)");
				setAdminMode("locked");
			} else if (!urlTableId && !storedTableId) {
				console.log("   → Mode admin LOCKED (pas de tableId)");
				setAdminMode("locked");
			} else {
				console.log("   → Mode normal (IDs trouvés)");
				setAdminMode(null);
			}
		};
		
		checkAdminMode();
	}, []);

	// Initialisation au démarrage
	useEffect(() => {
		const initialize = async () => {
			console.log("🚀 [App] Initialisation au démarrage");
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

			console.log("   - URL: restaurantId=", urlRestaurantId, "tableId=", urlTableId);
			console.log("   - Stored: restaurantId=", storedRestaurantId, "tableId=", storedTableId);
			console.log("   - Final: restaurantId=", finalRestaurantId, "tableId=", finalTableId);

			// ⭐ Si pas d'IDs, on ne fait rien (mode admin)
			if (!finalRestaurantId || !finalTableId) {
				console.log("   → IDs manquants, mode admin sera affiché");
				return;
			}

			console.log("✅ [App] Initialisation des stores avec:", { finalRestaurantId, finalTableId });

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
		console.log("🎯 [App] handleJoinTable appelé:", {
			clientName,
			reservationId,
			tableIdParam,
			tableNumberParam,
			clientIdParam,
			currentRestaurantId: restaurantId,
		});
		
		try {
			// ⭐ Stocker toutes les infos
			setUserName(clientName);
			setReservationId(reservationId);
			setTableNumber(tableNumberParam);
			setClientId(clientIdParam);

			// ⭐ Mettre à jour le store avec les infos (sans rappeler /client/token)
			// Le token a déjà été obtenu dans WelcomeScreen
			const { setTable } = useClientTableStore.getState();
			console.log("🎯 [App] Appel setTable avec:", { tableIdParam, restaurantId });
			await setTable(tableIdParam || DEFAULT_TABLE_ID, restaurantId || DEFAULT_RESTAURANT_ID);
			useClientTableStore.setState({ userName: clientName });

			console.log("🎯 [App] Transition vers MenuScreen");
			resetOrder();
			await clearCart();
			setStep("menu");
		} catch (error) {
			console.error("❌ [App] Erreur join table:", error);
		}
	};

	// Handler pour ajouter un article
	const handleAddOrder = async (item) => {
		addToOrder(item, userName);
		await addToCart(item._id, 1);
	};

	// Handler pour mettre à jour la quantité
	const handleUpdateQuantity = async (item, quantity) => {
		updateOrderQuantity(item, quantity);
		await updateCartQuantity(item._id, quantity);
	};

	// Handler pour soumettre la commande
	const submitOrder = async ({ redirectToTracking = true } = {}) => {
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


			// ⭐ ENVOYER TOUTES LES DONNÉES
			const createdOrder = await submitOrderToServer(orderData);

			await clearCart();
			const createdOrderId = createdOrder?._id || createdOrder?.id || null;

			if (redirectToTracking && createdOrderId) {
				navigateToTracking(createdOrderId);
			}

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

	// Handler pour valider la commande
	const handleValidateOrder = () => {
		if (currentOrder.length === 0) {
			showAlert("Aucun article", "Veuillez ajouter au moins un produit.", [
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

	// Navigation vers le paiement (depuis OrderScreen)
	const handlePayNow = async () => {
		if (!reservationId) {
			showAlert("Erreur", "Aucune réservation active", [{ text: "OK" }]);
			return;
		}

		try {
			// If there is an in-progress cart, submit it first. If already submitted,
			// skip submission and only navigate to payment with fetched orders.
			if (currentOrder.length > 0) {
				const createdOrder = await submitOrder({ redirectToTracking: false });
				if (!createdOrder) return;
			}
			
			// Puis charger les commandes et naviguer vers payment
			await useOrderStore
				.getState()
				.fetchOrdersByReservation(reservationId, clientId);

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

	// Handler après paiement réussi
	const handlePaymentSuccess = async () => {
		// Le paiement a déjà été effectué dans Payment.js
		// Nettoyer complètement la session
		try {
			// Nettoyer AsyncStorage (garder clientId qui est un UUID permanent)
			await AsyncStorage.multiRemove([
				"currentReservationId",
				"currentTableId",
				"currentTableNumber",
				"currentClientName",
				"currentClientId",
				"currentClientPhone",
				"pseudo",
				"tableId",
				"restaurantId",
				"clientPhone",
			]);

			// Reset les stores
			await useClientTableStore.getState().reset?.();
			resetOrder();
			useCartStore.getState().clearCart?.();
			useAllergyStore.getState().clearAllergies?.();
			useRestrictionStore.getState().clearRestrictions?.();

			// Reset les states locaux
			setReservationId(null);
			setTableNumber(null);
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
							console.log("📱 [App] onTableSelected callback reçu");
							console.log("   - restaurantId:", restaurantId);
							console.log("   - tableId:", tableId);
							
							// Initialiser les stores avec les nouveaux IDs
							console.log("📱 [App] Appel initTable...");
							await initTable(tableId, restaurantId);
							console.log("✅ [App] initTable complété");
							
							// Forcer le remount de l'app
							console.log("📱 [App] Remount avec forceRefresh++");
							setForceRefresh(prev => prev + 1);
							
							// Sortir du mode admin
							console.log("📱 [App] setAdminMode(null)");
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
								tableId={tableId || DEFAULT_TABLE_ID}
								tableNumber={tableNumber}
								onJoin={({ reservationId, clientId, userName }) => {
									handleJoinTable(userName, reservationId, tableId || DEFAULT_TABLE_ID, tableNumber, clientId);
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
								onBack={() => setStep("menu")}
								onPayNow={handlePayNow}
								onSuccess={handlePaymentSuccess}
								onReservationClosed={() => setStep("join")}
								onSplitWithOthers={() => showAlert("Split", "Fonctionnalité à venir", [{ text: "OK" }])}
								onCancelOrder={() => {
									showAlert("Annuler", "Voulez-vous vraiment annuler la commande ?", [
										{ text: "Non" },
										{ text: "Oui", onPress: () => setStep("menu") }
									]);
								}}
							/>
						)}

						{step === "payment" && (
							<Payment
								allOrders={allOrders}
								orderId={activeOrderId}
								reservationId={reservationId}
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
