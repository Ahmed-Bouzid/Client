// Payment.js
import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ⬅️ AJOUTEZ CE IMPORT

export default function Payment({
	allOrders = [],
	orderId,
	onSuccess,
	onBack,
}) {
	const [loading, setLoading] = useState(false);
	const API_URL = "http://192.168.1.185:3000";

	console.log("🎫 Payment reçu:", {
		orderId,
		allOrdersCount: allOrders.length,
	});

	const getClientToken = async () => {
		try {
			const token = await AsyncStorage.getItem("clientToken");
			if (!token) {
				console.log("❌ Pas de token dans AsyncStorage");
				return null;
			}
			console.log("✅ Token récupéré:", token.substring(0, 20) + "...");
			return token;
		} catch (error) {
			console.error("Erreur récupération token:", error);
			return null;
		}
	};

	const handlePay = async () => {
		console.log("💰 Paiement pour orderId:", orderId);

		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande à payer");
			return;
		}

		setLoading(true);

		try {
			// 1. Récupérer le token
			const token = await getClientToken();
			if (!token) {
				Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
				setLoading(false);
				return;
			}

			console.log("📡 Envoi requête avec token...");

			// 2. Envoyer la requête avec token
			const response = await fetch(
				`${API_URL}/orders/${orderId}/mark-as-paid`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`, // ⬅️ AJOUTEZ LE TOKEN
					},
				}
			);

			console.log("📡 Status paiement:", response.status);

			if (response.ok) {
				const data = await response.json();
				console.log("✅ Paiement réussi:", data);

				Alert.alert(
					"✅ Paiement réussi",
					"Votre commande a été marquée comme payée.",
					[
						{
							text: "OK",
							onPress: onSuccess,
						},
					]
				);
			} else {
				const errorText = await response.text();
				console.log("❌ Erreur réponse:", errorText);

				if (response.status === 401) {
					Alert.alert(
						"❌ Erreur d'authentification",
						"Votre session a expiré. Veuillez vous reconnecter.",
						[{ text: "OK" }]
					);
				} else {
					Alert.alert("❌ Erreur", errorText || "Le paiement a échoué");
				}
			}
		} catch (error) {
			console.error("🔥 Erreur réseau:", error);
			Alert.alert("❌ Erreur réseau", "Impossible de se connecter au serveur");
		} finally {
			setLoading(false);
		}
	};

	// Si pas d'orderId, afficher erreur
	if (!orderId) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Erreur</Text>
				<Text style={styles.errorText}>
					❌ Aucune commande à payer{"\n"}
					Retournez au menu et validez une commande d'abord.
				</Text>
				<TouchableOpacity style={styles.backButton} onPress={onBack}>
					<Text style={styles.buttonText}>Retour au Menu</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const total = allOrders.reduce(
		(sum, item) => sum + item.price * (item.quantity || 1),
		0
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Paiement</Text>

			<Text style={styles.orderId}>
				Commande: {orderId.substring(0, 12)}...
			</Text>

			<View style={styles.orderDetails}>
				<Text style={styles.detailTitle}>Articles:</Text>
				{allOrders.length === 0 ? (
					<Text style={styles.emptyText}>Aucun article à afficher</Text>
				) : (
					allOrders.map((item, index) => (
						<View key={index} style={styles.orderItem}>
							<Text style={styles.itemName}>
								{item.name} x {item.quantity || 1}
							</Text>
							<Text style={styles.itemPrice}>
								{(item.price * (item.quantity || 1)).toFixed(2)}€
							</Text>
						</View>
					))
				)}
			</View>

			<Text style={styles.total}>Total: {total.toFixed(2)}€</Text>

			<View style={styles.buttonsContainer}>
				<TouchableOpacity
					style={[styles.payButton, loading && styles.payButtonDisabled]}
					onPress={handlePay}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>Marquer comme payé</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.backButton}
					onPress={onBack}
					disabled={loading}
				>
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
		backgroundColor: "#f8f9fa",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
	},
	orderId: {
		fontSize: 14,
		color: "#666",
		marginBottom: 20,
		fontFamily: "monospace",
		backgroundColor: "#f0f0f0",
		padding: 8,
		borderRadius: 6,
	},
	errorText: {
		color: "red",
		margin: 20,
		textAlign: "center",
		lineHeight: 22,
	},
	orderDetails: {
		width: "100%",
		marginBottom: 25,
		padding: 20,
		backgroundColor: "#fff",
		borderRadius: 12,
	},
	detailTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		color: "#333",
	},
	emptyText: {
		color: "#999",
		fontStyle: "italic",
		textAlign: "center",
		padding: 20,
	},
	orderItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	itemName: {
		fontSize: 16,
		color: "#555",
	},
	itemPrice: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	total: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 30,
		color: "#4CAF50",
	},
	buttonsContainer: {
		width: "100%",
		gap: 15,
	},
	payButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	payButtonDisabled: {
		backgroundColor: "#81C784",
	},
	backButton: {
		backgroundColor: "#757575",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
});
