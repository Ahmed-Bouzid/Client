/**
 * ═══════════════════════════════════════════════════════════════
 * OrderDetailsScreen.jsx — Détails d'une commande (lookup par #XXX-XXX)
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours :
 *   1. Reçoit les données de commande depuis WelcomeScreen/App.jsx
 *   2. Affiche : numéro, date, articles, total, statut, paiement
 *   3. Bouton placeholder "Demander un remboursement" (UI only)
 *   4. Bouton retour accueil
 *
 * Props :
 *   - orderData: object — données de la commande
 *   - onBack: () => void — retour à l'accueil
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ── Helpers ──

const STATUS_LABELS = {
  pending: { label: "En attente", color: "#FF9800", icon: "time-outline" },
  in_progress: { label: "En préparation", color: "#2196F3", icon: "flame-outline" },
  confirmed: { label: "Confirmée", color: "#22C55E", icon: "checkmark-outline" },
  ready: { label: "Prête", color: "#4CAF50", icon: "checkmark-circle-outline" },
  completed: { label: "Terminée", color: "#22C55E", icon: "checkmark-done-outline" },
  delivered: { label: "Livrée", color: "#4CAF50", icon: "checkmark-done-outline" },
  cancelled: { label: "Annulée", color: "#F44336", icon: "close-circle-outline" },
};

const PAYMENT_STATUS_LABELS = {
  unpaid: { label: "Non payé", color: "#FF9800", icon: "alert-circle-outline" },
  partially_paid: { label: "Partiellement payé", color: "#F59E0B", icon: "wallet-outline" },
  paid: { label: "Payé", color: "#22C55E", icon: "checkmark-circle-outline" },
  refunded: { label: "Remboursé", color: "#60A5FA", icon: "return-down-back-outline" },
  pending: { label: "Paiement en attente", color: "#F59E0B", icon: "time-outline" },
  processing: { label: "Paiement en cours", color: "#60A5FA", icon: "sync-outline" },
  succeeded: { label: "Paiement confirmé", color: "#22C55E", icon: "checkmark-circle-outline" },
  failed: { label: "Paiement échoué", color: "#F44336", icon: "close-circle-outline" },
  partially_refunded: { label: "Remboursement partiel", color: "#93C5FD", icon: "return-down-back-outline" },
};

function getStatusInfo(status) {
  return STATUS_LABELS[status] || { label: status, color: "#999", icon: "help-outline" };
}

function getPaymentStatusInfo(status) {
  return (
    PAYMENT_STATUS_LABELS[status] || {
      label: status || "Inconnu",
      color: "#999",
      icon: "help-outline",
    }
  );
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price) {
  return `${price.toFixed(2)} €`;
}

// ── Component ──

export default function OrderDetailsScreen({ orderData, onBack, onPayByCard }) {
  if (!orderData) {
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#444" />
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptySubtitle}>
            Aucune commande trouvée avec ce numéro.
          </Text>
          <TouchableOpacity onPress={onBack} style={styles.backButtonEmpty}>
            <Ionicons name="arrow-back" size={18} color="#FF8A50" style={{ marginRight: 6 }} />
            <Text style={styles.backButtonEmptyText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(orderData.status);
  const resolvedPaymentStatus = (() => {
    if (orderData.paymentStatus) {
      return orderData.paymentStatus;
    }
    if (orderData.paid === true) {
      return "paid";
    }
    return orderData.payment?.status;
  })();
  const paymentStatusInfo = getPaymentStatusInfo(
    resolvedPaymentStatus,
  );
  const trackingInfo = getStatusInfo(orderData.trackingStatus);
  const remainingAmount = Math.max(0, (orderData.total || 0) - (orderData.paidAmount || 0));
  const hasPayByCardHandler = typeof onPayByCard === "function";
  const canPayByCard =
    hasPayByCardHandler &&
    remainingAmount > 0 &&
    orderData.paid !== true &&
    !["paid", "refunded"].includes(resolvedPaymentStatus || "") &&
    !["cancelled"].includes(orderData.status || "");

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail commande</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Number Card */}
        <View style={styles.card}>
          <View style={styles.orderNumberRow}>
            <Ionicons name="receipt" size={24} color="#FF8A50" />
            <Text style={styles.orderNumber}>{orderData.orderNumber}</Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(orderData.date)}</Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
            <View style={[styles.statusBadge, { backgroundColor: trackingInfo.color + "20", marginTop: 8 }]}>
              <Ionicons name={trackingInfo.icon} size={16} color={trackingInfo.color} />
              <Text style={[styles.statusText, { color: trackingInfo.color }]}> 
                Suivi: {trackingInfo.label}
              </Text>
            </View>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Articles commandés</Text>
          {orderData.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          {/* Separator */}
          <View style={styles.separator} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalPrice}>{formatPrice(orderData.total)}</Text>
          </View>
        </View>

        {/* Payment method */}
          {(orderData.paymentMethod || orderData.payment) && (
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <Ionicons name="card-outline" size={20} color="#FF8A50" />
                <Text style={styles.paymentLabel}>Paiement</Text>
            </View>
              <Text style={styles.paymentValue}>{orderData.paymentMethod || "-"}</Text>

              <View style={[styles.statusBadge, { backgroundColor: paymentStatusInfo.color + "20", marginTop: 10 }]}>
                <Ionicons name={paymentStatusInfo.icon} size={16} color={paymentStatusInfo.color} />
                <Text style={[styles.statusText, { color: paymentStatusInfo.color }]}> 
                  {paymentStatusInfo.label}
                </Text>
              </View>

              {orderData.payment?.cardLast4 && (
                <Text style={styles.statusMiniText}>
                  Carte: {orderData.payment.cardBrand || "card"} •••• {orderData.payment.cardLast4}
                </Text>
              )}
              {orderData.payment?.errorMessage && (
                <Text style={[styles.statusMiniText, { color: "#FF6B6B" }]}> 
                  Erreur: {orderData.payment.errorMessage}
                </Text>
              )}
              {orderData.payment?.confirmedAt && (
                <Text style={styles.statusMiniText}>
                  Payé à: {formatDate(orderData.payment.confirmedAt)}
                </Text>
              )}
          </View>
        )}

          {/* Timeline */}
          {Array.isArray(orderData.timeline) && orderData.timeline.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Historique</Text>
              {orderData.timeline.map((event, index) => (
                <View key={`${event.type}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{event.label}</Text>
                    <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Info utile */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations utiles</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Table</Text>
                <Text style={styles.infoValue}>{orderData.tableNumber || "-"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Client</Text>
                <Text style={styles.infoValue}>{orderData.clientName || "-"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Payé</Text>
                <Text style={styles.infoValue}>{orderData.paid ? "Oui" : "Non"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Montant réglé</Text>
                <Text style={styles.infoValue}>{formatPrice(orderData.paidAmount || 0)}</Text>
              </View>
            </View>
          </View>

        {/* Back to home */}
        {canPayByCard && (
          <TouchableOpacity onPress={onPayByCard} activeOpacity={0.85} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={["#11998e", "#38ef7d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButton}
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.payButtonText}>Payer en CB ({formatPrice(remainingAmount)})</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={{ marginTop: 16 }}>
          <LinearGradient
            colors={["#D35400", "#E67E22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeButton}
          >
            <Ionicons name="home-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#141414",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── ScrollView ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // ── Card ──
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },

  // ── Order Number ──
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    marginLeft: 10,
    fontVariant: ["tabular-nums"],
  },
  orderDate: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
  },

  // ── Status Badge ──
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusMiniText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 8,
  },

  // ── Section Title ──
  sectionTitle: {
    color: "#FF8A50",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  // ── Item Row ──
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemQuantity: {
    color: "#FF8A50",
    fontSize: 15,
    fontWeight: "700",
    width: 32,
    fontVariant: ["tabular-nums"],
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  itemPrice: {
    color: "#CCC",
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // ── Separator ──
  separator: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 12,
  },

  // ── Total ──
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  totalPrice: {
    color: "#FF8A50",
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  // ── Payment ──
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  paymentLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  paymentValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Timeline ──
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8A50",
    marginTop: 6,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  timelineDate: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },

  // ── Info Grid ──
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  infoItem: {
    width: "50%",
    marginBottom: 12,
  },
  infoLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Refund Button (placeholder) ──
  refundButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FF6B6B40",
    backgroundColor: "#1A1A1A",
  },
  refundButtonDisabled: {
    borderColor: "#4CAF5040",
    backgroundColor: "#1A1A1A",
  },
  refundText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "600",
  },
  refundTextDisabled: {
    color: "#4CAF50",
  },

  // ── Home Button ──
  homeButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  payButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonEmpty: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
  },
  backButtonEmptyText: {
    color: "#FF8A50",
    fontSize: 15,
    fontWeight: "600",
  },
});
