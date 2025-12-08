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
	const handleJoinTable = async (name) => {
		try {
			await joinTable(
				name, 
				tableId || DEFAULT_TABLE_ID, 
				restaurantId || DEFAULT_RESTAURANT_ID
			);
			// Réinitialiser les commandes et le panier lors d'une nouvelle connexion
			// pour s'assurer qu'on part avec un état propre (première connexion)
			resetOrder();
			await clearCart();
			setStep("menu");
		} catch (error) {
			// L'erreur est déjà gérée par le store
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

		try {
			await submitOrderToServer({ 
				tableId: tableId || DEFAULT_TABLE_ID, 
				restaurantId: restaurantId || DEFAULT_RESTAURANT_ID 
			});
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
			// L'erreur est déjà gérée par le store
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
		setStep("payment");
	};

	// Handler après paiement réussi
	const handlePaymentSuccess = () => {
		// Le paiement a déjà été effectué dans Payment.js
		// On redirige simplement vers le menu
		setStep("menu");
	};

	return (
		<StripeProvider publishableKey="pk_test_xxx">
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={["top", "left", "right"]}
			>
				{step === "join" && (
					<JoinOrCreateTable tableId={tableId || DEFAULT_TABLE_ID} onJoin={handleJoinTable} />
				)}

				{step === "menu" && (
					<Menu
						userName={userName}
						orders={currentOrder}
						setOrders={(orders) => {
							// Cette prop peut être supprimée si on utilise uniquement le store
						}}
						onAdd={handleAddOrder}
						onValidate={handleValidateOrder}
						onPay={handlePaymentSuccess}
						onUpdateQuantity={handleUpdateQuantity}
						hasActiveOrder={hasActiveOrder}
						onNavigateToPayment={navigateToPayment}
						onNavigateToOrders={() => setStep("orders")}
						cart={cart}
						setCart={(newCart) => {
							// Cette prop peut être supprimée si on utilise uniquement le store
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
						onSuccess={handlePaymentSuccess}
						onBack={() => setStep("menu")}
					/>
				)}

				<AlertComponent />
			</SafeAreaView>
		</StripeProvider>
	);
}
