import { API_BASE_URL } from "../config/api";
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
import { orderService } from "../../../shared-api/services/orderService.js";
import * as RootNavigation from "../utils/RootNavigation";
import { ReceiptModal } from "../components/receipt/ReceiptModal";

const { width, height } = Dimensions.get("window");

// 🎨 Premium Design System
const PREMIUM_COLORS = {
	primary: ["#667eea", "#764ba2"],
	secondary: ["#f093fb", "#f5576c"],
	accent: ["#4facfe", "#00f2fe"],
	success: ["#11998e", "#38ef7d"],
	warning: ["#f2994a", "#f2c94c"],
	danger: ["#ff416c", "#ff4b2b"],
	dark: ["#0f0c29", "#302b63", "#24243e"],
	glass: "rgba(255, 255, 255, 0.15)",
	glassBorder: "rgba(255, 255, 255, 0.25)",
	text: "#ffffff",
	textMuted: "rgba(255, 255, 255, 0.7)",
};

// 🎴 Premium Payment Item Card
const PremiumPaymentItem = ({ item, index, isSelected, isPaid, onToggle }) => {
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

	const itemTotal = (item?.price || 0) * (item?.quantity || 1);

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
								colors={PREMIUM_COLORS.success}
								style={styles.checkboxChecked}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="check" size={18} color="#fff" />
							</LinearGradient>
						) : isSelected ? (
							<LinearGradient
								colors={PREMIUM_COLORS.primary}
								style={styles.checkboxChecked}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<Text style={{ color: "#fff" }}>
									<MaterialIcons name="check" size={18} color="#fff" />{" "}
									{item.name}
									{item.clientName ? (
										<Text style={{ color: "#4facfe", fontWeight: "bold" }}>
											{" "}
											[{item.clientName}]
										</Text>
									) : null}
								</Text>
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
									isSelected ? PREMIUM_COLORS.primary : ["#e9ecef", "#dee2e6"]
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
	orderId = null,
	reservationId = null,
	tableId = null,
	onSuccess,
	onBack = () => {},
}) {
	// Redirection par défaut : retour au menu si onSuccess non fourni
	const handleSuccess =
		typeof onSuccess === "function"
			? onSuccess
			: () => {
					RootNavigation.navigate("Menu");
				};
	// Utilise le store Zustand pour l'historique persistant
	const { init } = useOrderStore();
	const [allOrders, setAllOrders] = useState([]); // Liste brute des commandes (Order)
	const [flatItems, setFlatItems] = useState([]); // Liste aplatie des items (chaque item = 1 produit d'une commande)
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

	// 🎫 État pour le reçu
	const [showReceipt, setShowReceipt] = useState(false);
	const [receiptData, setReceiptData] = useState(null);
	const [currentReservation, setCurrentReservation] = useState(null);
	const [shouldRedirectAfterReceipt, setShouldRedirectAfterReceipt] =
		useState(false);

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
		// Charger toutes les commandes de la réservation au montage
		const fetchOrders = async () => {
			if (reservationId) {
				const orders = await orderService.getOrdersByReservation(reservationId);
				setAllOrders(orders || []);
				// Aplatir les items : chaque item hérite de clientName et orderId
				const items = [];
				(orders || []).forEach((order) => {
					(order.items || []).forEach((item) => {
						items.push({
							...item,
							orderId: order._id,
							clientName: order.clientName || "",
						});
					});
				});
				setFlatItems(items);

				// Charger les infos de réservation pour le reçu
				try {
					const res = await fetch(
						`${API_BASE_URL}/reservations/${reservationId}`,
						{
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
					if (res.ok) {
						const data = await res.json();
						setCurrentReservation(data);
					}
				} catch (err) {
					console.error("Erreur chargement réservation:", err);
				}
			}
		};
		fetchOrders();
	}, [reservationId]);

	const { markAsPaid, isLoading } = useOrderStore();

	// 🔧 Fonction pour générer un ID unique pour chaque article
	const getItemId = (item) => {
		if (!item) return `unknown-${Date.now()}`;

		const id = item.productId || item._id || item.id;
		const name = item.name || "unnamed";
		const price = item.price || 0;
		const quantity = item.quantity || 1;

		return `${id}-${name}-${price}-${quantity}`;
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
				console.error("❌ Erreur sauvegarde paidItems:", error);
			}
		};

		savePaidItems();
	}, [paidItems, reservationId, orderId]);

	// ✅ Initialiser la sélection avec les articles non payés
	useEffect(() => {
		if (flatItems && flatItems.length > 0) {
			const nonPaidItems = flatItems.filter(
				(item) => !paidItems.has(getItemId(item))
			);
			const nonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));
			setSelectedItems(nonPaidIds);
		}
	}, [flatItems, paidItems]);

	// 🔍 Vérifier si la réservation peut être fermée
	const checkReservationClosure = async () => {
		if (!flatItems || flatItems.length === 0) {
			setReservationStatus({
				canClose: false,
				reason: "❌ Aucune commande à analyser",
				unpaidOrders: [],
				totalDue: 0,
				totalPaid: 0,
			});
			return;
		}

		const unpaidItems = flatItems.filter(
			(item) => !paidItems.has(getItemId(item))
		);

		const totalDue = unpaidItems.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0
		);

		const paidItemsList = flatItems.filter((item) =>
			paidItems.has(getItemId(item))
		);

		const totalPaid = paidItemsList.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0
		);

		const canClose = unpaidItems.length === 0;
		const reason = canClose
			? "✅ Toutes les commandes sont payées"
			: `❌ ${unpaidItems.length} article(s) à payer (${totalDue.toFixed(
					2
				)}€ dû)`;

		setReservationStatus({
			canClose,
			reason,
			unpaidOrders: unpaidItems,
			totalDue,
			totalPaid,
		});

		return { canClose, totalDue, totalPaid, unpaidOrders: unpaidItems };
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

	// 🚀 Fermer la réservation sur le serveur
	const closeReservationOnServer = async () => {
		if (!reservationId) {
			return { success: false, message: "Aucun ID de réservation" };
		}

		try {
			// ⭐ ENLEVEZ LE TOKEN - la nouvelle route n'en a pas besoin

			// ⭐ CORRECTION : Body vide ou objet vide
			const response = await fetch(
				`${API_BASE_URL}/reservations/client/${reservationId}/close`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}), // ⭐ Body VIDE
				}
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

	// 🎫 Gestion de la fermeture du reçu
	const handleCloseReceipt = async () => {
		setShowReceipt(false);

		// Si paiement complet, rediriger après fermeture du reçu
		if (shouldRedirectAfterReceipt) {
			await markAsPaid(orderId);
			setShouldRedirectAfterReceipt(false);
			handleSuccess();
		}
	};

	// 💳 Traitement du paiement
	const handlePay = async () => {
		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande à payer");
			return;
		}

		if (selectedItems.size === 0) {
			Alert.alert(
				"Erreur",
				"Veuillez sélectionner au moins un article à payer"
			);
			return;
		}

		setLoading(true);

		try {
			// 1. Filtrer les articles sélectionnés
			const selectedOrders = flatItems.filter((item) =>
				selectedItems.has(getItemId(item))
			);

			// 2. Calculer le montant payé
			const amountPaid = selectedOrders.reduce(
				(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
				0
			);

			// 3. Ajouter les articles aux paidItems
			const newPaidItems = new Set(paidItems);
			selectedOrders.forEach((item) => {
				newPaidItems.add(getItemId(item));
			});
			setPaidItems(newPaidItems);

			// 4. Vérifier si paiement complet
			const remainingItems = flatItems.filter(
				(item) => !newPaidItems.has(getItemId(item))
			);
			const isFullPayment = remainingItems.length === 0;

			// 5. Si paiement complet
			if (isFullPayment) {
				// Fermer la réservation sur le serveur
				if (reservationId) {
					const closureResult = await closeReservationOnServer();
					if (!closureResult.success) {
					}
				}

				// Nettoyer le stockage
				const storageKey = getStorageKey();
				if (storageKey) {
					await AsyncStorage.removeItem(storageKey);
				}
			}

			// 6. Mettre à jour les stats
			const updatedStatus = await checkReservationClosure();

			// 7. Calculer le reste à payer
			const remainingAmount = remainingItems.reduce(
				(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
				0
			);

			// 8. Afficher le reçu pour paiement complet
			if (isFullPayment) {
				// Préparer les données du reçu
				setReceiptData({
					items: selectedOrders.map((item) => ({
						name: item.name,
						quantity: item.quantity || 1,
						price: item.price || 0,
					})),
					amount: amountPaid,
					paymentMethod: "Card",
					last4Digits: null,
				});
				setShowReceipt(true);
				setShouldRedirectAfterReceipt(true); // Marquer pour redirection après fermeture
			} else {
				// 8. Afficher l'alerte de confirmation pour paiement partiel
				const message =
					`${selectedOrders.length} article(s) payé(s).\n\n` +
					`💳 Montant payé: ${amountPaid.toFixed(2)}€\n` +
					`💰 Total payé: ${updatedStatus?.totalPaid?.toFixed(2) || 0}€\n` +
					`📋 Reste à payer: ${remainingAmount.toFixed(2)}€ (${
						remainingItems.length
					} article${remainingItems.length > 1 ? "s" : ""})`;

				Alert.alert("⚠️ Paiement partiel", message, [
					{
						text: "OK",
						onPress: () => {
							setSelectedItems(new Set());
						},
					},
				]);
			}
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			Alert.alert("Erreur", "Échec du paiement. Veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	// 🚨 Si pas d'orderId
	if (!orderId) {
		return (
			<LinearGradient colors={PREMIUM_COLORS.dark} style={styles.container}>
				<View style={styles.errorContainer}>
					<LinearGradient
						colors={PREMIUM_COLORS.danger}
						style={styles.errorIconBg}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<MaterialIcons name="error-outline" size={48} color="#fff" />
					</LinearGradient>
					<Text style={styles.errorTitle}>Erreur</Text>
					<Text style={styles.errorText}>
						Aucune commande à payer{"\n"}
						Retournez au menu et validez une commande d'abord.
					</Text>
					<TouchableOpacity onPress={() => onBack?.()} activeOpacity={0.8}>
						<LinearGradient
							colors={PREMIUM_COLORS.primary}
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
		flatItems?.filter((item) => !paidItems.has(getItemId(item))) || [];
	const paidItemsList =
		flatItems?.filter((item) => paidItems.has(getItemId(item))) || [];
	const allSelected =
		selectedItems.size === availableItems.length && availableItems.length > 0;
	const selectedOrders = availableItems.filter((item) =>
		selectedItems.has(getItemId(item))
	);
	const total = selectedOrders.reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
		0
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
			colors={PREMIUM_COLORS.dark}
			style={styles.container}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
		>
			{/* Background decorations */}
			<View style={styles.bgDecor}>
				<LinearGradient
					colors={[...PREMIUM_COLORS.primary, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle1]}
				/>
				<LinearGradient
					colors={[...PREMIUM_COLORS.success, "transparent"]}
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
						colors={PREMIUM_COLORS.success}
						style={styles.headerIcon}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<Ionicons name="card" size={36} color="#fff" />
					</LinearGradient>
					<Text style={styles.title}>Paiement</Text>
					<Text style={styles.subtitle}>Sélectionnez les articles à payer</Text>
				</Animated.View>

				{/* Reservation Info Card */}
				{reservationId && (
					<View style={styles.infoCard}>
						<BlurView intensity={20} tint="light" style={styles.infoCardBlur}>
							{/* Status Badge */}
							<LinearGradient
								colors={
									reservationStatus.canClose
										? PREMIUM_COLORS.success
										: PREMIUM_COLORS.warning
								}
								style={styles.statusBadge}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<MaterialIcons
									name={
										reservationStatus.canClose ? "check-circle" : "schedule"
									}
									size={16}
									color="#fff"
								/>
								<Text style={styles.statusBadgeText}>
									{reservationStatus.reason || "Vérification..."}
								</Text>
							</LinearGradient>

							{/* Stats Grid */}
							<View style={styles.statsGrid}>
								<View style={styles.statCard}>
									<LinearGradient
										colors={PREMIUM_COLORS.danger}
										style={styles.statIconBg}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons name="receipt-long" size={18} color="#fff" />
									</LinearGradient>
									<Text style={styles.statLabel}>À payer</Text>
									<Text style={[styles.statValue, styles.statValueDanger]}>
										{reservationStatus.totalDue.toFixed(2)}€
									</Text>
								</View>
								<View style={styles.statCard}>
									<LinearGradient
										colors={PREMIUM_COLORS.success}
										style={styles.statIconBg}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons name="check-circle" size={18} color="#fff" />
									</LinearGradient>
									<Text style={styles.statLabel}>Payé</Text>
									<Text style={[styles.statValue, styles.statValueSuccess]}>
										{reservationStatus.totalPaid.toFixed(2)}€
									</Text>
								</View>
								<View style={styles.statCard}>
									<LinearGradient
										colors={PREMIUM_COLORS.accent}
										style={styles.statIconBg}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons
											name="shopping-basket"
											size={18}
											color="#fff"
										/>
									</LinearGradient>
									<Text style={styles.statLabel}>Articles</Text>
									<Text style={styles.statValue}>
										{paidItemsList.length} / {allOrders?.length || 0}
									</Text>
								</View>
							</View>

							{/* IDs */}
							<View style={styles.idsContainer}>
								<Text style={styles.idText}>
									<Text style={styles.idLabel}>Commande: </Text>
									{orderId.substring(0, 12)}...
								</Text>
								<Text style={styles.idText}>
									<Text style={styles.idLabel}>Réservation: </Text>
									{reservationId.substring(0, 12)}...
								</Text>
							</View>
						</BlurView>
					</View>
				)}

				{/* Items Section */}
				<View style={styles.itemsSection}>
					{/* Section Header */}
					<View style={styles.sectionHeader}>
						<View style={styles.sectionTitleRow}>
							<LinearGradient
								colors={PREMIUM_COLORS.primary}
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
											? PREMIUM_COLORS.secondary
											: PREMIUM_COLORS.primary
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
								colors={PREMIUM_COLORS.success}
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
									handleSuccess();
								}}
								activeOpacity={0.8}
							>
								<LinearGradient
									colors={PREMIUM_COLORS.accent}
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
									colors={PREMIUM_COLORS.success}
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
							colors={PREMIUM_COLORS.primary}
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
								<Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
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
						<TouchableOpacity
							onPress={handlePay}
							onPressIn={handlePressIn}
							onPressOut={handlePressOut}
							disabled={isProcessing || selectedItems.size === 0}
							activeOpacity={0.9}
						>
							<LinearGradient
								colors={
									isProcessing || selectedItems.size === 0
										? ["#ccc", "#999"]
										: PREMIUM_COLORS.success
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
					)}

					<TouchableOpacity
						onPress={() => onBack?.()}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						disabled={isProcessing}
						activeOpacity={0.9}
					>
						<LinearGradient
							colors={PREMIUM_COLORS.accent}
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

			{/* Receipt Modal */}
			<ReceiptModal
				visible={showReceipt}
				onClose={handleCloseReceipt}
				reservation={currentReservation}
				items={receiptData?.items || []}
				amount={receiptData?.amount || 0}
				paymentMethod={receiptData?.paymentMethod}
				last4Digits={receiptData?.last4Digits}
			/>
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
