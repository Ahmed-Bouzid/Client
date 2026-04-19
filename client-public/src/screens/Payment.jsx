/**
 * ═══════════════════════════════════════════════════════════════
 * Payment.jsx — ÉTAPE 4 : PAIEMENT STRIPE, TICKET & AVIS GOOGLE
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client :
 *   1. Affiche les articles commandés avec sélection individuelle
 *   2. L'utilisateur sélectionne les articles à payer (tout, partiel, 1/3)
 *   3. Calcul du montant total sélectionné
 *   4. Création d'un PaymentIntent Stripe (POST /payments/create-intent)
 *   5. Affichage du Payment Sheet natif Stripe (saisie carte bancaire)
 *   6. Confirmation du paiement → mise à jour des articles payés
 *   7. Si paiement complet → fermeture de la réservation sur le serveur
 *   8. Affichage du ticket de caisse (ReceiptModal)
 *   9. Possibilité de télécharger/enregistrer le ticket
 *  10. Pop-up avis Google (FeedbackScreen)
 *  11. Reset session → retour page d'accueil
 *
 * Modes de paiement :
 *   - Carte bancaire (Stripe Payment Sheet)
 *   - Apple Pay (iOS uniquement)
 *   - Web checkout (navigateur)
 *   - Paiement au comptoir (fast-food uniquement)
 *
 * Fonctionnalités secondaires :
 *   - Multi-clients : payer pour soi ou pour toute la table
 *   - Articles payés persistés dans AsyncStorage (paidItems)
 *   - Thème dynamique par restaurant
 *   - Écoute fermeture de réservation (WebSocket)
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Dimensions,
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
import { buildSafeTheme, DEFAULT_THEME } from "../theme/defaultTheme";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";
import WebStripeCheckout from "../components/payment/WebStripeCheckout";
import { orderService } from "shared-api/services/orderService.js";

const { width, height } = Dimensions.get("window");
const GRILLZ_RESTAURANT_ID = "695e4300adde654b80f6911a";

// 🎴 Premium Payment Item Card
const PremiumPaymentItem = ({
	item,
	index,
	isSelected,
	isPaid,
	onToggle,
	theme = DEFAULT_THEME,
}) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				delay: index * 60,
				useNativeDriver: false,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				delay: index * 60,
				useNativeDriver: false,
			}),
		]).start();
	}, []);

	const handlePress = () => {
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: false,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 3,
				useNativeDriver: false,
			}),
		]).start();
		onToggle?.();
	};

	const itemTotal =
		(parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1);

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
								colors={isSelected ? theme.primary : ["#e9ecef", "#dee2e6"]}
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

	// 👥 Multi-clients : filtrage par clientId (Option C)
	// false = affiche uniquement les commandes du client courant
	// true  = affiche toutes les commandes de la table
	const [payForWholeTable, setPayForWholeTable] = useState(false);

	// Commandes filtrées selon le mode actif
	const visibleOrders = payForWholeTable
		? allOrders
		: allOrders.filter((item) => !item.clientId || item.clientId === clientId);

	const otherClientsCount = allOrders.filter(
		(item) => item.clientId && item.clientId !== clientId,
	).length;

	// 🧾 États pour le ticket de caisse
	const [showReceipt, setShowReceipt] = useState(false);
	const [receiptData, setReceiptData] = useState(null);

	// 🌟 États pour le feedback & avis Google
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackData, setFeedbackData] = useState(null);
	const [webCheckoutVisible, setWebCheckoutVisible] = useState(false);
	const [webCheckoutSecret, setWebCheckoutSecret] = useState(null);
	const [webCheckoutContext, setWebCheckoutContext] = useState(null);

	// 🚪 Écouter la fermeture de réservation et rediriger automatiquement
	const restaurantId = useRestaurantStore((state) => state.id);
	const restaurantCategory = useRestaurantStore((state) => state.category);
	useReservationStatus(restaurantId, reservationId, onReservationClosed);

	// 🍔 Fast-food / foodtruck : déterminer si paiement au comptoir est disponible
	const isFastFood = restaurantCategory === "fast-food";
	const isFoodtruck = restaurantCategory === "foodtruck";

	// 🎨 Thème dynamique depuis la BDD, fallback DEFAULT_THEME
	const { config } = useRestaurantConfig(restaurantId);
	const isGrillzTheme =
		(config?.styleKey || "").toLowerCase() === "grillz" ||
		restaurantId === GRILLZ_RESTAURANT_ID;
	const theme = buildSafeTheme(
		config?.style,
		isGrillzTheme ? "grillz" : config?.styleKey,
	);

	// 🎨 Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const buttonScale = useRef(new Animated.Value(1)).current;
	const paymentRequestInFlightRef = useRef(false);

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: false,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: false,
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

	// ✅ Initialiser la sélection avec les articles non payés (du client courant uniquement)
	useEffect(() => {
		if (visibleOrders && visibleOrders.length > 0) {
			const nonPaidItems = visibleOrders.filter(
				(item) => !paidItems.has(getItemId(item)),
			);
			const nonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));
			setSelectedItems(nonPaidIds);
		} else {
			// Pas d'items pour ce client — ne pas logguer d'avertissement si c'est normal
			if (allOrders.length > 0 && !payForWholeTable) {
				// D'autres commandes existent mais ne sont pas pour ce client
			}
		}
	}, [visibleOrders, paidItems, payForWholeTable]);

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
			visibleOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
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
			visibleOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
		if (nonPaidItems.length === 0) return;

		const oneThirdCount = Math.ceil(nonPaidItems.length / 3);
		const oneThirdItems = nonPaidItems.slice(0, oneThirdCount);
		const newSelectedItems = new Set(
			oneThirdItems.map((item) => getItemId(item)),
		);
		setSelectedItems(newSelectedItems);
	};

	// ── PARCOURS : ferme la réservation sur le serveur (PUT /reservations/client/:id/close) ──
	const closeReservationOnServer = async () => {
		if (!reservationId) {
			return { success: false, message: "Aucun ID de réservation" };
		}

		try {
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

		setReceiptData(receipt);
		setShowReceipt(true);
	};

	/**
	 * ── PARCOURS : à la fermeture du ticket, déclenche le feedback + avis Google ──
	 */
	const handleReceiptClose = () => {
		setShowReceipt(false);

		// 🌟 Préparer les données pour le feedback
		const restaurantStore = useRestaurantStore.getState();

		setTimeout(() => {
			// Préparer les données feedback avec valeurs par défaut sûres
			const feedbackPayload = {
				restaurantData: {
					id: restaurantId || restaurantStore.id, // Fallback vers ID par défaut
					name: restaurantStore.name || "Restaurant",
					googleUrl: restaurantStore.googleUrl || null,
					googlePlaceId: restaurantStore.googlePlaceId || null,
				},
				customerData: {
					clientId: clientId || "anonymous-" + Date.now(),
					clientName: userName || "Client",
					tableId: tableId || null,
					tableNumber: tableNumber || "1",
					reservationId: reservationId || null,
				},
			};

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

	// ── PARCOURS : après paiement validé, met à jour paidItems, ferme réservation si complet ──
	const finalizePaymentSuccess = async (
		selectedOrders,
		amountPaid,
		paymentMethod,
		paymentIntentIdValue,
	) => {
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
			if (reservationId) {
				const closureResult = await closeReservationOnServer().catch((error) => {
					console.error("❌ Erreur fermeture réservation:", error);
					return { success: false, message: error.message };
				});

				if (closureResult && closureResult.success) {
					reservationClosed = true;
				} else {
					Alert.alert(
						"⚠️ Attention",
						"Le paiement est effectué mais la fermeture de réservation a échoué. Veuillez contacter le serveur.",
						[{ text: "OK" }],
					);
				}
			}

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
				sum + (parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
			0,
		);

		// 8. Afficher le ticket de caisse
		showReceiptTicket(
			{
				method: paymentMethod,
				paymentIntentId: paymentIntentIdValue,
				last4: null,
			},
			selectedOrders,
		);

		return {
			updatedStatus,
			remainingAmount,
		};
	};

	const handleWebCheckoutSuccess = async (paymentIntentIdValue) => {
		if (!webCheckoutContext) return;

		try {
			await finalizePaymentSuccess(
				webCheckoutContext.selectedOrders,
				webCheckoutContext.amountPaid,
				"card",
				paymentIntentIdValue || webCheckoutContext.paymentIntentId,
			);
			setWebCheckoutVisible(false);
			setWebCheckoutSecret(null);
			setWebCheckoutContext(null);
		} catch (error) {
			console.error("❌ Erreur finalisation paiement web:", error);
			Alert.alert("Erreur", "Paiement validé mais finalisation incomplète.");
		} finally {
			setLoading(false);
		}
	};

	// ── PARCOURS : crée PaymentIntent Stripe, affiche Payment Sheet, finalise le paiement ──
	const handlePay = async (paymentMethod = "card") => {
		if (paymentRequestInFlightRef.current) {
			return;
		}

		if (selectedItems.size === 0) {
			Alert.alert(
				"Erreur",
				"Veuillez sélectionner au moins un article à payer",
			);
			return;
		}

		// Vérifier que Stripe est bien initialisé (native uniquement)
		if (
			Platform.OS !== "web" &&
			(!initPaymentSheet || !presentPaymentSheet)
		) {
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

		paymentRequestInFlightRef.current = true;
		setLoading(true);

		try {
			// 1. Filtrer les articles sélectionnés
			const selectedOrders = allOrders.filter((item) =>
				selectedItems.has(getItemId(item)),
			);

			// 2. Calculer le montant payé
			const amountPaid = selectedOrders.reduce(
				(sum, item) =>
					sum +
					(parseFloat(item?.price) || 0) * (parseInt(item?.quantity) || 1),
				0,
			);
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

			if (Platform.OS === "web") {
				setWebCheckoutSecret(newClientSecret);
				setWebCheckoutContext({
					selectedOrders,
					amountPaid,
					paymentIntentId: newPaymentIntentId,
				});
				setWebCheckoutVisible(true);
				setLoading(false);
				return;
			}

			// 2.6. Initialiser Payment Sheet
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

			// 2.7. Présenter Payment Sheet
			const { error: presentError } = await presentPaymentSheet();

			if (presentError) {
				if (presentError.code === "Canceled") {
					setLoading(false);
					return;
				}
				console.error("❌ Erreur paiement:", presentError);
				Alert.alert("Erreur", presentError.message);
				setLoading(false);
				return;
			}

			await finalizePaymentSuccess(
				selectedOrders,
				amountPaid,
				paymentMethod,
				newPaymentIntentId,
			);
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			Alert.alert("Erreur", "Échec du paiement. Veuillez réessayer.");
		} finally {
			paymentRequestInFlightRef.current = false;
			setLoading(false);
		}
	};

	// ── PARCOURS : paiement au comptoir (fast-food uniquement, pas de Stripe) ──
	const handleCounterPayment = async () => {
		if (paymentRequestInFlightRef.current) {
			return;
		}

		if (selectedItems.size === 0) {
			Alert.alert(
				"Erreur",
				"Veuillez sélectionner au moins un article à payer",
			);
			return;
		}

		Alert.alert(
			"Paiement au comptoir",
			"Vous allez déclarer un paiement au comptoir. Présentez-vous au comptoir pour régler (espèces, carte, ticket restaurant…).",
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Confirmer",
					onPress: async () => {
						paymentRequestInFlightRef.current = true;
						setLoading(true);
						try {
							// Récupérer les orderIds uniques des articles sélectionnés
							const selectedOrders = allOrders.filter((item) =>
								selectedItems.has(getItemId(item)),
							);
							const uniqueOrderIds = [
								...new Set(
									selectedOrders
										.map((item) => item.orderId)
										.filter(Boolean),
								),
							];

							// Déclarer le paiement au comptoir pour chaque commande
							await Promise.all(
								uniqueOrderIds.map((oid) =>
									orderService.declareCounterPayment(oid),
								),
							);

							Alert.alert(
								"✅ Paiement au comptoir déclaré",
								"Présentez-vous au comptoir pour régler votre commande. Le restaurateur sera informé.",
								[
									{
										text: "OK",
										onPress: () => onSuccess?.(),
									},
								],
								{ cancelable: false },
							);
						} catch (error) {
							console.error("❌ Erreur paiement comptoir:", error);
							Alert.alert(
								"Erreur",
								error.message || "Impossible de déclarer le paiement au comptoir",
							);
						} finally {
							paymentRequestInFlightRef.current = false;
							setLoading(false);
						}
					},
				},
			],
		);
	};

	// 🚨 Si pas de commandes à afficher
	if (!allOrders || allOrders.length === 0) {
		return (
			<LinearGradient
				colors={
					isGrillzTheme
						? ["#0D0D0D", "#171717", "#0F0F0F"]
						: theme.background || [theme.dark, theme.card]
				}
				style={styles.container}
			>
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
		visibleOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
	const paidItemsList =
		visibleOrders?.filter((item) => paidItems.has(getItemId(item))) || [];
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
			useNativeDriver: false,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(buttonScale, {
			toValue: 1,
			friction: 3,
			useNativeDriver: false,
		}).start();
	};

	return (
		<LinearGradient
			colors={
				isGrillzTheme
					? ["#0D0D0D", "#171717", "#0F0F0F"]
					: theme.background || [theme.dark, theme.card]
			}
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
					colors={[
						...(isGrillzTheme ? theme.accent : theme.success),
						"transparent",
					]}
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
						colors={isGrillzTheme ? theme.primary : theme.success}
						style={styles.headerIcon}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<Ionicons name="card" size={36} color="#fff" />
					</LinearGradient>
					<Text style={styles.title}>Paiement</Text>
					<Text style={styles.subtitle}>Sélectionnez les articles à payer</Text>

					{/* 🍔 Bannière statut foodtruck / fast-food */}
					{(isFoodtruck || isFastFood) && (
						<View style={styles.statusBanner}>
							<MaterialIcons
								name={isFoodtruck ? "delivery-dining" : "restaurant"}
								size={20}
								color={isFoodtruck ? "#FF6B00" : "#4CAF50"}
							/>
							<Text style={styles.statusBannerText}>
								{isFoodtruck
									? "Commande reçue — Payez pour lancer la préparation"
									: "Préparation en cours — Choisissez votre mode de paiement"}
							</Text>
						</View>
					)}

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
					{/* 👥 Toggle : Mes articles / Toute la table */}
					{otherClientsCount > 0 && (
						<View style={styles.clientToggleRow}>
							<TouchableOpacity
								style={[
									styles.clientToggleBtn,
									!payForWholeTable && styles.clientToggleBtnActive,
									isGrillzTheme && !payForWholeTable && styles.clientToggleBtnActiveGrillz,
								]}
								onPress={() => setPayForWholeTable(false)}
								activeOpacity={0.8}
							>
								<MaterialIcons name="person" size={15} color={!payForWholeTable ? "#fff" : isGrillzTheme ? "#A1A1AA" : "#666"} />
								<Text style={[styles.clientToggleText, !payForWholeTable && styles.clientToggleTextActive]}>
									Mes articles
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.clientToggleBtn,
									payForWholeTable && styles.clientToggleBtnActive,
									isGrillzTheme && payForWholeTable && styles.clientToggleBtnActiveGrillz,
								]}
								onPress={() =>
									Alert.alert(
										"Payer pour toute la table",
										"Vous allez régler les commandes de tous les clients de cette table. Confirmez-vous ?",
										[
											{ text: "Annuler", style: "cancel" },
											{ text: "Confirmer", onPress: () => setPayForWholeTable(true) },
										],
									)
								}
								activeOpacity={0.8}
							>
								<MaterialIcons name="group" size={15} color={payForWholeTable ? "#fff" : isGrillzTheme ? "#A1A1AA" : "#666"} />
								<Text style={[styles.clientToggleText, payForWholeTable && styles.clientToggleTextActive]}>
									Toute la table
								</Text>
							</TouchableOpacity>
						</View>
					)}

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
									colors={allSelected ? theme.secondary : theme.primary}
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
											? ["#ccc", "#ccc"]
											: isGrillzTheme
												? [theme.primary, theme.primary]
												: [theme.success, theme.success]
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

							{/* 🏪 Bouton Payer au comptoir (fast-food uniquement) */}
							{isFastFood && (
								<TouchableOpacity
									onPress={handleCounterPayment}
									disabled={isProcessing || selectedItems.size === 0}
									activeOpacity={0.9}
								>
									<LinearGradient
										colors={
											isProcessing || selectedItems.size === 0
												? ["#ccc", "#999"]
												: ["#FF8C00", "#FF6B00"]
										}
										style={styles.payButton}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 0 }}
									>
										{isProcessing ? (
											<ActivityIndicator color="#fff" />
										) : (
											<>
												<MaterialIcons name="store" size={24} color="#fff" />
												<Text style={styles.payButtonText}>
													Payer au comptoir
												</Text>
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

			{Platform.OS === "web" && webCheckoutVisible && !!webCheckoutSecret && (
				<Modal
					visible={webCheckoutVisible}
					transparent
					animationType="fade"
					onRequestClose={() => {
						setWebCheckoutVisible(false);
						setWebCheckoutSecret(null);
						setWebCheckoutContext(null);
						setLoading(false);
					}}
				>
					<View style={styles.webModalBackdrop}>
						<View style={[styles.webModalCard, isGrillzTheme && styles.webModalCardGrillz]}>
							<Text style={[styles.webModalTitle, isGrillzTheme && styles.webModalTitleGrillz]}>Paiement sécurisé Stripe</Text>
							<Text style={[styles.webModalSubtitle, isGrillzTheme && styles.webModalSubtitleGrillz]}>
								Entrez vos informations de carte pour finaliser le paiement.
							</Text>
							<WebStripeCheckout
								clientSecret={webCheckoutSecret}
								onSuccess={handleWebCheckoutSuccess}
								onCancel={() => {
									setWebCheckoutVisible(false);
									setWebCheckoutSecret(null);
									setWebCheckoutContext(null);
									setLoading(false);
								}}
								onError={(message) => {
									Alert.alert("Paiement", message || "Erreur Stripe web.");
									setLoading(false);
								}}
							/>
						</View>
					</View>
				</Modal>
			)}
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	webModalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 16,
	},
	webModalCard: {
		width: "100%",
		maxWidth: 460,
		backgroundColor: "#F8FAFC",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	webModalTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#0F172A",
		marginBottom: 6,
	},
	webModalSubtitle: {
		fontSize: 13,
		color: "#475569",
		marginBottom: 12,
	},
	webModalCardGrillz: {
		backgroundColor: "#141414",
		borderColor: "#3F3F46",
	},
	webModalTitleGrillz: {
		color: "#F8FAFC",
	},
	webModalSubtitleGrillz: {
		color: "#D4D4D8",
	},

	// 👥 CLIENT TOGGLE (Mes articles / Toute la table)
	clientToggleRow: {
		flexDirection: "row",
		marginBottom: 12,
		borderRadius: 10,
		backgroundColor: "rgba(0,0,0,0.06)",
		padding: 3,
		gap: 3,
	},
	clientToggleBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
		borderRadius: 8,
		gap: 5,
	},
	clientToggleBtnActive: {
		backgroundColor: "#667eea",
	},
	clientToggleBtnActiveGrillz: {
		backgroundColor: "#EA580C",
	},
	clientToggleText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#666",
	},
	clientToggleTextActive: {
		color: "#fff",
	},

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
		color: DEFAULT_THEME.text,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: DEFAULT_THEME.textMuted,
		marginTop: 4,
	},
	statusBanner: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 14,
		marginTop: 12,
		gap: 10,
	},
	statusBannerText: {
		fontSize: 13,
		color: DEFAULT_THEME.textSecondary,
		flex: 1,
		lineHeight: 18,
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
		color: DEFAULT_THEME.text,
		marginBottom: 12,
	},
	errorText: {
		fontSize: 16,
		color: DEFAULT_THEME.textMuted,
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
		borderColor: DEFAULT_THEME.glassBorder,
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
		color: DEFAULT_THEME.text,
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
		color: DEFAULT_THEME.textMuted,
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
		color: DEFAULT_THEME.text,
		marginBottom: 8,
	},
	emptyStateSubtext: {
		fontSize: 16,
		color: DEFAULT_THEME.textMuted,
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
		shadowColor: DEFAULT_THEME.shadowColor,
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
