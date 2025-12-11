import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import JoinOrCreateTable from "./components/JoinOrCreateTable";
import Menu from "./components/Menu";
import AddOn from "./components/AddOn";
import Payment from "./components/Payment";
import OrderSummary from "./components/OrderSummary";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useCustomAlert } from "./utils/customAlert";
import { useTableStore } from "./stores/useTableStore";
import { useOrderStore } from "./stores/useOrderStore";
import { useCartStore } from "./stores/useCartStore";

export default function App() {
	const [step, setStep] = useState("join"); // join, menu, addOn, orders, payment
	const [reservationId, setReservationId] = useState("");
	const [clientId, setClientId] = useState("");
	const [tableNumber, setTableNumber] = useState(null);

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
	} = useTableStore();

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
				"Votre commande a été envoyée avec succès !",
				[
					{
						text: "OK",
						onPress: () => {
							setStep("menu");
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
	const handlePaymentSuccess = () => {
		// Le paiement a déjà été effectué dans Payment.js
		// On redirige simplement vers le menu
		setStep("join");
	};

	return (
		<StripeProvider publishableKey="pk_test_xxx">
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={["top", "left", "right"]}
			>
				{step === "join" && (
					<JoinOrCreateTable
						tableId={tableId || DEFAULT_TABLE_ID}
						onJoin={handleJoinTable}
					/>
				)}

				{step === "menu" && (
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
					/>
				)}

				<AlertComponent />
			</SafeAreaView>
		</StripeProvider>
	);
}
