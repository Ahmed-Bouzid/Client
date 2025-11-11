import React, { useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
} from "react-native";

const sampleAddOns = [
	{ id: 101, name: "Extra fromage", price: 2 },
	{ id: 102, name: "Dessert surprise", price: 5 },
];

export default function AddOn({ currentOrders, onComplete, onBack }) {
	const [selected, setSelected] = useState([]);

	const toggleItem = (item) => {
		if (selected.includes(item)) {
			setSelected(selected.filter((i) => i !== item));
		} else {
			setSelected([...selected, item]);
		}
	};

	return (
		<View style={{ flex: 1, padding: 20 }}>
			<Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
				Suggestions pour votre commande
			</Text>

			<FlatList
				data={sampleAddOns}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingVertical: 10,
							backgroundColor: selected.includes(item) ? "#d0f0c0" : "#f0f0f0",
							marginBottom: 5,
							borderRadius: 8,
							paddingHorizontal: 10,
						}}
						onPress={() => toggleItem(item)}
					>
						<Text>{item.name}</Text>
						<Text>{item.price}€</Text>
					</TouchableOpacity>
				)}
			/>

			<TouchableOpacity
				style={{
					marginTop: 20,
					padding: 12,
					backgroundColor: "#4CAF50",
					borderRadius: 8,
					alignItems: "center",
				}}
				onPress={() => onComplete(selected)}
			>
				<Text style={{ color: "#fff", fontWeight: "bold" }}>
					Recapitulatif de la commande
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={{
					marginTop: 12,
					padding: 12,
					backgroundColor: "#FF7043",
					borderRadius: 8,
					alignItems: "center",
				}}
				onPress={onBack}
			>
				<Text style={{ color: "#fff", fontWeight: "bold" }}>
					Retour au menu
				</Text>
			</TouchableOpacity>
		</View>
	);
}
