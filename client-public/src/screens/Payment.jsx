import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	ScrollView,
	Animated,
	Dimensions,
	Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrderStore } from "../stores/useOrderStore.js";
import { useStripe } from "@stripe/stripe-react-native";
import logger from "../utils/secureLogger"; // ✅ Logger sécurisé
import stripeService from "../services/stripeService";
import { API_BASE_URL } from "../config/api";
import { ReceiptModal } from "../components/receipt/ReceiptModal";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { useReservationStatus } from "../hooks/useReservationStatus"; // 🚪 Écoute fermeture réservation
import FeedbackScreen from "../components/FeedbackScreen"; // 🌟 Feedback & Avis Google
import clientFeedbackService from "../services/clientFeedbackService"; // 🌟 API Feedback
import { PREMIUM_COLORS } from "../theme/colors";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";

const { width, height } = Dimensions.get("window");

// 🎴 Premium Payment Item Card
const PremiumPaymentItem = ({ item, index, isSelected, isPaid, onToggle, theme = PREMIUM_COLORS }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				delay: index * 60,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				delay: index * 60,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const handlePress = () => {
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 3,
				useNativeDriver: true,
			}),
		]).start();
		onToggle?.();
	};

	const itemTotal =
		(parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1);
	console.log("🔍 DEBUG PremiumPaymentItem:", {
		name: item?.name,
		price: item?.price,
		quantity: item?.quantity,
		itemTotal,
		type: typeof itemTotal,
		isNaN: isNaN(itemTotal),
	});

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
				transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
			}}
		>
			<TouchableOpacity
				onPress={!isPaid ? handlePress : undefined}
				activeOpacity={isPaid ? 1 : 0.8}
			>
				<LinearGradient
					colors={
						isPaid
							? ["rgba(56, 239, 125, 0.2)", "rgba(17, 153, 142, 0.1)"]
							: isSelected
								? ["rgba(102, 126, 234, 0.3)", "rgba(118, 75, 162, 0.2)"]
								: ["rgba(255,255,255,0.95)", "rgba(248,249,250,0.95)"]
					}
					style={[styles.paymentItem, isPaid && styles.paymentItemPaid]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
				>
					{/* Checkbox */}
					<View style={styles.checkboxWrapper}>
						{isPaid ? (
							<LinearGradient
								colors={theme.success}
								style={styles.checkboxChecked}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="check" size={18} color="#fff" />
							</LinearGradient>
						) : isSelected ? (
							<LinearGradient
								colors={theme.primary}
								style={styles.checkboxChecked}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="check" size={18} color="#fff" />
							</LinearGradient>
						) : (
							<View style={styles.checkboxEmpty}>
								<View style={styles.checkboxInner} />
							</View>
						)}
					</View>

					{/* Item Info */}
					<View style={styles.paymentItemInfo}>
						<Text
							style={[
								styles.paymentItemName,
								isPaid && styles.paymentItemNamePaid,
								!isSelected && !isPaid && styles.paymentItemNameUnselected,
							]}
						>
							{item.name}
						</Text>
						<Text
							style={[
								styles.paymentItemDetails,
								isPaid && styles.paymentItemDetailsPaid,
								!isSelected && !isPaid && styles.paymentItemDetailsUnselected,
							]}
						>
							{item.price}€ × {item.quantity || 1}
						</Text>
					</View>

					{/* Price Badge */}
					<View style={styles.priceBadgeWrapper}>
						{isPaid ? (
							<View style={styles.paidBadge}>
								<MaterialIcons name="check-circle" size={14} color="#38ef7d" />
								<Text style={styles.paidBadgeText}>Payé</Text>
							</View>
						) : (
							<LinearGradient
								colors={
									isSelected ? theme.primary : ["#e9ecef", "#dee2e6"]
								}
								style={styles.priceBadge}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<Text
									style={[
										styles.priceBadgeText,
										!isSelected && styles.priceBadgeTextDark,
									]}
								>
									{itemTotal.toFixed(2)}€
								</Text>
							</LinearGradient>
						)}
					</View>
				</LinearGradient>
			</TouchableOpacity>
		</Animated.View>
	);
};

