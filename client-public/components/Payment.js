import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Payment({ allOrders, onSuccess, onBack }) {
	const total = allOrders.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Paiement</Text>

			<View style={styles.orderDetails}>
				<Text style={styles.detailTitle}>Détail de votre commande totale:</Text>
				{allOrders.map((item, index) => (
					<View key={index} style={styles.orderItem}>
						<Text>
							{item.name} x {item.quantity}
						</Text>
						<Text>{item.price * item.quantity}€</Text>
					</View>
				))}
			</View>

			<Text style={styles.total}>Total: {total}€</Text>

			<View style={styles.buttonsContainer}>
				<TouchableOpacity style={styles.payButton} onPress={onSuccess}>
					<Text style={styles.buttonText}>Payer {total}€</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.backButton} onPress={onBack}>
					<Text style={styles.buttonText}>Retour</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "whitesmoke",
	},
	title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
	orderDetails: {
		width: "100%",
		marginBottom: 30,
		padding: 15,
		backgroundColor: "#fff",
		borderRadius: 8,
	},
	detailTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
	orderItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 5,
	},
	total: { fontSize: 20, fontWeight: "600", marginBottom: 20 },
	buttonsContainer: { width: "100%", gap: 10 },
	payButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	backButton: {
		backgroundColor: "#757575",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
