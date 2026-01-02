import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// --- RESET ASYNCSTORAGE AU DEMARRAGE (à retirer après reset) ---

import { View, Text, ActivityIndicator, Animated } from "react-native";
import { API_CONFIG } from "../shared-api/config/apiConfig.js";
import { SafeAreaView } from "react-native-safe-area-context";
import JoinOrCreateTable from "./src/screens/JoinOrCreateTable";
import Menu from "./src/screens/Menu";
import AddOn from "./src/components/AddOn";
import Payment from "./src/screens/Payment";
import PaymentScreen from "./src/screens/PaymentScreen";
import OrderSummary from "./src/screens/OrderSummary";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useCustomAlert } from "./src/utils/customAlert";
import { useClientTableStore } from "./src/stores/useClientTableStore";
import { useOrderStore } from "./src/stores/useOrderStore";
import { useCartStore } from "./src/stores/useCartStore";
import { useAllergyStore } from "./src/stores/useAllergyStore";

// Toast animé style Sonner
const SuccessToast = ({ message, visible, onHide }) => {
	const slideAnim = useRef(new Animated.Value(100)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		AsyncStorage.multiRemove([
			"tableId",
			"reservationId",
			"clientId",
			"clientToken",
		]).then(() => {
			console.log("✅ Clés de session/table supprimées !");
		});
	}, []);

	useEffect(() => {
		if (visible) {
			// Slide up + fade in
			Animated.parallel([
				Animated.spring(slideAnim, {
					toValue: 0,
					friction: 8,
					tension: 40,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();

			// Auto-hide après 3s
			const timer = setTimeout(() => {
				Animated.parallel([
					Animated.timing(slideAnim, {
						toValue: 100,
						duration: 300,
						useNativeDriver: true,
					}),
					Animated.timing(opacityAnim, {
						toValue: 0,
						duration: 300,
						useNativeDriver: true,
					}),
				]).start(() => onHide?.());
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [visible]);

	if (!visible) return null;

	return (
		<Animated.View
			style={{
				position: "absolute",
				bottom: 40,
				left: 20,
				right: 20,
				transform: [{ translateY: slideAnim }],
				opacity: opacityAnim,
				zIndex: 9999,
			}}
		>
			<View
				style={{
					backgroundColor: "#1a1a1a",
					paddingVertical: 16,
					paddingHorizontal: 20,
					borderRadius: 12,
					flexDirection: "row",
					alignItems: "center",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.25,
					shadowRadius: 12,
					elevation: 10,
					borderWidth: 1,
					borderColor: "rgba(255,255,255,0.1)",
				}}
			>
				<View
					style={{
						width: 28,
						height: 28,
						borderRadius: 14,
						backgroundColor: "#22c55e",
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					<Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
						✓
					</Text>
				</View>
				<Text
					style={{
						color: "#fff",
						fontSize: 16,
						fontWeight: "500",
						flex: 1,
					}}
				>
					{message}
				</Text>
			</View>
		</Animated.View>
	);
};

export default function App() {
	const [step, setStep] = useState("loading"); // loading, join, menu, addOn, orders, payment
	const [reservationId, setReservationId] = useState("");
	const [clientId, setClientId] = useState("");
	const [tableNumber, setTableNumber] = useState(null);
	const [welcomeBackMessage, setWelcomeBackMessage] = useState(null);

	// IDs en dur pour les tests
	const DEFAULT_TABLE_ID = "686af692bb4cba684ff3b757";
	const DEFAULT_RESTAURANT_ID = "686af511bb4cba684ff3b72e";

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
	const { init: initAllergies } = useAllergyStore();

	// Initialisation au démarrage
	useEffect(() => {
		const initialize = async () => {
			// Initialiser avec les IDs en dur pour les tests
			// init() retourne true si une session existante (userName sauvegardé)
			const hasExistingSession = await initTable(
				DEFAULT_TABLE_ID,
				DEFAULT_RESTAURANT_ID
			);
			await initOrder();
			await initAllergies();

			// Si session existante, aller directement au menu avec message de bienvenue
			if (hasExistingSession) {
				// On récupère le userName depuis le store après init
				const savedUserName = useClientTableStore.getState().userName;
				if (savedUserName) {
					setWelcomeBackMessage(`Bon retour ${savedUserName} ! 👋`);
					setStep("menu");
					// Le toast gère son propre auto-hide via le composant SuccessToast
					return;
				}
			}

			// Sinon, afficher la page de connexion
			setStep("join");
		};
		initialize();
	}, []);

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
		tableId,
		tableNumber,
		clientId
	) => {
		try {
			// ⭐ Stocker toutes les infos
			setUserName(clientName);
			setReservationId(reservationId);
			setTableNumber(tableNumber);
			setClientId(clientId);

			// Appeler joinTable du store (si nécessaire)
			await joinTable(
				clientName,
				tableId || DEFAULT_TABLE_ID,
				restaurantId || DEFAULT_RESTAURANT_ID
			);

			resetOrder();
			await clearCart();
			setStep("menu");
		} catch (error) {
			console.error("Erreur join table:", error);
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
	const submitOrder = async () => {
		if (currentOrder.length === 0) {
			showAlert(
				"Panier vide",
				"Veuillez ajouter des articles avant de commander.",
				[{ text: "OK" }]
			);
			return;
		}

		// ⭐ VÉRIFIER qu'on a les infos nécessaires
		if (!reservationId) {
			showAlert(
				"Erreur",
				"Aucune réservation active. Veuillez rejoindre une table d'abord.",
				[{ text: "OK" }]
			);
			return;
		}

		try {
			// Fonction helper pour normaliser catégorie
			const normalizeCategory = (category) => {
				if (!category) return "autre";
				const normalized = category
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "");
				const validCategories = [
					"boisson",
					"entree",
					"plat",
					"dessert",
					"autre",
				];
				return validCategories.includes(normalized) ? normalized : "autre";
			};

			// Préparer les données COMPLÈTES
			const orderData = {
				tableId: tableId || DEFAULT_TABLE_ID,
				restaurantId: restaurantId || DEFAULT_RESTAURANT_ID,
				reservationId: reservationId, // ⭐ DÉJÀ PRÉSENT
				clientId: clientId, // ⭐ AJOUTER
				clientName: userName, // ⭐ AJOUTER (userName vient du store)
				items: currentOrder.map((item) => ({
					productId: item._id,
					name: item.name,
					price: item.price,
					quantity: item.quantity || 1,
					category: normalizeCategory(item.category), // ⭐ Normaliser
				})),
				total: currentOrder.reduce(
					(sum, item) => sum + item.price * (item.quantity || 1),
					0
				),
				status: "in_progress",
				origin: "client",
			};

			console.log("📤 Envoi commande avec données:", orderData);

			// ⭐ ENVOYER TOUTES LES DONNÉES
			await submitOrderToServer(orderData);

			await clearCart();

			showAlert(
				"✅ Commande envoyée",
				"Souhaitez-vous payer maintenant ou continuer à commander ?",
				[
					{
						text: "Nouvelle commande",
						style: "cancel",
						onPress: () => {
							setStep("menu");
						},
					},
					{
						text: "💳 Payer",
						onPress: () => {
							navigateToPayment();
						},
					},
				]
			);
		} catch (error) {
			console.error("Erreur création commande dans App.js:", error);
			showAlert(
				"Erreur",
				error.message || "Erreur lors de la création de la commande"
			);
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

	// Navigation vers le paiement
	const navigateToPayment = () => {
		if (!activeOrderId) {
			showAlert("Erreur", "Aucune commande active à payer", [{ text: "OK" }]);
			return;
		}

		// ⭐ Passer toutes les infos nécessaires au Payment
		// Vous devrez ajuster Payment.js pour accepter ces props
		setStep("payment");
	};

	// Handler après paiement réussi
	const handlePaymentSuccess = async () => {
		try {
			// Marquer la commande comme payée dans le store local
			await markAsPaid(activeOrderId);

			console.log("✅ Commande marquée comme payée localement");

			// Rediriger vers l'écran de connexion (nouvelle session)
			setStep("join");
		} catch (error) {
			console.error("❌ Erreur lors du marquage de paiement:", error);
			// Même en cas d'erreur, on redirige (le webhook aura marqué côté serveur)
			setStep("join");
		}
	};

	const STRIPE_PUBLISHABLE_KEY =
		process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
		"pk_test_51Ski7zH5JuPQb6uBqEKKQzUq5njDrBZFXvvlR5j9Gz5xnrmXCJO5hEP7tBxcWLrTCO0iYzfFV7OZlxfGaW3FMy5E00VJ0pUHsj";

	return (
		<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={["top", "left", "right"]}
			>
				{/* État de chargement */}
				{step === "loading" && (
					<View
						style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
					>
						<ActivityIndicator size="large" color="#4CAF50" />
						<Text style={{ marginTop: 16, color: "#666", fontSize: 16 }}>
							Chargement...
						</Text>
					</View>
				)}

				{step === "join" && (
					<JoinOrCreateTable
						tableId={tableId || DEFAULT_TABLE_ID}
						tableNumber={tableNumber}
						onJoin={handleJoinTable}
					/>
				)}

				{step === "menu" && (
					<>
						<Menu
							userName={userName}
							// ⭐⭐ AJOUTEZ CES PROPS ⭐⭐
							reservationId={reservationId}
							tableId={tableId || DEFAULT_TABLE_ID}
							tableNumber={tableNumber}
							clientId={clientId}
							orders={currentOrder}
							onAdd={handleAddOrder}
							onValidate={handleValidateOrder}
							onPay={handlePaymentSuccess}
							onUpdateQuantity={handleUpdateQuantity}
							hasActiveOrder={hasActiveOrder}
							onNavigateToPayment={navigateToPayment}
							onNavigateToOrders={handleValidateOrder}
							navigation={{
								navigate: (screen, params) => {
									// Simuler navigation pour Menu
									if (screen === "Payment") {
										setStep("payment");
									}
								},
							}}
						/>
					</>
				)}

				{step === "addOn" && (
					<AddOn
						currentOrders={currentOrder}
						onComplete={handleAddOnComplete}
						onBack={() => setStep("menu")}
					/>
				)}

				{step === "orders" && (
					<OrderSummary
						allOrders={allOrders}
						currentOrder={currentOrder}
						onUpdateQuantity={handleUpdateQuantity}
						onSubmitOrder={submitOrder}
						onBackToMenu={() => setStep("menu")}
					/>
				)}

				{step === "payment" && (
					<PaymentScreen
						orderId={activeOrderId}
						onSuccess={handlePaymentSuccess}
					/>
				)}
				{/* Toast Success "Bon retour" */}
				<AlertComponent />
				<SuccessToast
					message={welcomeBackMessage}
					visible={!!welcomeBackMessage}
					onHide={() => setWelcomeBackMessage(null)}
				/>
			</SafeAreaView>
		</StripeProvider>
	);
}
