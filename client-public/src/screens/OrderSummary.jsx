/**
 * OrderSummary - Style Foodmood
 * Écran de validation AVANT envoi de la commande
 * L'utilisateur peut modifier les quantités avant de confirmer
 */
import React, { useState } from "react";
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OrderSummary({
  currentOrder = [],
  onUpdateQuantity = () => {},
  onConfirm = () => {},
  onBackToMenu = () => {},
  isGrillzTheme = false,
}) {
  const total = currentOrder.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const summaryText = currentOrder.map((i) => `${i.quantity || 1} x ${i.name}`).join(", ");
  const dateText = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const handleQuantityChange = (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      Alert.alert("Supprimer", "Voulez-vous supprimer cet article ?", [
        { text: "Non" },
        { text: "Oui", onPress: () => onUpdateQuantity(item, 0) }
      ]);
    } else {
      onUpdateQuantity(item, newQty);
    }
  };

  const handleConfirm = () => {
    if (currentOrder.length === 0) {
      Alert.alert("Panier vide", "Ajoutez des articles avant de confirmer");
      return;
    }
    onConfirm();
  };

  return (
    <View style={[styles.container, isGrillzTheme && styles.grillzContainer]}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToMenu} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color={isGrillzTheme ? "#F59E0B" : "#1F2937"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isGrillzTheme && styles.grillzHeaderTitle]}>Récapitulatif</Text>
      </View>

      {/* ═══════════════════════════════════════════════════════════
          SUMMARY
      ═══════════════════════════════════════════════════════════ */}
      <View style={styles.summarySection}>
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryText, isGrillzTheme && styles.grillzSummaryText]} numberOfLines={2}>
            {summaryText || "Aucun article"}
          </Text>
          <Text style={[styles.summaryDate, isGrillzTheme && styles.grillzSummaryDate]}>{dateText}</Text>
        </View>
        <Text style={[styles.summaryPrice, isGrillzTheme && styles.grillzSummaryPrice]}>${total.toFixed(2)}</Text>
      </View>

      {/* ═══════════════════════════════════════════════════════════
          PRODUCT CARDS - Editables
      ═══════════════════════════════════════════════════════════ */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {currentOrder.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-cart" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>Panier vide</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onBackToMenu}>
              <Text style={styles.emptyButtonText}>Retour au menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentOrder.map((item, index) => {
            const itemPrice = (item.price || 0) * (item.quantity || 1);

            return (
              <View key={item._id || index} style={[styles.card, isGrillzTheme && styles.grillzCard]}>
                <View style={styles.cardTop}>
                  {/* Image */}
                  <View style={styles.productImageContainer}>
                    <Image 
                      source={item.image && item.image.trim() !== "" ? {uri: item.image} : PANINI_IMAGE} 
                      style={styles.productImage} 
                      resizeMode="cover" 
                    />
                  </View>

                  {/* Infos */}
                  <View style={styles.infoContainer}>
                    <Text style={[styles.productName, isGrillzTheme && styles.grillzProductName]}>{item.name}</Text>
                    <Text style={[styles.productPrice, isGrillzTheme && styles.grillzProductPrice]}>${itemPrice.toFixed(2)}</Text>
                  </View>

                  {/* Quantity controls */}
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityBtn} 
                      onPress={() => handleQuantityChange(item, -1)}
                    >
                      <MaterialIcons name="remove" size={20} color={isGrillzTheme ? "#F59E0B" : "#1F2937"} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, isGrillzTheme && styles.grillzQuantityText]}>{item.quantity || 1}</Text>
                    <TouchableOpacity 
                      style={styles.quantityBtn} 
                      onPress={() => handleQuantityChange(item, 1)}
                    >
                      <MaterialIcons name="add" size={20} color={isGrillzTheme ? "#F59E0B" : "#1F2937"} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Description */}
                {item.description && (
                  <Text style={[styles.productDescription, isGrillzTheme && styles.grillzProductDescription]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      {currentOrder.length > 0 && (
        <View style={[styles.footer, isGrillzTheme && styles.grillzFooter]}>
          {/* Confirm button */}
          <TouchableOpacity style={[styles.confirmBtn, isGrillzTheme && styles.grillzConfirmBtn]} onPress={handleConfirm} activeOpacity={0.9}>
            <Text style={styles.confirmBtnText}>Confirmer la commande • ${total.toFixed(2)}</Text>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity style={[styles.backButton, isGrillzTheme && styles.grillzBackButton]} onPress={onBackToMenu} activeOpacity={0.9}>
            <Text style={[styles.backButtonText, isGrillzTheme && styles.grillzBackButtonText]}>Retour au menu</Text>
          </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 180 },

  emptyState: { alignItems: "center", paddingVertical: 100 },
  emptyText: { fontSize: 22, fontWeight: "700", color: "#1F2937", marginTop: 20, marginBottom: 30 },
  emptyButton: {
    backgroundColor: "#F87171",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  emptyButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

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
  productDescription: { fontSize: 13, color: "#9CA3AF", marginTop: 12, lineHeight: 18 },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 4,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: "center",
  },

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

  confirmBtn: {
    backgroundColor: "#F87171",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  backButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  backButtonText: { fontSize: 13, fontWeight: "500", color: "#9CA3AF" },

  grillzContainer: { backgroundColor: "#0D0D0D" },
  grillzHeaderTitle: { color: "#F8FAFC" },
  grillzSummaryText: { color: "#F8FAFC" },
  grillzSummaryDate: { color: "#A3A3A3" },
  grillzSummaryPrice: { color: "#F97316" },
  grillzCard: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  grillzProductName: { color: "#F8FAFC" },
  grillzProductPrice: { color: "#F97316" },
  grillzProductDescription: { color: "#A3A3A3" },
  grillzQuantityText: { color: "#F8FAFC" },
  grillzFooter: { backgroundColor: "#0D0D0D" },
  grillzConfirmBtn: { backgroundColor: "#EA580C" },
  grillzBackButton: { borderColor: "#3F3F46" },
  grillzBackButtonText: { color: "#D4D4D8" },
});
