import React, { useState, useEffect, useRef, useMemo } from "react";
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Pressable,
	FlatList,
	ScrollView,
	Alert,
	Animated,
	Dimensions,
	TextInput,
	Platform,
	ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
	MaterialCommunityIcons,
	MaterialIcons,
	Ionicons,
} from "@expo/vector-icons";
import { useCartStore } from "../stores/useCartStore.js";
import useProductStore from "../stores/useProductStore.js";
import { useAllergyStore } from "../stores/useAllergyStore.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrderStore } from "../stores/useOrderStore.js";
import DietaryPreferences from "./DietaryPreferences.jsx";
import MessagingBubble from "../components/messaging/MessagingBubble.jsx";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";
import { useStyleUpdates } from "../hooks/useSocketClient.js"; // ⭐ NOUVEAU : WebSocket temps réel
import { useReservationStatus } from "../hooks/useReservationStatus.js"; // 🚪 Écoute fermeture réservation
import { useFeatureLevel } from "../stores/useFeatureLevelStore.js"; // 🎯 Feature Levels
import { useRestaurantStore } from "../stores/useRestaurantStore"; // 🏪 Store restaurant
import { buildSafeTheme, DEFAULT_THEME } from "../theme/defaultTheme"; // 🎨 Thème centralisé

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const BUTTON_SMALL = 60;
const BUTTON_EXPANDED = SCREEN_WIDTH - 40 - 60 * 3 - 8 * 3;

// 🖼️ Images thiings.co pour les catégories du menu (Metro require statique obligatoire)
const CATEGORY_IMAGES = {
	starter: require("../../../assets/images/menu/starter.png"),
	main: require("../../../assets/images/menu/main.png"),
	dessert: require("../../../assets/images/menu/Dessert.png"),
	cafe: require("../../../assets/images/menu/Cafe.png"),
	burger: require("../../../assets/images/menu/Burger.png"),
	sandwich: require("../../../assets/images/menu/Sandwich.png"),
	pizza: require("../../../assets/images/menu/Pizza.png"),
	pates: require("../../../assets/images/menu/Pates.png"),
	cocktail: require("../../../assets/images/menu/Cocktail.png"),
	soda: require("../../../assets/images/menu/Soda.png"),
	vin: require("../../../assets/images/menu/Vin.png"),
	biere: require("../../../assets/images/menu/Biere.png"),
	alcool: require("../../../assets/images/menu/Alcool.png"),
	eau: require("../../../assets/images/menu/Eau.png"),
	poulet: require("../../../assets/images/menu/Poulet.png"),
	viande: require("../../../assets/images/menu/Viande.png"),
	poisson: require("../../../assets/images/menu/Poisson.png"),
	vege: require("../../../assets/images/menu/Vege.png"),
	vegan: require("../../../assets/images/menu/Vegan.png"),
	accompagnement: require("../../../assets/images/menu/Accompagnement.png"),
	sauce: require("../../../assets/images/menu/sauce.png"),
};

// 🎯 Helper : retourne l'image thiings.co correspondant à un nom de catégorie
const getImageByCategory = (name) => {
	const n = name.toLowerCase();
	if (n.includes("entree") || n.includes("entrée") || n.includes("salade"))
		return CATEGORY_IMAGES.starter;
	if (n.includes("plat") || n.includes("principal"))
		return CATEGORY_IMAGES.main;
	if (n.includes("dessert") || n.includes("sucré") || n.includes("tiramisu"))
		return CATEGORY_IMAGES.dessert;
	if (
		n.includes("café") ||
		n.includes("coffee") ||
		n.includes("thé") ||
		n.includes("tea")
	)
		return CATEGORY_IMAGES.cafe;
	if (n.includes("burger")) return CATEGORY_IMAGES.burger;
	if (n.includes("sandwich") || n.includes("salé"))
		return CATEGORY_IMAGES.sandwich;
	if (n.includes("pizza")) return CATEGORY_IMAGES.pizza;
	if (n.includes("pâtes") || n.includes("pasta")) return CATEGORY_IMAGES.pates;
	if (n.includes("mocktail") || n.includes("cocktail"))
		return CATEGORY_IMAGES.cocktail;
	if (
		n.includes("boisson") ||
		n.includes("drink") ||
		n.includes("soda") ||
		n.includes("jus")
	)
		return CATEGORY_IMAGES.soda;
	if (n.includes("vin") && !n.includes("vinai")) return CATEGORY_IMAGES.vin;
	if (n.includes("biere") || n.includes("bière")) return CATEGORY_IMAGES.biere;
	if (n.includes("aperitif") || n.includes("apéritif") || n.includes("apero"))
		return CATEGORY_IMAGES.alcool;
	if (
		n.includes("digestif") ||
		n.includes("alcool") ||
		n.includes("rhum") ||
		n.includes("vodka") ||
		n.includes("whisky") ||
		n.includes("gin")
	)
		return CATEGORY_IMAGES.alcool;
	if (n.includes("eau") || n.includes("plate") || n.includes("gazeuse"))
		return CATEGORY_IMAGES.eau;
	if (n.includes("poulet")) return CATEGORY_IMAGES.poulet;
	if (n.includes("viande") || n.includes("meat")) return CATEGORY_IMAGES.viande;
	if (n.includes("poisson") || n.includes("fish"))
		return CATEGORY_IMAGES.poisson;
	if (n.includes("vegan")) return CATEGORY_IMAGES.vegan;
	if (n.includes("végé") || n.includes("vege")) return CATEGORY_IMAGES.vege;
	if (n.includes("accompagnement") || n.includes("side"))
		return CATEGORY_IMAGES.accompagnement;
	if (n.includes("sauce")) return CATEGORY_IMAGES.sauce;
	return null;
};

// 🎯 Assure une couleur de description lisible, meme si le theme met du blanc
const getSafeDescColor = (theme) => {
	const candidate =
		theme?.textSecondary || theme?.textMuted || theme?.text || null;
	if (!candidate || typeof candidate !== "string") {
		return DEFAULT_THEME.textSecondary;
	}
	// 🌑 Thème sombre détecté (ex: Grillz) : `dark` est une string hex unique.
	// Sur fond sombre on garde les couleurs chaudes telles quelles.
	if (typeof theme?.dark === "string") {
		return candidate;
	}
	const lower = candidate.toLowerCase();

	// Vérifier les formats de blanc simples
	if (lower === "#fff" || lower === "#ffffff" || lower === "white") {
		return DEFAULT_THEME.textSecondary;
	}

	// Vérifier rgba() et rgb() avec des valeurs blanches
	const rgbaMatch = lower.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (rgbaMatch) {
		const r = parseInt(rgbaMatch[1]);
		const g = parseInt(rgbaMatch[2]);
		const b = parseInt(rgbaMatch[3]);
		// Si les 3 composantes sont > 200 → c'est du blanc/très clair
		if (r > 200 && g > 200 && b > 200) {
			return DEFAULT_THEME.text; // Gris foncé
		}
	}

	// Si la couleur est trop claire (hex), forcer un gris foncé
	if (lower.startsWith("#")) {
		const hex = lower.replace("#", "");
		if (hex.length === 3 || hex.length === 6) {
			const to255 = (value) =>
				parseInt(value.length === 1 ? value + value : value, 16);
			const r = to255(hex.length === 3 ? hex[0] : hex.slice(0, 2));
			const g = to255(hex.length === 3 ? hex[1] : hex.slice(2, 4));
			const b = to255(hex.length === 3 ? hex[2] : hex.slice(4, 6));
			const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
			if (luminance > 0.8) {
				return DEFAULT_THEME.text;
			}
		}
	}
	return candidate;
};

// 🔥 Composant Header Grillz personnalisé (utilisé uniquement pour Le Grillz)
const GrillzHeader = ({
	userName,
	restaurantName,
	onOpenDietary,
	showDietaryFeature = true,
	theme,
	styleConfig = {},
}) => {
	// 🔥 Couleurs BBQ hardcodées — évite tout flash bleu du DEFAULT_THEME au chargement
	const BBQ_PRIMARY =
		Array.isArray(theme?.primary) &&
		theme.primary[0] !== DEFAULT_THEME.primary[0]
			? theme.primary
			: ["#FF6B35", "#D9381E"];

	return (
		<View style={styles.grillzHeader}>
			{/* Fond charbon profond */}
			<LinearGradient
				colors={["#1A1110", "#2B1F1E"]}
				style={styles.grillzHeaderOuter}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
			>
				{/* Barre de flamme signature en haut */}
				<LinearGradient
					colors={BBQ_PRIMARY}
					style={styles.grillzFlameStrip}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
				/>

				{/* Ligne branding */}
				<View style={styles.grillzLogoContainer}>
					{/* Badge BBQ */}
					<LinearGradient colors={BBQ_PRIMARY} style={styles.grillzLogo}>
						<Text style={{ fontSize: 24 }}>🍗</Text>
					</LinearGradient>
					<View style={styles.grillzBrandText}>
						<Text style={styles.grillzTitle}>
							{restaurantName || "LE GRILLZ"} 🔥
						</Text>
						<Text style={styles.grillzSubtitle}>
							{styleConfig.slogan || "🍗 POULET BBQ · FOODTRUCK HALAL 🔥"}
						</Text>
					</View>
				</View>

				{/* Séparateur braise */}
				<View style={styles.grillzDivider} />

				{/* Ligne bienvenue + badges */}
				<View style={styles.grillzUserButton}>
					<Text style={styles.grillzUserText}>
						{userName
							? `👋 ${userName}`
							: `👋 Bienvenue${restaurantName ? ` au ${restaurantName}` : " !"}`}
					</Text>
					<View style={styles.grillzBadgesRow}>
						{styleConfig.categoryLabel && (
							<View style={styles.grillzHalalBadge}>
								<Text style={styles.grillzHalalText}>
									🥩 {styleConfig.categoryLabel}
								</Text>
							</View>
						)}
						{/* Bouton allergènes/restrictions — visible si activé */}
						{showDietaryFeature && (
							<TouchableOpacity
								style={styles.grillzDietaryButton}
								onPress={onOpenDietary}
								activeOpacity={0.8}
							>
								<Ionicons name="medical-outline" size={18} color="#FFFAF0" />
							</TouchableOpacity>
						)}
					</View>
				</View>
			</LinearGradient>
		</View>
	);
};

