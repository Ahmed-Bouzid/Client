import React, { useState, useEffect, useRef } from "react";
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
	Animated,
	Easing,
	StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAllergyStore } from "../stores/useAllergyStore";
import { useRestrictionStore } from "../stores/useRestrictionStore";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import { BAGHERA_PALETTE, BAGHERA_FONTS } from "../theme/bagheraTheme";

// 🎯 Allergènes par défaut (fallback si API échoue)
const DEFAULT_ALLERGENS = [
	{
		_id: "default-allergen-1",
		name: "Gluten",
		icon: "🌾",
		description: "Blé, seigle, orge, avoine",
	},
	{
		_id: "default-allergen-2",
		name: "Crustacés",
		icon: "🦞",
		description: "Crevettes, crabes, homards",
	},
	{
		_id: "default-allergen-3",
		name: "Œufs",
		icon: "🥚",
		description: "Tous types d'œufs",
	},
	{
		_id: "default-allergen-4",
		name: "Poissons",
		icon: "🐟",
		description: "Tous types de poissons",
	},
	{
		_id: "default-allergen-5",
		name: "Arachides",
		icon: "🥜",
		description: "Cacahuètes",
	},
	{
		_id: "default-allergen-6",
		name: "Soja",
		icon: "🫘",
		description: "Soja et dérivés",
	},
	{
		_id: "default-allergen-7",
		name: "Lait",
		icon: "🥛",
		description: "Lactose et produits laitiers",
	},
	{
		_id: "default-allergen-8",
		name: "Fruits à coque",
		icon: "🌰",
		description: "Amandes, noisettes, noix, etc.",
	},
	{
		_id: "default-allergen-9",
		name: "Céleri",
		icon: "🥬",
		description: "Céleri et dérivés",
	},
	{
		_id: "default-allergen-10",
		name: "Moutarde",
		icon: "🌭",
		description: "Graines de moutarde",
	},
	{
		_id: "default-allergen-11",
		name: "Sésame",
		icon: "🫙",
		description: "Graines de sésame",
	},
	{
		_id: "default-allergen-12",
		name: "Sulfites",
		icon: "🍷",
		description: "Conservateurs sulfités",
	},
	{
		_id: "default-allergen-13",
		name: "Lupin",
		icon: "🌸",
		description: "Graines de lupin",
	},
	{
		_id: "default-allergen-14",
		name: "Mollusques",
		icon: "🦪",
		description: "Huîtres, moules, escargots",
	},
];

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

