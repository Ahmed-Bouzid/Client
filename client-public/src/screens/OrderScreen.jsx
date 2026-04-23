/**
 * ═══════════════════════════════════════════════════════════════
 * OrderScreen.jsx — ÉTAPE 3 : RÉCAPITULATIF COMMANDE & VALIDATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client :
 *   1. Affiche les articles commandés avec quantités et prix
 *   2. Affiche la barre de progression (Prepare → Cook → Ready → Served)
 *   3. Bouton "Payer" → navigue vers Payment
 *   4. Bouton "Annuler" → annulation locale (fast-food) ou serveur
 *
 * Mode fast-food :
 *   - Commande PAS encore en BDD (pendingOrder=true)
 *   - Timer 10s avec countdown visible
 *   - Annulation gratuite pendant le countdown (pas de requête BDD)
 *   - Auto-submit en BDD après 10s via onAutoSubmit callback
 *
 * Fonctionnalités secondaires :
 *   - Bannière de statut selon la catégorie (foodtruck, fast-food)
 *   - Barre de progression de cuisson
 *   - Écoute fermeture de réservation (useReservationStatus)
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { useReservationStatus } from "../hooks/useReservationStatus";

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
  pendingOrder = false,   // 🍔 Fast-food: commande pas encore en BDD
  pendingItems = [],      // 🍔 Fast-food: articles du panier local
  onBack = () => {},
  onPayNow = () => {},
  onCancelOrder = () => {},
  onAutoSubmit = () => {},  // 🍔 Fast-food: callback envoi BDD après 10s
  onReservationClosed = () => {},
}) {
  // Stores
  const storeRestaurantId = useRestaurantStore((state) => state.id);
  const restaurantCategory = useRestaurantStore((state) => state.category);
  const effectiveRestaurantId = restaurantId || storeRestaurantId;
  const isGrillzTheme = effectiveRestaurantId === GRILLZ_RESTAURANT_ID;
  const isFoodtruck = restaurantCategory === "foodtruck";
  const isFastFood = restaurantCategory === "fast-food";

  // 🚪 Écouter fermeture réservation WebSocket
  useReservationStatus(effectiveRestaurantId, reservationId, onReservationClosed);

  // ═══════════════════════════════════════════════════════════════════════
  // 🍔 FAST-FOOD: Countdown 10s avant envoi BDD
  // ═══════════════════════════════════════════════════════════════════════
  const CANCEL_WINDOW = 10; // secondes
  const [countdown, setCountdown] = useState(pendingOrder ? CANCEL_WINDOW : 0);
  const [isSubmitted, setIsSubmitted] = useState(!pendingOrder);
  const timerRef = useRef(null);
  const hasAutoSubmitted = useRef(false);

  // Stabiliser la ref du callback pour éviter les re-renders
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;

  useEffect(() => {
    if (!pendingOrder || isSubmitted) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Auto-submit après 10s
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            setIsSubmitted(true);
            onAutoSubmitRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pendingOrder, isSubmitted]);

  // L'annulation est possible UNIQUEMENT pendant le countdown
  const canCancel = pendingOrder && !isSubmitted && countdown > 0;

  // ═══════════════════════════════════════════════════════════════════════
  // MULTI-CLIENTS : Filtrage par clientId
  // ═══════════════════════════════════════════════════════════════════════
  const [payForWholeTable, setPayForWholeTable] = useState(false);

  const visibleOrders = useMemo(() => {
    if (payForWholeTable) return allOrders;
    return allOrders.filter((item) => !item.clientId || item.clientId === clientId);
  }, [allOrders, clientId, payForWholeTable]);

  const otherClientsCount = useMemo(() => {
    return allOrders.filter((item) => item.clientId && item.clientId !== clientId).length;
  }, [allOrders, clientId]);

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════
  // 🍔 Fast-food pending: afficher les items locaux tant que pas soumis
  const items = (pendingOrder && !isSubmitted) ? pendingItems : visibleOrders;
  const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const summaryText = items.map((i) => `${i.quantity || 1} x ${i.name}`).join(", ");
  const dateText = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

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
        <Text style={[styles.summaryPrice, isGrillzTheme && styles.grillzSummaryPrice]}>{total.toFixed(2)}€</Text>
      </View>

      {/* 🍔 STATUS BANNER (foodtruck / fast-food) */}
      {(isFoodtruck || isFastFood) && (
        <View style={[styles.statusBanner, isFoodtruck ? styles.statusBannerFoodtruck : styles.statusBannerFastfood]}>
          <MaterialIcons
            name={isFoodtruck ? "delivery-dining" : (canCancel ? "hourglass-top" : "restaurant")}
            size={20}
            color={isFoodtruck ? "#FF6B00" : "#4CAF50"}
          />
          <Text style={styles.statusBannerText}>
            {isFoodtruck
              ? "Commande reçue — Payez pour lancer la préparation"
              : canCancel
                ? `Envoi dans ${countdown}s — Vous pouvez encore annuler`
                : "Préparation en cours — Payez quand vous êtes prêt"}
          </Text>
        </View>
      )}

      {/* PRODUCT CARDS */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={80} color="#4ECDC4" />
            <Text style={[styles.emptyText, isGrillzTheme && styles.grillzEmptyText]}>Aucune commande</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const itemPrice = (item.price || 0) * (item.quantity || 1);

            return (
              <View
                key={item._id || `item-${index}`}
                style={[styles.card, isGrillzTheme && styles.grillzCard]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.productImageContainer}>
                    <Image source={PANINI_IMAGE} style={styles.productImage} resizeMode="cover" />
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={[styles.productName, isGrillzTheme && styles.grillzProductName]}>{item.name}</Text>
                    <Text style={[styles.productPrice, isGrillzTheme && styles.grillzProductPrice]}>{itemPrice.toFixed(2)}€</Text>
                  </View>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>x{item.quantity || 1}</Text>
                  </View>
                </View>
                <ProgressBar step={1} />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      {items.length > 0 && (
        <View style={[styles.footer, isGrillzTheme && styles.grillzFooter]}>
          {/* 🍔 Fast-food pending: bouton "Payer" désactivé tant que pas soumis */}
          <TouchableOpacity 
            style={[
              styles.payBtn,
              isGrillzTheme && styles.grillzPayBtn,
              canCancel && styles.payBtnDisabled,
            ]} 
            onPress={onPayNow} 
            activeOpacity={0.9}
            disabled={canCancel}
          >
            <Text style={[styles.payBtnText, canCancel && styles.payBtnTextDisabled]}>
              {canCancel
                ? `Envoi en cours (${countdown}s)…`
                : `Payer maintenant • ${total.toFixed(2)}€`}
            </Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.9}>
              <Text style={styles.backButtonText}>Retour au menu</Text>
            </TouchableOpacity>

            {/* 🍔 Fast-food: cancel cliquable pendant 10s uniquement */}
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                isGrillzTheme && styles.grillzCancelBtn,
                canCancel && styles.cancelBtnActive,
                (pendingOrder && !canCancel) && styles.cancelBtnDisabled,
              ]}
              onPress={canCancel ? onCancelOrder : (pendingOrder ? undefined : onCancelOrder)}
              activeOpacity={canCancel ? 0.7 : (pendingOrder ? 1 : 0.9)}
              disabled={pendingOrder && !canCancel}
            >
              <Text style={[
                styles.cancelBtnText,
                isGrillzTheme && styles.grillzCancelBtnText,
                canCancel && styles.cancelBtnTextActive,
                (pendingOrder && !canCancel) && styles.cancelBtnTextDisabled,
              ]}>
                {canCancel
                  ? `Annuler (${countdown}s)`
                  : pendingOrder
                    ? "Commande envoyée ✓"
                    : "Annuler la commande"}
              </Text>
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

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  statusBannerFoodtruck: {
    backgroundColor: "rgba(255, 107, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.2)",
  },
  statusBannerFastfood: {
    backgroundColor: "rgba(76, 175, 80, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  statusBannerText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },

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

  quantityBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quantityBadgeText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },

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
  payBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  btnRow: { flexDirection: "row", gap: 12 },

  backButton: {
    flex: 1,
    backgroundColor: "#1F2937",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  backButtonText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

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

  // 🍔 Fast-food pending styles
  payBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  payBtnTextDisabled: {
    color: "#9CA3AF",
  },
  cancelBtnActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#F87171",
    borderWidth: 1.5,
  },
  cancelBtnTextActive: {
    color: "#DC2626",
    fontWeight: "700",
  },
  cancelBtnDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  cancelBtnTextDisabled: {
    color: "#D1D5DB",
  },

  // Grillz theme
  grillzContainer: { backgroundColor: "#0D0D0D" },
  grillzHeaderTitle: { color: "#F8FAFC" },
  grillzSummaryText: { color: "#F8FAFC" },
  grillzSummaryDate: { color: "#A3A3A3" },
  grillzSummaryPrice: { color: "#F97316" },
  grillzEmptyText: { color: "#F8FAFC" },
  grillzCard: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  grillzProductName: { color: "#F8FAFC" },
  grillzProductPrice: { color: "#F97316" },
  grillzFooter: { backgroundColor: "#0D0D0D" },
  grillzPayBtn: { backgroundColor: "#EA580C" },
  grillzCancelBtn: { borderColor: "#3F3F46" },
  grillzCancelBtnText: { color: "#D4D4D8" },
});
