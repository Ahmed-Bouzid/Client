import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "./src/config/api";
import { Resto_id_key } from "./src/config/restaurantConfig";
import JoinOrCreateTable from "./src/screens/JoinOrCreateTable";
import Menu from "./src/screens/Menu";
import AddOn from "./src/components/menu/AddOn";
import Payment from "./src/screens/Payment";
import OrderSummary from "./src/screens/OrderSummary";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useCustomAlert } from "./src/utils/customAlert";
import { useClientTableStore } from "./src/stores/useClientTableStore";
import { useOrderStore } from "./src/stores/useOrderStore";
import { useCartStore } from "./src/stores/useCartStore";
import { useAllergyStore } from "./src/stores/useAllergyStore";
import { useRestrictionStore } from "./src/stores/useRestrictionStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
	const [step, setStep] = useState("join"); // join, menu, addOn, orders, payment
	const [reservationId, setReservationId] = useState("");
	const [clientId, setClientId] = useState("");
	const [tableNumber, setTableNumber] = useState(null);

	// IDs en dur pour les tests
	const DEFAULT_TABLE_ID = "686af692bb4cba684ff3b757";
	const DEFAULT_RESTAURANT_ID = Resto_id_key;

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

	// Initialisation au démarrage
	useEffect(() => {
		const initialize = async () => {
			// Initialiser avec les IDs en dur pour les tests
			await initTable(DEFAULT_TABLE_ID, DEFAULT_RESTAURANT_ID);
			await initOrder();

			// ⭐ Initialiser les stores d'allergies et restrictions
			await useAllergyStore.getState().init();
			await useRestrictionStore.getState().init();

			// ⭐ Récupérer le numéro de table depuis l'API
			try {
				const response = await fetch(
					`${API_BASE_URL}/tables/${DEFAULT_TABLE_ID}`,
				);
				if (response.ok) {
					const tableData = await response.json();
					setTableNumber(tableData.number || tableData.tableNumber || "?");
					console.log("✅ Table info chargée:", tableData);
				}
			} catch (error) {
				console.error("Erreur récupération table:", error);
			}
		};
		initialize();
	}, []);

	// Log de débogage pour l'ID du restaurant
	useEffect(() => {
		console.log(`[DEBUG] Restaurant ID: ${Resto_id_key}`);
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
		clientId,
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
				restaurantId || DEFAULT_RESTAURANT_ID,
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
				[{ text: "OK" }],
			);
			return;
		}

		// ⭐ VÉRIFIER qu'on a les infos nécessaires
		if (!reservationId) {
			showAlert(
				"Erreur",
				"Aucune réservation active. Veuillez rejoindre une table d'abord.",
				[{ text: "OK" }],
			);
			return;
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

			console.log("📤 Envoi commande avec données:", orderData);

			// ⭐ ENVOYER TOUTES LES DONNÉES
			await submitOrderToServer(orderData);

			await clearCart();

			showAlert(
				"✅ Commande envoyée",
				"Votre commande a été envoyée avec succès !",
				[
					{
						text: "OK",
						onPress: () => {
							setStep("menu");
						},
					},
				],
			);
		} catch (error) {
			console.error("Erreur création commande dans App.js:", error);
			showAlert(
				"Erreur",
				error.message || "Erreur lors de la création de la commande",
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
	const navigateToPayment = async () => {
		if (!reservationId) {
			showAlert("Erreur", "Aucune réservation active", [{ text: "OK" }]);
			return;
		}

		try {
			// ⭐ CHARGER LES COMMANDES DEPUIS L'API AVANT DE NAVIGUER
			console.log(
				"\n🚀🚀🚀 ========== APP.JSX - NAVIGATION PAYMENT ========== 🚀🚀🚀",
			);
			console.log("📋 Données session:", {
				reservationId,
				tableId,
				tableNumber,
				userName,
				clientId,
			});
			console.log(
				"🔍 Chargement des commandes pour reservation:",
				reservationId,
			);
			console.log("🔑 Avec clientId:", clientId, "(filtrage foodtruck)");
			await useOrderStore
				.getState()
				.fetchOrdersByReservation(reservationId, clientId);

			// Vérifier ce qui a été chargé
			const loadedOrders = useOrderStore.getState().allOrders;
			console.log(
				"✅ Commandes chargées depuis store:",
				loadedOrders?.length || 0,
			);
			console.log(
				"📦 Détail allOrders avant passage à Payment:",
				JSON.stringify(loadedOrders, null, 2),
			);
			console.log(
				"🚀🚀🚀 ===================================================== 🚀🚀🚀\n",
			);

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

			console.log("✅ Session nettoyée après paiement réussi");
		} catch (error) {
			console.error("❌ Erreur nettoyage session:", error);
			// Même en cas d'erreur, on redirige
			setStep("join");
		}
	};

	return (
		<StripeProvider
			publishableKey="pk_test_51Ski7zH5JuPQb6uBbPv7B8vwFCwhCL0nINHqUX1oxpNm0Qz3fUn5ZoGWf9jwd2dXVizHD0pTalhdEejZMQy9evAi00m3oQWIw0"
			merchantIdentifier="merchant.com.orderit.app"
		>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={["top", "left", "right"]}
			>
				{step === "join" && (
					<JoinOrCreateTable
						tableId={tableId || DEFAULT_TABLE_ID}
						tableNumber={tableNumber}
						onJoin={handleJoinTable}
					/>
				)}

				{step === "menu" && (
					<Menu
						userName={userName}
						restaurantId={restaurantId || DEFAULT_RESTAURANT_ID} // ✨ NOUVEAU : Pour charger la config dynamique
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
					<Payment
						allOrders={allOrders}
						orderId={activeOrderId}
						// ⭐⭐ AJOUTEZ CES PROPS ⭐⭐
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

				<AlertComponent />
			</SafeAreaView>
		</StripeProvider>
	);
}
