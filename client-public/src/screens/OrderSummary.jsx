/**
 * OrderSummary - Style Foodmood
 * É  cran de validation AVANT envoi de la commande
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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { BAGHERA_PALETTE, BAGHERA_FONTS } from "../theme/bagheraTheme";
import { useTranslation } from "../hooks/useTranslation";

const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");
const BAGHERA_LOGO = require("../../assets/baghera/logo.png");
const BAGHERA_IMG_BRUNCH = require("../../assets/baghera/hero-brunch.jpg");
const BAGHERA_IMG_BAGHEERA = require("../../assets/baghera/signature-bagheera.jpg");
const BAGHERA_IMG_MOWGLI = require("../../assets/baghera/signature-mowgli.jpg");
const BAGHERA_IMG_SHEREKAN = require("../../assets/baghera/signature-shere-kan.jpg");
const BAGHERA_IMG_ATELIER = require("../../assets/baghera/ambiance-atelier.jpg");
const BAGHERA_FALLBACKS = [BAGHERA_IMG_BAGHEERA, BAGHERA_IMG_MOWGLI, BAGHERA_IMG_SHEREKAN];
const getBagheraSummaryImage = (item) => {
  if (!item) return BAGHERA_IMG_BRUNCH;
  if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) return { uri: item.image };
  const h = `${item.name || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
  if (/(café|cafe|the|thé|latte|cappuccino|espresso|moka|chocolat|boisson|jus|smoothie|tea|coffee|vodka|cocktail|spritz|mimosa|champagne|aperol)/.test(h)) return BAGHERA_IMG_ATELIER;
  if (/(brunch|œuf|oeuf|egg|pancake|avocat|avocado|toast|granola|yaourt|porridge|tartine)/.test(h)) return BAGHERA_IMG_BRUNCH;
  if (/(burger|sandwich|panini|wrap|club|bagel|viande|bœuf|boeuf|poulet|chicken|steak)/.test(h)) return BAGHERA_IMG_SHEREKAN;
  if (/(salade|salad|bowl|veggie|végé|vegan|légume|legume|crudité|quinoa|buddha)/.test(h)) return BAGHERA_IMG_MOWGLI;
  if (/(dessert|sucré|sucre|gâteau|gateau|tarte|cake|pâtisserie|patisserie|cookie|brownie|crème|creme|glace)/.test(h)) return BAGHERA_IMG_BAGHEERA;
  const idx = (item.name || '').length % BAGHERA_FALLBACKS.length;
  return BAGHERA_FALLBACKS[idx];
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OrderSummary({
  currentOrder = [],
  onUpdateQuantity = () => {},
  onConfirm = () => {},
  onBackToMenu = () => {},
  isGrillzTheme = false,
  isBaghera = false,
}) {
  const { t } = useTranslation();
  const total = currentOrder.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const summaryText = currentOrder.map((i) => `${i.quantity || 1} x ${i.name}`).join(", ");
  const dateText = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const handleQuantityChange = (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      Alert.alert(t("Supprimer"), "Voulez-vous supprimer cet article ?", [
        { text: "Non" },
        { text: "Oui", onPress: () => onUpdateQuantity(item, 0) }
      ]);
    } else {
      onUpdateQuantity(item, newQty);
    }
  };

  const handleConfirm = () => {
    if (currentOrder.length === 0) {
      Alert.alert(t("Panier vide"), "Ajoutez des articles avant de confirmer");
      return;
    }
    onConfirm();
  };

  return (
    <View style={[
      styles.container,
      isGrillzTheme && styles.grillzContainer,
      isBaghera && { backgroundColor: BAGHERA_PALETTE.linen },
    ]}>
      {/* HEADER */}
      {isBaghera ? (
        <View style={{
          backgroundColor: BAGHERA_PALETTE.linen,
          paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20,
          paddingHorizontal: 22,
          paddingBottom: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity
            onPress={onBackToMenu}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={BAGHERA_PALETTE.espresso} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Image
              source={require("../../assets/baghera/baghera-logo.png")}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={{
                fontFamily: BAGHERA_FONTS.day,
                fontSize: 36,
                color: BAGHERA_PALETTE.sage,
                letterSpacing: 0.5,
              }}>{t("récapitulatif")}</Text>
              <View style={{
                width: 3, height: 3, borderRadius: 1.5,
                backgroundColor: BAGHERA_PALETTE.terracotta,
                marginLeft: 6, opacity: 0.8,
              }} />
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToMenu} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={28} color={isGrillzTheme ? "#F59E0B" : "#1F2937"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isGrillzTheme && styles.grillzHeaderTitle]}>{t("Récapitulatif")}</Text>
        </View>
      )}

      {/* SUMMARY */}
      <View style={styles.summarySection}>
        <View style={styles.summaryLeft}>
          <Text style={[
            styles.summaryText,
            isGrillzTheme && styles.grillzSummaryText,
            isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontWeight: '400', color: BAGHERA_PALETTE.espresso, fontSize: 14 },
          ]} numberOfLines={2}>
            {summaryText || t("Aucun article")}
          </Text>
          <Text style={[
            styles.summaryDate,
            isGrillzTheme && styles.grillzSummaryDate,
            isBaghera && { fontFamily: BAGHERA_FONTS.sans, color: BAGHERA_PALETTE.sage },
          ]}>{dateText}</Text>
        </View>
        <Text style={[
          styles.summaryPrice,
          isGrillzTheme && styles.grillzSummaryPrice,
          isBaghera && { fontFamily: BAGHERA_FONTS.mono, fontWeight: '400', color: BAGHERA_PALETTE.terracotta, fontSize: 22 },
        ]}>{total.toFixed(2)}€</Text>
      </View>

      {/* ═══════════════════════════════════════════════════════════
          PRODUCT CARDS - Editables
      ═══════════════════════════════════════════════════════════ */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {currentOrder.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-cart" size={80} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t("Panier vide")}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onBackToMenu}>
              <Text style={styles.emptyButtonText}>{t("Retour au menu")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentOrder.map((item, index) => {
            const itemPrice = (item.price || 0) * (item.quantity || 1);

            return (
              <View key={item._id || index} style={[
                styles.card,
                isGrillzTheme && styles.grillzCard,
                isBaghera && {
                  backgroundColor: BAGHERA_PALETTE.white,
                  borderWidth: 1,
                  borderColor: BAGHERA_PALETTE.linen,
                  borderRadius: 20,
                  padding: 14,
                  shadowOpacity: 0,
                  elevation: 0,
                },
              ]}>
                <View style={styles.cardTop}>
                  {/* Image */}
                  <View style={[styles.productImageContainer, isBaghera && { borderRadius: 14, overflow: 'hidden' }]}>
                    <Image 
                      source={isBaghera
                        ? getBagheraSummaryImage(item)
                        : (item.image && item.image.trim() !== "" ? {uri: item.image} : PANINI_IMAGE)}
                      style={styles.productImage} 
                      resizeMode="cover" 
                    />
                  </View>

                  {/* Infos */}
                  <View style={styles.infoContainer}>
                    <Text style={[
                      styles.productName,
                      isGrillzTheme && styles.grillzProductName,
                      isBaghera && { fontFamily: BAGHERA_FONTS.black, fontSize: 18, fontWeight: '400', color: BAGHERA_PALETTE.espresso },
                    ]}>{item.name}</Text>
                    <Text style={[
                      styles.productPrice,
                      isGrillzTheme && styles.grillzProductPrice,
                      isBaghera && { fontFamily: BAGHERA_FONTS.mono, fontSize: 15, fontWeight: '400', color: BAGHERA_PALETTE.terracotta },
                    ]}>{itemPrice.toFixed(2)}€</Text>
                  </View>

                  {/* Quantity controls */}
                  <View style={[
                    styles.quantityControls,
                    isGrillzTheme && styles.grillzQuantityControls,
                    isBaghera && { backgroundColor: 'transparent' },
                  ]}>
                    <TouchableOpacity 
                      style={[
                        styles.quantityBtn,
                        isGrillzTheme && styles.grillzQuantityBtn,
                        isBaghera && { backgroundColor: BAGHERA_PALETTE.terracotta, width: 30, height: 30, borderRadius: 15 },
                      ]} 
                      onPress={() => handleQuantityChange(item, -1)}
                    >
                      <MaterialIcons name="remove" size={18} color={isBaghera ? "#FFFFFF" : (isGrillzTheme ? "#F59E0B" : "#1F2937")} />
                    </TouchableOpacity>
                    <Text style={[
                      styles.quantityText,
                      isGrillzTheme && styles.grillzQuantityText,
                      isBaghera && { fontFamily: BAGHERA_FONTS.black, color: BAGHERA_PALETTE.espresso, fontSize: 16 },
                    ]}>{item.quantity || 1}</Text>
                    <TouchableOpacity 
                      style={[
                        styles.quantityBtn,
                        isGrillzTheme && styles.grillzQuantityBtn,
                        isBaghera && { backgroundColor: BAGHERA_PALETTE.terracotta, width: 30, height: 30, borderRadius: 15 },
                      ]} 
                      onPress={() => handleQuantityChange(item, 1)}
                    >
                      <MaterialIcons name="add" size={18} color={isBaghera ? "#FFFFFF" : (isGrillzTheme ? "#F59E0B" : "#1F2937")} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Description */}
                {item.description && (
                  <Text style={[
                    styles.productDescription,
                    isGrillzTheme && styles.grillzProductDescription,
                    isBaghera && { fontFamily: BAGHERA_FONTS.sans, color: BAGHERA_PALETTE.sage, fontSize: 13, marginTop: 8 },
                  ]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      {currentOrder.length > 0 && (
        <View style={[
          styles.footer,
          isGrillzTheme && styles.grillzFooter,
          isBaghera && { backgroundColor: BAGHERA_PALETTE.linen, borderTopWidth: 0 },
        ]}>
          {/* Confirm button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isGrillzTheme && styles.grillzConfirmBtn,
              isBaghera && { backgroundColor: BAGHERA_PALETTE.terracotta, borderRadius: 28, paddingVertical: 16, shadowOpacity: 0 },
            ]}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.confirmBtnText,
              isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontWeight: '600', letterSpacing: 0.3 },
            ]}>{ t("Confirmer la commande") } • {total.toFixed(2)}€</Text>
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity
            style={[
              styles.backButton,
              isGrillzTheme && styles.grillzBackButton,
              isBaghera && { borderColor: BAGHERA_PALETTE.linen, backgroundColor: 'transparent' },
            ]}
            onPress={onBackToMenu}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.backButtonText,
              isGrillzTheme && styles.grillzBackButtonText,
              isBaghera && { fontFamily: BAGHERA_FONTS.sans, color: BAGHERA_PALETTE.sage },
            ]}>{t("Retour au menu")}</Text>
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
  grillzQuantityControls: { backgroundColor: "#2A2A2A" },
  grillzQuantityBtn: { backgroundColor: "#3A3A3A" },
  grillzQuantityText: { color: "#F8FAFC" },
  grillzFooter: { backgroundColor: "#0D0D0D" },
  grillzConfirmBtn: { backgroundColor: "#EA580C" },
  grillzBackButton: { borderColor: "#3F3F46" },
  grillzBackButtonText: { color: "#D4D4D8" },
});
