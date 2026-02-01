import React, { useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const sampleAddOns = [
	{
		id: 101,
		name: "Extra fromage",
		price: 2,
		description: "Fromage supplémentaire pour vos plats",
		popular: true,
	},
	{
		id: 102,
		name: "Dessert surprise",
		price: 5,
		description: "Notre dessert du jour",
		popular: true,
	},
	{
		id: 103,
		name: "Sauce maison",
		price: 1.5,
		description: "Notre sauce secrète",
		popular: false,
	},
	{
		id: 104,
		name: "Boisson premium",
		price: 3.5,
		description: "Boisson gazeuse ou jus frais",
		popular: false,
	},
	{
		id: 105,
		name: "Pain à l'ail",
		price: 2.5,
		description: "Pain frais à l'ail et persil",
		popular: true,
	},
	{
		id: 106,
		name: "Salade complémentaire",
		price: 3,
		description: "Salade fraîche avec vinaigrette",
		popular: false,
	},
];

export default function AddOn({
	currentOrders = [],
	onComplete = () => {},
	onBack = () => {},
}) {
	const [selected, setSelected] = useState([]);

	const toggleItem = (item) => {
		if (selected.includes(item)) {
			setSelected(selected.filter((i) => i !== item));
		} else {
			setSelected([...selected, item]);
		}
	};

	const calculateTotal = () => {
		return selected.reduce((sum, item) => sum + item.price, 0);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
					<MaterialIcons name="arrow-back" size={24} color="#333" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Suggestions supplémentaires</Text>
				<View style={{ width: 40 }} />
			</View>

			<Text style={styles.subtitle}>
				Améliorez votre expérience avec ces ajouts délicieux
			</Text>

			{/* Liste des add-ons */}
			<ScrollView style={styles.listContainer}>
				<FlatList
					data={sampleAddOns}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={[
								styles.addOnCard,
								selected.includes(item) && styles.selectedCard,
							]}
							onPress={() => toggleItem(item)}
						>
							<View style={styles.addOnInfo}>
								<View style={styles.addOnHeader}>
									<Text style={styles.addOnName}>{item.name}</Text>
									{item.popular && (
										<View style={styles.popularBadge}>
											<Text style={styles.popularText}>Populaire</Text>
										</View>
									)}
								</View>
								<Text style={styles.addOnDescription}>{item.description}</Text>
							</View>

							<View style={styles.addOnActions}>
								<Text style={styles.addOnPrice}>{item.price.toFixed(2)}€</Text>
								<View
									style={[
										styles.checkbox,
										selected.includes(item) && styles.checkboxSelected,
									]}
								>
									{selected.includes(item) && (
										<MaterialIcons name="check" size={16} color="#fff" />
									)}
								</View>
							</View>
						</TouchableOpacity>
					)}
					scrollEnabled={false}
				/>
			</ScrollView>

			{/* Panier des sélections */}
			{selected.length > 0 && (
				<View style={styles.selectionSummary}>
					<Text style={styles.summaryTitle}>Vos ajouts sélectionnés :</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View style={styles.selectedItems}>
							{selected.map((item) => (
								<View key={item.id} style={styles.selectedItem}>
									<Text style={styles.selectedItemName}>{item.name}</Text>
									<Text style={styles.selectedItemPrice}>{item.price}€</Text>
								</View>
							))}
						</View>
					</ScrollView>
					<Text style={styles.totalText}>
						Total supplémentaire :{" "}
						<Text style={styles.totalPrice}>
							{calculateTotal().toFixed(2)}€
						</Text>
					</Text>
				</View>
			)}

			{/* Actions en bas */}
			{/* Actions en bas */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity
					style={styles.backButtonAction}
					onPress={() => onBack?.()}
				>
					<MaterialIcons name="arrow-back" size={20} color="#666" />
					<Text style={styles.backButtonText}>Retour</Text>
				</TouchableOpacity>

				{/* BOUTON UNIQUE POUR CONTINUER */}
				<TouchableOpacity
					style={styles.nextButton}
					onPress={() => onComplete?.(selected)}
				>
					<Text style={styles.nextButtonText}>
						{selected.length === 0 ? "Passer" : "Continuer"}
					</Text>
					<MaterialIcons name="arrow-forward" size={20} color="#fff" />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f9fa",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 15,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	backButton: {
		padding: 5,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginVertical: 15,
		paddingHorizontal: 20,
	},
	listContainer: {
		flex: 1,
		paddingHorizontal: 20,
	},
	addOnCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 15,
		borderRadius: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#eee",
		elevation: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	selectedCard: {
		borderColor: "#4CAF50",
		backgroundColor: "#F1F8E9",
	},
	addOnInfo: {
		flex: 1,
		marginRight: 15,
	},
	addOnHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 5,
	},
	addOnName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginRight: 10,
	},
	popularBadge: {
		backgroundColor: "#FF9800",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
	},
	popularText: {
		fontSize: 10,
		color: "#fff",
		fontWeight: "bold",
	},
	addOnDescription: {
		fontSize: 13,
		color: "#666",
	},
	addOnActions: {
		alignItems: "center",
	},
	addOnPrice: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#4CAF50",
		marginBottom: 8,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#ddd",
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		backgroundColor: "#4CAF50",
		borderColor: "#4CAF50",
	},
	selectionSummary: {
		backgroundColor: "#fff",
		padding: 15,
		marginHorizontal: 20,
		marginBottom: 15,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#eee",
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		marginBottom: 10,
	},
	selectedItems: {
		flexDirection: "row",
		marginBottom: 10,
	},
	selectedItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#E8F5E9",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
	},
	selectedItemName: {
		fontSize: 13,
		color: "#2E7D32",
		marginRight: 5,
	},
	selectedItemPrice: {
		fontSize: 13,
		fontWeight: "bold",
		color: "#2E7D32",
	},
	totalText: {
		fontSize: 14,
		color: "#333",
		textAlign: "right",
	},
	totalPrice: {
		fontWeight: "bold",
		color: "#4CAF50",
		fontSize: 16,
	},
	actionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingBottom: 25,
		paddingTop: 15,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	backButtonAction: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f8f9fa",
	},
	backButtonText: {
		fontSize: 16,
		color: "#666",
		marginLeft: 8,
	},
	nextButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 10,
		backgroundColor: "#4CAF50",
	},
	nextButtonDisabled: {
		backgroundColor: "#BDBDBD",
	},
	nextButtonText: {
		fontSize: 16,
		color: "#fff",
		fontWeight: "bold",
		marginRight: 8,
	},
});
