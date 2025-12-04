import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const OrderSummary = ({
	allOrders = [], // ← VALEUR PAR DÉFAUT
	currentOrder = [], // ← VALEUR PAR DÉFAUT
	onUpdateQuantity = () => {},
	onSubmitOrder = () => {},
	onBackToMenu = () => {},
}) => {
	// Sécurité contre les données undefined
	const safeAllOrders = allOrders || [];
	const safeCurrentOrder = currentOrder || [];

	const sentOrders = safeAllOrders.filter((item) => item && item.sent);
	const totalAll = [...sentOrders, ...safeCurrentOrder].reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
		0
	);

	return (
		<View style={{ flex: 1, padding: 20 }}>
			<Text style={styles.title}>Récapitulatif de votre commande</Text>

			{sentOrders.length > 0 && (
				<>
					<Text style={styles.sectionTitle}>Commandes précédentes</Text>
					{sentOrders.map((item, index) => (
						<View key={`sent-${index}`} style={styles.sentOrderItem}>
							<Text style={styles.sentItemText}>
								{item?.name || "Produit"} x {item?.quantity || 0} (
								{item?.price || 0}€)
							</Text>
							<Text style={styles.sentItemSubtotal}>
								= {(item?.price || 0) * (item?.quantity || 0)}€
							</Text>
						</View>
					))}
					<View style={styles.sentTotal}>
						<Text style={styles.sentTotalText}>
							Total commandes précédentes:{" "}
							{sentOrders.reduce(
								(sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
								0
							)}
							€
						</Text>
					</View>
				</>
			)}

			{safeCurrentOrder.length > 0 && (
				<>
					<Text style={styles.sectionTitle}>Commande en cours</Text>
					{safeCurrentOrder.map((item, index) => (
						<View key={`current-${index}`} style={styles.currentOrderItem}>
							<Text style={styles.itemName}>
								{item?.name || "Produit"} ({item?.price || 0}€)
							</Text>
							<View style={styles.quantityControls}>
								<TouchableOpacity
									style={styles.quantityButton}
									onPress={() =>
										onUpdateQuantity(item, (item?.quantity || 0) - 1)
									}
								>
									<Text style={styles.quantityButtonText}>−</Text>
								</TouchableOpacity>
								<Text style={styles.quantityText}>{item?.quantity || 0}</Text>
								<TouchableOpacity
									style={styles.quantityButton}
									onPress={() =>
										onUpdateQuantity(item, (item?.quantity || 0) + 1)
									}
								>
									<Text style={styles.quantityButtonText}>+</Text>
								</TouchableOpacity>
							</View>
						</View>
					))}
				</>
			)}

			<View style={styles.grandTotal}>
				<Text style={styles.grandTotalText}>TOTAL À PAYER: {totalAll}€</Text>
			</View>

			<View style={styles.actionsContainer}>
				<TouchableOpacity
					style={[styles.actionButton, styles.sendButton]}
					onPress={onSubmitOrder}
				>
					<Text style={styles.actionButtonText}>
						{safeCurrentOrder.length > 0
							? "Envoyer la commande"
							: "Commande envoyée"}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.actionButton, styles.backButton]}
					onPress={onBackToMenu}
				>
					<Text style={styles.actionButtonText}>Retour au menu</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	title: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginVertical: 10,
		color: "#333",
	},
	sentOrderItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	sentItemText: {
		color: "#999",
		fontStyle: "italic",
		fontSize: 16,
	},
	sentItemSubtotal: {
		color: "#999",
		fontStyle: "italic",
		fontSize: 14,
	},
	sentTotal: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
	},
	sentTotalText: {
		color: "#666",
		fontWeight: "600",
		fontSize: 16,
		textAlign: "right",
	},
	currentOrderItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	itemName: {
		fontSize: 16,
		flex: 1,
	},
	quantityControls: {
		flexDirection: "row",
		alignItems: "center",
	},
	quantityButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#4CAF50",
		borderRadius: 4,
		marginHorizontal: 4,
	},
	quantityButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	quantityText: {
		marginHorizontal: 8,
		fontSize: 16,
		fontWeight: "600",
		minWidth: 20,
		textAlign: "center",
	},
	grandTotal: {
		marginTop: 20,
		paddingTop: 15,
		borderTopWidth: 2,
		borderTopColor: "#333",
	},
	grandTotalText: {
		fontSize: 20,
		fontWeight: "bold",
		textAlign: "center",
		color: "#333",
	},
	actionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 30,
		gap: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	sendButton: {
		backgroundColor: "#4CAF50",
	},
	backButton: {
		backgroundColor: "#2196F3",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 14,
		textAlign: "center",
	},
});

export default OrderSummary;
