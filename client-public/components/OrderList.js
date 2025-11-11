import React from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from "react-native";

export default function OrderList({ orders, setOrders, cart, setCart }) {
	const handleIncrease = (item) => {
		setOrders((prev) =>
			prev.map((o) =>
				o.name === item.name ? { ...o, quantity: o.quantity + 1 } : o
			)
		);
	};

	const handleDecrease = (item) => {
		setOrders((prev) =>
			prev.map((o) =>
				o.name === item.name
					? { ...o, quantity: Math.max(0, o.quantity - 1) }
					: o
			)
		);
	};
	return (
		<View style={{ flex: 1, padding: 20 }}>
			<Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
				Commandes envoyées
			</Text>
			<FlatList
				data={orders.filter((item) => item.quantity > 0)}
				keyExtractor={(item, index) => index.toString()}
				renderItem={({ item }) => (
					<View style={styles.item}>
						<Text style={styles.name}>{item.name}</Text>
						<Text style={styles.price}>{item.price}€</Text>

						<View style={styles.counter}>
							<TouchableOpacity
								style={styles.counterButton}
								onPress={() => handleDecrease(item)} // diminue la quantité
							>
								<Text style={styles.counterText}>−</Text>
							</TouchableOpacity>

							<Text style={styles.counterValue}>{item.quantity}</Text>

							<TouchableOpacity
								style={styles.counterButton}
								onPress={() => handleIncrease(item)} // augmente la quantité
							>
								<Text style={styles.counterText}>+</Text>
							</TouchableOpacity>
						</View>

						<Text style={{ marginLeft: 10 }}>
							{item.sent ? "Envoyée" : "En cours"}
						</Text>
					</View>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	item: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderColor: "#ccc",
	},
});
