import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	SectionList,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProductStore } from "../../client-public/stores/useProductStore";

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
}) {
	const products = useProductStore((state) => state.products);
	const fetchProducts = useProductStore((state) => state.fetchProducts);

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [cart, setCart] = useState({});

	// ⚡ Groupement des produits par catégorie (optimisé avec useMemo)
	const groupedProducts = useMemo(() => {
		const grouped = {};
		products.forEach((p) => {
			const category = p.category || "Autres";
			if (!grouped[category]) grouped[category] = [];
			grouped[category].push(p);
		});
		return Object.keys(grouped).map((cat) => ({
			title: cat,
			data: grouped[cat],
		}));
	}, [products]);

	// 🧺 Gère les ajouts/suppressions
	const handleIncrease = (item) => {
		setCart({ ...cart, [item._id]: (cart[item._id] || 0) + 1 });
		onAdd(item);
	};

	const handleDecrease = (item) => {
		if (cart[item._id] > 0) {
			setCart({ ...cart, [item._id]: cart[item._id] - 1 });
		}
	};

	// 🧾 Articles ajoutés

	const cartItems = products
		.filter((item) => cart[item._id] > 0)
		.map((item) => ({
			...item,
			sent:
				orders.find((o) => o.name === item.name && o.user === userName)?.sent ||
				false,
		}));

	const openModal = (item) => {
		setSelectedItem(item);
		setModalVisible(true);
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	// 🎨 Rendu d’un produit
	const renderItem = ({ item }) => (
		<View style={styles.item}>
			<TouchableOpacity
				style={styles.infoContainer}
				onPress={() => openModal(item)}
			>
				<Text style={styles.name}>{item.name}</Text>
			</TouchableOpacity>

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
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Menu de {userName}</Text>

			<SectionList
				sections={groupedProducts}
				keyExtractor={(item) => item._id.toString()}
				renderItem={renderItem}
				renderSectionHeader={({ section: { title } }) => (
					<Text style={styles.categoryTitle}>{title}</Text>
				)}
				ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
				SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
				contentContainerStyle={{ paddingBottom: 150 }}
			/>

			<View style={styles.separatorLine} />

			{/* 🛒 Panier */}
			<View style={styles.cartContainer}>
				<Text style={styles.cartTitle}>Votre commande :</Text>
				{cartItems.length === 0 ? (
					<Text style={{ fontStyle: "italic" }}>
						Ajoutez votre premier article au panier.
					</Text>
				) : (
					<View>
						{cartItems.map((item) => (
							<Text key={item._id}>
								{item.name} x {cart[item._id]} {item.sent ? "(Envoyée)" : ""}
							</Text>
						))}
					</View>
				)}
				{/* ✅ DEUX BOUTONS INDÉPENDANTS */}

				<View style={styles.buttonsContainer}>
					{/* BOUTON 1: "Valider la commande" - DÉPEND SEULEMENT DES ARTICLES */}
					{cartItems.length > 0 && (
						<TouchableOpacity
							style={[styles.actionButton, styles.validateButton]}
							onPress={onNavigateToOrders}
						>
							<Text style={styles.actionButtonText}>
								✅ Valider la commande ({Object.keys(cart).length} articles)
							</Text>
						</TouchableOpacity>
					)}

					{/* BOUTON 2: "Payer" - DÉPEND SEULEMENT SI COMMANDE ENVOYÉE */}
					{hasActiveOrder && (
						<TouchableOpacity
							style={[styles.actionButton, styles.payButton]}
							onPress={onNavigateToPayment}
						>
							<Text style={styles.actionButtonText}>💳 Payer ma commande</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* 🔹 Modal d'information sur un produit */}
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
								{selectedItem.description}
							</Text>
							<View style={{ flexDirection: "row", marginTop: 10 }}>
								{selectedItem.vegan && (
									<MaterialCommunityIcons
										name="leaf"
										size={24}
										color="green"
										style={{ marginRight: 10 }}
									/>
								)}
								{selectedItem.glutenFree && (
									<MaterialCommunityIcons
										name="wheat"
										size={24}
										color="orange"
										style={{ marginRight: 10 }}
									/>
								)}
							</View>
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
	container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
	title: { fontSize: 26, fontWeight: "bold", marginBottom: 15, color: "#333" },

	categoryTitle: {
		paddingVertical: 8,
		paddingHorizontal: 1,
		backgroundColor: "#F5F5DC",
		color: "#2E7D32",
		fontSize: 18,
		fontWeight: "500",
		borderRadius: 6,
		textAlign: "center",
		borderBottomWidth: 3,
		borderBottomColor: "#81C784",
		fontFamily: "serif",
	},

	item: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 12,
		borderRadius: 10,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},

	infoContainer: { flexDirection: "row", alignItems: "center", flex: 2 },
	name: { fontSize: 18, color: "#333" },
	price: { flex: 1, fontSize: 18, color: "#333", textAlign: "center" },

	counter: { flexDirection: "row", alignItems: "center" },
	counterButton: {
		width: 32,
		height: 32,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	counterText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111",
	},
	counterValue: {
		marginHorizontal: 8,
		fontSize: 16,
		fontWeight: "500",
		color: "#0F172A",
	},

	cartContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		maxHeight: "25%",
		backgroundColor: "#f0f0f0",
		padding: 10,
		borderTopWidth: 1,
		borderColor: "#ccc",
	},
	cartTitle: { fontWeight: "bold", marginBottom: 5 },
	validateBtn: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#2196F3",
		borderRadius: 8,
		alignSelf: "flex-end",
		marginTop: 10,
	},
	validateText: { color: "#fff", fontWeight: "bold" },
	payBtn: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#4CAF50",
		borderRadius: 8,
		alignSelf: "flex-end",
		marginTop: 10,
	},
	payText: { color: "#fff", fontWeight: "bold" },

	separatorLine: { height: 1, backgroundColor: "#ccc", marginVertical: 10 },
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "80%",
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 20,
		alignItems: "center",
	},
	modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
	modalDescription: {
		fontSize: 16,
		color: "#555",
		marginBottom: 20,
		textAlign: "center",
	},
	modalCloseButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 10,
		paddingHorizontal: 30,
		borderRadius: 8,
	},
	modalCloseText: { color: "#fff", fontWeight: "bold" },
	buttonsContainer: {
		marginTop: 15,
		gap: 10,
	},
	actionButton: {
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	validateButton: {
		backgroundColor: "#4CAF50",
	},
	payButton: {
		backgroundColor: "#FF9800",
	},
	summaryButton: {
		backgroundColor: "#2196F3",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
});