// 🇮🇹 Composant Header Italia personnalisé (utilisé uniquement pour Lacucinadinini)
const ItaliaHeader = ({
	userName,
	restaurantName,
	onOpenDietary,
	showDietaryFeature = true,
	theme,
	styleConfig = {},
}) => {
	return (
		<View style={styles.italiaHeader}>
			{/* Drapeau Italien en arrière-plan */}
			<View style={styles.italiaFlagBg}>
				<View style={[styles.italiaFlag, { backgroundColor: "#009246" }]} />
				<View style={[styles.italiaFlag, { backgroundColor: "#FFFFFF" }]} />
				<View style={[styles.italiaFlag, { backgroundColor: "#CE2B37" }]} />
			</View>

			{/* Contenu header */}
			<View style={styles.italiaHeaderContent}>
				{/* Logo avec pizza/pasta icon */}
				<View style={styles.italiaLogoContainer}>
					<LinearGradient
						colors={
							Array.isArray(theme?.gold) ? theme.gold : ["#F1BF00", "#DAA520"]
						}
						style={styles.italiaLogo}
					>
						<Ionicons
							name={styleConfig.headerIcon || "pizza"}
							size={32}
							color="#2C1810"
						/>
					</LinearGradient>
					<View style={styles.italiaBrandText}>
						<Text style={styles.italiaTitle}>
							{restaurantName || "Ristorante"}
						</Text>
						<Text style={styles.italiaSubtitle}>
							{styleConfig.categoryLabel || "CUCINA ITALIANA"}
						</Text>
					</View>
				</View>

				{/* Utilisateur */}
				<View style={styles.italiaUserSection}>
					<Text style={styles.italiaUserText}>
						{userName ? `Ciao ${userName}! 🇮🇹` : "Benvenuto! 🇮🇹"}
					</Text>
					{showDietaryFeature && (
						<TouchableOpacity
							style={styles.italiaDietaryButton}
							onPress={onOpenDietary}
							activeOpacity={0.8}
						>
							<Ionicons name="medical" size={18} color="#009246" />
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* Slogan italien */}
			{styleConfig.slogan && (
				<Text style={styles.italiaSlogan}>{styleConfig.slogan}</Text>
			)}
		</View>
	);
};

// 🎨 Composant Card Produit Premium avec animations
const PremiumProductCard = ({
	item,
	cart,
	onIncrease,
	onDecrease,
	onPress,
	index,
	categoryGradient,
	themeGradient, // 🔥 Gradient fallback du thème (Grillz = orange BBQ, autres = DEFAULT)
	showAllergens = true, // 🎯 Contrôle l'affichage des allergènes selon le niveau
	theme, // 🎨 Thème dynamique pour les couleurs de texte
}) => {
	// 🎯 Priorité : gradient de la catégorie → primary du thème → DEFAULT bleu
	// On lit theme.primary directement (= currentStyle) pour éviter tout décalage de timing
	const activeGradient = Array.isArray(categoryGradient)
		? categoryGradient
		: Array.isArray(theme?.primary)
			? theme.primary
			: DEFAULT_THEME.primary;
	const { productContainsUserAllergen } = useAllergyStore();
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(30)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 8,
				tension: 40,
				delay: index * 80,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnim, {
				toValue: 1,
				duration: 400,
				delay: index * 80,
				useNativeDriver: true,
			}),
			Animated.spring(translateY, {
				toValue: 0,
				friction: 8,
				tension: 40,
				delay: index * 80,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const quantity = cart[item._id] || 0;
	const descColor = getSafeDescColor(theme);

	useEffect(() => {}, [item?._id, descColor]);

	return (
		<Animated.View
			style={[
				styles.premiumCard,
				{
					opacity: opacityAnim,
					transform: [{ scale: scaleAnim }, { translateY }],
				},
			]}
		>
			{/* Gradient accent line */}
			<LinearGradient colors={activeGradient} style={styles.cardAccentLine} />

			<TouchableOpacity
				activeOpacity={0.95}
				onPress={onPress}
				style={styles.premiumCardContent}
			>
				{/* Info section */}
				<View style={styles.premiumCardInfo}>
					<Text
						style={[
							styles.premiumProductName,
							{ color: theme?.text || DEFAULT_THEME.text },
						]}
					>
						{item.name}
					</Text>
					<Text
						style={[styles.premiumProductDesc, { color: descColor }]}
						numberOfLines={2}
					>
						{item.description || "Une création savoureuse de notre chef"}
					</Text>

					{/* Tags row */}
					<View style={styles.premiumTagsRow}>
						{item.vegan && (
							<View style={styles.premiumTag}>
								<Text
									style={[
										styles.premiumTagText,
										{ color: theme?.text || DEFAULT_THEME.text },
									]}
								>
									🌱 Vegan
								</Text>
							</View>
						)}
						{item.glutenFree && (
							<View
								style={[
									styles.premiumTag,
									{ backgroundColor: "rgba(255,152,0,0.15)" },
								]}
							>
								<Text style={[styles.premiumTagText, { color: "#FF9800" }]}>
									🌾 Sans gluten
								</Text>
							</View>
						)}
						{/* 🎯 Allergies : affichées seulement si le niveau le permet */}
						{showAllergens && productContainsUserAllergen(item) && (
							<View
								style={[
									styles.premiumTag,
									{ backgroundColor: "rgba(244,67,54,0.1)" },
								]}
							>
								<Text style={[styles.premiumTagText, { color: "#F44336" }]}>
									⚠️
								</Text>
							</View>
						)}
						{showAllergens && item.allergens && (
							<View
								style={[
									styles.premiumTag,
									{ backgroundColor: "rgba(100,149,237,0.1)" },
								]}
							>
								<Ionicons name="information-circle" size={14} color="#6495ED" />
							</View>
						)}
					</View>
				</View>

				{/* Price & Actions */}
				<View style={styles.premiumCardActions}>
					{/* Price with gradient */}
					<LinearGradient
						colors={activeGradient}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.premiumPriceBadge}
					>
						<Text
							style={[
								styles.premiumPriceText,
								{ color: theme?.text || DEFAULT_THEME.text },
							]}
						>
							{item.price}€
						</Text>
					</LinearGradient>

					{/* Quantity controls */}
					<View style={styles.premiumCounter}>
						<TouchableOpacity
							style={styles.premiumCounterBtn}
							onPress={() => onDecrease(item)}
						>
							<LinearGradient
								colors={
									quantity > 0 ? ["#ff6b6b", "#ee5a5a"] : ["#e0e0e0", "#d0d0d0"]
								}
								style={styles.premiumCounterGradient}
							>
								<Text style={styles.premiumCounterText}>−</Text>
							</LinearGradient>
						</TouchableOpacity>

						<View style={styles.premiumCounterValueContainer}>
							<Text
								style={[
									styles.premiumCounterValue,
									{
										color:
											quantity > 0
												? theme?.text || DEFAULT_THEME.text
												: theme?.textMuted || DEFAULT_THEME.textMuted,
									},
								]}
							>
								{quantity}
							</Text>
						</View>

						<TouchableOpacity
							style={styles.premiumCounterBtn}
							onPress={() => onIncrease(item)}
						>
							<LinearGradient
								colors={activeGradient}
								style={styles.premiumCounterGradient}
							>
								<Text style={styles.premiumCounterText}>+</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

// 🔍 Barre de recherche Premium
const PremiumSearchBar = ({ value, onChangeText, onClear }) => {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<View
			style={[
				styles.premiumSearchContainer,
				{
					borderColor: isFocused
						? DEFAULT_THEME.glassBorder
						: "rgba(0,0,0,0.08)",
				},
			]}
		>
			<LinearGradient
				colors={
					isFocused
						? [DEFAULT_THEME.glass, "rgba(74,144,217,0.03)"]
						: ["#fff", "#fff"]
				}
				style={styles.premiumSearchGradient}
			>
				<MaterialIcons
					name="search"
					size={22}
					color={isFocused ? DEFAULT_THEME.textAccent : "#999"}
					style={styles.searchIcon}
				/>
				<TextInput
					style={styles.premiumSearchInput}
					placeholder="Rechercher un délice..."
					placeholderTextColor="#999"
					value={value}
					onChangeText={onChangeText}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					returnKeyType="search"
				/>
				{value.length > 0 && (
					<TouchableOpacity onPress={onClear} style={styles.clearButton}>
						<View style={styles.clearButtonInner}>
							<MaterialIcons name="close" size={16} color="#fff" />
						</View>
					</TouchableOpacity>
				)}
			</LinearGradient>
		</View>
	);
};

// 🛒 Panier flottant Premium
const PremiumFloatingCart = ({ itemCount, total, onPress }) => {
	const bounceAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (itemCount > 0) {
			Animated.sequence([
				Animated.spring(scaleAnim, {
					toValue: 1,
					friction: 6,
					tension: 40,
					useNativeDriver: true,
				}),
				Animated.loop(
					Animated.sequence([
						Animated.timing(bounceAnim, {
							toValue: -5,
							duration: 1500,
							useNativeDriver: true,
						}),
						Animated.timing(bounceAnim, {
							toValue: 0,
							duration: 1500,
							useNativeDriver: true,
						}),
					]),
				),
			]).start();
		} else {
			Animated.spring(scaleAnim, {
				toValue: 0,
				friction: 8,
				useNativeDriver: true,
			}).start();
		}
	}, [itemCount > 0]);

	if (itemCount === 0) return null;

	return (
		<Animated.View
			style={[
				styles.premiumFloatingCart,
				{
					transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
				},
			]}
		>
			<BlurView intensity={80} tint="light" style={styles.premiumCartBlur}>
				<LinearGradient
					colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.95)"]}
					style={styles.premiumCartGradient}
				>
					<View style={styles.premiumCartInfo}>
						<View style={styles.premiumCartBadge}>
							<Text style={styles.premiumCartBadgeText}>{itemCount}</Text>
						</View>
						<View style={styles.premiumCartTextContainer}>
							<Text style={styles.premiumCartLabel}>Votre panier</Text>
							<Text style={styles.premiumCartTotal}>{total.toFixed(2)}€</Text>
						</View>
					</View>

					<TouchableOpacity onPress={onPress} activeOpacity={0.9}>
						<LinearGradient
							colors={DEFAULT_THEME.primary}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.premiumCartButton}
						>
							<Text style={styles.premiumCartButtonText}>Commander</Text>
							<MaterialIcons name="arrow-forward" size={18} color="#fff" />
						</LinearGradient>
					</TouchableOpacity>
				</LinearGradient>
			</BlurView>
		</Animated.View>
	);
};

