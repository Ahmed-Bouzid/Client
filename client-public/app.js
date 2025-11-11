import React, { useState } from "react";
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
	const [allOrders, setAllOrders] = useState([]); // ← AJOUTÉ - toutes les commandes cumulées
	const [orders, setOrders] = useState([]); // commandes déjà envoyées
	const [currentOrder, setCurrentOrder] = useState([]); // commande en cours
	const [cart, setCart] = useState({});
	const restaurantId = "686af511bb4cba684ff3b72e";

	// Utilisation du hook d'alerte personnalisée
	const { showAlert, AlertComponent } = useCustomAlert();

	const getClientToken = async () => {
		const token = await AsyncStorage.getItem("clientToken");
		if (!token) throw new Error("Pas de token trouvé !");
		return token;
	};

	const handleJoinTable = (name) => {
		setUserName(name);
		setStep("menu");
	};

	// Ajouter un produit à la commande en cours
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
		// Mettre à jour le panier visuel
		setCart((prev) => ({
			...prev,
			[item._id]: (prev[item._id] || 0) + 1,
		}));
	};

	// Modifier quantité / suppression dans la commande en cours
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

		const items =
			currentOrder.length > 0
				? currentOrder.map((i) => ({
						productId: i._id,
						name: i.name,
						quantity: i.quantity,
						price: i.price,
				  }))
				: [];

		console.log("🛒 Items à commander:", items);

		if (items.length === 0) {
			console.log("❌ Panier vide");
			showAlert(
				"Panier vide",
				"Veuillez ajouter des articles avant de commander.",
				[{ text: "OK" }]
			);
			return;
		}

		try {
			console.log("🔑 Récupération du token...");
			const token = await getClientToken();
			console.log("✅ Token récupéré:", token ? "OUI" : "NON");

			console.log("🚀 Envoi de la commande...");
			const res = await fetch("http://192.168.1.165:3000/orders/", {
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

			// AJOUT : Cumuler les commandes dans allOrders
			setAllOrders((prev) => [
				...prev,
				...currentOrder.map((item) => ({
					...item,
					sent: true,
					orderId: data.orderId,
				})),
			]);

			// Reset panier MAIS PAS hasActiveOrder
			setCurrentOrder([]);
			setCart({});
			setHasActiveOrder(true); // ← GARDEZ ÇA POUR LE BOUTON PAYER

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

	// Valider la commande actuelle et passer à add-ons
	const handleValidateOrder = () => {
		if (currentOrder.length === 0) {
			showAlert("Aucun article", "Veuillez ajouter au moins un produit.", [
				{ text: "OK" },
			]);
			return;
		}
		setStep("orders");
	};

	// Ajouter des add-ons et continuer
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
		setStep("orders"); // page de récap
	};

	// Envoyer la commande finale
	const handlePay = () => {
		// Logique de paiement...
		setHasActiveOrder(false); // ← COMMANDE TERMINÉE
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
						onPay={handlePay}
						cart={cart}
						setCart={setCart}
						onUpdateQuantity={handleUpdateQuantity}
						hasActiveOrder={hasActiveOrder}
						onNavigateToPayment={() => setStep("payment")}
						onNavigateToOrders={() => setStep("addOn")}
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
						allOrders={allOrders} // ← AJOUTÉ
						currentOrder={currentOrder}
						onUpdateQuantity={handleUpdateQuantity}
						onSubmitOrder={submitOrder}
						onBackToMenu={() => setStep("menu")}
					/>
				)}

				{step === "payment" && (
					<Payment
						allOrders={allOrders} // ← AJOUTÉ
						onSuccess={() => {
							setHasActiveOrder(false); // ← Reset ici
							setAllOrders([]); // ← VIDER après paiement
							setStep("menu");
						}}
						onBack={() => setStep("menu")}
					/>
				)}

				{/* Composant d'alerte personnalisée - DOIT ÊTRE À LA FIN */}
				<AlertComponent />
			</SafeAreaView>
		</StripeProvider>
	);
}
