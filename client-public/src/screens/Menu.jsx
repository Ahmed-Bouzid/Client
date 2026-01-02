import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
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
	Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useCartStore } from "../stores/useCartStore.js";
import useProductStore from "../stores/useProductStore.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrderStore } from "../stores/useOrderStore.js";
import AllergenBadge from "../components/AllergenBadge.jsx";
import AllergyManagement from "./AllergyManagement.jsx";
import MessagingBubble from "../components/MessagingBubble.jsx";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const BUTTON_SMALL = 60;
const BUTTON_EXPANDED = SCREEN_WIDTH - 40 - 60 * 3 - 8 * 3;

// 🎨 Premium Design System (identique OrderSummary/Payment)
const PREMIUM_COLORS = {
	primary: ["#667eea", "#764ba2"],
	secondary: ["#f093fb", "#f5576c"],
	accent: ["#4facfe", "#00f2fe"],
	success: ["#11998e", "#38ef7d"],
	warning: ["#f2994a", "#f2c94c"],
	dark: ["#0f0c29", "#302b63", "#24243e"],
	glass: "rgba(255, 255, 255, 0.15)",
	glassBorder: "rgba(255, 255, 255, 0.25)",
	text: "#ffffff",
	textMuted: "rgba(255, 255, 255, 0.7)",
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
}) => {
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
			{/* Allergen Badge */}
			<AllergenBadge product={item} />

			{/* Gradient accent line */}
			<LinearGradient
				colors={categoryGradient || ["#667eea", "#764ba2"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={styles.cardAccentLine}
			/>

			<TouchableOpacity
				activeOpacity={0.95}
				onPress={onPress}
				style={styles.premiumCardContent}
			>
				{/* Info section */}
				<View style={styles.premiumCardInfo}>
					<Text style={styles.premiumProductName}>{item.name}</Text>
					<Text style={styles.premiumProductDesc} numberOfLines={2}>
						{item.description || "Une création savoureuse de notre chef"}
					</Text>

					{/* Tags row */}
					<View style={styles.premiumTagsRow}>
						{item.vegan && (
							<View style={styles.premiumTag}>
								<Text style={styles.premiumTagText}>🌱 Vegan</Text>
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
					</View>
				</View>

				{/* Price & Actions */}
				<View style={styles.premiumCardActions}>
					{/* Price with gradient */}
					<LinearGradient
						colors={categoryGradient || ["#667eea", "#764ba2"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.premiumPriceBadge}
					>
						<Text style={styles.premiumPriceText}>{item.price}€</Text>
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
									quantity > 0 && styles.premiumCounterValueActive,
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
								colors={categoryGradient || ["#667eea", "#764ba2"]}
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
						? "rgba(102, 126, 234, 0.5)"
						: "rgba(0,0,0,0.08)",
				},
			]}
		>
			<LinearGradient
				colors={
					isFocused
						? ["rgba(102,126,234,0.1)", "rgba(118,75,162,0.05)"]
						: ["#fff", "#fff"]
				}
				style={styles.premiumSearchGradient}
			>
				<MaterialIcons
					name="search"
					size={22}
					color={isFocused ? "#667eea" : "#999"}
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
					])
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
							colors={["#667eea", "#764ba2"]}
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
}) => {
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
					colors={isSelected ? category.gradient : ["#fff", "#fff"]}
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
							backgroundColor: category.gradient[0],
						},
					]}
				/>

				{/* Icône emoji (visible quand non sélectionné) */}
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
					{category.emoji}
				</Animated.Text>

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
					{category.title.toUpperCase()}
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
	navigation = null,
}) {
	const products = useProductStore((state) => state.products);
	const fetchProducts = useProductStore((state) => state.fetchProducts);
	const { cart } = useCartStore();
	const { currentOrder, fetchActiveOrder } = useOrderStore();

	const [selectedCategory, setSelectedCategory] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [allergyModalVisible, setAllergyModalVisible] = useState(false);

	// 💬 État pour la messagerie client → serveur
	const [reservationId, setReservationId] = useState(null);
	const [clientId, setClientId] = useState(null);

	// ⭐ État pour les modales
	const [infoModalVisible, setInfoModalVisible] = useState(false); // Modal d'information
	const [optionsModalVisible, setOptionsModalVisible] = useState(false); // Modal de sélection d'options
	const [productOptions, setProductOptions] = useState([]);
	const [infoProductOptions, setInfoProductOptions] = useState([]); // Options pour la modal info
	const [selectedOptions, setSelectedOptions] = useState([]);
	const [loadingOptions, setLoadingOptions] = useState(false);

	// 💬 Récupérer reservationId et clientId pour la messagerie
	useEffect(() => {
		const loadMessageIds = async () => {
			try {
				const storedReservationId = await AsyncStorage.getItem(
					"currentReservationId"
				);
				const storedClientId = await AsyncStorage.getItem("clientId");
				if (storedReservationId) setReservationId(storedReservationId);
				if (storedClientId) setClientId(storedClientId);
			} catch (error) {
				console.error("Erreur chargement IDs messagerie:", error);
			}
		};
		loadMessageIds();
	}, []);

	// ⚡ Catégories avec gradients (style moderne)
	const categories = [
		{
			id: "boisson",
			title: "Boissons",
			emoji: "🥤",
			gradient: ["#a955ff", "#ea51ff"],
			icon: "glass-cocktail",
		},
		{
			id: "entrée",
			title: "Entrées",
			emoji: "🥗",
			gradient: ["#80FF72", "#7EE8FA"],
			icon: "leaf",
		},
		{
			id: "plat",
			title: "Plats",
			emoji: "🍝",
			gradient: ["#FF9966", "#FF5E62"],
			icon: "food",
		},
		{
			id: "dessert",
			title: "Desserts",
			emoji: "🍰",
			gradient: ["#ffa9c6", "#f434e2"],
			icon: "cake",
		},
	];

	// ============ FONCTIONS ============
	// Ouvrir la modal d'information (clic sur produit)
	const handleOpenInfoModal = async (item) => {
		console.log("🖼️ handleOpenInfoModal - item:", item);
		console.log("🖼️ item.image:", item.image);
		console.log("🖼️ item.imageUrl:", item.imageUrl);
		setSelectedItem(item);
		setInfoModalVisible(true);
		// Charger les options pour affichage informatif
		const options = await checkProductOptions(item._id);
		setInfoProductOptions(options);
	};

	// Ouvrir la modal de sélection d'options (clic sur "+")
	const handleIncrease = async (item) => {
		// Charger les options pour vérifier si le produit en a
		const options = await checkProductOptions(item._id);
		if (options && options.length > 0) {
			// Le produit a des options, ouvrir la modal de sélection
			setSelectedItem(item);
			setSelectedOptions([]);
			setProductOptions(options);
			setOptionsModalVisible(true);
		} else {
			// Pas d'options, ajout direct au panier
			onAdd?.(item);
		}
	};

	// Vérifie si un produit a des options (retourne les options ou [])
	const checkProductOptions = async (productId) => {
		try {
			const clientToken = await AsyncStorage.getItem("clientToken");
			if (!clientToken) return [];

			const url = `${process.env.EXPO_PUBLIC_API_URL || "https://orderit-backend-6y1m.onrender.com"}/products/${productId}/options`;
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${clientToken}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const options = await response.json();
				return Array.isArray(options) ? options : [];
			}
			return [];
		} catch (error) {
			console.error("Erreur vérification options:", error);
			return [];
		}
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
		0
	);

	const getActiveOrderId = async () => {
		const activeOrder = await fetchActiveOrder();
		return activeOrder?._id || null;
	};

	const fetchProductOptions = async (productId) => {
		setLoadingOptions(true);
		try {
			const clientToken = await AsyncStorage.getItem("clientToken");
			if (!clientToken) {
				setProductOptions([]);
				return;
			}

			const url = `${process.env.EXPO_PUBLIC_API_URL || "https://orderit-backend-6y1m.onrender.com"}/products/${productId}/options`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${clientToken}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const options = await response.json();
				setProductOptions(Array.isArray(options) ? options : []);
			} else {
				setProductOptions([]);
			}
		} catch (error) {
			console.error("Erreur chargement options:", error);
			setProductOptions([]);
		} finally {
			setLoadingOptions(false);
		}
	};

	const toggleOption = (option) => {
		setSelectedOptions((prev) => {
			const exists = prev.find((opt) => opt._id === option._id);
			if (exists) {
				// Décocher l'option
				return [];
			} else {
				// Cocher l'option (max 1)
				return [option];
			}
		});
	};

	const handleAddToCartWithOptions = () => {
		if (selectedOptions.length > 0) {
			// Créer un nom avec l'option entre parenthèses
			const optionName = selectedOptions[0].name;
			const itemWithOptions = {
				...selectedItem,
				name: `${selectedItem.name} (${optionName})`,
				originalName: selectedItem.name,
				options: selectedOptions,
			};
			onAdd?.(itemWithOptions);
		} else {
			onAdd?.(selectedItem);
		}
		setOptionsModalVisible(false);
		setSelectedOptions([]);
	};

	const handlePayPress = async () => {
		if (onNavigateToPayment) {
			const orderId = await getActiveOrderId();
			if (!orderId) {
				Alert.alert("Erreur", "Aucune commande active trouvée");
				return;
			}
			onNavigateToPayment?.();
			return;
		}

		// Fallback si pas de navigation
		const orderId = await getActiveOrderId();
		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande active trouvée");
			return;
		}

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
					p.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: [];

	// ⭐ Produits filtrés par catégorie sélectionnée
	const categoryProducts = selectedCategory
		? products.filter((p) => p.category?.toLowerCase() === selectedCategory.id)
		: [];

	// 💰 Total du panier
	const cartTotal = cartItems.reduce(
		(sum, item) => sum + item.price * (cart[item._id] || 0),
		0
	);

	// 🎯 ÉCRAN UNIFIÉ : Catégories + Produits
	return (
		<LinearGradient
			colors={PREMIUM_COLORS.dark}
			style={styles.container}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
		>
			{/* Décorations premium */}
			<View style={styles.bgDecor} pointerEvents="none">
				<LinearGradient
					colors={[...PREMIUM_COLORS.primary, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle1]}
				/>
				<LinearGradient
					colors={[...PREMIUM_COLORS.accent, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle2]}
				/>
			</View>

			{/* Header Premium */}
			<View style={styles.premiumHeader}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
					{/* Icône avec pastille allergènes */}
					<View style={styles.headerIconContainer}>
						<TouchableOpacity
							onPress={() => setAllergyModalVisible(true)}
							activeOpacity={0.7}
						>
							<LinearGradient
								colors={PREMIUM_COLORS.accent}
								style={styles.headerIcon}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="restaurant-menu" size={32} color="#fff" />
							</LinearGradient>
						</TouchableOpacity>
						{/* Pastille rouge avec + (déplacée en dehors du LinearGradient) */}
						<View style={styles.allergyBadgeAbsolute}>
							<Text style={styles.allergyBadgeText}>+</Text>
						</View>
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.welcomeTitle}>
							{userName ? `Bonjour ${userName}` : "Bienvenue"} ✨
						</Text>
						<Text style={styles.subtitle}>Découvrez notre carte</Text>
					</View>
				</View>
			</View>

			{/* 🔍 Barre de recherche Premium */}
			<PremiumSearchBar
				value={searchQuery}
				onChangeText={(text) => {
					setSearchQuery(text);
					if (text.trim()) setSelectedCategory(null);
				}}
				onClear={() => setSearchQuery("")}
			/>

			{/* ⭐ Barre de catégories animées style gradient-menu (masquée si recherche active) */}
			{!searchQuery.trim() && (
				<View style={styles.categoriesBar}>
					{categories.map((cat) => {
						const isSelected = selectedCategory?.id === cat.id;
						return (
							<AnimatedCategoryButton
								key={cat.id}
								category={cat}
								isSelected={isSelected}
								otherSelected={selectedCategory && !isSelected}
								onPress={() => setSelectedCategory(isSelected ? null : cat)}
							/>
						);
					})}
				</View>
			)}

			{/* 🔍 Résultats de recherche */}
			{searchQuery.trim() ? (
				<FlatList
					data={searchResults}
					keyExtractor={(item) => item._id.toString()}
					renderItem={({ item, index }) => {
						const productCategory = categories.find(
							(c) => c.id === item.category?.toLowerCase()
						);
						return (
							<PremiumProductCard
								item={item}
								cart={cart}
								onIncrease={handleIncrease}
								onDecrease={handleDecrease}
								onPress={() => handleOpenInfoModal(item)}
								index={index}
								categoryGradient={productCategory?.gradient}
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
							onPress={() => handleOpenInfoModal(item)}
							index={index}
							categoryGradient={selectedCategory?.gradient}
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

			{/* Bouton Payer si commande active (affiché même si le panier est vide) */}
			{hasActiveOrder && (
				<TouchableOpacity
					style={styles.payButtonFloat}
					onPress={handlePayPress}
					activeOpacity={0.9}
				>
					<LinearGradient
						colors={["#667eea", "#764ba2"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.payButtonGradient}
					>
						<Text style={styles.payButtonText}>💳 Payer ma commande</Text>
					</LinearGradient>
				</TouchableOpacity>
			)}

			{/* 🔹 MODAL 1 : Info produit (lecture seule) - Clic sur produit */}
			{selectedItem && (
				<Modal
					transparent
					visible={infoModalVisible}
					animationType="fade"
					onRequestClose={() => setInfoModalVisible(false)}
				>
					<TouchableOpacity
						style={styles.modalOverlayDark}
						activeOpacity={1}
						onPress={() => setInfoModalVisible(false)}
					>
						<TouchableOpacity
							style={styles.modalContent}
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
						>
							<Text style={styles.modalTitle}>{selectedItem.name}</Text>

							{/* Image du produit */}
							{(selectedItem.image || selectedItem.imageUrl) && (
								<Image
									source={{ uri: selectedItem.image || selectedItem.imageUrl }}
									style={styles.modalImage}
									resizeMode="cover"
									onLoad={() =>
										console.log(
											"✅ Image chargée:",
											selectedItem.image || selectedItem.imageUrl
										)
									}
									onError={(e) =>
										console.log("❌ Erreur image:", e.nativeEvent.error)
									}
								/>
							)}

							{/* Options (sur une ligne) */}
							{infoProductOptions.length > 0 && (
								<Text style={styles.infoOptionsOneLine}>
									{infoProductOptions.map((opt) => opt.name).join(" - ")}
								</Text>
							)}

							{/* Allergènes */}
							{selectedItem.allergens && selectedItem.allergens.length > 0 && (
								<View style={styles.infoAllergensContainer}>
									<Text style={styles.modalAllergens}>
										⚠️ Allergènes :{" "}
										{selectedItem.allergens
											.map((a) =>
												typeof a === "object" ? `${a.icon || ""} ${a.name}` : a
											)
											.join(", ")}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>
			)}

			{/* 🔹 MODAL 2 : Sélection d'options (0 ou 1 option) - Clic sur "+" */}
			{selectedItem && (
				<Modal
					transparent
					visible={optionsModalVisible}
					animationType="fade"
					onRequestClose={() => setOptionsModalVisible(false)}
				>
					<View style={styles.modalOverlayDark}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>{selectedItem.name}</Text>

							{/* Section Options avec boutons radio */}
							{loadingOptions ? (
								<View style={styles.optionsLoading}>
									<Text style={styles.optionsLoadingText}>
										Chargement des options...
									</Text>
								</View>
							) : productOptions.length > 0 ? (
								<View style={styles.optionsContainer}>
									<Text style={styles.optionsTitle}>
										Choisissez une option :
									</Text>
									{productOptions.map((option) => {
										const isSelected = selectedOptions.find(
											(opt) => opt._id === option._id
										);
										return (
											<TouchableOpacity
												key={option._id}
												style={[
													styles.optionItem,
													isSelected && styles.optionItemSelected,
												]}
												onPress={() => toggleOption(option)}
											>
												<View style={styles.optionLeft}>
													<Text style={styles.optionRadio}>
														{isSelected ? "🔘" : "⚪"}
													</Text>
													<Text style={styles.optionName}>{option.name}</Text>
												</View>
												{option.price > 0 && (
													<Text style={styles.optionPrice}>
														+{option.price.toFixed(2)}€
													</Text>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							) : null}

							{/* Boutons Annuler / Ajouter */}
							<View style={styles.modalButtons}>
								<Pressable
									style={[styles.modalButton, styles.modalCancelButton]}
									onPress={() => {
										setOptionsModalVisible(false);
										setSelectedOptions([]);
									}}
								>
									<Text style={styles.modalCancelText}>Annuler</Text>
								</Pressable>
								<Pressable
									style={[styles.modalButton, styles.modalAddButton]}
									onPress={handleAddToCartWithOptions}
								>
									<Text style={styles.modalAddText}>Ajouter</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
			)}

			{/* 🚨 Modal Gestion des Allergies */}
			<Modal
				visible={allergyModalVisible}
				animationType="slide"
				onRequestClose={() => setAllergyModalVisible(false)}
			>
				<AllergyManagement onClose={() => setAllergyModalVisible(false)} />
			</Modal>

			{/* 💬 Bulle de messagerie client → serveur */}
			{reservationId && (
				<MessagingBubble
					reservationId={reservationId}
					clientId={clientId || userName}
					clientName={userName}
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
	headerIconContainer: {
		position: "relative", // Essentiel pour positionner la pastille
	},
	allergyBadgeAbsolute: {
		position: "absolute",
		top: -2,
		right: -2,
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#eb3349",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#fff",
		shadowColor: "#eb3349",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 4,
		elevation: 5,
		zIndex: 10,
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
		paddingTop: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	allergyBadge: {
		position: "absolute",
		top: -2,
		right: -2,
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#eb3349",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#fff",
		shadowColor: "#eb3349",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 4,
		elevation: 5,
		overflow: "visible",
	},
	allergyBadgeText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "bold",
		lineHeight: 16,
	},
	headerIcon: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#4facfe",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	welcomeTitle: {
		fontSize: 32,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
		letterSpacing: -0.5,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: PREMIUM_COLORS.textMuted,
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
		color: PREMIUM_COLORS.text,
		fontWeight: "500",
	},
	searchIcon: {
		marginRight: 12,
	},
	clearButton: {
		padding: 4,
	},
	clearButtonInner: {
		backgroundColor: "#667eea",
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
	// ⭐ Barre de catégories animées
	categoriesBar: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		marginBottom: 20,
		paddingHorizontal: 5,
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
	buttonText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		position: "absolute",
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
		backgroundColor: "#2196F3",
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
	modalOverlayDark: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 25,
		alignItems: "center",
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	modalImage: {
		width: "100%",
		height: 200,
		borderRadius: 12,
		marginVertical: 15,
		backgroundColor: "#f0f0f0",
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
		fontStyle: "italic",
		marginBottom: 20,
		textAlign: "center",
	},
	// 🎨 Styles modal info produit
	infoPriceContainer: {
		alignSelf: "center",
		backgroundColor: "#667eea",
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
		marginVertical: 10,
	},
	infoPriceText: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "700",
	},
	infoOptionsOneLine: {
		fontSize: 15,
		color: "#555",
		textAlign: "center",
		marginTop: 15,
		fontStyle: "italic",
	},
	infoOptionsContainer: {
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
	},
	infoOptionsTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#333",
		marginBottom: 10,
	},
	infoOptionItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		paddingHorizontal: 10,
		backgroundColor: "#f9f9f9",
		borderRadius: 8,
		marginBottom: 6,
	},
	infoOptionName: {
		fontSize: 14,
		color: "#555",
	},
	infoOptionPrice: {
		fontSize: 14,
		fontWeight: "600",
		color: "#667eea",
	},
	infoAllergensContainer: {
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
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
	// ⭐ Styles pour les options
	optionsContainer: {
		width: "100%",
		marginTop: 20,
		marginBottom: 15,
	},
	optionsTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#333",
		marginBottom: 12,
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
		borderColor: "transparent",
	},
	optionItemSelected: {
		backgroundColor: "#E8F5E9",
		borderColor: "#4CAF50",
	},
	optionLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	optionCheckbox: {
		fontSize: 20,
		marginRight: 10,
	},
	optionRadio: {
		fontSize: 20,
		marginRight: 10,
	},
	optionName: {
		fontSize: 15,
		fontWeight: "500",
		color: "#333",
		flex: 1,
	},
	optionPrice: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4CAF50",
	},
	optionsLoading: {
		paddingVertical: 20,
	},
	optionsLoadingText: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
	},
	modalButtons: {
		flexDirection: "row",
		marginTop: 10,
		gap: 10,
		width: "100%",
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	modalCancelButton: {
		backgroundColor: "#9E9E9E",
	},
	modalAddButton: {
		backgroundColor: "#4CAF50",
	},
	modalCancelText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	modalAddText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
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
		// overflow: "hidden" retiré pour permettre l'affichage du AllergenBadge
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
		overflow: "hidden",
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
		color: PREMIUM_COLORS.text,
		marginBottom: 6,
		letterSpacing: -0.3,
	},
	premiumProductDesc: {
		fontSize: 14,
		color: PREMIUM_COLORS.textMuted,
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
		color: PREMIUM_COLORS.text,
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
		shadowColor: "#764ba2",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 4,
	},
	premiumPriceText: {
		fontSize: 16,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
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
		color: PREMIUM_COLORS.textMuted,
	},
	premiumCounterValueActive: {
		color: PREMIUM_COLORS.text,
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
		backgroundColor: "#667eea",
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
});