// 🎨 Composant bouton animé style gradient-menu
const AnimatedCategoryButton = ({
	category,
	isSelected,
	onPress,
	otherSelected,
	themeGradient,
}) => {
	const selectedGradient =
		category.gradient ?? themeGradient ?? DEFAULT_THEME.primary;
	const widthAnim = useRef(new Animated.Value(BUTTON_SMALL)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const iconOpacity = useRef(new Animated.Value(1)).current;
	const textOpacity = useRef(new Animated.Value(0)).current;
	const glowOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isSelected) {
			// Expand animation
			Animated.parallel([
				Animated.spring(widthAnim, {
					toValue: BUTTON_EXPANDED,
					friction: 8,
					tension: 40,
					useNativeDriver: false,
				}),
				Animated.timing(iconOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(textOpacity, {
					toValue: 1,
					duration: 200,
					delay: 100,
					useNativeDriver: true,
				}),
				Animated.timing(glowOpacity, {
					toValue: 0.5,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			// Collapse animation
			Animated.parallel([
				Animated.spring(widthAnim, {
					toValue: BUTTON_SMALL,
					friction: 8,
					tension: 40,
					useNativeDriver: false,
				}),
				Animated.timing(iconOpacity, {
					toValue: 1,
					duration: 200,
					delay: 50,
					useNativeDriver: true,
				}),
				Animated.timing(textOpacity, {
					toValue: 0,
					duration: 100,
					useNativeDriver: true,
				}),
				Animated.timing(glowOpacity, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [isSelected]);

	return (
		<TouchableOpacity activeOpacity={0.9} onPress={onPress}>
			<Animated.View
				style={[
					styles.animatedButton,
					{
						width: widthAnim,
						height: BUTTON_SMALL,
					},
				]}
			>
				{/* Background gradient (toujours présent mais visible si sélectionné) */}
				<LinearGradient
					colors={isSelected ? selectedGradient : ["#fff", "#fff"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={StyleSheet.absoluteFill}
				/>

				{/* Glow effect */}
				<Animated.View
					style={[
						styles.glowEffect,
						{
							opacity: glowOpacity,
							backgroundColor: selectedGradient[0],
						},
					]}
				/>

				{/* Icône image thiings.co (ou emoji en fallback) */}
				{category?.image ? (
					<Animated.Image
						source={category.image}
						style={[
							styles.buttonEmojiImage,
							{
								opacity: iconOpacity,
								transform: [
									{
										scale: iconOpacity.interpolate({
											inputRange: [0, 1],
											outputRange: [0, 1],
										}),
									},
								],
							},
						]}
						resizeMode="contain"
					/>
				) : (
					<Animated.Text
						style={[
							styles.buttonEmoji,
							{
								opacity: iconOpacity,
								transform: [
									{
										scale: iconOpacity.interpolate({
											inputRange: [0, 1],
											outputRange: [0, 1],
										}),
									},
								],
							},
						]}
					>
						{category?.emoji || "🍽️"}
					</Animated.Text>
				)}

				{/* Texte (visible quand sélectionné) */}
				<Animated.Text
					style={[
						styles.buttonText,
						{
							opacity: textOpacity,
							transform: [
								{
									scale: textOpacity.interpolate({
										inputRange: [0, 1],
										outputRange: [0.5, 1],
									}),
								},
							],
						},
					]}
				>
					{category?.title?.toUpperCase() || "CATÉGORIE"}
				</Animated.Text>
			</Animated.View>
		</TouchableOpacity>
	);
};

export default function Menu({
	userName = "",
	orders = [],
	setOrders = () => {},
	onAdd = () => {},
	onValidate = () => {},
	onPay = () => {},
	onUpdateQuantity = () => {},
	hasActiveOrder = false,
	onNavigateToPayment = () => {},
	onNavigateToOrders = () => {},
	reservationId = null, // 🎯 ID de réservation pour la messagerie
	clientId = null, // 🎯 ID client pour la messagerie
	navigation = null,
	restaurantId, // ✨ NOUVEAU : ID du restaurant pour charger la config
	onReservationClosed = () => {}, // 🚪 Callback si la réservation est fermée
}) {
	// 🎯 Feature Levels : Récupérer les fonctionnalités disponibles selon la catégorie
	const { hasAllergies, hasRestrictions, isMinimum, level } = useFeatureLevel();

	// ✨ NOUVEAU : Charger la config dynamique (VERSION SIMPLIFIÉE)
	const {
		config,
		loading: configLoading,
		error: configError,
	} = useRestaurantConfig(restaurantId);

	// ⭐ NOUVEAU : Écouter les changements de style en temps réel via WebSocket
	const { style: liveStyle, isConnected: socketConnected } =
		useStyleUpdates(restaurantId);

	// 🚪 NOUVEAU : Écouter la fermeture de réservation et rediriger automatiquement
	useReservationStatus(restaurantId, reservationId, onReservationClosed);

	// 🚀 ARCHITECTURE 100% JSON-DRIVEN : Lecture des flags depuis config.style
	const restaurantName = useRestaurantStore((state) => state.name) || "";
	const useCustomHeader = config?.style?.useCustomHeader || false;

	// 🎨 Thème dynamique selon le restaurant (fallback sur DEFAULT_THEME neutre si pas de config)
	const baseTheme = buildSafeTheme(config?.style, config?.styleKey);

	const [currentStyle, setCurrentStyle] = useState(DEFAULT_THEME);

	// Mettre à jour le style quand un nouveau style est appliqué en temps réel
	useEffect(() => {
		if (liveStyle && liveStyle.config) {
			// 🚀 Appliquer le style depuis WebSocket (merger avec DEFAULT_THEME pour fallback complet)
			setCurrentStyle(buildSafeTheme(liveStyle.config, config?.styleKey));

			// Optionnel : Afficher une notification à l'utilisateur
			Alert.alert(
				"🎨 Nouveau style",
				"L'apparence du menu a été mise à jour !",
				[{ text: "OK" }],
			);
		}
	}, [liveStyle]);

	// Mettre à jour le style quand la config initiale est chargée
	useEffect(() => {
		if (config?.style) {
			// Merger avec DEFAULT_THEME pour garantir toutes les propriétés
			const mergedStyle = buildSafeTheme(config.style, config?.styleKey);
			setCurrentStyle(mergedStyle);
		}
	}, [config]);

	const products = useProductStore((state) => state.products);
	const fetchProducts = useProductStore((state) => state.fetchProducts);
	const { cart } = useCartStore();
	const { currentOrder, fetchActiveOrder } = useOrderStore();

	const [selectedCategory, setSelectedCategory] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showDietaryModal, setShowDietaryModal] = useState(false);

	// 🎯 Gestion des options de menu
	const [optionsModalVisible, setOptionsModalVisible] = useState(false);
	const [currentProductForOptions, setCurrentProductForOptions] =
		useState(null);
	const [optionGroups, setOptionGroups] = useState([]);
	const [selectedOptions, setSelectedOptions] = useState({});
	const [loadingOptions, setLoadingOptions] = useState(false);

	useEffect(() => {}, [
		optionsModalVisible,
		optionGroups,
		selectedOptions,
		currentProductForOptions,
	]);

	useEffect(() => {}, [modalVisible, selectedItem]);

	// ⚠️ LEGACY : Catégories hardcodées comme fallback
	const legacyCategories = [
		{
			id: "boisson",
			title: "Boissons",
			emoji: "🥤",
			image: CATEGORY_IMAGES.soda,
			gradient: ["#a955ff", "#ea51ff"],
			icon: "glass-cocktail",
		},
		{
			id: "autre",
			title: "Sandwiches",
			emoji: "🥪",
			image: CATEGORY_IMAGES.sandwich,
			gradient: ["#FFD700", "#FF8C00"],
			icon: "sandwich",
		},
		{
			id: "dessert",
			title: "Desserts",
			emoji: "🍰",
			image: CATEGORY_IMAGES.dessert,
			gradient: ["#ffa9c6", "#f434e2"],
			icon: "cake",
		},
	];

	// ✨ NOUVEAU : Extraire les couleurs et catégories de la config
	const COLORS = currentStyle; // Utiliser le style en temps réel

	// 🛡️ Helper : Garantir qu'on retourne toujours un array valide pour LinearGradient
	const getGradient = (colorKey) => {
		const value = COLORS?.[colorKey];
		return Array.isArray(value) && value.length > 0
			? value
			: DEFAULT_THEME[colorKey] && Array.isArray(DEFAULT_THEME[colorKey])
				? DEFAULT_THEME[colorKey]
				: DEFAULT_THEME.primary;
	};

	// 🎯 Générer automatiquement les catégories depuis les produits disponibles
	const productCategories = useMemo(() => {
		const uniqueCategories = new Set();
		products.forEach((product) => {
			if (product.category) {
				uniqueCategories.add(product.category.toLowerCase());
			}
		});
		return Array.from(uniqueCategories);
	}, [products]);

	// 🎨 Mapper les catégories avec leurs configs (emoji, gradient, etc.)
	const mappedProductCategories = useMemo(() => {
		// 🎯 Fonction helper pour déterminer l'emoji selon le nom de catégorie
		const getEmojiByCategory = (name) => {
			const lowerName = name.toLowerCase();
			if (lowerName.includes("entree") || lowerName.includes("entrée"))
				return "🥗";
			if (lowerName.includes("plat") || lowerName.includes("principal"))
				return "🍖";
			if (
				lowerName.includes("dessert") ||
				lowerName.includes("sucré") ||
				lowerName.includes("tiramisu")
			)
				return "🍰";
			if (
				lowerName.includes("café") ||
				lowerName.includes("coffee") ||
				lowerName.includes("thé") ||
				lowerName.includes("tea")
			)
				return "☕";
			if (
				lowerName.includes("burger") ||
				lowerName.includes("sandwich") ||
				lowerName.includes("salé")
			)
				return "🍔";
			if (lowerName.includes("pizza")) return "🍕";
			if (lowerName.includes("salade")) return "🥗";
			if (lowerName.includes("pâtes") || lowerName.includes("pasta"))
				return "🍝";
			if (lowerName.includes("mocktail") || lowerName.includes("cocktail"))
				return "🍹";
			if (
				lowerName.includes("boisson") ||
				lowerName.includes("drink") ||
				lowerName.includes("soda") ||
				lowerName.includes("jus")
			)
				return "🥤";
			if (lowerName.includes("vin") || lowerName.includes("vins")) return "🍷";
			if (lowerName.includes("biere") || lowerName.includes("bière"))
				return "🍺";
			if (
				lowerName.includes("aperitif") ||
				lowerName.includes("apéritif") ||
				lowerName.includes("apero")
			)
				return "🥂";
			if (
				lowerName.includes("digestif") ||
				lowerName.includes("spirit") ||
				lowerName.includes("alcool") ||
				lowerName.includes("rhum") ||
				lowerName.includes("vodka") ||
				lowerName.includes("whisky") ||
				lowerName.includes("gin")
			)
				return "🥃";
			if (
				lowerName.includes("eau") ||
				lowerName.includes("plate") ||
				lowerName.includes("gazeuse")
			)
				return "💧";
			if (
				lowerName.includes("poulet") ||
				lowerName.includes("viande") ||
				lowerName.includes("meat")
			)
				return "🍗";
			if (lowerName.includes("poisson") || lowerName.includes("fish"))
				return "🐟";
			if (lowerName.includes("végé") || lowerName.includes("vegan"))
				return "🥬";
			if (lowerName.includes("accompagnement") || lowerName.includes("side"))
				return "🍟";
			if (lowerName.includes("sauce")) return "🫙";
			if (lowerName.includes("formule") || lowerName.includes("menu"))
				return "🍱";
			if (lowerName.includes("chausson") || lowerName.includes("viennoiserie"))
				return "🥐";
			if (lowerName.includes("feu") || lowerName.includes("grill")) return "🔥";
			if (lowerName.includes("fromage") || lowerName.includes("cheese"))
				return "🧀";
			if (lowerName.includes("pain") || lowerName.includes("bread"))
				return "🥖";
			if (lowerName.includes("fruit")) return "🍓";
			if (lowerName.includes("glace") || lowerName.includes("ice")) return "🍦";
			// Défaut plus neutre qu'une assiette
			return "🍴";
		};

		return productCategories.map((catName) => {
			// Chercher d'abord dans legacyCategories
			const legacy = legacyCategories.find((l) => l.id === catName);
			if (legacy) return legacy;

			// Sinon, créer une config avec emoji automatique
			return {
				id: catName,
				title: catName.charAt(0).toUpperCase() + catName.slice(1),
				emoji: getEmojiByCategory(catName),
				image: getImageByCategory(catName),
				gradient: null, // ← pas de gradient propre : utilisera themeGradient (couleur du restaurant)
				icon: "restaurant",
			};
		});
	}, [productCategories]);

	// ✅ Mapper les catégories reçues du backend (strings) vers les objets legacyCategories
	const apiCategories = config?.categories || []; // Backend retourne ["boisson", "dessert"]
	const dynamicCategories = apiCategories
		.map((catName) => {
			// Chercher dans legacyCategories
			return legacyCategories.find((legacy) => legacy.id === catName);
		})
		.filter((cat) => cat !== undefined); // Supprimer les undefined

	// 🎯 Prioriser : 1) catégories API, 2) catégories des produits, 3) legacy fallback
	const categories =
		dynamicCategories.length > 0
			? dynamicCategories
			: mappedProductCategories.length > 0
				? mappedProductCategories
				: legacyCategories;

	// Add a mapping function to handle category display
	const mapCategoryDisplay = (categoryId) => {
		if (categoryId === "autre") {
			return {
				id: "autre",
				title: "Sandwiches",
				emoji: "🥪",
				image: CATEGORY_IMAGES.sandwich,
				gradient: ["#FFD700", "#FF8C00"],
				icon: "sandwich",
			};
		}
		return categories.find((cat) => cat.id === categoryId);
	};

	// ============ FONCTIONS ============

	// 🎯 Fonction pour récupérer les options d'un produit
	const fetchProductOptions = async (productId) => {
		try {
			setLoadingOptions(true);
			const token = await AsyncStorage.getItem("clientToken");
			const { API_CONFIG } = require("../config/apiConfig.js");

			const response = await fetch(
				`${API_CONFIG.BASE_URL}/products/${productId}/options`,
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				return [];
			}

			const data = await response.json();
			return Array.isArray(data) ? data : [];
		} catch (error) {
			console.error("❌ Erreur fetch options:", error);
			return [];
		} finally {
			setLoadingOptions(false);
		}
	};

	// 🎯 Normaliser les options (menus/formules ou options produit)
	const normalizeOptionGroups = (item, fetchedOptions) => {
		if (Array.isArray(item?.options) && item.options.length > 0) {
			return item.options
				.filter((group) => group && group.available !== false)
				.map((group, groupIndex) => {
					const choices = Array.isArray(group.choices) ? group.choices : [];
					return {
						id: group.id || `group-${groupIndex}`,
						name: group.name || `Choix ${groupIndex + 1}`,
						maxPrice: group.maxPrice ?? null,
						choices: choices
							.filter((choice) => choice && choice.available !== false)
							.map((choice, choiceIndex) => ({
								id: choice.id || `choice-${groupIndex}-${choiceIndex}`,
								name: choice.name,
								price: choice.priceAdjustment || choice.price || 0, // ✅ Support priceAdjustment ET price
							})),
					};
				});
		}

		if (Array.isArray(fetchedOptions) && fetchedOptions.length > 0) {
			return [
				{
					id: "options",
					name: "Options",
					choices: fetchedOptions.map((option) => ({
						id: option._id,
						name: option.name,
						price: option.price || 0,
					})),
				},
			];
		}

		return [];
	};

	const handleIncrease = async (item) => {
		// 🎯 Vérifier si le produit a des options (notamment pour les menus/formules)
		// Utiliser directement item.options si disponible, sinon fetch
		const groups = normalizeOptionGroups(item, null);

		if (groups.length > 0) {
			setCurrentProductForOptions(item);
			setOptionGroups(groups);
			setSelectedOptions({});
			setOptionsModalVisible(true);
		} else {
			onAdd?.(item);
		}
	};

	const closeOptionsModal = () => {
		setOptionsModalVisible(false);
		setSelectedOptions({});
		setOptionGroups([]);
		setCurrentProductForOptions(null);
	};

	// Validation des options sélectionnées
	const handleValidateOptions = () => {
		if (!currentProductForOptions) return;

		const missingGroup = optionGroups.find(
			(group) => (group.choices || []).length > 0 && !selectedOptions[group.id],
		);
		if (missingGroup) {
			Alert.alert(
				"Choix requis",
				`Veuillez choisir une option pour "${missingGroup.name}".`,
			);
			return;
		}

		const selectedChoices = optionGroups
			.map((group) => selectedOptions[group.id])
			.filter(Boolean);

		const optionsTotal = selectedChoices.reduce(
			(sum, choice) => sum + (choice.price || 0),
			0,
		);

		// Ajouter au panier avec les options
		const itemWithOptions = {
			...currentProductForOptions,
			selectedOptions: selectedChoices,
			optionsTotal,
			// Prix final = prix du produit + somme des prix des options
			finalPrice: (currentProductForOptions.price || 0) + optionsTotal,
		};

		onAdd?.(itemWithOptions);
		closeOptionsModal();
	};

	// Toggle sélection d'une option
	const toggleOption = (groupId, choice) => {
		setSelectedOptions((prev) => ({
			...prev,
			[groupId]: choice,
		}));
	};

	const handleDecrease = async (item) => {
		const currentQty = cart[item._id] || 0;
		if (currentQty > 0) {
			const newQty = currentQty - 1;
			// onUpdateQuantity gère déjà la mise à jour du panier ET de la commande
			onUpdateQuantity?.(item, newQty);
		}
	};

	const cartItems = products
		.filter((item) => (cart[item._id] || 0) > 0)
		.map((item) => ({
			...item,
			sent:
				currentOrder.find((o) => o.name === item.name && o.user === userName)
					?.sent || false,
		}));

	const totalArticles = cartItems.reduce(
		(total, item) => total + (cart[item._id] || 0),
		0,
	);

	const getActiveOrderId = async () => {
		const activeOrder = await fetchActiveOrder();
		return activeOrder?._id || null;
	};

	const openModal = (item) => {
		setSelectedItem(item);
		setModalVisible(true);
	};

	const handlePayPress = async () => {
		if (onNavigateToPayment) {
			// ✅ Navigation directe vers Payment
			// fetchOrdersByReservation sera appelé dans navigateToPayment (App.jsx)
			onNavigateToPayment?.();
			return;
		}

		// Fallback si pas de navigation
		Alert.alert("Erreur", "Navigation non disponible");
	};

	useEffect(() => {
		const loadProducts = async () => {
			try {
				const clientToken = await AsyncStorage.getItem("clientToken");
				if (clientToken) {
					await fetchProducts(clientToken);
				} else {
					console.warn("⚠️ Client doit rejoindre une table d'abord");
				}
			} catch (error) {
				console.error("❌ Error loading products:", error);
			}
		};
		loadProducts();
	}, []);

	// 🔍 Produits filtrés par recherche
	const searchResults = searchQuery.trim()
		? products.filter(
				(p) =>
					p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: [];

	// ⭐ Produits filtrés par catégorie sélectionnée
	const categoryProducts = selectedCategory
		? products.filter((p) => {
				const mappedCategory = mapCategoryDisplay(p.category?.toLowerCase());
				return mappedCategory && mappedCategory.id === selectedCategory.id;
			})
		: [];

	// 💰 Total du panier
	const cartTotal = cartItems.reduce(
		(sum, item) => sum + item.price * (cart[item._id] || 0),
		0,
	);

	// 🎯 ÉCRAN UNIFIÉ : Catégories + Produits
	// Afficher un loader si la config est en cours de chargement
	if (configLoading) {
		return (
			<LinearGradient
				colors={DEFAULT_THEME.dark}
				style={styles.container}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<ActivityIndicator size="large" color={DEFAULT_THEME.primary[0]} />
					<Text
						style={{
							color: DEFAULT_THEME.textInverse,
							marginTop: 16,
							fontSize: 16,
						}}
					>
						Chargement de la configuration...
					</Text>
				</View>
			</LinearGradient>
		);
	}

	// 🖼️ Image de fond : DÉSACTIVÉE dans Menu (seulement dans JoinOrCreateTable)
	const shouldShowBackgroundImage = false; // ❌ Jamais d'image de fond dans Menu

	// 🐛 Debug theme selection

	// 🌟 Couleur de fond spécifique pour Italia : blanc pur au lieu de crème
	const backgroundGradient =
		config?.styleKey === "italia"
			? ["#FFFFFF", "#FFFFFF"] // Blanc pur pour Italia
			: getGradient("background");

	// 🎨 Rendu final SANS image de fond (toujours LinearGradient uniquement)
	return (
		<LinearGradient
			colors={backgroundGradient}
			style={styles.container}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
		>
			{/* Décorations premium (cercles en arrière-plan) */}
			<View style={styles.bgDecor} pointerEvents="none">
				<LinearGradient
					colors={[...getGradient("primary"), "transparent"]}
					style={[styles.bgCircle, styles.bgCircle1]}
				/>
				<LinearGradient
					colors={[...getGradient("accent"), "transparent"]}
					style={[styles.bgCircle, styles.bgCircle2]}
				/>
			</View>

			{/* 🔒 Header Conditionnel : Italia, Grillz ou Standard */}
			{config?.styleKey === "italia" ? (
				<ItaliaHeader
					userName={userName}
					restaurantName={restaurantName}
					onOpenDietary={() => setShowDietaryModal(true)}
					showDietaryFeature={hasAllergies || hasRestrictions}
					theme={currentStyle}
					styleConfig={{
						headerIcon: config?.style?.headerIcon || "pizza",
						categoryLabel: config?.style?.categoryLabel || "CUCINA ITALIANA",
						slogan: config?.style?.slogan || "Autentica cucina italiana",
					}}
				/>
			) : useCustomHeader ? (
				<GrillzHeader
					userName={userName}
					restaurantName={restaurantName}
					onOpenDietary={() => setShowDietaryModal(true)}
					showDietaryFeature={hasAllergies || hasRestrictions}
					theme={currentStyle}
					styleConfig={{
						headerIcon: config?.style?.headerIcon || "flame",
						categoryLabel: config?.style?.categoryLabel,
						slogan: config?.style?.slogan,
					}}
				/>
			) : (
				<View style={styles.premiumHeader}>
					<View style={styles.headerRow}>
						<TouchableOpacity
							onPress={() => setShowDietaryModal(true)}
							style={{ position: "relative" }}
							activeOpacity={0.7}
						>
							<LinearGradient
								colors={getGradient("accent")}
								style={styles.headerIcon}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="restaurant-menu" size={32} color="#fff" />
							</LinearGradient>
							{/* Badge "+" */}
							<View
								style={{
									position: "absolute",
									top: -4,
									right: -4,
									backgroundColor: "#ff512f",
									width: 20,
									height: 20,
									borderRadius: 10,
									alignItems: "center",
									justifyContent: "center",
									borderWidth: 2,
									borderColor: "#fff",
								}}
							>
								<Ionicons name="add" size={14} color="#fff" />
							</View>
						</TouchableOpacity>
						<View style={{ flex: 1, alignItems: "center" }}>
							<Text style={styles.welcomeTitle}>
								{userName ? `Bonjour ${userName}` : "Bienvenue"} ✨
							</Text>
						</View>
					</View>
					<Text style={styles.subtitle}>Découvrez notre carte</Text>
				</View>
			)}

			{/* 🔍 Barre de recherche Premium */}
			<PremiumSearchBar
				value={searchQuery}
				onChangeText={(text) => {
					setSearchQuery(text);
					if (text.trim()) setSelectedCategory(null);
				}}
				onClear={() => setSearchQuery("")}
			/>

			{/* ⭐ Zone fixe pour les boutons de catégories avec scroll horizontal */}
			{!searchQuery.trim() && (
				<View style={styles.categoriesFixedZone}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalCategoriesContainer}
					>
						{categories.map((cat) => {
							const isSelected = selectedCategory?.id === cat.id;
							return (
								<AnimatedCategoryButton
									key={cat.id}
									category={cat}
									isSelected={isSelected}
									otherSelected={selectedCategory && !isSelected}
									onPress={() => setSelectedCategory(isSelected ? null : cat)}
									themeGradient={getGradient("primary")}
								/>
							);
						})}
					</ScrollView>
				</View>
			)}

			{/* 🔍 Résultats de recherche */}
			{searchQuery.trim() ? (
				<FlatList
					data={searchResults}
					keyExtractor={(item) => item._id.toString()}
					renderItem={({ item, index }) => {
						const productCategory = categories.find(
							(c) => c.id === item.category?.toLowerCase(),
						);
						return (
							<PremiumProductCard
								item={item}
								cart={cart}
								onIncrease={handleIncrease}
								onDecrease={handleDecrease}
								onPress={() => openModal(item)}
								index={index}
								categoryGradient={productCategory?.gradient}
								themeGradient={getGradient("primary")}
								showAllergens={hasAllergies}
								theme={currentStyle}
							/>
						);
					}}
					contentContainerStyle={styles.premiumListContainer}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptySearch}>
							<Text style={styles.emptySearchEmoji}>🔍</Text>
							<Text style={styles.emptySearchText}>
								Aucun résultat pour "{searchQuery}"
							</Text>
							<Text style={styles.emptySearchSubtext}>
								Essayez avec un autre mot-clé
							</Text>
						</View>
					}
					ListHeaderComponent={
						<Text style={styles.searchResultsCount}>
							{searchResults.length} résultat
							{searchResults.length > 1 ? "s" : ""}
						</Text>
					}
				/>
			) : selectedCategory ? (
				/* ⭐ Liste des produits de la catégorie sélectionnée avec cartes premium */
				<FlatList
					data={categoryProducts}
					keyExtractor={(item) => item._id.toString()}
					renderItem={({ item, index }) => (
						<PremiumProductCard
							item={item}
							cart={cart}
							onIncrease={handleIncrease}
							onDecrease={handleDecrease}
							onPress={() => openModal(item)}
							index={index}
							categoryGradient={selectedCategory?.gradient}
							showAllergens={hasAllergies}
							theme={currentStyle}
						/>
					)}
					contentContainerStyle={styles.premiumListContainer}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptyCategory}>
							<Text style={styles.emptyCategoryText}>
								Aucun produit dans cette catégorie
							</Text>
						</View>
					}
				/>
			) : (
				<View style={styles.noCategorySelected}>
					<LinearGradient
						colors={["rgba(102,126,234,0.1)", "rgba(118,75,162,0.05)"]}
						style={styles.noCategoryGradient}
					>
						<Text style={styles.noCategoryEmoji}>✨</Text>
						<Text style={styles.noCategoryText}>Choisissez une catégorie</Text>
						<Text style={styles.noCategorySubtext}>
							Explorez notre sélection de délices
						</Text>
					</LinearGradient>
				</View>
			)}

			{/* 🛒 Panier flottant Premium */}
			<PremiumFloatingCart
				itemCount={totalArticles}
				total={cartTotal}
				onPress={() => onNavigateToOrders?.()}
			/>

			{/* Bouton Payer si commande active */}
			{hasActiveOrder && !cartItems.length && (
				<TouchableOpacity
					style={styles.payButtonFloat}
					onPress={handlePayPress}
					activeOpacity={0.9}
				>
					<LinearGradient
						colors={getGradient("primary")}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.payButtonGradient}
					>
						<Text style={styles.payButtonText}>💳 Payer ma commande</Text>
					</LinearGradient>
				</TouchableOpacity>
			)}

			{/* 🔹 Modal produit Premium */}
			{selectedItem && (
				<Modal
					transparent
					visible={modalVisible}
					animationType="fade"
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContent}>
							<Text
								style={[
									styles.modalTitle,
									{ color: currentStyle?.text || DEFAULT_THEME.text },
								]}
							>
								{selectedItem.name}
							</Text>
							<Text
								style={[
									styles.modalDescription,
									{ color: getSafeDescColor(currentStyle) },
								]}
							>
								{selectedItem.description || "Sans description"}
							</Text>
							<View style={styles.modalTags}>
								{selectedItem.vegan && (
									<Text style={[styles.modalTag, styles.modalVeganTag]}>
										🌱 Vegan
									</Text>
								)}
								{selectedItem.glutenFree && (
									<Text style={[styles.modalTag, styles.modalGlutenTag]}>
										🌾 Sans gluten
									</Text>
								)}
							</View>
							{/* 🎯 Allergènes : affichés seulement si le niveau le permet */}
							{hasAllergies && selectedItem.allergens && (
								<Text style={styles.modalAllergens}>
									⚠️ Allergènes :{" "}
									{Array.isArray(selectedItem.allergens)
										? selectedItem.allergens.join(", ")
										: selectedItem.allergens}
								</Text>
							)}
							<Pressable
								style={styles.modalCloseButton}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.modalCloseText}>Fermer</Text>
							</Pressable>
						</View>
					</View>
				</Modal>
			)}

			{/* 🎯 Modal Options Produit (pour menus/formules) - Grille 3 colonnes */}
			<Modal
				transparent
				visible={optionsModalVisible}
				animationType="slide"
				onRequestClose={closeOptionsModal}
			>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{ maxHeight: "95%", width: "95%", height: "92%" },
						]}
					>
						<View style={styles.modalHeaderOptions}>
							<Text
								style={[
									styles.modalTitle,
									{ color: "#333", flex: 1, fontSize: 14 },
								]}
							>
								Options
							</Text>
							<TouchableOpacity
								onPress={closeOptionsModal}
								style={styles.modalCloseIcon}
							>
								<Ionicons name="close-circle" size={32} color="#333" />
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.optionsScrollContainer}
							showsVerticalScrollIndicator={false}
						>
							{loadingOptions ? (
								<ActivityIndicator
									size="small"
									color={DEFAULT_THEME.primary[0]}
								/>
							) : optionGroups.length === 0 ? (
								<Text
									style={[
										styles.modalDescription,
										{ color: getSafeDescColor(currentStyle) },
									]}
								>
									Aucune option disponible
								</Text>
							) : (
								optionGroups.map((group) => (
									<View key={group.id} style={styles.optionGroupContainer}>
										<Text style={[styles.optionGroupTitle, { color: "#222" }]}>
											{group.name}
										</Text>
										<View style={styles.optionsGrid}>
											{(group.choices || []).map((choice) => {
												const isSelected =
													selectedOptions[group.id]?.id === choice.id;
												return (
													<TouchableOpacity
														key={choice.id}
														style={[
															styles.optionGridItem,
															isSelected && styles.optionGridItemSelected,
														]}
														onPress={() => toggleOption(group.id, choice)}
														activeOpacity={0.7}
													>
														<Text style={styles.optionGridCheckmark}>
															{isSelected ? "✅" : "⭕"}
														</Text>
														<Text
															style={[styles.optionGridName, { color: "#333" }]}
															numberOfLines={2}
														>
															{choice.name}
														</Text>
														{choice.priceAdjustment > 0 && (
															<Text
																style={[
																	styles.optionGridPrice,
																	{ color: "#4CAF50" },
																]}
															>
																+{choice.priceAdjustment.toFixed(2)}€
															</Text>
														)}
													</TouchableOpacity>
												);
											})}
										</View>
									</View>
								))
							)}
						</ScrollView>

						<View style={styles.modalButtons}>
							<Pressable
								style={[styles.modalButton, styles.modalCancelButton]}
								onPress={closeOptionsModal}
							>
								<Text style={styles.modalCloseText}>Annuler</Text>
							</Pressable>
							<Pressable
								style={[styles.modalButton, styles.modalAddButton]}
								onPress={handleValidateOptions}
							>
								<Text style={styles.modalCloseText}>
									Ajouter{" "}
									{Object.keys(selectedOptions).length > 0 &&
										`(${Object.keys(selectedOptions).length})`}
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal Préférences Alimentaires */}
			<DietaryPreferences
				visible={showDietaryModal}
				onClose={() => setShowDietaryModal(false)}
			/>

			{/* 💬 Messagerie Client-Serveur : visible uniquement si reservationId fourni */}
			{reservationId && clientId && (
				<MessagingBubble
					reservationId={reservationId}
					clientId={clientId}
					isClient={true}
				/>
			)}
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		paddingTop: 50,
	},
	// Décorations premium (identique OrderSummary)
	bgDecor: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
	},
	bgCircle: {
		position: "absolute",
		borderRadius: 999,
		opacity: 0.18,
	},
	bgCircle1: {
		width: SCREEN_WIDTH * 0.7,
		height: SCREEN_WIDTH * 0.7,
		top: -SCREEN_WIDTH * 0.2,
		right: -SCREEN_WIDTH * 0.2,
	},
	bgCircle2: {
		width: SCREEN_WIDTH * 0.5,
		height: SCREEN_WIDTH * 0.5,
		bottom: 100,
		left: -SCREEN_WIDTH * 0.2,
	},
	// 🎨 Header Premium
	premiumHeader: {
		marginBottom: 20,
		alignItems: "center",
		paddingTop: 10,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		marginBottom: 8,
		width: "100%",
	},
	headerIcon: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: DEFAULT_THEME.shadowColor,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	welcomeTitle: {
		fontSize: 32,
		fontWeight: "800",
		color: DEFAULT_THEME.text,
		letterSpacing: -0.5,
		textAlign: "left",
	},
	subtitle: {
		fontSize: 16,
		color: DEFAULT_THEME.textMuted,
		fontWeight: "500",
		textAlign: "center",
		marginTop: 4,
	},
	// 🔍 Barre de recherche Premium
	premiumSearchContainer: {
		marginBottom: 20,
		borderRadius: 16,
		borderWidth: 2,
		overflow: "hidden",
	},
	premiumSearchGradient: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	premiumSearchInput: {
		flex: 1,
		paddingVertical: 14,
		fontSize: 16,
		color: DEFAULT_THEME.text,
		fontWeight: "500",
	},
	searchIcon: {
		marginRight: 12,
	},
	clearButton: {
		padding: 4,
	},
	clearButtonInner: {
		backgroundColor: DEFAULT_THEME.primary[0],
		borderRadius: 12,
		padding: 4,
	},
	// Anciens styles recherche gardés
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 12,
		paddingHorizontal: 12,
		marginBottom: 15,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	searchInput: {
		flex: 1,
		paddingVertical: 12,
		fontSize: 15,
		color: "#333",
	},
	// Résultats de recherche
	searchResultsCount: {
		fontSize: 14,
		color: "#666",
		marginBottom: 10,
		fontWeight: "500",
	},
	searchResultHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	categoryBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
	},
	categoryBadgeText: {
		fontSize: 10,
		color: "#fff",
		fontWeight: "600",
	},
	emptySearch: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 50,
	},
	emptySearchEmoji: {
		fontSize: 50,
		marginBottom: 15,
	},
	emptySearchText: {
		fontSize: 16,
		color: "#333",
		fontWeight: "500",
		marginBottom: 5,
	},
	emptySearchSubtext: {
		fontSize: 14,
		color: "#999",
	},
	// ⭐ Zone fixe pour les boutons de catégories
	categoriesFixedZone: {
		height: 80,
		marginHorizontal: -20,
		marginBottom: 10,
		justifyContent: "center",
	},
	// ⭐ Container scroll horizontal pour les boutons
	horizontalCategoriesContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 25,
	},
	// 🎨 Bouton animé style gradient-menu
	animatedButton: {
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		backgroundColor: "#fff",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
	},
	glowEffect: {
		position: "absolute",
		top: 10,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 30,
		opacity: 0,
		transform: [{ scale: 1.1 }],
	},
	buttonEmoji: {
		fontSize: 24,
		position: "absolute",
	},
	buttonEmojiImage: {
		width: 32,
		height: 32,
		position: "absolute",
	},
	buttonText: {
		color: "#fff",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		position: "absolute",
		textAlign: "center",
		paddingHorizontal: 8,
		maxWidth: BUTTON_EXPANDED - 20,
		lineHeight: 14,
	},
	// Anciens styles gardés pour compatibilité
	categoryPillWrapper: {
		flex: 1,
		marginHorizontal: 4,
	},
	categoryPillGradient: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		paddingHorizontal: 8,
		borderRadius: 16,
		elevation: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
	},
	categoryPillInactive: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		paddingHorizontal: 8,
		borderRadius: 16,
		backgroundColor: "#fff",
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	categoryEmoji: {
		fontSize: 24,
		marginBottom: 4,
	},
	categoryPillText: {
		fontSize: 11,
		fontWeight: "700",
		textAlign: "center",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	// État vide
	noCategorySelected: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
		paddingBottom: 100,
	},
	noCategoryText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1a1a2e",
		marginBottom: 8,
		textAlign: "center",
	},
	noCategorySubtext: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	emptyCategory: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 50,
	},
	emptyCategoryText: {
		fontSize: 16,
		color: "#999",
	},
	// Panier flottant
	floatingCart: {
		position: "absolute",
		bottom: 20,
		left: 20,
		right: 20,
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 15,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
	},
	floatingCartInfo: {
		flex: 1,
	},
	floatingCartCount: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
	},
	floatingCartTotal: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#4CAF50",
	},
	floatingCartButton: {
		backgroundColor: "#4CAF50",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 10,
	},
	floatingCartButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 14,
	},
	payButtonFloat: {
		position: "absolute",
		bottom: 20,
		left: 20,
		right: 20,
		// backgroundColor supprimé - le LinearGradient gère le fond
		padding: 15,
		borderRadius: 12,
		alignItems: "center",
	},
	payButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	// Anciens styles gardés pour compatibilité
	categoriesGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	categoryCard: {
		width: "48%",
		height: 150,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 15,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	categoryIcon: {
		marginBottom: 10,
	},
	categoryTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		textAlign: "center",
	},
	// Écran 2
	listContainer: {
		padding: 15,
		paddingBottom: 200,
	},
	productCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 15,
		borderRadius: 12,
		marginBottom: 10,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
	},
	productInfo: {
		flex: 1,
		marginRight: 15,
	},
	productName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 5,
	},
	productDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	productTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 5,
	},
	tag: {
		fontSize: 11,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		marginRight: 5,
		marginTop: 3,
	},
	veganTag: {
		backgroundColor: "#E8F5E9",
		color: "#2E7D32",
	},
	glutenTag: {
		backgroundColor: "#FFF3E0",
		color: "#EF6C00",
	},
	allergens: {
		fontSize: 12,
		color: "#ff6b6b",
		fontStyle: "italic",
		marginTop: 3,
	},
	productActions: {
		alignItems: "center",
	},
	price: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#4CAF50",
		marginBottom: 8,
	},
	counter: {
		flexDirection: "row",
		alignItems: "center",
	},
	counterButton: {
		width: 32,
		height: 32,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
	},
	counterText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#333",
	},
	counterValue: {
		marginHorizontal: 10,
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},
	// 🛒 Panier fixe
	cartContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		padding: 15,
		borderTopWidth: 1,
		borderColor: "#eee",
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	cartTitle: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 10,
		color: "#333",
	},
	emptyCart: {
		fontStyle: "italic",
		color: "#999",
		textAlign: "center",
		padding: 10,
	},
	cartItems: {
		flexDirection: "row",
	},
	cartItem: {
		backgroundColor: "#f0f0f0",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	cartItemName: {
		fontSize: 14,
		color: "#333",
	},
	cartItemQty: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#4CAF50",
		marginLeft: 4,
	},
	// Panier rapide
	quickCart: {
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 15,
		marginTop: 20,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	quickCartTitle: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 10,
		color: "#333",
	},
	quickCartItems: {
		flexDirection: "row",
		marginBottom: 10,
	},
	quickCartItem: {
		backgroundColor: "#f0f0f0",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 12,
		marginRight: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	quickCartName: {
		fontSize: 13,
		color: "#333",
	},
	quickCartQty: {
		fontSize: 13,
		fontWeight: "bold",
		color: "#4CAF50",
		marginLeft: 3,
	},
	quickCartButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	quickCartButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	// 🎯 BOUTONS PRINCIPAUX
	mainButtonsContainer: {
		marginTop: 30,
		marginBottom: 20,
		gap: 15,
	},
	mainActionButton: {
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
	},
	mainValidateButton: {
		backgroundColor: "#4CAF50",
	},
	mainViewOrderButton: {
		backgroundColor: "#2196F3",
	},
	mainPayButton: {
		backgroundColor: "#FF9800",
	},
	mainActionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	// Boutons écran 2
	buttonsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 15,
		gap: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	validateButton: {
		backgroundColor: "#4CAF50",
	},
	payButton: {
		backgroundColor: "#FF9800",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 18,
		alignItems: "stretch",
		overflow: "hidden",
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	modalDescription: {
		fontSize: 16,
		color: "#555",
		marginBottom: 15,
		textAlign: "center",
		lineHeight: 22,
	},
	modalTags: {
		flexDirection: "row",
		marginBottom: 15,
	},
	modalTag: {
		fontSize: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
		marginHorizontal: 5,
	},
	modalVeganTag: {
		backgroundColor: "#E8F5E9",
		color: "#2E7D32",
	},
	modalGlutenTag: {
		backgroundColor: "#FFF3E0",
		color: "#EF6C00",
	},
	modalAllergens: {
		fontSize: 14,
		color: "#ff6b6b",
		fontStyle: "italic",
		marginBottom: 20,
		textAlign: "center",
	},
	modalCloseButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 12,
		paddingHorizontal: 40,
		borderRadius: 10,
	},
	modalCloseText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},

	// Styles options produit (menus/formules)
	optionGroup: {
		marginBottom: 12,
	},
	optionGroupTitle: {
		fontSize: 12,
		fontWeight: "700",
		marginBottom: 6,
	},
	optionItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderRadius: 10,
		backgroundColor: "#f5f5f5",
		marginBottom: 8,
		borderWidth: 2,
		borderColor: "#e0e0e0",
	},
	optionItemSelected: {
		backgroundColor: "#e8f5e9",
		borderColor: "#4CAF50",
	},
	optionLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	optionRadio: {
		fontSize: 20,
		marginRight: 10,
	},
	optionName: {
		fontSize: 15,
		fontWeight: "500",
		flex: 1,
	},
	optionPrice: {
		fontSize: 14,
		fontWeight: "600",
	},

	// Nouveaux styles grille 3 colonnes
	modalHeaderOptions: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	modalCloseIcon: {
		padding: 8,
	},
	optionsScrollContainer: {
		flex: 1,
		width: "100%",
		paddingVertical: 12,
	},
	optionGroupContainer: {
		marginBottom: 16,
	},
	optionsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		justifyContent: "space-between",
	},
	optionGridItem: {
		width: "31%",
		minHeight: 75,
		borderRadius: 8,
		backgroundColor: "#f5f5f5",
		borderWidth: 2,
		borderColor: "#e0e0e0",
		justifyContent: "center",
		alignItems: "center",
		padding: 5,
	},
	optionGridItemSelected: {
		backgroundColor: "#e8f5e9",
		borderColor: "#4CAF50",
		borderWidth: 3,
	},
	optionGridCheckmark: {
		fontSize: 14,
		marginBottom: 2,
	},
	optionGridName: {
		fontSize: 10,
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 1,
	},
	optionGridPrice: {
		fontSize: 9,
		fontWeight: "700",
	},
	modalButtons: {
		flexDirection: "row",
		alignSelf: "stretch",
		marginTop: 10,
		gap: 10,
		paddingBottom: 4,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	modalCancelButton: {
		backgroundColor: "#666",
	},
	modalAddButton: {
		backgroundColor: "#4CAF50",
	},

	// ============================================
	// 🎨 STYLES PREMIUM 10/10
	// ============================================

	// Liste premium
	premiumListContainer: {
		paddingHorizontal: 5,
		paddingBottom: 150,
	},

	// Carte produit premium
	premiumCard: {
		borderRadius: 20,
		marginBottom: 16,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},
	cardAccentLine: {
		height: 4,
		width: "100%",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	premiumCardContent: {
		flexDirection: "row",
		padding: 18,
		justifyContent: "space-between",
		backgroundColor: "rgba(255,255,255,0.07)",
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	premiumCardInfo: {
		flex: 1,
		paddingRight: 12,
	},
	premiumProductName: {
		fontSize: 18,
		fontWeight: "700",
		color: DEFAULT_THEME.text,
		marginBottom: 6,
		letterSpacing: -0.3,
	},
	premiumProductDesc: {
		fontSize: 14,
		color: DEFAULT_THEME.textMuted,
		lineHeight: 18,
		marginBottom: 10,
	},
	premiumTagsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	premiumTag: {
		backgroundColor: "rgba(76,175,80,0.12)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	premiumTagText: {
		fontSize: 11,
		fontWeight: "600",
		color: DEFAULT_THEME.text,
	},
	premiumCardActions: {
		alignItems: "flex-end",
		justifyContent: "space-between",
	},
	premiumPriceBadge: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: DEFAULT_THEME.shadowColor,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 4,
	},
	premiumPriceText: {
		fontSize: 16,
		fontWeight: "800",
		color: DEFAULT_THEME.textInverse,
	},
	premiumCounter: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	premiumCounterBtn: {
		borderRadius: 12,
		overflow: "hidden",
	},
	premiumCounterGradient: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 12,
	},
	premiumCounterText: {
		fontSize: 20,
		fontWeight: "700",
		color: "#fff",
	},
	premiumCounterValueContainer: {
		width: 32,
		alignItems: "center",
	},
	premiumCounterValue: {
		fontSize: 16,
		fontWeight: "700",
		color: DEFAULT_THEME.textMuted,
	},
	premiumCounterValueActive: {
		color: DEFAULT_THEME.text,
	},

	// État vide premium
	noCategoryGradient: {
		padding: 40,
		borderRadius: 24,
		alignItems: "center",
	},
	noCategoryEmoji: {
		fontSize: 60,
		marginBottom: 16,
	},

	// Panier flottant premium
	premiumFloatingCart: {
		position: "absolute",
		bottom: 20,
		left: 16,
		right: 16,
		borderRadius: 20,
		overflow: "hidden",
	},
	premiumCartBlur: {
		borderRadius: 20,
		overflow: "hidden",
	},
	premiumCartGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.05)",
	},
	premiumCartInfo: {
		flexDirection: "row",
		alignItems: "center",
	},
	premiumCartBadge: {
		backgroundColor: DEFAULT_THEME.primary[0],
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	premiumCartBadgeText: {
		color: "#fff",
		fontWeight: "800",
		fontSize: 14,
	},
	premiumCartTextContainer: {},
	premiumCartLabel: {
		fontSize: 12,
		color: "#666",
		fontWeight: "500",
	},
	premiumCartTotal: {
		fontSize: 18,
		fontWeight: "800",
		color: "#1a1a2e",
	},
	premiumCartButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 14,
		gap: 8,
	},
	premiumCartButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 14,
	},

	// Bouton payer premium
	payButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		borderRadius: 16,
		gap: 8,
	},

	// 🔥 ===== STYLES GRILLZ (utilisés uniquement pour Le Grillz) =====
	grillzHeader: {
		marginBottom: 20,
	},
	grillzHeaderOuter: {
		borderRadius: 20,
		marginHorizontal: 10,
		overflow: "hidden",
		shadowColor: "#FF6B35",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.5,
		shadowRadius: 12,
		elevation: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 107, 53, 0.4)",
	},
	grillzFlameStrip: {
		height: 3,
		width: "100%",
	},
	grillzLogoContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingTop: 16,
		paddingBottom: 12,
	},
	grillzLogo: {
		width: 54,
		height: 54,
		borderRadius: 27,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 14,
		shadowColor: "#FF6B35",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.5,
		shadowRadius: 8,
		elevation: 6,
	},
	grillzBrandText: {
		flex: 1,
	},
	grillzTitle: {
		fontSize: 26,
		fontWeight: "900",
		color: "#FFFAF0",
		letterSpacing: -0.5,
		textShadowColor: "#FF6B35",
		textShadowRadius: 8,
		textShadowOffset: { width: 0, height: 2 },
	},
	grillzSubtitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#D4A574",
		letterSpacing: 1.2,
		marginTop: 3,
	},
	grillzDivider: {
		height: 1,
		backgroundColor: "rgba(255, 107, 53, 0.25)",
		marginHorizontal: 18,
		marginBottom: 10,
	},
	grillzUserButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 18,
		paddingBottom: 14,
	},
	grillzUserText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#FFFAF0",
	},
	grillzBadgesRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	grillzHalalBadge: {
		backgroundColor: "rgba(255, 107, 53, 0.2)",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "rgba(255, 107, 53, 0.5)",
	},
	grillzHalalText: {
		fontSize: 10,
		fontWeight: "800",
		color: "#FF6B35",
		letterSpacing: 0.5,
	},
	grillzDietaryButton: {
		backgroundColor: "rgba(255, 107, 53, 0.2)",
		borderRadius: 12,
		padding: 8,
		borderWidth: 1,
		borderColor: "rgba(255, 107, 53, 0.4)",
	},

	// 🇮🇹 ===== STYLES ITALIA (utilisés uniquement pour Lacucinadinini) =====
	italiaHeader: {
		marginBottom: 20,
		overflow: "hidden",
		borderRadius: 20,
		marginHorizontal: 10,
		shadowColor: "#009246",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	italiaFlagBg: {
		flexDirection: "row",
		height: 8,
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 1,
	},
	italiaFlag: {
		flex: 1,
	},
	italiaHeaderContent: {
		backgroundColor: "#FFF8E7",
		padding: 20,
		paddingTop: 28,
	},
	italiaLogoContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	italiaLogo: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
		shadowColor: "#F1BF00",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 4,
		elevation: 4,
	},
	italiaBrandText: {
		flex: 1,
	},
	italiaTitle: {
		fontSize: 30,
		fontWeight: "700",
		color: "#2C1810",
		letterSpacing: -0.5,
		fontFamily: Platform.select({
			ios: "Georgia",
			android: "serif",
		}),
	},
	italiaSubtitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#009246",
		letterSpacing: 3,
		marginTop: 2,
	},
	italiaUserSection: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "rgba(0, 146, 70, 0.08)",
		borderRadius: 15,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(0, 146, 70, 0.15)",
	},
	italiaUserText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#2C1810",
		fontFamily: Platform.select({
			ios: "Georgia",
			android: "serif",
		}),
	},
	italiaDietaryButton: {
		backgroundColor: "rgba(0, 146, 70, 0.1)",
		borderRadius: 12,
		padding: 8,
		borderWidth: 1,
		borderColor: "#009246",
	},
	italiaSlogan: {
		fontSize: 13,
		fontWeight: "500",
		color: "#CE2B37",
		textAlign: "center",
		paddingVertical: 8,
		paddingHorizontal: 20,
		backgroundColor: "#FFF8E7",
		fontStyle: "italic",
		fontFamily: Platform.select({
			ios: "Georgia",
			android: "serif",
		}),
	},
});
