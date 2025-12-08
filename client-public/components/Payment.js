// Payment.js
import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useOrderStore } from "../stores/useOrderStore.js";

export default function Payment({
	allOrders = [],
	orderId,
	onSuccess,
	onBack,
}) {
	const [loading, setLoading] = useState(false);
	const [selectedItems, setSelectedItems] = useState(new Set());
	const { markAsPaid, isLoading } = useOrderStore();

	// Créer un identifiant unique pour chaque article (même si c'est le même produit)
	const getItemId = (index) => {
		return `item-${index}`;
	};

	// Initialiser avec tous les articles sélectionnés par défaut
	useEffect(() => {
		if (allOrders && allOrders.length > 0) {
			const allIds = new Set(allOrders.map((_, index) => getItemId(index)));
			setSelectedItems(allIds);
		}
	}, [allOrders]);

	const toggleItem = (index) => {
		if (!allOrders || !allOrders[index]) return;
		const itemId = getItemId(index);
		const newSelected = new Set(selectedItems);
		if (newSelected.has(itemId)) {
			newSelected.delete(itemId);
		} else {
			newSelected.add(itemId);
		}
		setSelectedItems(newSelected);
	};

	const toggleAll = () => {
		if (!allOrders || allOrders.length === 0) return;
		
		if (selectedItems.size === allOrders.length) {
			// Tout désélectionner
			setSelectedItems(new Set());
		} else {
			// Tout sélectionner
			const allIds = new Set(allOrders.map((_, index) => getItemId(index)));
			setSelectedItems(allIds);
		}
	};

	const safeAllOrders = allOrders || [];
	const selectedOrders = safeAllOrders.filter((_, index) => 
		selectedItems.has(getItemId(index))
	);
	const total = selectedOrders.reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
		0
	);

	const handlePay = async () => {
		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande à payer");
			return;
		}

		if (selectedItems.size === 0) {
			Alert.alert("Erreur", "Veuillez sélectionner au moins un article à payer");
			return;
		}

		setLoading(true);

		try {
			// Pour l'instant, on paie toute la commande
			// TODO: Implémenter le paiement partiel côté backend si nécessaire
			await markAsPaid(orderId);
			Alert.alert(
				"✅ Paiement réussi",
				`${selectedOrders.length} article(s) sélectionné(s).`,
				[
					{
						text: "OK",
						onPress: () => {
							onSuccess();
						},
					},
				]
			);
		} catch (error) {
			// L'erreur est déjà gérée par le store
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

	const isProcessing = loading || isLoading;
	const allSelected = selectedItems.size === safeAllOrders.length && safeAllOrders.length > 0;

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Paiement</Text>

			<Text style={styles.orderId}>
				Commande: {orderId.substring(0, 12)}...
			</Text>

			<View style={styles.orderDetails}>
				<View style={styles.headerRow}>
					<Text style={styles.detailTitle}>Articles:</Text>
					<TouchableOpacity onPress={toggleAll} style={styles.selectAllButton}>
						<Text style={styles.selectAllText}>
							{allSelected ? "Tout désélectionner" : "Tout sélectionner"}
						</Text>
					</TouchableOpacity>
				</View>

				{safeAllOrders.length === 0 ? (
					<Text style={styles.emptyText}>Aucun article à afficher</Text>
				) : (
					<ScrollView style={styles.itemsList}>
						{safeAllOrders.map((item, index) => {
							const itemId = getItemId(index);
							const isSelected = selectedItems.has(itemId);
							return (
								<TouchableOpacity
									key={`${item.name}-${index}-${item.price}`}
									style={[
										styles.orderItem,
										isSelected && styles.orderItemSelected,
									]}
									onPress={() => toggleItem(index)}
								>
									<View style={styles.checkboxContainer}>
										<View
											style={[
												styles.checkbox,
												isSelected && styles.checkboxChecked,
											]}
										>
											{isSelected && (
												<MaterialIcons
													name="check"
													size={18}
													color="#fff"
												/>
											)}
										</View>
									</View>
									<View style={styles.itemInfo}>
										<Text style={styles.itemName}>
											{item.name} x {item.quantity || 1}
										</Text>
										<Text style={styles.itemPrice}>
											{(item.price * (item.quantity || 1)).toFixed(2)}€
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>
				)}
			</View>

			<View style={styles.totalContainer}>
				<Text style={styles.totalLabel}>
					Total ({selectedOrders.length} article{selectedOrders.length > 1 ? "s" : ""}):
				</Text>
				<Text style={styles.total}> {total.toFixed(2)}€</Text>
			</View>

			<View style={styles.buttonsContainer}>
				<TouchableOpacity
					style={[
						styles.payButton,
						(isProcessing || selectedItems.size === 0) &&
							styles.payButtonDisabled,
					]}
					onPress={handlePay}
					disabled={isProcessing || selectedItems.size === 0}
				>
					{isProcessing ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>
							Payer {selectedOrders.length} article{selectedOrders.length > 1 ? "s" : ""}
						</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.backButton}
					onPress={onBack}
					disabled={isProcessing}
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
		padding: 20,
		backgroundColor: "#f8f9fa",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	orderId: {
		fontSize: 14,
		color: "#666",
		marginBottom: 20,
		fontFamily: "monospace",
		backgroundColor: "#f0f0f0",
		padding: 8,
		borderRadius: 6,
		textAlign: "center",
	},
	errorText: {
		color: "red",
		margin: 20,
		textAlign: "center",
		lineHeight: 22,
	},
	orderDetails: {
		width: "100%",
		marginBottom: 15,
		padding: 15,
		backgroundColor: "#fff",
		borderRadius: 12,
		maxHeight: 400,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	detailTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	selectAllButton: {
		padding: 5,
	},
	selectAllText: {
		fontSize: 14,
		color: "#2196F3",
		fontWeight: "600",
	},
	itemsList: {
		maxHeight: 300,
	},
	orderItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		borderRadius: 8,
		marginBottom: 5,
	},
	orderItemSelected: {
		backgroundColor: "#E8F5E9",
	},
	checkboxContainer: {
		marginRight: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: "#4CAF50",
		borderRadius: 4,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	checkboxChecked: {
		backgroundColor: "#4CAF50",
		borderColor: "#4CAF50",
	},
	itemInfo: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	itemName: {
		fontSize: 16,
		color: "#555",
		flex: 1,
	},
	itemPrice: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginLeft: 10,
	},
	emptyText: {
		color: "#999",
		fontStyle: "italic",
		textAlign: "center",
		padding: 20,
	},
	totalContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
		paddingVertical: 15,
		backgroundColor: "#fff",
		borderRadius: 12,
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
	},
	total: {
		fontSize: 24,
		fontWeight: "bold",
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
		opacity: 0.6,
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