export default function DietaryPreferences({ visible, onClose, isBaghera = false }) {
	const [activeTab, setActiveTab] = useState("allergies"); // "allergies" ou "restrictions"

	const { userAllergenIds, toggleAllergen, allergensCache, setAllergensCache } =
		useAllergyStore();
	const { userRestrictions, toggleRestriction } = useRestrictionStore();

	const [allergens, setAllergens] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const fadeAnim = useRef(new Animated.Value(0)).current; // 🎯 Fade in/out (Cucina/Grillz)

	// 🎨 BAGHERA — silk modal animation (même courbe que la modale panthère)
	const [mounted, setMounted] = useState(false);
	const bagheraBackdrop = useRef(new Animated.Value(0)).current;
	const bagheraCard = useRef(new Animated.Value(0)).current;

	// Animation d'apparition/disparition
	useEffect(() => {
		if (visible) {
			loadAllergens();
			setMounted(true);
			if (isBaghera) {
				bagheraBackdrop.setValue(0);
				bagheraCard.setValue(0);
				Animated.parallel([
					Animated.timing(bagheraBackdrop, {
						toValue: 1,
						duration: 320,
						easing: Easing.out(Easing.quad),
						useNativeDriver: true,
					}),
					Animated.timing(bagheraCard, {
						toValue: 1,
						duration: 560,
						delay: 80,
						easing: Easing.bezier(0.6, 0.05, 0.1, 1), // BAGHERA silk
						useNativeDriver: true,
					}),
				]).start();
			} else {
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: false,
				}).start();
			}
		} else {
			if (isBaghera) {
				Animated.parallel([
					Animated.timing(bagheraCard, {
						toValue: 0,
						duration: 280,
						easing: Easing.bezier(0.4, 0, 0.2, 1),
						useNativeDriver: true,
					}),
					Animated.timing(bagheraBackdrop, {
						toValue: 0,
						duration: 320,
						easing: Easing.out(Easing.quad),
						useNativeDriver: true,
					}),
				]).start(({ finished }) => {
					if (finished) setMounted(false);
				});
			} else {
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: false,
				}).start(({ finished }) => {
					if (finished) setMounted(false);
				});
			}
		}
	}, [visible, isBaghera]);

	const loadAllergens = async () => {
		setLoading(true);
		try {
			const token = await clientAuthService.getClientToken();
			const response = await fetch(
				`${process.env.EXPO_PUBLIC_API_URL || "https://orderit-backend-6y1m.onrender.com"}/allergens`,
				{
					headers: {
						...(token && { Authorization: `Bearer ${token}` }),
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setAllergens(Array.isArray(data) ? data : []);
				setAllergensCache(Array.isArray(data) ? data : []);
			} else {
				console.warn(
					"⚠️ API allergènes indisponible, utilisation des données par défaut",
				);
				setAllergens(DEFAULT_ALLERGENS);
				setAllergensCache(DEFAULT_ALLERGENS);
			}
		} catch (error) {
			console.warn(
				"⚠️ Erreur chargement allergènes (silencieuse):",
				error.message,
			);
			// Mode silencieux : utiliser les allergènes par défaut
			setAllergens(DEFAULT_ALLERGENS);
			setAllergensCache(DEFAULT_ALLERGENS);
		} finally {
			setLoading(false);
		}
	};

	const filteredAllergens = allergens.filter((a) =>
		a.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const renderAllergenItem = ({ item }) => {
		const isSelected = userAllergenIds.includes(item._id);
		const accent = isBaghera ? BAGHERA_PALETTE.ember : "#ff512f";

		return (
			<TouchableOpacity
				style={{
					flexDirection: "row",
					alignItems: "center",
					padding: 16,
					marginVertical: 6,
					marginHorizontal: 16,
					backgroundColor: isBaghera ? BAGHERA_PALETTE.creamSoft : "#fff",
					borderRadius: isBaghera ? 18 : 12,
					shadowColor: isBaghera ? BAGHERA_PALETTE.ink : "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: isBaghera ? 0.04 : 0.1,
					shadowRadius: isBaghera ? 8 : 4,
					elevation: isBaghera ? 1 : 3,
					borderWidth: isBaghera ? 1 : 2,
					borderColor: isSelected
						? accent
						: (isBaghera ? BAGHERA_PALETTE.sand : "transparent"),
				}}
				onPress={() => toggleAllergen(item._id)}
				activeOpacity={0.7}
			>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isSelected
							? accent
							: (isBaghera ? BAGHERA_PALETTE.cream : "#f5f5f5"),
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					{isSelected ? (
						<Ionicons name="checkmark" size={20} color="#fff" />
					) : (
						<Ionicons name="warning-outline" size={20} color={isBaghera ? BAGHERA_PALETTE.smoke : "#999"} />
					)}
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: isBaghera ? 17 : 16,
							fontFamily: isBaghera ? BAGHERA_FONTS.serif : undefined,
							fontWeight: isBaghera ? "400" : (isSelected ? "700" : "600"),
							color: isSelected ? accent : (isBaghera ? BAGHERA_PALETTE.ink : "#333"),
							marginBottom: 2,
						}}
					>
						{item.icon} {item.name}
					</Text>
					{item.description && (
						<Text
							style={{
								fontSize: 13,
								fontFamily: isBaghera ? BAGHERA_FONTS.sansItalic : undefined,
								color: isBaghera ? BAGHERA_PALETTE.smoke : "#666",
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
							backgroundColor: isBaghera ? BAGHERA_PALETTE.cream : "#fff5f0",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 6,
						}}
					>
						<Text style={{ fontSize: 11, color: accent, fontWeight: "600", fontFamily: isBaghera ? BAGHERA_FONTS.sans : undefined, letterSpacing: 0.5 }}>
							ACTIF
						</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	};

	const renderRestrictionItem = ({ item }) => {
		const isSelected = userRestrictions.includes(item.id);
		const accent = isBaghera ? BAGHERA_PALETTE.ember : "#ff9800";

		return (
			<TouchableOpacity
				style={{
					flexDirection: "row",
					alignItems: "center",
					padding: 16,
					marginVertical: 6,
					marginHorizontal: 16,
					backgroundColor: isBaghera ? BAGHERA_PALETTE.creamSoft : "#fff",
					borderRadius: isBaghera ? 18 : 12,
					shadowColor: isBaghera ? BAGHERA_PALETTE.ink : "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: isBaghera ? 0.04 : 0.1,
					shadowRadius: isBaghera ? 8 : 4,
					elevation: isBaghera ? 1 : 3,
					borderWidth: isBaghera ? 1 : 2,
					borderColor: isSelected
						? accent
						: (isBaghera ? BAGHERA_PALETTE.sand : "transparent"),
				}}
				onPress={() => toggleRestriction(item.id)}
				activeOpacity={0.7}
			>
				<View
					style={{
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: isSelected
							? accent
							: (isBaghera ? BAGHERA_PALETTE.cream : "#f5f5f5"),
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12,
					}}
				>
					{isSelected ? (
						<Ionicons name="checkmark" size={20} color="#fff" />
					) : (
						<MaterialIcons name="restaurant-menu" size={20} color={isBaghera ? BAGHERA_PALETTE.smoke : "#999"} />
					)}
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: isBaghera ? 17 : 16,
							fontFamily: isBaghera ? BAGHERA_FONTS.serif : undefined,
							fontWeight: isBaghera ? "400" : (isSelected ? "700" : "600"),
							color: isSelected ? accent : (isBaghera ? BAGHERA_PALETTE.ink : "#333"),
							marginBottom: 2,
						}}
					>
						{item.icon} {item.name}
					</Text>
					{item.description && (
						<Text
							style={{
								fontSize: 13,
								fontFamily: isBaghera ? BAGHERA_FONTS.sansItalic : undefined,
								color: isBaghera ? BAGHERA_PALETTE.smoke : "#666",
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
							backgroundColor: isBaghera ? BAGHERA_PALETTE.cream : "#fff9e6",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 6,
						}}
					>
						<Text style={{ fontSize: 11, color: accent, fontWeight: "600", fontFamily: isBaghera ? BAGHERA_FONTS.sans : undefined, letterSpacing: 0.5 }}>
							ACTIF
						</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<Modal
			visible={mounted || visible}
			transparent
			animationType="none"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View
				style={{
					flex: 1,
					justifyContent: "flex-start",
				}}
			>
				{/* Backdrop dim animé */}
				<Animated.View
					style={{
						...StyleSheet.absoluteFillObject,
						backgroundColor: isBaghera ? BAGHERA_PALETTE.ink : "#000",
						opacity: isBaghera
							? bagheraBackdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.42] })
							: 0.5,
					}}
				>
					<TouchableOpacity
						style={StyleSheet.absoluteFillObject}
						activeOpacity={1}
						onPress={onClose}
					/>
				</Animated.View>

				{/* Container animé */}
				<Animated.View
					style={{
						height: "50%",
						backgroundColor: isBaghera ? BAGHERA_PALETTE.cream : "#f8f9fa",
						borderBottomLeftRadius: 24,
						borderBottomRightRadius: 24,
						shadowColor: isBaghera ? BAGHERA_PALETTE.ink : "#000",
						shadowOffset: { width: 0, height: isBaghera ? 18 : 4 },
						shadowOpacity: isBaghera ? 0.28 : 0.2,
						shadowRadius: isBaghera ? 32 : 12,
						elevation: isBaghera ? 14 : 10,
						opacity: isBaghera ? bagheraCard : fadeAnim,
						transform: isBaghera
							? [
								{
									translateY: bagheraCard.interpolate({
										inputRange: [0, 1],
										outputRange: [-22, 0],
									}),
								},
								{
									scale: bagheraCard.interpolate({
										inputRange: [0, 1],
										outputRange: [0.97, 1],
									}),
								},
							]
							: undefined,
					}}
				>
					{/* Header */}
					{isBaghera ? (
						<View
							style={{
								paddingTop: 50,
								paddingBottom: 18,
								paddingHorizontal: 20,
								flexDirection: "row",
								alignItems: "flex-end",
								justifyContent: "space-between",
								backgroundColor: BAGHERA_PALETTE.cream,
								borderBottomWidth: 1,
								borderBottomColor: BAGHERA_PALETTE.sand,
							}}
						>
							<View style={{ flex: 1 }}>
								<Text
									style={{
										fontFamily: BAGHERA_FONTS.serif,
										fontSize: 26,
										color: BAGHERA_PALETTE.ink,
										letterSpacing: -0.3,
									}}
								>
									Préférences<Text style={{ color: BAGHERA_PALETTE.ember }}>.</Text>
								</Text>
								<Text
									style={{
										fontFamily: BAGHERA_FONTS.serifItalic,
										fontSize: 13,
										color: BAGHERA_PALETTE.smoke,
										marginTop: 2,
									}}
								>— allergies & restrictions</Text>
							</View>
							<TouchableOpacity
								onPress={onClose}
								style={{
									width: 38,
									height: 38,
									borderRadius: 19,
									backgroundColor: BAGHERA_PALETTE.creamSoft,
									borderWidth: 1,
									borderColor: BAGHERA_PALETTE.sand,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="close" size={20} color={BAGHERA_PALETTE.ink} />
							</TouchableOpacity>
						</View>
					) : (
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
					)}

					{/* Tabs */}
					<View
						style={{
							flexDirection: "row",
							paddingHorizontal: 16,
							paddingVertical: 16,
							backgroundColor: isBaghera ? BAGHERA_PALETTE.cream : "#fff",
							borderBottomWidth: 1,
							borderBottomColor: isBaghera ? BAGHERA_PALETTE.sand : "#eee",
						}}
					>
						<TouchableOpacity
							style={{
								flex: 1,
								paddingVertical: 12,
								borderBottomWidth: isBaghera ? 2 : 3,
								borderBottomColor:
									activeTab === "allergies"
										? (isBaghera ? BAGHERA_PALETTE.ember : "#ff512f")
										: "transparent",
							}}
							onPress={() => setActiveTab("allergies")}
						>
							<Text
								style={{
									textAlign: "center",
									fontSize: isBaghera ? 17 : 16,
									fontFamily: isBaghera
										? (activeTab === "allergies" ? BAGHERA_FONTS.serifItalic : BAGHERA_FONTS.sans)
										: undefined,
									fontWeight: isBaghera ? "400" : (activeTab === "allergies" ? "bold" : "500"),
									color:
										activeTab === "allergies"
											? (isBaghera ? BAGHERA_PALETTE.ember : "#ff512f")
											: (isBaghera ? BAGHERA_PALETTE.smoke : "#666"),
								}}
							>
								{isBaghera ? "Allergies" : "⚠️ Allergies"}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={{
								flex: 1,
								paddingVertical: 12,
								borderBottomWidth: isBaghera ? 2 : 3,
								borderBottomColor:
									activeTab === "restrictions"
										? (isBaghera ? BAGHERA_PALETTE.ember : "#ff9800")
										: "transparent",
							}}
							onPress={() => setActiveTab("restrictions")}
						>
							<Text
								style={{
									textAlign: "center",
									fontSize: isBaghera ? 17 : 16,
									fontFamily: isBaghera
										? (activeTab === "restrictions" ? BAGHERA_FONTS.serifItalic : BAGHERA_FONTS.sans)
										: undefined,
									fontWeight: isBaghera ? "400" : (activeTab === "restrictions" ? "bold" : "500"),
									color:
										activeTab === "restrictions"
											? (isBaghera ? BAGHERA_PALETTE.ember : "#ff9800")
											: (isBaghera ? BAGHERA_PALETTE.smoke : "#666"),
								}}
							>
								{isBaghera ? "Restrictions" : "🍴 Restrictions"}
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
									backgroundColor: isBaghera ? BAGHERA_PALETTE.cream : "#fff",
									borderBottomWidth: 1,
									borderBottomColor: isBaghera ? BAGHERA_PALETTE.sand : "#eee",
								}}
							>
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										backgroundColor: isBaghera ? BAGHERA_PALETTE.creamSoft : "#f5f5f5",
										borderRadius: isBaghera ? 16 : 12,
										borderWidth: isBaghera ? 1 : 0,
										borderColor: isBaghera ? BAGHERA_PALETTE.sand : "transparent",
										paddingHorizontal: 12,
									}}
								>
									<Ionicons name="search" size={20} color={isBaghera ? BAGHERA_PALETTE.smoke : "#999"} />
									<TextInput
										style={{
											flex: 1,
											padding: 12,
											fontSize: 16,
											fontFamily: isBaghera ? BAGHERA_FONTS.sans : undefined,
											color: isBaghera ? BAGHERA_PALETTE.ink : "#333",
										}}
										placeholder="Rechercher un allergène..."
										value={searchQuery}
										onChangeText={setSearchQuery}
										placeholderTextColor={isBaghera ? BAGHERA_PALETTE.smoke : "#999"}
									/>
									{searchQuery.length > 0 && (
										<TouchableOpacity onPress={() => setSearchQuery("")}>
											<Ionicons name="close-circle" size={20} color={isBaghera ? BAGHERA_PALETTE.smoke : "#999"} />
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
									<ActivityIndicator size="large" color={isBaghera ? BAGHERA_PALETTE.ember : "#ff512f"} />
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
											<Text style={{ fontSize: 16, color: isBaghera ? BAGHERA_PALETTE.smoke : "#999", fontFamily: isBaghera ? BAGHERA_FONTS.sansItalic : undefined }}>
												Aucun allergène trouvé
											</Text>
										</View>
									}
								/>
							)}
						</View>
					) : (
						<View style={{ flex: 1 }}>
							<FlatList
								data={RESTRICTIONS_OPTIONS}
								renderItem={renderRestrictionItem}
								keyExtractor={(item) => item.id}
								contentContainerStyle={{ paddingVertical: 8 }}
							/>
						</View>
					)}
				</Animated.View>
			</View>
		</Modal>
	);
}