export default function Payment({
	allOrders = [],
	orderId = null,
	reservationId = null,
	tableId = null,
	tableNumber = null, // 🆕
	userName = null, // 🆕
	clientId = null, // 🆕
	onSuccess = () => {},
	onBack = () => {},
	onReservationClosed = () => {}, // 🚪 Callback si la réservation est fermée
}) {
	const [loading, setLoading] = useState(false);
	const [selectedItems, setSelectedItems] = useState(new Set());
	const [paidItems, setPaidItems] = useState(new Set());
	const [reservationStatus, setReservationStatus] = useState({
		canClose: false,
		reason: "",
		unpaidOrders: [],
		totalDue: 0,
		totalPaid: 0,
	});

	// 🧾 États pour le ticket de caisse
	const [showReceipt, setShowReceipt] = useState(false);
	const [receiptData, setReceiptData] = useState(null);

	// 🌟 États pour le feedback & avis Google
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackData, setFeedbackData] = useState(null);

	// 🚪 Écouter la fermeture de réservation et rediriger automatiquement
	const restaurantId = useRestaurantStore((state) => state.id);
	useReservationStatus(restaurantId, reservationId, onReservationClosed);

	// 🎨 Thème dynamique depuis la BDD, fallback PREMIUM_COLORS
	const { config } = useRestaurantConfig(restaurantId);
	const theme = config?.style ? { ...PREMIUM_COLORS, ...config.style } : PREMIUM_COLORS;

	// 🎨 Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const buttonScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const { markAsPaid, isLoading } = useOrderStore();
	const { initPaymentSheet, presentPaymentSheet, isApplePaySupported } =
		useStripe();

	// States Stripe
	const [applePayAvailable, setApplePayAvailable] = useState(false);
	const [clientSecret, setClientSecret] = useState(null);
	const [paymentIntentId, setPaymentIntentId] = useState(null);

	// 🔧 Fonction pour générer un ID unique pour chaque article
	const getItemId = (item, index) => {
		if (!item) return `unknown-${Date.now()}-${Math.random()}`;

		// ⭐ Utiliser _id MongoDB comme clé unique (toujours unique)
		if (item._id) return item._id;

		// Fallback avec tous les champs + index aléatoire
		const id = item.productId || item.id;
		const name = item.name || "unnamed";
		const price = item.price || 0;
		const quantity = item.quantity || 1;
		const uniqueSuffix = index !== undefined ? index : Math.random();

		return `${id}-${name}-${price}-${quantity}-${uniqueSuffix}`;
	};

	// 🔧 Clé de stockage unique basée sur reservationId ou orderId
	const getStorageKey = () => {
		if (reservationId) return `paidItems_res_${reservationId}`;
		if (orderId) return `paidItems_order_${orderId}`;
		return null;
	};

	// 📂 Charger les articles payés depuis AsyncStorage
	useEffect(() => {
		const loadPaidItems = async () => {
			const storageKey = getStorageKey();
			if (!storageKey) return;

			try {
				const saved = await AsyncStorage.getItem(storageKey);
				if (saved) {
					const parsed = JSON.parse(saved);
					console.log(
						"📂 Chargement paidItems:",
						storageKey,
						parsed.length,
						"articles",
					);
					setPaidItems(new Set(parsed));
				}
			} catch (error) {
				console.error("❌ Erreur chargement paidItems:", error);
			}
		};

		loadPaidItems();
	}, [reservationId, orderId]);

	// 💾 Sauvegarder les articles payés dans AsyncStorage
	useEffect(() => {
		const savePaidItems = async () => {
			const storageKey = getStorageKey();
			if (!storageKey) return;

			try {
				const itemsArray = Array.from(paidItems);
				await AsyncStorage.setItem(storageKey, JSON.stringify(itemsArray));
			} catch (error) {
				logger.error("Erreur sauvegarde paiement", error.message);
			}
		};

		savePaidItems();
	}, [paidItems, reservationId, orderId]);

	// 📱 Vérifier disponibilité Apple Pay
	useEffect(() => {
		const checkApplePay = async () => {
			if (Platform.OS === "ios" && typeof isApplePaySupported === "function") {
				try {
					const isSupported = await isApplePaySupported();
					setApplePayAvailable(isSupported);
					console.log("📱 Apple Pay disponible:", isSupported);
				} catch (error) {
					console.error("Erreur vérification Apple Pay:", error);
					setApplePayAvailable(false);
				}
			} else {
				setApplePayAvailable(false);
			}
		};
		checkApplePay();
	}, [isApplePaySupported]);

	// ✅ Initialiser la sélection avec les articles non payés
	useEffect(() => {
		console.log(
			"\n🔍🔍🔍 ========== PAYMENT.JSX - ANALYSE ALLORDERS ========== 🔍🔍🔍",
		);
		console.log("📦 Props reçues:", {
			reservationId,
			tableId,
			tableNumber,
			userName,
			clientId,
			allOrdersLength: allOrders?.length || 0,
		});
		console.log(
			"📋 TOUS LES ORDERS (allOrders):",
			JSON.stringify(allOrders, null, 2),
		);

		// Grouper par orderId pour voir s'il y a plusieurs commandes
		const ordersByOrderId = {};
		allOrders?.forEach((item) => {
			const oid = item.orderId || "unknown";
			if (!ordersByOrderId[oid]) ordersByOrderId[oid] = [];
			ordersByOrderId[oid].push(item);
		});
		console.log(
			"📊 Groupé par orderId:",
			Object.keys(ordersByOrderId).length,
			"commandes distinctes",
		);
		Object.entries(ordersByOrderId).forEach(([oid, items]) => {
			const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
			console.log(
				`  - Order ${oid}: ${items.length} items, total: ${total.toFixed(2)}€`,
			);
			items.forEach((item) => {
				console.log(
					`    * ${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)}€`,
				);
			});
		});
		console.log(
			"🔍🔍🔍 ====================================================== 🔍🔍🔍\n",
		);

		if (allOrders && allOrders.length > 0) {
			const nonPaidItems = allOrders.filter(
				(item) => !paidItems.has(getItemId(item)),
			);
			const nonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));
			console.log(
				"✅ Items non payés initialisés:",
				nonPaidItems.length,
				"items",
			);
			setSelectedItems(nonPaidIds);
		} else {
			console.warn("⚠️ Aucun item dans allOrders");
		}
	}, [allOrders, paidItems]);

	// 🔍 Vérifier si la réservation peut être fermée
	const checkReservationClosure = async () => {
		if (!allOrders || allOrders.length === 0) {
			setReservationStatus({
				canClose: false,
				reason: "❌ Aucune commande à analyser",
				unpaidOrders: [],
				totalDue: 0,
				totalPaid: 0,
			});
			return;
		}

		const unpaidOrders = allOrders.filter(
			(item) => !paidItems.has(getItemId(item)),
		);

		const totalDue = unpaidOrders.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0,
		);

		const paidOrdersList = allOrders.filter((item) =>
			paidItems.has(getItemId(item)),
		);

		const totalPaid = paidOrdersList.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0,
		);

		const canClose = unpaidOrders.length === 0;
		const reason = canClose
			? "✅ Toutes les commandes sont payées"
			: `❌ ${unpaidOrders.length} article(s) à payer (${totalDue.toFixed(
					2,
				)}€ dû)`;

		setReservationStatus({
			canClose,
			reason,
			unpaidOrders,
			totalDue,
			totalPaid,
		});

		return { canClose, totalDue, totalPaid, unpaidOrders };
	};

	// 🔄 Mettre à jour le statut de la réservation
	useEffect(() => {
		if (allOrders?.length > 0) {
			checkReservationClosure();
		}
	}, [allOrders, paidItems]);

	// 🎯 Sélectionner/désélectionner un article
	const toggleItem = (item) => {
		const itemId = getItemId(item);
		const newSelected = new Set(selectedItems);
		if (newSelected.has(itemId)) {
			newSelected.delete(itemId);
		} else {
			newSelected.add(itemId);
		}
		setSelectedItems(newSelected);
	};

	// 🎯 Tout sélectionner/désélectionner
	const toggleAll = () => {
		const nonPaidItems =
			allOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
		if (nonPaidItems.length === 0) return;

		const allNonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));

		if (selectedItems.size === allNonPaidIds.size) {
			setSelectedItems(new Set());
		} else {
			setSelectedItems(allNonPaidIds);
		}
	};

	// 🎯 Sélectionner 1/3 des articles disponibles
	const selectOneThird = () => {
		const nonPaidItems =
			allOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
		if (nonPaidItems.length === 0) return;

		const oneThirdCount = Math.ceil(nonPaidItems.length / 3);
		const oneThirdItems = nonPaidItems.slice(0, oneThirdCount);
		const newSelectedItems = new Set(
			oneThirdItems.map((item) => getItemId(item)),
		);
		setSelectedItems(newSelectedItems);
	};

	// 🚀 Fermer la réservation sur le serveur
	const closeReservationOnServer = async () => {
		if (!reservationId) {
			return { success: false, message: "Aucun ID de réservation" };
		}

		try {
			console.log("🔍 Tentative fermeture réservation:", reservationId);

			const response = await fetch(
				`${API_BASE_URL}/reservations/client/${reservationId}/close`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}),
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Erreur fermeture réservation:", errorText);
				return {
					success: false,
					message: `Erreur serveur: ${response.status}`,
				};
			}

			const data = await response.json();
			console.log("✅ Réservation fermée:", data);

			// ⭐ LA TABLE SERA LIBÉRÉE AUTOMATIQUEMENT PAR LA ROUTE BACKEND
			// Pas besoin d'appeler releaseTable séparément

			return {
				success: true,
				message: "✅ Réservation fermée avec succès",
				data,
			};
		} catch (error) {
			console.error("🚨 Erreur réseau:", error);
			return { success: false, message: `Erreur réseau: ${error.message}` };
		}
	};

	/**
	 * 🧾 Affiche le ticket de caisse avec les détails du paiement
	 */
	const showReceiptTicket = (paymentDetails, selectedOrders) => {
		console.log("🧾 showReceiptTicket appelé:", {
			paymentDetails,
			selectedOrdersCount: selectedOrders.length,
		});

		// Récupérer le nom du restaurant depuis le store
		const restaurantName = useRestaurantStore.getState().name || "Restaurant";

		// Générer le numéro de ticket : INITIALES-YYYYMMDD-HHMM
		const now = new Date();
		const initiales = restaurantName
			.split(" ")
			.map((w) => w[0])
			.join("")
			.toUpperCase()
			.slice(0, 3);
		const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
		const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
		const ticketNumber = `${initiales}-${dateStr}-${timeStr}`;

		// Calculer le montant total
		const totalAmount = selectedOrders.reduce(
			(sum, item) =>
				sum + (parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
			0,
		);

		console.log("🧾 Montant calculé:", totalAmount);
		console.log("🧾 Numéro de ticket:", ticketNumber);

		// Traduire le mode de paiement
		const paymentMethodLabel =
			{
				card: "Paiement par carte",
				apple_pay: "Apple Pay",
				fake: "Test",
			}[paymentDetails.method] || "Paiement par carte";

		// Créer l'objet pour ReceiptModal
		const receipt = {
			reservation: {
				_id: ticketNumber,
				tableNumber: tableNumber,
				clientName: userName || "Client",
				restaurantId: {
					name: restaurantName,
				},
			},
			items: selectedOrders.map((item) => ({
				name: item.name || item.productName || "Article",
				quantity: parseInt(item.quantity) || 1,
				price: parseFloat(item.price) || 0,
			})),
			amount: totalAmount,
			paymentMethod: paymentMethodLabel,
			last4Digits: paymentDetails.last4 || null,
		};

		console.log("🧾 Receipt data:", receipt);

		setReceiptData(receipt);
		setShowReceipt(true);
	};

	/**
	 * 🏠 Gère la fermeture du ticket et redirection
	 */
	const handleReceiptClose = () => {
		setShowReceipt(false);

		// 🌟 Préparer les données pour le feedback
		const restaurantStore = useRestaurantStore.getState();

		console.log("🌟 [PAYMENT] Préparation feedbackData:");
		console.log("  - restaurantId:", restaurantId);
		console.log("  - restaurantStore.id:", restaurantStore.id);
		console.log("  - clientId:", clientId);
		console.log("  - userName:", userName);
		console.log("  - tableId:", tableId);
		console.log("  - reservationId:", reservationId);

		setTimeout(() => {
			// Préparer les données feedback avec valeurs par défaut sûres
			const feedbackPayload = {
				restaurantData: {
					id: restaurantId || restaurantStore.id || "695e4300adde654b80f6911a", // Fallback vers ID par défaut
					name: restaurantStore.name || "Restaurant",
					googleUrl: restaurantStore.googleUrl || null,
					googlePlaceId: restaurantStore.googlePlaceId || null,
				},
				customerData: {
					clientId: clientId || "anonymous-" + Date.now(),
					clientName: userName || "Client",
					tableId: tableId || "686af692bb4cba684ff3b757", // Table par défaut
					tableNumber: tableNumber || "1",
					reservationId: reservationId || null,
				},
			};

			console.log("🌟 [PAYMENT] FeedbackData final:", feedbackPayload);
			setFeedbackData(feedbackPayload);

			// Afficher le feedback au lieu de fermer directement
			setShowFeedback(true);
		}, 300); // Délai pour que le ticket se ferme proprement
	};

	/**
	 * 🌟 Gère la fermeture du feedback (retour au menu final)
	 */
	const handleFeedbackClose = () => {
		setShowFeedback(false);
		setFeedbackData(null);

		setTimeout(() => {
			setSelectedItems(new Set());
			onSuccess?.();
		}, 300);
	};

	// 💳 Traitement du paiement
	const handlePay = async (paymentMethod = "card") => {
		console.log("⚡ handlePay appelé avec:", paymentMethod);
		console.log("⚡ selectedItems.size:", selectedItems.size);
		console.log("⚡ allOrders.length:", allOrders.length);

		if (selectedItems.size === 0) {
			console.log("❌ STOP: selectedItems.size === 0");
			Alert.alert(
				"Erreur",
				"Veuillez sélectionner au moins un article à payer",
			);
			return;
		}

		console.log("✅ Check selectedItems OK");

		// Vérifier que Stripe est bien initialisé
		if (!initPaymentSheet || !presentPaymentSheet) {
			console.log("❌ STOP: Stripe hooks manquants");
			Alert.alert(
				"Erreur",
				"Stripe n'est pas correctement initialisé. Veuillez redémarrer l'application.",
			);
			console.error("❌ Stripe hooks non disponibles:", {
				initPaymentSheet: !!initPaymentSheet,
				presentPaymentSheet: !!presentPaymentSheet,
			});
			return;
		}

		console.log("✅ Check Stripe OK");

		setLoading(true);
		console.log("🔄 Début du paiement...");

		try {
			// 1. Filtrer les articles sélectionnés
			console.log("\n💰💰💰 ========== CALCUL PAIEMENT ========== 💰💰💰");
			console.log("🔢 selectedItems (IDs):", Array.from(selectedItems));
			const selectedOrders = allOrders.filter((item) =>
				selectedItems.has(getItemId(item)),
			);
			console.log("✅ selectedOrders filtrés:", selectedOrders.length, "items");
			selectedOrders.forEach((item) => {
				console.log(
					`  - ${item.name} (${getItemId(item)}): ${item.price}€ x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}€`,
				);
			});

			// 2. Calculer le montant payé
			const amountPaid = selectedOrders.reduce(
				(sum, item) =>
					sum +
					(parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
				0,
			);
			console.log("💵 MONTANT TOTAL À PAYER:", amountPaid.toFixed(2), "€");
			console.log("💰💰💰 ================================== 💰💰💰\n");
			logger.debug("Calcul montant paiement", {
				totalItems: paidItems.length,
				amount: "[CENSORED]",
			});

			logger.info("Création PaymentIntent");
			const amountCents = Math.round(amountPaid * 100);

			const paymentMethodTypes =
				paymentMethod === "apple_pay" ? ["card", "apple_pay"] : ["card"];

			// 2.5. Récupérer orderId depuis le premier article sélectionné
			const firstOrderId =
				selectedOrders[0]?.orderId || orderId || allOrders[0]?.orderId;
			if (!firstOrderId) {
				Alert.alert("Erreur", "Impossible de trouver l'ID de commande");
				setLoading(false);
				return;
			}

			const paymentIntentResult = await stripeService.createPaymentIntent({
				orderId: firstOrderId,
				amount: amountCents,
				currency: "eur",
				paymentMethodTypes,
				tipAmount: 0,
				paymentMode: "client",
				reservationId: reservationId,
			});

			const newClientSecret = paymentIntentResult.clientSecret;
			const newPaymentIntentId = paymentIntentResult.paymentIntentId;
			setClientSecret(newClientSecret);
			setPaymentIntentId(newPaymentIntentId);
			console.log("✅ PaymentIntent créé:", newPaymentIntentId);

			// 2.6. Initialiser Payment Sheet
			console.log("🔄 Initialisation Payment Sheet...");
			const { error: initError } = await initPaymentSheet({
				paymentIntentClientSecret: newClientSecret,
				merchantDisplayName: "SunnyGo Restaurant",
				applePay: applePayAvailable
					? {
							merchantCountryCode: "FR",
							merchantIdentifier: "merchant.com.sunnygo.app",
							cartItems: [
								{
									label: "Commande",
									amount: (amountCents / 100).toFixed(2),
								},
							],
						}
					: undefined,
				returnURL: "sunnygo://payment",
			});

			if (initError) {
				console.error("❌ Erreur init Payment Sheet:", initError);
				Alert.alert("Erreur", initError.message);
				setLoading(false);
				return;
			}

			console.log("✅ Payment Sheet initialisé");

			// 2.7. Présenter Payment Sheet
			console.log("🔄 Affichage Payment Sheet...");
			const { error: presentError } = await presentPaymentSheet();

			if (presentError) {
				if (presentError.code === "Canceled") {
					console.log("❌ Paiement annulé par l'utilisateur");
					setLoading(false);
					return;
				}
				console.error("❌ Erreur paiement:", presentError);
				Alert.alert("Erreur", presentError.message);
				setLoading(false);
				return;
			}

			console.log("✅ Paiement Stripe réussi!");

			// 3. Ajouter les articles aux paidItems
			const newPaidItems = new Set(paidItems);
			selectedOrders.forEach((item) => {
				newPaidItems.add(getItemId(item));
			});

			// 4. Vérifier si paiement complet
			const remainingItems = allOrders.filter(
				(item) => !newPaidItems.has(getItemId(item)),
			);
			const isFullPayment = remainingItems.length === 0;

			// 5. Si paiement complet → Fermer la réservation
			let reservationClosed = false;
			if (isFullPayment) {
				console.log("✅ Paiement complet - Fermeture de la réservation");

				// Fermer la réservation sur le serveur
				if (reservationId) {
					const closureResult = await closeReservationOnServer().catch(
						(error) => {
							console.error("❌ Erreur fermeture réservation:", error);
							return { success: false, message: error.message };
						},
					);

					if (closureResult && closureResult.success) {
						console.log("✅ Réservation fermée avec succès");
						reservationClosed = true;
					} else {
						console.log(
							"⚠️ Réservation non fermée:",
							closureResult?.message || "Erreur inconnue",
						);
						Alert.alert(
							"⚠️ Attention",
							"Le paiement est effectué mais la fermeture de réservation a échoué. Veuillez contacter le serveur.",
							[{ text: "OK" }],
						);
					}
				}

				// ⚠️ Nettoyer AsyncStorage SEULEMENT si réservation fermée avec succès
				if (reservationClosed) {
					const storageKey = getStorageKey();
					if (storageKey) {
						await AsyncStorage.removeItem(storageKey);
					}

					await AsyncStorage.multiRemove([
						"currentReservationId",
						"currentTableId",
						"currentTableNumber",
						"currentClientName",
					]);
				}
			}

			// 6. Mettre à jour les stats (seulement si réservation PAS terminée)
			let updatedStatus = null;
			if (!isFullPayment || !reservationClosed) {
				updatedStatus = await checkReservationClosure();
			}

			// 7. Calculer le reste à payer
			const remainingAmount = remainingItems.reduce(
				(sum, item) =>
					sum +
					(parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
				0,
			);

			console.log("🔍 DEBUG values:", {
				amountPaid,
				remainingAmount,
				updatedStatus_totalPaid: updatedStatus?.totalPaid,
				types: {
					amountPaid: typeof amountPaid,
					remainingAmount: typeof remainingAmount,
					totalPaid: typeof updatedStatus?.totalPaid,
				},
			});

			// 8. Afficher l'alerte de confirmation
			const message =
				`${selectedOrders.length} article(s) payé(s).\n\n` +
				`💳 Montant payé: ${(amountPaid || 0).toFixed(2)}€\n` +
				(updatedStatus
					? `💰 Total payé: ${(parseFloat(updatedStatus?.totalPaid) || 0).toFixed(2)}€\n`
					: "") +
				(remainingAmount > 0
					? `📋 Reste à payer: ${(remainingAmount || 0).toFixed(2)}€ (${
							remainingItems.length
						} article${remainingItems.length > 1 ? "s" : ""})`
					: "✅ Tous les articles sont payés !");

			// 🧾 Afficher le ticket de caisse au lieu d'un simple Alert
			showReceiptTicket(
				{
					method: paymentMethod,
					paymentIntentId: newPaymentIntentId,
				},
				selectedOrders,
			);
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			Alert.alert("Erreur", "Échec du paiement. Veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	// 🚨 Si pas de commandes à afficher
	if (!allOrders || allOrders.length === 0) {
		return (
			<LinearGradient colors={theme.background || [theme.dark, theme.card]} style={styles.container}>
				<View style={styles.errorContainer}>
					<LinearGradient
						colors={theme.danger}
						style={styles.errorIconBg}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<MaterialIcons name="error-outline" size={48} color="#fff" />
					</LinearGradient>
					<Text style={styles.errorTitle}>Aucune commande</Text>
					<Text style={styles.errorText}>
						Aucune commande n'a été trouvée pour cette réservation.{"\n"}
						Retournez au menu et commandez des articles d'abord.
					</Text>
					<TouchableOpacity onPress={() => onBack?.()} activeOpacity={0.8}>
						<LinearGradient
							colors={theme.primary}
							style={styles.errorBackButton}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
						>
							<MaterialIcons name="arrow-back" size={20} color="#fff" />
							<Text style={styles.errorBackButtonText}>Retour au Menu</Text>
						</LinearGradient>
					</TouchableOpacity>
				</View>
			</LinearGradient>
		);
	}

	// 📊 Calculs pour l'affichage
	const isProcessing = loading || isLoading;
	const availableItems =
		allOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
	const paidItemsList =
		allOrders?.filter((item) => paidItems.has(getItemId(item))) || [];
	const allSelected =
		selectedItems.size === availableItems.length && availableItems.length > 0;
	const selectedOrders = availableItems.filter((item) =>
		selectedItems.has(getItemId(item)),
	);
	const total = (selectedOrders || []).reduce(
		(sum, item) =>
			sum + (parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
		0,
	);

	const handlePressIn = () => {
		Animated.spring(buttonScale, {
			toValue: 0.95,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(buttonScale, {
			toValue: 1,
			friction: 3,
			useNativeDriver: true,
		}).start();
	};

	return (
		<LinearGradient
			colors={theme.background || [theme.dark, theme.card]}
			style={styles.container}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
		>
			{/* Background decorations */}
			<View style={styles.bgDecor}>
				<LinearGradient
					colors={[...theme.primary, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle1]}
				/>
				<LinearGradient
					colors={[...theme.success, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle2]}
				/>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<Animated.View
					style={[
						styles.header,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					<LinearGradient
						colors={theme.success}
						style={styles.headerIcon}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<Ionicons name="card" size={36} color="#fff" />
					</LinearGradient>
					<Text style={styles.title}>Paiement</Text>
					<Text style={styles.subtitle}>Sélectionnez les articles à payer</Text>

					{/* Boutons de sélection rapide */}
					{availableItems.length > 0 && (
						<View style={styles.quickSelectButtons}>
							<TouchableOpacity
								onPress={selectOneThird}
								activeOpacity={0.7}
								style={styles.quickSelectButton}
							>
								<LinearGradient
									colors={theme.secondary}
									style={styles.quickSelectGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<MaterialIcons name="pie-chart" size={18} color="#fff" />
									<Text style={styles.quickSelectText}>1/3</Text>
								</LinearGradient>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={toggleAll}
								activeOpacity={0.7}
								style={styles.quickSelectButton}
							>
								<LinearGradient
									colors={theme.accent}
									style={styles.quickSelectGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<MaterialIcons
										name={
											selectedItems.size === availableItems.length
												? "deselect"
												: "select-all"
										}
										size={18}
										color="#fff"
									/>
									<Text style={styles.quickSelectText}>
										{selectedItems.size === availableItems.length
											? "Tout désélectionner"
											: "100%"}
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						</View>
					)}
				</Animated.View>

				{/* Items Section */}
				<View style={styles.itemsSection}>
					{/* Section Header */}
					<View style={styles.sectionHeader}>
						<View style={styles.sectionTitleRow}>
							<LinearGradient
								colors={theme.primary}
								style={styles.sectionIconBg}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="shopping-cart" size={18} color="#fff" />
							</LinearGradient>
							<Text style={styles.sectionTitle}>
								Articles à payer ({availableItems.length})
							</Text>
						</View>
						{availableItems.length > 0 && (
							<TouchableOpacity onPress={toggleAll} style={styles.selectAllBtn}>
								<LinearGradient
									colors={
										allSelected
											? theme.secondary
											: theme.primary
									}
									style={styles.selectAllGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<MaterialIcons
										name={allSelected ? "remove-done" : "done-all"}
										size={16}
										color="#fff"
									/>
									<Text style={styles.selectAllText}>
										{allSelected ? "Désélectionner" : "Tout sélectionner"}
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						)}
					</View>

					{/* Items List */}
					{availableItems.length === 0 ? (
						<View style={styles.emptyState}>
							<LinearGradient
								colors={theme.success}
								style={styles.emptyStateIcon}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="celebration" size={48} color="#fff" />
							</LinearGradient>
							<Text style={styles.emptyStateTitle}>Tout est payé !</Text>
							<Text style={styles.emptyStateSubtext}>
								Vous pouvez retourner au menu.
							</Text>
							<TouchableOpacity
								onPress={() => {
									const storageKey = getStorageKey();
									if (storageKey) {
										AsyncStorage.removeItem(storageKey);
									}
									onSuccess();
								}}
								activeOpacity={0.8}
							>
								<LinearGradient
									colors={theme.accent}
									style={styles.emptyStateButton}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<MaterialIcons
										name="restaurant-menu"
										size={20}
										color="#fff"
									/>
									<Text style={styles.emptyStateButtonText}>
										Retour au menu
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.itemsList}>
							{availableItems.map((item, index) => {
								const itemId = getItemId(item);
								const isSelected = selectedItems.has(itemId);
								return (
									<PremiumPaymentItem
										key={itemId}
										item={item}
										index={index}
										isSelected={isSelected}
										isPaid={false}
										onToggle={() => toggleItem(item)}
										theme={theme}
									/>
								);
							})}
						</View>
					)}

					{/* Paid Items (if any) */}
					{paidItemsList.length > 0 && (
						<View style={styles.paidSection}>
							<View style={styles.paidSectionHeader}>
								<LinearGradient
									colors={theme.success}
									style={styles.sectionIconBg}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<MaterialIcons name="check-circle" size={18} color="#fff" />
								</LinearGradient>
								<Text style={styles.paidSectionTitle}>
									Déjà payés ({paidItemsList.length})
								</Text>
							</View>
							<View style={styles.itemsList}>
								{paidItemsList.map((item, index) => (
									<PremiumPaymentItem
										key={getItemId(item)}
										item={item}
										index={index}
										isSelected={false}
										isPaid={true}
										theme={theme}
									/>
								))}
							</View>
						</View>
					)}
				</View>

				{/* Total Section */}
				{availableItems.length > 0 && (
					<View style={styles.totalSection}>
						<LinearGradient
							colors={theme.primary}
							style={styles.totalGradient}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
						>
							<View style={styles.totalContent}>
								<View style={styles.totalLeft}>
									<MaterialIcons name="payments" size={24} color="#fff" />
									<View style={styles.totalTextContainer}>
										<Text style={styles.totalLabel}>Total sélectionné</Text>
										<Text style={styles.totalCount}>
											{selectedOrders.length} article
											{selectedOrders.length > 1 ? "s" : ""}
										</Text>
									</View>
								</View>
								<Text style={styles.totalValue}>
									{(total || 0).toFixed(2)}€
								</Text>
							</View>
						</LinearGradient>
					</View>
				)}

				{/* Info Note */}
				{reservationId && (
					<View style={styles.infoNote}>
						<BlurView intensity={15} tint="light" style={styles.infoNoteBlur}>
							<MaterialIcons name="info-outline" size={20} color="#4facfe" />
							<View style={styles.infoNoteText}>
								<Text style={styles.infoNoteTitle}>
									Les articles payés sont sauvegardés
								</Text>
								<Text style={styles.infoNoteSubtext}>
									{paidItems.size > 0
										? `${paidItems.size} article(s) déjà payé(s)`
										: "Vous pouvez quitter et revenir"}
								</Text>
							</View>
						</BlurView>
					</View>
				)}

				{/* Action Buttons */}
				<Animated.View
					style={[
						styles.actionsContainer,
						{ transform: [{ scale: buttonScale }] },
					]}
				>
					{availableItems.length > 0 && (
						<>
							{/* Bouton Payer par carte */}
							<TouchableOpacity
								onPress={() => {
									console.log("🔘 Bouton paiement cliqué!");
									try {
										handlePay("card");
									} catch (error) {
										console.error(
											"❌ Erreur lors de l'appel handlePay:",
											error,
										);
										Alert.alert(
											"Erreur",
											"Une erreur est survenue lors du paiement",
										);
										setLoading(false);
									}
								}}
								disabled={isProcessing || selectedItems.size === 0}
							>
								<LinearGradient
									colors={
										isProcessing || selectedItems.size === 0
											? ["#ccc", "#999"]
											: theme.success
									}
									style={styles.payButton}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									{isProcessing ? (
										<ActivityIndicator color="#fff" />
									) : (
										<>
											<MaterialIcons name="payment" size={24} color="#fff" />
											<Text style={styles.payButtonText}>
												Payer {selectedOrders.length} article
												{selectedOrders.length > 1 ? "s" : ""}
												{reservationStatus.canClose ? " et fermer" : ""}
											</Text>
										</>
									)}
								</LinearGradient>
							</TouchableOpacity>

							{/* Bouton Apple Pay (si disponible) */}
							{applePayAvailable && (
								<TouchableOpacity
									onPress={() => handlePay("apple_pay")}
									onPressIn={handlePressIn}
									onPressOut={handlePressOut}
									disabled={isProcessing || selectedItems.size === 0}
									activeOpacity={0.9}
								>
									<LinearGradient
										colors={
											isProcessing || selectedItems.size === 0
												? ["#ccc", "#999"]
												: ["#000", "#333"]
										}
										style={styles.applePayButton}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 0 }}
									>
										{isProcessing ? (
											<ActivityIndicator color="#fff" />
										) : (
											<>
												<Ionicons name="logo-apple" size={24} color="#fff" />
												<Text style={styles.payButtonText}>Apple Pay</Text>
											</>
										)}
									</LinearGradient>
								</TouchableOpacity>
							)}
						</>
					)}

					<TouchableOpacity
						onPress={() => onBack?.()}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						disabled={isProcessing}
						activeOpacity={0.9}
					>
						<LinearGradient
							colors={theme.accent}
							style={styles.backButton}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
						>
							<MaterialIcons name="arrow-back" size={22} color="#fff" />
							<Text style={styles.backButtonText}>Retour</Text>
						</LinearGradient>
					</TouchableOpacity>
				</Animated.View>
			</ScrollView>

			{/* 🧾 Ticket de caisse modal */}
			{showReceipt && receiptData && (
				<ReceiptModal
					visible={showReceipt}
					onClose={handleReceiptClose}
					reservation={receiptData.reservation}
					items={receiptData.items}
					amount={receiptData.amount}
					paymentMethod={receiptData.paymentMethod}
					last4Digits={receiptData.last4Digits}
				/>
			)}

			{/* 🌟 Feedback & Avis Google modal */}
			{showFeedback && feedbackData && (
				<FeedbackScreen
					visible={showFeedback}
					onClose={handleFeedbackClose}
					restaurantData={feedbackData.restaurantData}
					customerData={feedbackData.customerData}
				/>
			)}
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	bgDecor: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
	},
	bgCircle: {
		position: "absolute",
		borderRadius: 999,
		opacity: 0.2,
	},
	bgCircle1: {
		width: width * 0.7,
		height: width * 0.7,
		top: -width * 0.2,
		right: -width * 0.2,
	},
	bgCircle2: {
		width: width * 0.5,
		height: width * 0.5,
		bottom: 100,
		left: -width * 0.2,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	header: {
		alignItems: "center",
		marginBottom: 24,
		paddingTop: 20,
	},
	headerIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
		shadowColor: "#11998e",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: PREMIUM_COLORS.textMuted,
		marginTop: 4,
	},
	// Error State
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	errorIconBg: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
	},
	errorTitle: {
		fontSize: 28,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
		marginBottom: 12,
	},
	errorText: {
		fontSize: 16,
		color: PREMIUM_COLORS.textMuted,
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 32,
	},
	errorBackButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 16,
		gap: 10,
	},
	errorBackButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	// Info Card
	infoCard: {
		marginBottom: 24,
		borderRadius: 20,
		overflow: "hidden",
	},
	infoCardBlur: {
		padding: 20,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: PREMIUM_COLORS.glassBorder,
	},
	statusBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 20,
		gap: 8,
		marginBottom: 20,
	},
	statusBadgeText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "600",
	},
	statsGrid: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	statCard: {
		flex: 1,
		alignItems: "center",
		padding: 12,
	},
	statIconBg: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},
	statLabel: {
		fontSize: 12,
		color: "rgba(255,255,255,0.6)",
		marginBottom: 4,
	},
	statValue: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#fff",
	},
	statValueDanger: {
		color: "#ff6b6b",
	},
	statValueSuccess: {
		color: "#38ef7d",
	},
	idsContainer: {
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.1)",
	},
	idText: {
		fontSize: 11,
		color: "rgba(255,255,255,0.5)",
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
		marginBottom: 4,
	},
	idLabel: {
		color: "rgba(255,255,255,0.7)",
	},
	// Items Section
	itemsSection: {
		marginBottom: 20,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	sectionTitleRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	sectionIconBg: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: PREMIUM_COLORS.text,
	},
	selectAllBtn: {
		borderRadius: 20,
		overflow: "hidden",
	},
	selectAllGradient: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 20,
		gap: 6,
	},
	selectAllText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	itemsList: {
		gap: 10,
	},
	// Payment Item
	paymentItem: {
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		marginBottom: 10,
	},
	paymentItemPaid: {
		opacity: 0.7,
	},
	checkboxWrapper: {
		marginRight: 14,
	},
	checkboxEmpty: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: "#dee2e6",
		backgroundColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxInner: {
		width: 12,
		height: 12,
		borderRadius: 3,
		backgroundColor: "#f1f3f4",
	},
	checkboxChecked: {
		width: 26,
		height: 26,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	paymentItemInfo: {
		flex: 1,
	},
	paymentItemName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	paymentItemNamePaid: {
		color: "rgba(255,255,255,0.9)",
	},
	paymentItemNameUnselected: {
		color: "#333",
	},
	paymentItemDetails: {
		fontSize: 14,
		color: "rgba(255,255,255,0.7)",
	},
	paymentItemDetailsPaid: {
		color: "rgba(255,255,255,0.6)",
	},
	paymentItemDetailsUnselected: {
		color: "#666",
	},
	priceBadgeWrapper: {},
	priceBadge: {
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 12,
	},
	priceBadgeText: {
		fontSize: 15,
		fontWeight: "bold",
		color: "#fff",
	},
	priceBadgeTextDark: {
		color: "#333",
	},
	paidBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	paidBadgeText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#38ef7d",
	},
	// Paid Section
	paidSection: {
		marginTop: 24,
	},
	paidSectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	paidSectionTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: PREMIUM_COLORS.textMuted,
	},
	// Empty State
	emptyState: {
		alignItems: "center",
		padding: 40,
	},
	emptyStateIcon: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
	},
	emptyStateTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
		marginBottom: 8,
	},
	emptyStateSubtext: {
		fontSize: 16,
		color: PREMIUM_COLORS.textMuted,
		marginBottom: 24,
	},
	emptyStateButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 14,
		gap: 10,
	},
	emptyStateButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	// Total Section
	totalSection: {
		marginBottom: 20,
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#667eea",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 10,
	},
	totalGradient: {
		borderRadius: 20,
	},
	totalContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
	},
	totalLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	totalTextContainer: {},
	totalLabel: {
		fontSize: 14,
		color: "rgba(255,255,255,0.8)",
		fontWeight: "600",
	},
	totalCount: {
		fontSize: 12,
		color: "rgba(255,255,255,0.6)",
	},
	totalValue: {
		fontSize: 28,
		fontWeight: "800",
		color: "#fff",
	},
	// Info Note
	infoNote: {
		marginBottom: 20,
		borderRadius: 14,
		overflow: "hidden",
	},
	infoNoteBlur: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(79, 172, 254, 0.3)",
		gap: 14,
	},
	infoNoteText: {
		flex: 1,
	},
	infoNoteTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 2,
	},
	infoNoteSubtext: {
		fontSize: 12,
		color: "rgba(255,255,255,0.6)",
	},
	// Action Buttons
	actionsContainer: {
		gap: 14,
	},
	// Quick Select Buttons
	quickSelectButtons: {
		flexDirection: "row",
		marginTop: 16,
		gap: 12,
	},
	quickSelectButton: {
		flex: 1,
		borderRadius: 12,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
	},
	quickSelectGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		gap: 8,
	},
	quickSelectText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "700",
	},
	payButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#11998e",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 10,
	},
	applePayButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 10,
	},
	payButtonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "bold",
		letterSpacing: 0.5,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		borderRadius: 16,
		gap: 10,
		shadowColor: "#4facfe",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	backButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
