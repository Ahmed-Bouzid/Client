import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	TextInput,
	ActivityIndicator,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAllergyStore } from "../stores/useAllergyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PREMIUM_COLORS } from "../theme/colors";
import useRestaurantConfig from "../hooks/useRestaurantConfig";
import { useRestaurantStore } from "../stores/useRestaurantStore";

export default function AllergyManagement({ onClose }) {
	// 🎨 Thème dynamique depuis la BDD, fallback PREMIUM_COLORS
	const restaurantId = useRestaurantStore((state) => state.id);
	const { config } = useRestaurantConfig(restaurantId);
	const theme = config?.style ? { ...PREMIUM_COLORS, ...config.style } : PREMIUM_COLORS;

	const { userAllergenIds, toggleAllergen, allergensCache, setAllergensCache } =
		useAllergyStore();

	const [allergens, setAllergens] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadAllergens();
	}, []);

	const loadAllergens = async () => {
		setLoading(true);
		try {
			const token = await AsyncStorage.getItem("clientToken");
			const response = await fetch(
				`${process.env.EXPO_PUBLIC_API_URL || "https://orderit-backend-6y1m.onrender.com"}/allergens`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setAllergens(Array.isArray(data) ? data : []);
				setAllergensCache(Array.isArray(data) ? data : []);
			} else {
				throw new Error("Erreur chargement allergènes");
			}
		} catch (error) {
			console.error("❌ Erreur chargement allergènes:", error);
			Alert.alert("Erreur", "Impossible de charger les allergènes");
		} finally {
			setLoading(false);
		}
	};

	const filteredAllergens = allergens.filter((a) =>
		a.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const renderAllergenItem = ({ item }) => {
		const isSelected = userAllergenIds.includes(item._id);

		return (
			<TouchableOpacity
				style={{
					flexDirection: "row",
					alignItems: "center",
					padding: 16,
					marginVertical: 6,
					marginHorizontal: 16,
					backgroundColor: "#fff",
					borderRadius: 12,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 3,
					borderWidth: 2,
					borderColor: isSelected ? "#eb3349" : "transparent",
				}}
				onPress={() => toggleAllergen(item._id)}
				activeOpacity={0.7}
			>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isSelected ? "#eb3349" : "#f5f5f5",
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					{isSelected ? (
						<Ionicons name="checkmark" size={20} color="#fff" />
					) : (
						<Ionicons name="warning-outline" size={20} color="#999" />
					)}
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: isSelected ? "700" : "600",
							color: isSelected ? "#eb3349" : "#333",
							marginBottom: 2,
						}}
					>
						{item.icon} {item.name}
					</Text>
					{item.description && (
						<Text
							style={{
								fontSize: 13,
								color: "#666",
							}}
							numberOfLines={2}
						>
							{item.description}
						</Text>
					)}
				</View>

				{isSelected && (
					<View
						style={{
							backgroundColor: "#fee",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 6,
						}}
					>
						<Text style={{ fontSize: 11, color: "#eb3349", fontWeight: "600" }}>
							ACTIF
						</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#f8f9fa", height: "100%" }}>
			{/* Header */}
			<LinearGradient
				colors={theme.primary}
				style={{
					paddingTop: 60,
					paddingBottom: 20,
					paddingHorizontal: 20,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<View style={{ flex: 1 }}>
						<Text
							style={{
								fontSize: 28,
								fontWeight: "700",
								color: "#fff",
								marginBottom: 4,
							}}
						>
							Mes allergies
						</Text>
						<Text style={{ fontSize: 14, color: "#f0f0f0" }}>
							{userAllergenIds.length} allergène(s) sélectionné(s)
						</Text>
					</View>
					{onClose && (
						<TouchableOpacity
							onPress={onClose}
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: "rgba(255,255,255,0.2)",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name="close" size={24} color="#fff" />
						</TouchableOpacity>
					)}
				</View>
			</LinearGradient>

			{/* Info Card */}
			<View
				style={{
					margin: 16,
					padding: 16,
					backgroundColor: "#fff",
					borderRadius: 12,
					borderLeftWidth: 4,
					borderLeftColor: "#667eea",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 3,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Ionicons name="information-circle" size={24} color="#667eea" />
					<Text
						style={{
							marginLeft: 8,
							fontSize: 13,
							color: "#555",
							flex: 1,
							lineHeight: 18,
						}}
					>
						Les produits contenant vos allergènes seront marqués d'un{" "}
						<Text style={{ fontWeight: "700", color: "#eb3349" }}>
							point rouge
						</Text>{" "}
						dans le menu.
					</Text>
				</View>
			</View>

			{/* Search Bar */}
			<View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: "#fff",
						borderRadius: 12,
						paddingHorizontal: 12,
						height: 48,
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.05,
						shadowRadius: 2,
						elevation: 2,
					}}
				>
					<Ionicons name="search" size={20} color="#999" />
					<TextInput
						style={{
							flex: 1,
							marginLeft: 8,
							fontSize: 16,
							color: "#333",
						}}
						placeholder="Rechercher un allergène..."
						placeholderTextColor="#999"
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery("")}>
							<Ionicons name="close-circle" size={20} color="#999" />
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* List */}
			{loading ? (
				<View
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<ActivityIndicator size="large" color="#667eea" />
					<Text style={{ marginTop: 12, fontSize: 14, color: "#999" }}>
						Chargement des allergènes...
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredAllergens}
					renderItem={renderAllergenItem}
					keyExtractor={(item) => item._id}
					contentContainerStyle={{ paddingBottom: 20 }}
					ListEmptyComponent={
						<View
							style={{
								padding: 40,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name="sad-outline" size={64} color="#ccc" />
							<Text
								style={{
									marginTop: 16,
									fontSize: 16,
									color: "#999",
									textAlign: "center",
								}}
							>
								Aucun allergène trouvé
							</Text>
						</View>
					}
				/>
			)}

			{/* Save Button (optional, auto-save via store) */}
			{userAllergenIds.length > 0 && (
				<View
					style={{
						padding: 16,
						backgroundColor: "#fff",
						borderTopWidth: 1,
						borderTopColor: "#eee",
					}}
				>
					<TouchableOpacity
						onPress={() => {
							Alert.alert(
								"Sauvegardé",
								"Vos allergies sont automatiquement sauvegardées",
								[{ text: "OK" }],
							);
						}}
					>
						<LinearGradient
							colors={theme.success}
							style={{
								padding: 16,
								borderRadius: 12,
								alignItems: "center",
							}}
						>
							<Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
								✓ {userAllergenIds.length} allergène(s) actif(s)
							</Text>
						</LinearGradient>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}
