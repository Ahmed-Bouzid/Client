/**
 * OrderScreen - Design Foodmood + Fonctionnalités Payment complètes
 * PARTIE 1: Logique sans modification du design
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import { useOrderStore } from "../stores/useOrderStore.js";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { useReservationStatus } from "../hooks/useReservationStatus";
import { ReceiptModal } from "../components/receipt/ReceiptModal";
import FeedbackScreen from "../components/FeedbackScreen";
import stripeService from "../services/stripeService";
import { API_BASE_URL } from "../config/api";
import logger from "../utils/secureLogger";

const { width } = Dimensions.get("window");
const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");
const GRILLZ_RESTAURANT_ID = "695e4300adde654b80f6911a";

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════
const ProgressBar = ({ step = 1 }) => {
  const steps = ["Prepare", "Cook", "Ready", "Served"];
  return (
    <View style={pbStyles.container}>
      <View style={pbStyles.trackContainer}>
        <View style={pbStyles.track}>
          <View style={[pbStyles.trackFill, { width: `${((step) / 4) * 100}%` }]} />
        </View>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[pbStyles.dot, i < step && pbStyles.dotActive]}
          />
        ))}
      </View>
      <View style={pbStyles.labels}>
        {steps.map((label, i) => (
          <Text key={label} style={[pbStyles.label, i < step && pbStyles.labelActive]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const pbStyles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 12, paddingHorizontal: 8 },
  trackContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  track: {
    position: "absolute",
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: "#E5E5E5",
    borderRadius: 1,
  },
  trackFill: {
    position: "absolute",
    height: 2,
    backgroundColor: "#1F2937",
    borderRadius: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
    zIndex: 1,
  },
  dotActive: { backgroundColor: "#1F2937" },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  label: { fontSize: 12, color: "#D1D5DB", fontWeight: "500" },
  labelActive: { color: "#1F2937", fontWeight: "600" },
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OrderScreen({
  allOrders = [],
  orderId = null,
  clientId = null,
  reservationId = null,
  restaurantId = null,
  tableId = null,
  tableNumber = null,
  userName = null,
  onBack = () => {},
  onPayNow = () => {},
  onCancelOrder = () => {},
  onSuccess = () => {},
  onReservationClosed = () => {},
}) {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [paidItems, setPaidItems] = useState(new Set());
  const [payForWholeTable, setPayForWholeTable] = useState(false);
  const [reservationStatus, setReservationStatus] = useState({
    canClose: false,
    reason: "",
    unpaidOrders: [],
    totalDue: 0,
    totalPaid: 0,
  });

  // 🧾 Ticket de caisse
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // 🌟 Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);

  // Stripe
  const { initPaymentSheet, presentPaymentSheet, isApplePaySupported } = useStripe();
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Stores
  const { markAsPaid, activeOrderId: storeOrderId } = useOrderStore();
  const storeRestaurantId = useRestaurantStore((state) => state.id);

  // Use orderId from props or from store
  const effectiveOrderId = orderId || storeOrderId;
  const effectiveRestaurantId = restaurantId || storeRestaurantId;
  const isGrillzTheme = effectiveRestaurantId === GRILLZ_RESTAURANT_ID;

  // 🚪 Écouter fermeture réservation WebSocket
  useReservationStatus(effectiveRestaurantId, reservationId, onReservationClosed);

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════
  const getItemId = (item) => {
    if (!item) return `unknown-${Date.now()}`;
    if (item._id) return item._id;
    return `${item.id || item.productId}-${item.name}-${item.price}`;
  };

  const getStorageKey = () => {
    if (reservationId) return `paidItems_res_${reservationId}`;
    if (orderId) return `paidItems_order_${orderId}`;
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MULTI-CLIENTS : Filtrage
  // ═══════════════════════════════════════════════════════════════════════
  const visibleOrders = useMemo(() => {
    if (payForWholeTable) return allOrders;
    return allOrders.filter((item) => !item.clientId || item.clientId === clientId);
  }, [allOrders, clientId, payForWholeTable]);

  const otherClientsCount = useMemo(() => {
    return allOrders.filter((item) => item.clientId && item.clientId !== clientId).length;
  }, [allOrders, clientId]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOAD PAID ITEMS FROM STORAGE
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      const storageKey = getStorageKey();
      if (!storageKey) return;
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) setPaidItems(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("❌ Erreur chargement paidItems:", e);
      }
    })();
  }, [reservationId, orderId]);

  // ═══════════════════════════════════════════════════════════════════════
  // SAVE PAID ITEMS TO STORAGE
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      const storageKey = getStorageKey();
      if (!storageKey) return;
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(paidItems)));
      } catch (e) {
        logger.error("Erreur sauvegarde paidItems", e.message);
      }
    })();
  }, [paidItems, reservationId, orderId]);

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK APPLE PAY
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      if (Platform.OS === "ios" && typeof isApplePaySupported === "function") {
        try {
          const supported = await isApplePaySupported();
          setApplePayAvailable(supported);
        } catch (e) {
          setApplePayAvailable(false);
        }
      }
    })();
  }, [isApplePaySupported]);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-SELECT NON-PAID ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visibleOrders.length > 0) {
      const nonPaidIds = new Set(
        visibleOrders.filter((i) => !paidItems.has(getItemId(i))).map(getItemId)
      );
      setSelectedItems(nonPaidIds);
    }
  }, [visibleOrders.length, paidItems.size, payForWholeTable]);

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK RESERVATION CLOSURE
  // ═══════════════════════════════════════════════════════════════════════
  const checkReservationClosure = async () => {
    if (!allOrders || allOrders.length === 0) {
      setReservationStatus({ canClose: false, reason: "Aucune commande", unpaidOrders: [], totalDue: 0, totalPaid: 0 });
      return;
    }

    const unpaidOrders = allOrders.filter((i) => !paidItems.has(getItemId(i)));
    const totalDue = unpaidOrders.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    const paidOrdersList = allOrders.filter((i) => paidItems.has(getItemId(i)));
    const totalPaid = paidOrdersList.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

    const canClose = unpaidOrders.length === 0;
    setReservationStatus({
      canClose,
      reason: canClose ? "✅ Tout payé" : `${unpaidOrders.length} article(s) à payer`,
      unpaidOrders,
      totalDue,
      totalPaid,
    });

    return { canClose, totalDue, totalPaid, unpaidOrders };
  };

  useEffect(() => {
    if (allOrders?.length > 0) checkReservationClosure();
  }, [allOrders, paidItems]);

  // ═══════════════════════════════════════════════════════════════════════
  // SELECTION FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const toggleItem = (item) => {
    const id = getItemId(item);
    const s = new Set(selectedItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedItems(s);
  };

  const toggleAll = () => {
    const nonPaid = visibleOrders.filter((i) => !paidItems.has(getItemId(i)));
    if (nonPaid.length === 0) return;
    const allIds = new Set(nonPaid.map(getItemId));
    setSelectedItems(selectedItems.size === allIds.size ? new Set() : allIds);
  };

  const selectOneThird = () => {
    const nonPaid = visibleOrders.filter((i) => !paidItems.has(getItemId(i)));
    if (nonPaid.length === 0) return;
    const count = Math.ceil(nonPaid.length / 3);
    setSelectedItems(new Set(nonPaid.slice(0, count).map(getItemId)));
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSE RESERVATION
  // ═══════════════════════════════════════════════════════════════════════
  const closeReservationOnServer = async () => {
    if (!reservationId) return { success: false, message: "Aucun ID de réservation" };
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/client/${reservationId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return { success: false, message: `Erreur: ${res.status}` };
      return { success: true, message: "Réservation fermée" };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RECEIPT
  // ═══════════════════════════════════════════════════════════════════════
  const showReceiptTicket = (paymentDetails, selectedOrders) => {
    const restaurantName = useRestaurantStore.getState().name || "Restaurant";
    const now = new Date();
    const initiales = restaurantName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
    const ticketNumber = `${initiales}-${dateStr}-${timeStr}`;

    const totalAmount = selectedOrders.reduce(
      (s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 1), 0
    );

    const paymentMethodLabel = { card: "Carte", apple_pay: "Apple Pay", fake: "Test" }[paymentDetails.method] || "Carte";

    setReceiptData({
      reservation: {
        _id: ticketNumber,
        tableNumber,
        clientName: userName || "Client",
        restaurantId: { name: restaurantName },
      },
      items: selectedOrders.map(i => ({ name: i.name, quantity: i.quantity || 1, price: i.price || 0 })),
      amount: totalAmount,
      paymentMethod: paymentMethodLabel,
      last4Digits: paymentDetails.last4 || null,
    });
    setShowReceipt(true);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setReceiptData(null);
    // Retour direct au menu
    setTimeout(() => {
      setSelectedItems(new Set());
      // Force navigation back to menu
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    }, 200);
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    setTimeout(() => {
      setSelectedItems(new Set());
      onSuccess?.();
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PAYMENT
  // ═══════════════════════════════════════════════════════════════════════
  const handlePay = async (paymentMethod = "card") => {
    if (selectedItems.size === 0) {
      Alert.alert("Erreur", "Sélectionnez au moins un article");
      return;
    }

    // Web must use the dedicated Stripe web checkout flow (Payment screen).
    // Keeping native PaymentSheet on web can bypass UI and create inconsistent behavior.
    if (Platform.OS === "web") {
      if (typeof onPayNow === "function") {
        onPayNow();
      } else {
        Alert.alert("Paiement web", "Veuillez ouvrir l'écran de paiement.");
      }
      return;
    }

    if (!initPaymentSheet || !presentPaymentSheet) {
      Alert.alert("Erreur", "Stripe non initialisé");
      return;
    }

    setLoading(true);

    try {
      const selectedOrders = allOrders.filter((i) => selectedItems.has(getItemId(i)));
      const amountPaid = selectedOrders.reduce(
        (s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 1), 0
      );
      const amountCents = Math.round(amountPaid * 100);

      // Get orderId from items or props (commande déjà soumise par MenuScreen)
      const finalOrderId = selectedOrders[0]?.orderId || effectiveOrderId || allOrders[0]?.orderId;
      
      if (!finalOrderId) {
        Alert.alert("Erreur", "Aucune commande trouvée. Retournez au menu.");
        setLoading(false);
        return;
      }

      // Create PaymentIntent
      const paymentIntentResult = await stripeService.createPaymentIntent({
        orderId: finalOrderId,
        amount: amountCents,
        currency: "eur",
        paymentMethodTypes: paymentMethod === "apple_pay" ? ["card", "apple_pay"] : ["card"],
        tipAmount: 0,
        paymentMode: "client",
        reservationId,
      });

      const newClientSecret = paymentIntentResult.clientSecret;
      setClientSecret(newClientSecret);
      setPaymentIntentId(paymentIntentResult.paymentIntentId);

      // Init Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: newClientSecret,
        merchantDisplayName: "Foodmood",
        applePay: applePayAvailable ? {
          merchantCountryCode: "FR",
          merchantIdentifier: "merchant.com.foodmood.app",
          cartItems: [{ label: "Commande", amount: (amountCents / 100).toFixed(2) }],
        } : undefined,
        returnURL: "foodmood://payment",
      });

      if (initError) {
        Alert.alert("Erreur", initError.message);
        setLoading(false);
        return;
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          setLoading(false);
          return;
        }
        Alert.alert("Erreur", presentError.message);
        setLoading(false);
        return;
      }

      // Payment succeeded - update paidItems
      const newPaidItems = new Set(paidItems);
      selectedOrders.forEach((i) => newPaidItems.add(getItemId(i)));
      setPaidItems(newPaidItems);

      // Check if full payment
      const remainingItems = allOrders.filter((i) => !newPaidItems.has(getItemId(i)));
      const isFullPayment = remainingItems.length === 0;

      // Close reservation if fully paid
      let reservationClosed = false;
      if (isFullPayment && reservationId) {
        const closureResult = await closeReservationOnServer();
        if (closureResult.success) {
          reservationClosed = true;
          const storageKey = getStorageKey();
          if (storageKey) await AsyncStorage.removeItem(storageKey);
          await AsyncStorage.multiRemove([
            "currentReservationId", "currentTableId", "currentTableNumber", "currentClientName"
          ]);
        }
      }

      // Show receipt
      showReceiptTicket({ method: paymentMethod, last4: "****" }, selectedOrders);

    } catch (e) {
      console.error("❌ Erreur paiement:", e);
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════
  const items = visibleOrders.filter((i) => !paidItems.has(getItemId(i)));
  const total = visibleOrders.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const selectedTotal = Array.from(selectedItems).reduce((s, id) => {
    const item = visibleOrders.find((i) => getItemId(i) === id);
    return s + (item ? (item.price || 0) * (item.quantity || 1) : 0);
  }, 0);

  const summaryText = items.map((i) => `${i.quantity || 1} x ${i.name}`).join(", ");
  const dateText = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER MODALS
  // ═══════════════════════════════════════════════════════════════════════
  if (showReceipt && receiptData) {
    return (
      <ReceiptModal 
        visible={true} 
        reservation={receiptData.reservation}
        items={receiptData.items}
        amount={receiptData.amount}
        paymentMethod={receiptData.paymentMethod}
        last4Digits={receiptData.last4Digits}
        onClose={handleReceiptClose} 
      />
    );
  }

  if (showFeedback && feedbackData) {
    return (
      <FeedbackScreen
        restaurantData={feedbackData.restaurantData}
        customerData={feedbackData.customerData}
        onClose={handleFeedbackClose}
        onSubmit={handleFeedbackClose}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.container, isGrillzTheme && styles.grillzContainer]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color={isGrillzTheme ? "#F59E0B" : "#1F2937"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isGrillzTheme && styles.grillzHeaderTitle]}>Ma commande en cours</Text>
      </View>

      {/* SUMMARY */}
      <View style={styles.summarySection}>
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryText, isGrillzTheme && styles.grillzSummaryText]} numberOfLines={2}>
            {summaryText || "Aucun article"}
          </Text>
          <Text style={[styles.summaryDate, isGrillzTheme && styles.grillzSummaryDate]}>{dateText}</Text>
        </View>
        <Text style={[styles.summaryPrice, isGrillzTheme && styles.grillzSummaryPrice]}>${total.toFixed(2)}</Text>
      </View>

      {/* TOGGLE: Mes articles / Toute la table */}
      {otherClientsCount > 0 && (
        <View style={[styles.clientToggleRow, isGrillzTheme && styles.grillzClientToggleRow]}>
          <TouchableOpacity
            style={[styles.clientToggleBtn, !payForWholeTable && styles.clientToggleBtnActive, isGrillzTheme && !payForWholeTable && styles.grillzClientToggleBtnActive]}
            onPress={() => setPayForWholeTable(false)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person" size={16} color={!payForWholeTable ? "#fff" : isGrillzTheme ? "#A1A1AA" : "#6B7280"} />
            <Text style={[styles.clientToggleText, !payForWholeTable && styles.clientToggleTextActive]}>
              Mes articles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.clientToggleBtn, payForWholeTable && styles.clientToggleBtnActive, isGrillzTheme && payForWholeTable && styles.grillzClientToggleBtnActive]}
            onPress={() =>
              Alert.alert(
                "Payer pour toute la table",
                "Vous allez régler les commandes de tous les clients. Confirmez-vous ?",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Confirmer", onPress: () => setPayForWholeTable(true) },
                ]
              )
            }
            activeOpacity={0.8}
          >
            <MaterialIcons name="group" size={16} color={payForWholeTable ? "#fff" : isGrillzTheme ? "#A1A1AA" : "#6B7280"} />
            <Text style={[styles.clientToggleText, payForWholeTable && styles.clientToggleTextActive]}>
              Toute la table ({otherClientsCount + items.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PRODUCT CARDS */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={80} color="#4ECDC4" />
            <Text style={[styles.emptyText, isGrillzTheme && styles.grillzEmptyText]}>Tout est payé !</Text>
          </View>
        ) : (
          items.map((item) => {
            const id = getItemId(item);
            const itemPrice = (item.price || 0) * (item.quantity || 1);
            const isSelected = selectedItems.has(id);

            return (
              <TouchableOpacity
                key={id}
                style={[styles.card, isSelected && styles.cardSelected, isGrillzTheme && styles.grillzCard, isGrillzTheme && isSelected && styles.grillzCardSelected]}
                onPress={() => toggleItem(item)}
                activeOpacity={0.95}
              >
                <View style={styles.cardTop}>
                  <View style={styles.productImageContainer}>
                    <Image source={PANINI_IMAGE} style={styles.productImage} resizeMode="cover" />
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={[styles.productName, isGrillzTheme && styles.grillzProductName]}>{item.name}</Text>
                    <Text style={[styles.productPrice, isGrillzTheme && styles.grillzProductPrice]}>${itemPrice.toFixed(2)}</Text>
                  </View>
                  {/* Checkbox */}
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <MaterialIcons name="check" size={16} color="#FFF" />}
                  </View>
                </View>
                <ProgressBar step={1} />
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLeft, isGrillzTheme && styles.grillzTimeLeft]}>15 minutes restantes</Text>
                  <Text style={[styles.timeAvg, isGrillzTheme && styles.grillzTimeAvg]}>40 min en moyenne</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      {items.length > 0 && (
        <View style={[styles.footer, isGrillzTheme && styles.grillzFooter]}>
          <TouchableOpacity 
            style={[styles.payBtn, loading && styles.payBtnDisabled, isGrillzTheme && styles.grillzPayBtn]} 
            onPress={() => handlePay("card")} 
            activeOpacity={0.9}
            disabled={loading}
          >
            <Text style={styles.payBtnText}>
              {loading ? "Paiement..." : `Payer maintenant • $${selectedTotal.toFixed(2)}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            {!isGrillzTheme && (
              <TouchableOpacity style={styles.splitBtn} onPress={selectOneThird} activeOpacity={0.9}>
                <Text style={styles.splitBtnText}>Split with others</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.cancelBtn, isGrillzTheme && styles.grillzCancelBtn]} onPress={onCancelOrder} activeOpacity={0.9}>
              <Text style={[styles.cancelBtnText, isGrillzTheme && styles.grillzCancelBtnText]}>Annuler la commande</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEF7F0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937" },

  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryLeft: { flex: 1, paddingRight: 16 },
  summaryText: { fontSize: 13, fontWeight: "700", color: "#1F2937", lineHeight: 18 },
  summaryDate: { fontSize: 11, color: "#9CA3AF", fontStyle: "italic", marginTop: 4 },
  summaryPrice: { fontSize: 28, fontWeight: "700", color: "#EA580C" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 220 },

  emptyState: { alignItems: "center", paddingVertical: 100 },
  emptyText: { fontSize: 22, fontWeight: "700", color: "#1F2937", marginTop: 20 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#EA580C",
  },

  cardTop: { flexDirection: "row", alignItems: "center" },
  productImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    marginRight: 12,
    marginTop: -10,
    marginLeft: -10,
  },
  productImage: { width: "100%", height: "100%", marginTop: 10 },
  infoContainer: { flex: 1, marginLeft: 14 },
  productName: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#EA580C" },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  timeLeft: { fontSize: 13, fontWeight: "700", color: "#EA580C" },
  timeAvg: { fontSize: 11, color: "#9CA3AF" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FEF7F0",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },

  payBtn: {
    backgroundColor: "#F87171",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  btnRow: { flexDirection: "row", gap: 12 },

  splitBtn: {
    flex: 1,
    backgroundColor: "#1F2937",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  splitBtnText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  cancelBtn: {
      flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "500", color: "#9CA3AF" },

  // ═══════════════════════════════════════════════════════════════════════
  // CLIENT TOGGLE
  // ═══════════════════════════════════════════════════════════════════════
  clientToggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    padding: 4,
    gap: 4,
  },
  clientToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  clientToggleBtnActive: {
    backgroundColor: "#F87171",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  clientToggleTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  grillzContainer: { backgroundColor: "#0D0D0D" },
  grillzHeaderTitle: { color: "#F8FAFC" },
  grillzSummaryText: { color: "#F8FAFC" },
  grillzSummaryDate: { color: "#A3A3A3" },
  grillzSummaryPrice: { color: "#F97316" },
  grillzClientToggleRow: { backgroundColor: "#1A1A1A" },
  grillzClientToggleBtnActive: { backgroundColor: "#EA580C" },
  grillzEmptyText: { color: "#F8FAFC" },
  grillzCard: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  grillzCardSelected: { borderColor: "#F97316" },
  grillzProductName: { color: "#F8FAFC" },
  grillzProductPrice: { color: "#F97316" },
  grillzTimeLeft: { color: "#F97316" },
  grillzTimeAvg: { color: "#A3A3A3" },
  grillzFooter: { backgroundColor: "#0D0D0D" },
  grillzPayBtn: { backgroundColor: "#EA580C" },
  grillzCancelBtn: { borderColor: "#3F3F46" },
  grillzCancelBtnText: { color: "#D4D4D8" },
});
