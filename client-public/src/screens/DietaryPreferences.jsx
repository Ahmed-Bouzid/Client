import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	TextInput,
	ActivityIndicator,
	Alert,
	Modal,
	ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAllergyStore } from "../stores/useAllergyStore";
import { useRestrictionStore } from "../stores/useRestrictionStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREMIUM_COLORS } from "../theme/colors";

const RESTRICTIONS_OPTIONS = [
	{
		id: "halal",
		name: "Halal",
		icon: "🕌",
		description: "Viande Halal uniquement",
	},
	{
		id: "casher",
		name: "Casher",
		icon: "✡️",
		description: "Alimentation Casher",
	},
	{ id: "vegan", name: "Vegan", icon: "🌱", description: "100% végétal" },
	{
		id: "vegetarian",
		name: "Végétarien",
		icon: "🥗",
		description: "Sans viande ni poisson",
	},
	{
		id: "gluten-free",
		name: "Sans gluten",
		icon: "🌾",
		description: "Sans gluten",
	},
	{
		id: "lactose-free",
		name: "Sans lactose",
		icon: "🥛",
		description: "Sans produits laitiers",
	},
];

export default function DietaryPreferences({ visible, onClose }) {
	const [activeTab, setActiveTab] = useState("allergies"); // "allergies" ou "restrictions"

	const { userAllergenIds, toggleAllergen, allergensCache, setAllergensCache } =
		useAllergyStore();
	const { userRestrictions, toggleRestriction } = useRestrictionStore();

	const [allergens, setAllergens] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (visible) {
			loadAllergens();
		}
	}, [visible]);

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
			// Alert.alert("Erreur", "Impossible de charger les allergènes");
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
					borderColor: isSelected ? "#ff512f" : "transparent",
				}}
				onPress={() => toggleAllergen(item._id)}
				activeOpacity={0.7}
			>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isSelected ? "#ff512f" : "#f5f5f5",
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
							color: isSelected ? "#ff512f" : "#333",
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
							backgroundColor: "#fff5f0",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 6,
						}}
					>
						<Text style={{ fontSize: 11, color: "#ff512f", fontWeight: "600" }}>
							ACTIF
						</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	};

	const renderRestrictionItem = ({ item }) => {
		const isSelected = userRestrictions.includes(item.id);

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
					borderColor: isSelected ? "#ff9800" : "transparent",
				}}
				onPress={() => toggleRestriction(item.id)}
				activeOpacity={0.7}
			>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isSelected ? "#ff9800" : "#f5f5f5",
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					{isSelected ? (
						<Ionicons name="checkmark" size={20} color="#fff" />
					) : (
						<MaterialIcons name="restaurant-menu" size={20} color="#999" />
					)}
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: isSelected ? "700" : "600",
							color: isSelected ? "#ff9800" : "#333",
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
							backgroundColor: "#fff9e6",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 6,
						}}
					>
						<Text style={{ fontSize: 11, color: "#ff9800", fontWeight: "600" }}>
							ACTIF
						</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={false}
			onRequestClose={onClose}
		>
			<View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
				{/* Header */}
				<LinearGradient
					colors={["#ff9800", "#ff6f00"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{
						paddingTop: 50,
						paddingBottom: 16,
						paddingHorizontal: 20,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Text
						style={{
							fontSize: 24,
							fontWeight: "bold",
							color: "#fff",
							flex: 1,
						}}
					>
						Préférences alimentaires
					</Text>
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
				</LinearGradient>

				{/* Tabs */}
				<View
					style={{
						flexDirection: "row",
						paddingHorizontal: 16,
						paddingVertical: 16,
						backgroundColor: "#fff",
						borderBottomWidth: 1,
						borderBottomColor: "#eee",
					}}
				>
					<TouchableOpacity
						style={{
							flex: 1,
							paddingVertical: 12,
							borderBottomWidth: 3,
							borderBottomColor:
								activeTab === "allergies" ? "#ff512f" : "transparent",
						}}
						onPress={() => setActiveTab("allergies")}
					>
						<Text
							style={{
								textAlign: "center",
								fontSize: 16,
								fontWeight: activeTab === "allergies" ? "bold" : "500",
								color: activeTab === "allergies" ? "#ff512f" : "#666",
							}}
						>
							⚠️ Allergies
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{
							flex: 1,
							paddingVertical: 12,
							borderBottomWidth: 3,
							borderBottomColor:
								activeTab === "restrictions" ? "#ff9800" : "transparent",
						}}
						onPress={() => setActiveTab("restrictions")}
					>
						<Text
							style={{
								textAlign: "center",
								fontSize: 16,
								fontWeight: activeTab === "restrictions" ? "bold" : "500",
								color: activeTab === "restrictions" ? "#ff9800" : "#666",
							}}
						>
							🍴 Restrictions
						</Text>
					</TouchableOpacity>
				</View>

				{/* Content */}
				{activeTab === "allergies" ? (
					<View style={{ flex: 1 }}>
						{/* Search bar */}
						<View
							style={{
								paddingHorizontal: 16,
								paddingVertical: 12,
								backgroundColor: "#fff",
								borderBottomWidth: 1,
								borderBottomColor: "#eee",
							}}
						>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									backgroundColor: "#f5f5f5",
									borderRadius: 12,
									paddingHorizontal: 12,
								}}
							>
								<Ionicons name="search" size={20} color="#999" />
								<TextInput
									style={{
										flex: 1,
										padding: 12,
										fontSize: 16,
										color: "#333",
									}}
									placeholder="Rechercher un allergène..."
									value={searchQuery}
									onChangeText={setSearchQuery}
									placeholderTextColor="#999"
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
								style={{
									flex: 1,
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<ActivityIndicator size="large" color="#ff512f" />
							</View>
						) : (
							<FlatList
								data={filteredAllergens}
								renderItem={renderAllergenItem}
								keyExtractor={(item) => item._id}
								contentContainerStyle={{ paddingVertical: 8 }}
								ListEmptyComponent={
									<View
										style={{
											padding: 32,
											alignItems: "center",
										}}
									>
										<Text style={{ fontSize: 16, color: "#999" }}>
											Aucun allergène trouvé
										</Text>
									</View>
								}
							/>
						)}
					</View>
				) : (
					<FlatList
						data={RESTRICTIONS_OPTIONS}
						renderItem={renderRestrictionItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingVertical: 8 }}
					/>
				)}
			</View>
		</Modal>
	);
}
