import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Pressable,
	FlatList,
	ScrollView,
	Alert,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import useProductStore from "../stores/useProductStore.js";
import { useCartStore } from "../stores/useCartStore.js";
import { useOrderStore } from "../stores/useOrderStore.js";
import { orderService } from "../../shared-api/services/orderService.js";

export default function Menu({
	userName,
	orders,
	setOrders,
	onAdd,
	onValidate,
	onPay,
	onUpdateQuantity,
	hasActiveOrder,
	onNavigateToPayment,
	onNavigateToOrders,
	navigation,
}) {
	const products = useProductStore((state) => state.products);
	const fetchProducts = useProductStore((state) => state.fetchProducts);
	const { cart } = useCartStore();
	const { currentOrder, fetchActiveOrder } = useOrderStore();

	const [selectedCategory, setSelectedCategory] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);

	// ⚡ Catégories principales
	const categories = [
		{
			id: "boisson",
			title: "🥤 Boissons",
			color: "#4FC3F7",
			icon: "glass-cocktail",
		},
		{ id: "entrée", title: "🥗 Entrées", color: "#81C784", icon: "leaf" },
		{ id: "plat", title: "🍝 Plats", color: "#FFB74D", icon: "food" },
		{ id: "dessert", title: "🍰 Desserts", color: "#BA68C8", icon: "cake" },
	];

	// ============ FONCTIONS ============
	const handleIncrease = async (item) => {
		// onAdd gère déjà l'ajout au panier ET à la commande
		onAdd(item);
	};

	const handleDecrease = async (item) => {
		const currentQty = cart[item._id] || 0;
		if (currentQty > 0) {
			const newQty = currentQty - 1;
			// onUpdateQuantity gère déjà la mise à jour du panier ET de la commande
			onUpdateQuantity(item, newQty);
		}
	};

	const cartItems = products
		.filter((item) => (cart[item._id] || 0) > 0)
		.map((item) => ({
			...item,
			sent:
				currentOrder.find((o) => o.name === item.name && o.user === userName)?.sent ||
				false,
		}));

	const getActiveOrderId = async () => {
		const activeOrder = await fetchActiveOrder();
		return activeOrder?._id || null;
	};

	const openModal = (item) => {
		setSelectedItem(item);
		setModalVisible(true);
	};

	const handlePayPress = async () => {
		if (onNavigateToPayment) {
			const orderId = await getActiveOrderId();
			if (!orderId) {
				Alert.alert("Erreur", "Aucune commande active trouvée");
				return;
			}
			onNavigateToPayment();
			return;
		}

		// Fallback si pas de navigation
		const orderId = await getActiveOrderId();
		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande active trouvée");
			return;
		}

		Alert.alert("Erreur", "Navigation non disponible");
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	// 🎯 ÉCRAN 2 : PRODUITS D'UNE CATÉGORIE
	if (selectedCategory) {
		const categoryProducts = products.filter(
			(p) => p.category?.toLowerCase() === selectedCategory.id
		);

		return (
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => setSelectedCategory(null)}
						style={styles.backButton}
					>
						<MaterialIcons name="arrow-back" size={28} color="#333" />
						<Text style={styles.backText}>Retour</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{selectedCategory.title}</Text>
					<View style={{ width: 90 }} />
				</View>

				{/* Liste produits */}
				<FlatList
					data={categoryProducts}
					keyExtractor={(item) => item._id.toString()}
					renderItem={({ item }) => (
						<View style={styles.productCard}>
							<TouchableOpacity
								style={styles.productInfo}
								onPress={() => openModal(item)}
							>
								<Text style={styles.productName}>{item.name}</Text>
								<Text style={styles.productDescription}>
									{item.description || "Sans description"}
								</Text>
								{item.allergens && (
									<Text style={styles.allergens}>⚠️ {item.allergens}</Text>
								)}
								<View style={styles.productTags}>
									{item.vegan && (
										<Text style={[styles.tag, styles.veganTag]}>🌱 Vegan</Text>
									)}
									{item.glutenFree && (
										<Text style={[styles.tag, styles.glutenTag]}>
											🌾 Sans gluten
										</Text>
									)}
								</View>
							</TouchableOpacity>

							<View style={styles.productActions}>
								<Text style={styles.price}>{item.price}€</Text>
								<View style={styles.counter}>
									<TouchableOpacity
										style={styles.counterButton}
										onPress={() => handleDecrease(item)}
									>
										<Text style={styles.counterText}>−</Text>
									</TouchableOpacity>
									<Text style={styles.counterValue}>{cart[item._id] || 0}</Text>
									<TouchableOpacity
										style={styles.counterButton}
										onPress={() => handleIncrease(item)}
									>
										<Text style={styles.counterText}>+</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					)}
					contentContainerStyle={styles.listContainer}
					showsVerticalScrollIndicator={false}
				/>

				{/* 🛒 Panier fixe */}
				<View style={styles.cartContainer}>
					<Text style={styles.cartTitle}>Votre commande :</Text>
					{cartItems.length === 0 ? (
						<Text style={styles.emptyCart}>Panier vide</Text>
					) : (
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View style={styles.cartItems}>
								{cartItems.map((item) => (
									<View key={item._id} style={styles.cartItem}>
										<Text style={styles.cartItemName}>{item.name}</Text>
										<Text style={styles.cartItemQty}>x{cart[item._id] || 0}</Text>
									</View>
								))}
							</View>
						</ScrollView>
					)}

					{/* Boutons */}
					<View style={styles.buttonsContainer}>
						{cartItems.length > 0 && (
							<TouchableOpacity
								style={[styles.actionButton, styles.validateButton]}
								onPress={onNavigateToOrders}
							>
								<Text style={styles.actionButtonText}>
									✅ Valider ({Object.keys(cart).length} articles)
								</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		);
	}

	// 🎯 ÉCRAN 1 : CHOIX DES CATÉGORIES
	return (
		<View style={styles.container}>
			<Text style={styles.welcomeTitle}>Bonjour {userName} 👋</Text>
			<Text style={styles.subtitle}>Que voulez-vous commander ?</Text>

			{/* Grille catégories */}
			<View style={styles.categoriesGrid}>
				{categories.map((cat) => (
					<TouchableOpacity
						key={cat.id}
						style={[styles.categoryCard, { backgroundColor: cat.color }]}
						onPress={() => setSelectedCategory(cat)}
					>
						<MaterialCommunityIcons
							name={cat.icon}
							size={40}
							color="#fff"
							style={styles.categoryIcon}
						/>
						<Text style={styles.categoryTitle}>{cat.title}</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* 🛒 Panier rapide */}
			{cartItems.length > 0 && (
				<View style={styles.quickCart}>
					<Text style={styles.quickCartTitle}>Votre panier</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View style={styles.quickCartItems}>
							{cartItems.map((item) => (
								<View key={item._id} style={styles.quickCartItem}>
									<Text style={styles.quickCartName}>{item.name}</Text>
									<Text style={styles.quickCartQty}>x{cart[item._id]}</Text>
								</View>
							))}
						</View>
					</ScrollView>
					<TouchableOpacity
						style={styles.quickCartButton}
						onPress={onNavigateToOrders}
					>
						<Text style={styles.quickCartButtonText}>Voir le panier</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* 🎯 BOUTONS PRINCIPAUX */}
			<View style={styles.mainButtonsContainer}>
				{hasActiveOrder && (
					<TouchableOpacity
						style={[styles.mainActionButton, styles.mainPayButton]}
						onPress={handlePayPress}
					>
						<Text style={styles.mainActionButtonText}>
							💳 Payer ma commande
						</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* 🔹 Modal produit */}
			{selectedItem && (
				<Modal
					transparent
					visible={modalVisible}
					animationType="fade"
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>{selectedItem.name}</Text>
							<Text style={styles.modalDescription}>
								{selectedItem.description || "Sans description"}
							</Text>
							<View style={styles.modalTags}>
								{selectedItem.vegan && (
									<Text style={[styles.modalTag, styles.modalVeganTag]}>
										🌱 Vegan
									</Text>
								)}
								{selectedItem.glutenFree && (
									<Text style={[styles.modalTag, styles.modalGlutenTag]}>
										🌾 Sans gluten
									</Text>
								)}
							</View>
							{selectedItem.allergens && (
								<Text style={styles.modalAllergens}>
									⚠️ Allergènes : {selectedItem.allergens}
								</Text>
							)}
							<Pressable
								style={styles.modalCloseButton}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.modalCloseText}>Fermer</Text>
							</Pressable>
						</View>
					</View>
				</Modal>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f9fa",
		padding: 20,
	},
	// Header
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		backgroundColor: "#fff",
		marginHorizontal: -20,
		paddingHorizontal: 20,
		marginTop: -25,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		padding: 5,
	},
	backText: {
		fontSize: 16,
		color: "#333",
		marginLeft: 5,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
	// Écran 1
	welcomeTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#333",
		marginTop: 10,
		marginBottom: 5,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 30,
	},
	categoriesGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	categoryCard: {
		width: "48%",
		height: 150,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 15,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	categoryIcon: {
		marginBottom: 10,
	},
	categoryTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		textAlign: "center",
	},
	// Écran 2
	listContainer: {
		padding: 15,
		paddingBottom: 200,
	},
	productCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 15,
		borderRadius: 12,
		marginBottom: 10,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
	},
	productInfo: {
		flex: 1,
		marginRight: 15,
	},
	productName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 5,
	},
	productDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	productTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 5,
	},
	tag: {
		fontSize: 11,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		marginRight: 5,
		marginTop: 3,
	},
	veganTag: {
		backgroundColor: "#E8F5E9",
		color: "#2E7D32",
	},
	glutenTag: {
		backgroundColor: "#FFF3E0",
		color: "#EF6C00",
	},
	allergens: {
		fontSize: 12,
		color: "#ff6b6b",
		fontStyle: "italic",
		marginTop: 3,
	},
	productActions: {
		alignItems: "center",
	},
	price: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#4CAF50",
		marginBottom: 8,
	},
	counter: {
		flexDirection: "row",
		alignItems: "center",
	},
	counterButton: {
		width: 32,
		height: 32,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
	},
	counterText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#333",
	},
	counterValue: {
		marginHorizontal: 10,
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},
	// 🛒 Panier fixe
	cartContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		padding: 15,
		borderTopWidth: 1,
		borderColor: "#eee",
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	cartTitle: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 10,
		color: "#333",
	},
	emptyCart: {
		fontStyle: "italic",
		color: "#999",
		textAlign: "center",
		padding: 10,
	},
	cartItems: {
		flexDirection: "row",
	},
	cartItem: {
		backgroundColor: "#f0f0f0",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	cartItemName: {
		fontSize: 14,
		color: "#333",
	},
	cartItemQty: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#4CAF50",
		marginLeft: 4,
	},
	// Panier rapide
	quickCart: {
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 15,
		marginTop: 20,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	quickCartTitle: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 10,
		color: "#333",
	},
	quickCartItems: {
		flexDirection: "row",
		marginBottom: 10,
	},
	quickCartItem: {
		backgroundColor: "#f0f0f0",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 12,
		marginRight: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	quickCartName: {
		fontSize: 13,
		color: "#333",
	},
	quickCartQty: {
		fontSize: 13,
		fontWeight: "bold",
		color: "#4CAF50",
		marginLeft: 3,
	},
	quickCartButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	quickCartButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	// 🎯 BOUTONS PRINCIPAUX
	mainButtonsContainer: {
		marginTop: 30,
		marginBottom: 20,
		gap: 15,
	},
	mainActionButton: {
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
	},
	mainValidateButton: {
		backgroundColor: "#4CAF50",
	},
	mainViewOrderButton: {
		backgroundColor: "#2196F3",
	},
	mainPayButton: {
		backgroundColor: "#FF9800",
	},
	mainActionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	// Boutons écran 2
	buttonsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 15,
		gap: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	validateButton: {
		backgroundColor: "#4CAF50",
	},
	payButton: {
		backgroundColor: "#FF9800",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 25,
		alignItems: "center",
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	modalDescription: {
		fontSize: 16,
		color: "#555",
		marginBottom: 15,
		textAlign: "center",
		lineHeight: 22,
	},
	modalTags: {
		flexDirection: "row",
		marginBottom: 15,
	},
	modalTag: {
		fontSize: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		marginHorizontal: 5,
	},
	modalVeganTag: {
		backgroundColor: "#E8F5E9",
		color: "#2E7D32",
	},
	modalGlutenTag: {
		backgroundColor: "#FFF3E0",
		color: "#EF6C00",
	},
	modalAllergens: {
		fontSize: 14,
		color: "#ff6b6b",
		fontStyle: "italic",
		marginBottom: 20,
		textAlign: "center",
	},
	modalCloseButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 12,
		paddingHorizontal: 40,
		borderRadius: 10,
	},
	modalCloseText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
});
