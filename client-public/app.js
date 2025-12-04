import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import JoinOrCreateTable from "./components/JoinOrCreateTable";
import Menu from "./components/Menu";
import AddOn from "./components/AddOn";
import Payment from "./components/Payment";
import OrderSummary from "./components/OrderSummary";
import { StripeProvider } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCustomAlert } from "./utils/customAlert";

export default function App() {
	const [step, setStep] = useState("join"); // join, menu, addOn, orders, payment
	const [tableId] = useState("686af692bb4cba684ff3b757");
	const [userName, setUserName] = useState(null);
	const [hasActiveOrder, setHasActiveOrder] = useState(false);
	const [allOrders, setAllOrders] = useState([]);
	const [orders, setOrders] = useState([]);
	const [currentOrder, setCurrentOrder] = useState([]);
	const [cart, setCart] = useState({});
	const [activeOrderId, setActiveOrderId] = useState(null); // ⭐ NOUVEAU: Stocke l'ID de commande active
	const restaurantId = "686af511bb4cba684ff3b72e";

	const { showAlert, AlertComponent } = useCustomAlert();

	// Récupérer l'ID de commande active au démarrage
	useEffect(() => {
		const loadActiveOrderId = async () => {
			try {
				const savedId = await AsyncStorage.getItem("activeOrderId");
				if (savedId) {
					setActiveOrderId(savedId);
					setHasActiveOrder(true);
					console.log("📦 OrderId restauré:", savedId);
				}
			} catch (error) {
				console.error("Erreur chargement orderId:", error);
			}
		};
		loadActiveOrderId();
	}, []);

	const getClientToken = async () => {
		const token = await AsyncStorage.getItem("clientToken");
		if (!token) throw new Error("Pas de token trouvé !");
		return token;
	};

	const handleJoinTable = (name) => {
		setUserName(name);
		setStep("menu");
	};

	const handleAddOrder = (item) => {
		setCurrentOrder((prev) => {
			const existing = prev.find((o) => o._id === item._id);
			if (existing) {
				return prev.map((o) =>
					o._id === item._id ? { ...o, quantity: o.quantity + 1 } : o
				);
			}
			return [...prev, { ...item, quantity: 1, user: userName }];
		});
		setCart((prev) => ({
			...prev,
			[item._id]: (prev[item._id] || 0) + 1,
		}));
	};

	const handleUpdateQuantity = (item, quantity) => {
		if (quantity <= 0) {
			setCurrentOrder((prev) => prev.filter((o) => o._id !== item._id));
			setCart((prev) => {
				const updated = { ...prev };
				delete updated[item._id];
				return updated;
			});
		} else {
			setCurrentOrder((prev) =>
				prev.map((o) => (o._id === item._id ? { ...o, quantity: quantity } : o))
			);
			setCart((prev) => ({ ...prev, [item._id]: quantity }));
		}
	};

	const submitOrder = async () => {
		console.log("📦 Début de submitOrder");

		const items = currentOrder.map((i) => ({
			productId: i._id,
			name: i.name,
			quantity: i.quantity,
			price: i.price,
		}));

		console.log("🛒 Items à commander:", items);

		if (items.length === 0) {
			showAlert(
				"Panier vide",
				"Veuillez ajouter des articles avant de commander.",
				[{ text: "OK" }]
			);
			return;
		}

		try {
			const token = await getClientToken();
			console.log("🔑 Token récupéré: OUI");

			const res = await fetch("http://192.168.1.185:3000/orders/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					tableId,
					items,
					total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
					status: "in_progress",
					restaurantId,
					serverId: null,
					origin: "client",
				}),
			});

			console.log("📡 Réponse du serveur:", res.status);

			const data = await res.json();

			if (!res.ok) {
				console.error("❌ Erreur création commande :", data);
				showAlert(
					"Erreur",
					data.message || "Erreur lors de la création de la commande",
					[{ text: "OK" }]
				);
				return;
			}

			// ⭐⭐⭐ SAUVEGARDEZ L'ID DE LA COMMANDE ⭐⭐⭐
			const newOrderId = data._id;
			setActiveOrderId(newOrderId);
			await AsyncStorage.setItem("activeOrderId", newOrderId);
			setHasActiveOrder(true);
			console.log("🎯 Nouvelle commande ID:", newOrderId);

			// Cumuler les commandes
			setAllOrders((prev) => [
				...prev,
				...currentOrder.map((item) => ({
					...item,
					sent: true,
					orderId: newOrderId,
				})),
			]);

			// Reset panier
			setCurrentOrder([]);
			setCart({});

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
		} catch (err) {
			console.error("💥 Erreur serveur :", err);
			showAlert(
				"Erreur",
				"Erreur de connexion au serveur. Veuillez réessayer.",
				[{ text: "OK" }]
			);
		}
	};

	const handleValidateOrder = () => {
		if (currentOrder.length === 0) {
			showAlert("Aucun article", "Veuillez ajouter au moins un produit.", [
				{ text: "OK" },
			]);
			return;
		}
		setStep("orders");
	};

	const handleAddOnComplete = (addOns) => {
		const updatedOrder = [...currentOrder];
		addOns.forEach((item) => {
			const existing = updatedOrder.find((o) => o._id === item._id);
			if (existing) {
				existing.quantity += item.quantity;
			} else {
				updatedOrder.push({ ...item, user: userName });
			}
		});
		setCurrentOrder(updatedOrder);
		setStep("orders");
	};

	// ⭐⭐⭐ FONCTION POUR NAVIGUER VERS PAYMENT ⭐⭐⭐
	const navigateToPayment = () => {
		if (!activeOrderId) {
			showAlert("Erreur", "Aucune commande active à payer", [{ text: "OK" }]);
			return;
		}
		console.log("🚀 Navigation vers Payment avec ID:", activeOrderId);
		setStep("payment");
	};

	// ⭐⭐⭐ FONCTION APRÈS PAIEMENT RÉUSSI ⭐⭐⭐
	const handlePaymentSuccess = async () => {
		// Marquer la commande comme payée dans le state
		setHasActiveOrder(false);
		setAllOrders([]);

		// Supprimer l'ID sauvegardé
		setActiveOrderId(null);
		await AsyncStorage.removeItem("activeOrderId");

		console.log("✅ Paiement réussi, retour au menu");
		setStep("menu");
	};

	return (
		<StripeProvider publishableKey="pk_test_xxx">
			<SafeAreaView
				style={{ flex: 1, backgroundColor: "whitesmoke" }}
				edges={["top", "left", "right"]}
			>
				{step === "join" && (
					<JoinOrCreateTable tableId={tableId} onJoin={handleJoinTable} />
				)}

				{step === "menu" && (
					<Menu
						userName={userName}
						orders={currentOrder}
						setOrders={setCurrentOrder}
						onAdd={handleAddOrder}
						onValidate={handleValidateOrder}
						onPay={handlePaymentSuccess} // Appelé après paiement réussi
						onUpdateQuantity={handleUpdateQuantity}
						hasActiveOrder={hasActiveOrder}
						onNavigateToPayment={navigateToPayment} // ⬅️ FONCTION CORRECTE
						onNavigateToOrders={() => setStep("addOn")}
						cart={cart}
						setCart={setCart}
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
						orderId={activeOrderId} // ⬅️ ID PASSÉ DIRECTEMENT
						onSuccess={handlePaymentSuccess}
						onBack={() => setStep("menu")}
					/>
				)}

				<AlertComponent />
			</SafeAreaView>
		</StripeProvider>
	);
}
