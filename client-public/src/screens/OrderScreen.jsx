/**
 * ═══════════════════════════════════════════════════════════════
 * OrderS  creen.jsx — ÉTAPE 3 : RÉCAPITULATIF COMMANDE & VALIDATION
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
  Animated,
  PanResponder,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { useReservationStatus } from "../hooks/useReservationStatus";
import useThemeKey from "../hooks/useThemeKey";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";
import {
  getOrderContainerTokens,
  getOrderHeaderTokens,
  getOrderSummaryTokens,
  getOrderCardTokens,
  getOrderFooterTokens,
} from "../theme/defaultTheme";
import { BAGHERA_PALETTE, BAGHERA_FONTS } from "../theme/bagheraTheme";
import { useTranslation } from "../hooks/useTranslation";

const { width } = Dimensions.get("window");
const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");
const BAGHERA_LOGO = require("../../assets/baghera/logo.png");
const BAGHERA_IMG_BRUNCH = require("../../assets/baghera/hero-brunch.jpg");
const BAGHERA_IMG_BAGHEERA = require("../../assets/baghera/signature-bagheera.jpg");
const BAGHERA_IMG_MOWGLI = require("../../assets/baghera/signature-mowgli.jpg");
const BAGHERA_IMG_SHEREKAN = require("../../assets/baghera/signature-shere-kan.jpg");
const BAGHERA_IMG_ATELIER = require("../../assets/baghera/ambiance-atelier.jpg");
const BAGHERA_FALLBACKS = [BAGHERA_IMG_BAGHEERA, BAGHERA_IMG_MOWGLI, BAGHERA_IMG_SHEREKAN];
const getBagheraOrderImage = (item) => {
  if (!item) return BAGHERA_IMG_BRUNCH;
  if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) return { uri: item.image };
  const h = `${item.name || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
  if (/(café|cafe|the|thé|latte|cappuccino|espresso|moka|chocolat|boisson|jus|smoothie|tea|coffee)/.test(h)) return BAGHERA_IMG_ATELIER;
  if (/(brunch|œuf|oeuf|egg|pancake|avocat|avocado|toast|granola|yaourt|porridge|tartine)/.test(h)) return BAGHERA_IMG_BRUNCH;
  if (/(burger|sandwich|panini|wrap|club|bagel|viande|bœuf|boeuf|poulet|chicken|steak)/.test(h)) return BAGHERA_IMG_SHEREKAN;
  if (/(salade|salad|bowl|veggie|végé|vegan|légume|legume|crudité|quinoa|buddha)/.test(h)) return BAGHERA_IMG_MOWGLI;
  if (/(dessert|sucré|sucre|gâteau|gateau|tarte|cake|pâtisserie|patisserie|cookie|brownie|crème|creme|glace)/.test(h)) return BAGHERA_IMG_BAGHEERA;
  const idx = (item.name || '').length % BAGHERA_FALLBACKS.length;
  return BAGHERA_FALLBACKS[idx];
};

// 🔑 LEGACY 0.4-A — Fallback synchrone tant que la tee styleKey n'est pas
// branchée AVANT OrderScreen dans le flow (MenuScreen / App.jsx ne montent
// pas useRestaurantConfig en amont, donc themeKey.styleKey peut être null
// au premier render). À retirer Phase 0.6 quand setSession() sera garanti
// pre-mount via tee globale au boot.
const GRILLZ_RESTAURANT_ID_FALLBACK = "695e4300adde654b80f6911a";

// 🚨 BDD-DEBT 0.4-A — La BDD retourne styleKey "grills" (avec S) alors que
// l'ensemble du code (8 helpers getPayment*/getOrder*Tokens dans defaultTheme.js)
// compare strictement à "grillz" (avec Z). Bug latent qui affecte aussi Payment.jsx
// (masqué là-bas car la majorité du look Grillz vient de buildSafeTheme(config.style)
// qui consomme l'objet palette BDD plutôt qu'une comparaison string).
// Normalisation locale ici pour débloquer 0.4-A. Fix définitif Phase 0.6 :
//   — soit migration BDD "grills" → "grillz" (nécessite confirmation user + Render redeploy)
//   — soit alias global STYLE_KEY_ALIASES dans defaultTheme.js
const normalizeStyleKey = (key) => {
  if (!key) return null;
  const lower = String(key).toLowerCase();
  if (lower === "grills") return "grillz";
  return lower;
};

const resolveStyleKeyFallback = (themeKey, config, effectiveRestaurantId) => {
  if (themeKey?.styleKey) return normalizeStyleKey(themeKey.styleKey);
  if (config?.styleKey) return normalizeStyleKey(config.styleKey);
  if (effectiveRestaurantId === GRILLZ_RESTAURANT_ID_FALLBACK) return "grillz";
  return null;
};

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
// SEND-NOW SLIDER (slide pour envoyer immédiatement avant la fin du timer)
// ═══════════════════════════════════════════════════════════════════════════
const SendNowSlider = ({ countdown, onConfirm, isBaghera = false }) => {
  const TRACK_W = width - 48;
  const THUMB_W = 56;
  const TRAVEL = TRACK_W - THUMB_W - 8;
  const translateX = useRef(new Animated.Value(0)).current;
  const confirmedRef = useRef(false);
  const palette = isBaghera
    ? { track: BAGHERA_PALETTE.white, border: BAGHERA_PALETTE.linen, thumb: BAGHERA_PALETTE.terracotta, label: BAGHERA_PALETTE.sage, hint: BAGHERA_PALETTE.terracotta }
    : { track: "#FFF7ED", border: "#FDBA74", thumb: "#F97316", label: "#9A6938", hint: "#C2410C" };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const x = Math.max(0, Math.min(g.dx, TRAVEL));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx >= TRAVEL * 0.85 && !confirmedRef.current) {
          confirmedRef.current = true;
          Animated.timing(translateX, { toValue: TRAVEL, duration: 120, useNativeDriver: true }).start(() => {
            onConfirm?.();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7, tension: 60 }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 4 }}>
      <View style={{
        height: 64,
        borderRadius: 32,
        backgroundColor: palette.track,
        borderWidth: 1,
        borderColor: palette.border,
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <Text style={{
          textAlign: "center",
          color: palette.label,
          fontSize: 14,
          fontStyle: isBaghera ? "italic" : "normal",
          fontFamily: isBaghera ? "InstrumentSerif-Italic" : undefined,
        }}>
          Glissez pour envoyer maintenant ({countdown}s)
        </Text>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: THUMB_W,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.thumb,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateX }],
            shadowColor: palette.thumb,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="chevron-right" size={32} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

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
  const { t } = useTranslation();
  // Stores
  const storeRestaurantId = useRestaurantStore((state) => state.id);
  const restaurantCategory = useRestaurantStore((state) => state.category);
  const effectiveRestaurantId = restaurantId || storeRestaurantId;
  const isFoodtruck = restaurantCategory === "foodtruck";
  const isFastFood = restaurantCategory === "fast-food";

  // � Phase 0.4-A — useThemeKey() coexiste avec useRestaurantConfig (strangler).
  // styleKey est la single source of truth tenant identity (cf. useThemeKey JSDoc).
  // Fallback sur config?.styleKey tant que la propagation tees Phase 0.3 n'est
  // pas garantie sur tous les chemins de boot (deep links, refresh).
  const themeKey = useThemeKey();
  const { config } = useRestaurantConfig(effectiveRestaurantId);
  // 🔑 Phase 0.4-A — Résolution styleKey en 3 niveaux :
  //   1) themeKey.styleKey (canonical Zustand, single source of truth)
  //   2) config.styleKey (fetch backend, ~300ms après mount)
  //   3) hash hardcoded fallback (LEGACY 0.4-A — synchrone au 1er render)
  // Niveau 3 nécessaire car OrderScreen est le 1er écran à monter
  // useRestaurantConfig dans le flow (MenuScreen ne le fait pas).
  const resolvedStyleKey = resolveStyleKeyFallback(themeKey, config, effectiveRestaurantId);
  // 🆕 Phase 3.4 — Baghera tenant override (démo client 13 mai 2026)
  // Iso-strict cucina/grillz : on délègue aux helpers existants pour ces styleKey,
  // et on shortcut vers les tokens Baghera quand styleKey === 'baghera'.
  const isBaghera = resolvedStyleKey === 'baghera';
  const orderContainerTokens = useMemo(
    () => isBaghera ? {
      background: BAGHERA_PALETTE.linen,
      emptyTextColor: BAGHERA_PALETTE.sage,
    } : getOrderContainerTokens(resolvedStyleKey),
    [resolvedStyleKey, isBaghera],
  );
  const orderHeaderTokens = useMemo(
    () => isBaghera ? {
      titleColor: BAGHERA_PALETTE.espresso,
      backIconColor: BAGHERA_PALETTE.espresso,
    } : getOrderHeaderTokens(resolvedStyleKey),
    [resolvedStyleKey, isBaghera],
  );
  const orderSummaryTokens = useMemo(
    () => isBaghera ? {
      textColor: BAGHERA_PALETTE.espresso,
      dateColor: BAGHERA_PALETTE.sage,
      priceColor: BAGHERA_PALETTE.terracotta,
    } : getOrderSummaryTokens(resolvedStyleKey),
    [resolvedStyleKey, isBaghera],
  );
  const orderCardTokens = useMemo(
    () => isBaghera ? {
      cardBackground: BAGHERA_PALETTE.white,
      cardBorderOverride: { borderWidth: 1, borderColor: BAGHERA_PALETTE.linen },
      productNameColor: BAGHERA_PALETTE.espresso,
      productPriceColor: BAGHERA_PALETTE.terracotta,
    } : getOrderCardTokens(resolvedStyleKey),
    [resolvedStyleKey, isBaghera],
  );
  const orderFooterTokens = useMemo(
    () => isBaghera ? {
      footerBackground: BAGHERA_PALETTE.linen,
      payBtnBackground: BAGHERA_PALETTE.terracotta,
      cancelBtnBorderColor: BAGHERA_PALETTE.linen,
      cancelBtnTextColor: BAGHERA_PALETTE.sage,
    } : getOrderFooterTokens(resolvedStyleKey),
    [resolvedStyleKey, isBaghera],
  );

  // �🚪 Écouter fermeture réservation WebSocket
  useReservationStatus(effectiveRestaurantId, reservationId, onReservationClosed, tableId);

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

  // 🚀 Slide-to-send-now : court-circuite le timer et envoie immédiatement
  const triggerSendNow = useCallback(() => {
    if (hasAutoSubmitted.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    hasAutoSubmitted.current = true;
    setCountdown(0);
    setIsSubmitted(true);
    onAutoSubmitRef.current?.();
  }, []);

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
    <View style={[styles.container, { backgroundColor: orderContainerTokens.background }]}>
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
            onPress={onBack}
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
              }}>{t("votre commande")}</Text>
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
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={28} color={orderHeaderTokens.backIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: orderHeaderTokens.titleColor }]}>{t("Ma commande en cours")}</Text>
        </View>
      )}

      {/* SUMMARY */}
      <View style={styles.summarySection}>
        <View style={styles.summaryLeft}>
          <Text style={[
            styles.summaryText,
            { color: orderSummaryTokens.textColor },
            isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontSize: 14 },
          ]} numberOfLines={2}>
            {summaryText || t("Aucun article")}
          </Text>
          <Text style={[
            styles.summaryDate,
            { color: orderSummaryTokens.dateColor },
            isBaghera && { fontFamily: BAGHERA_FONTS.sans },
          ]}>{dateText}</Text>
        </View>
        <Text style={[
          styles.summaryPrice,
          { color: orderSummaryTokens.priceColor },
          isBaghera && { fontFamily: BAGHERA_FONTS.mono, fontWeight: '400', fontSize: 24 },
        ]}>{total.toFixed(2)}€</Text>
      </View>

      {/* 🍔 STATUS BANNER (foodtruck / fast-food) — masqué pendant le countdown (le slider fait foi) */}
      {(isFoodtruck || isFastFood) && !canCancel && (
        <View style={[styles.statusBanner, isFoodtruck ? styles.statusBannerFoodtruck : styles.statusBannerFastfood]}>
          <MaterialIcons
            name={isFoodtruck ? "delivery-dining" : "restaurant"}
            size={20}
            color={isFoodtruck ? "#FF6B00" : "#4CAF50"}
          />
          <Text style={styles.statusBannerText}>
            {isFoodtruck
              ? "Commande reçue — Payez pour lancer la préparation"
              : "Préparation en cours — Payez quand vous êtes prêt"}
          </Text>
        </View>
      )}

      {/* PRODUCT CARDS */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={80} color="#4ECDC4" />
            <Text style={[styles.emptyText, { color: orderContainerTokens.emptyTextColor }]}>{t("Aucune commande")}</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const itemPrice = (item.price || 0) * (item.quantity || 1);

            return (
              <View
                key={item._id || `item-${index}`}
                style={[
                  styles.card,
                  { backgroundColor: orderCardTokens.cardBackground },
                  orderCardTokens.cardBorderOverride,
                  isBaghera && { borderRadius: 20, padding: 14 },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.productImageContainer, isBaghera && { borderRadius: 14, overflow: 'hidden' }]}>
                    <Image
                      source={isBaghera ? getBagheraOrderImage(item) : PANINI_IMAGE}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={[
                      styles.productName,
                      { color: orderCardTokens.productNameColor },
                      isBaghera && { fontFamily: BAGHERA_FONTS.black, fontSize: 18, fontWeight: '400' },
                    ]}>{item.name}</Text>
                    <Text style={[
                      styles.productPrice,
                      { color: orderCardTokens.productPriceColor },
                      isBaghera && { fontFamily: BAGHERA_FONTS.mono, fontSize: 18, fontWeight: '400' },
                    ]}>{itemPrice.toFixed(2)}€</Text>
                  </View>
                  <View style={[
                    styles.quantityBadge,
                    isBaghera && { backgroundColor: BAGHERA_PALETTE.terracotta },
                  ]}>
                    <Text style={[
                      styles.quantityBadgeText,
                      isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontWeight: '600' },
                    ]}>x{item.quantity || 1}</Text>
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
        <View style={[styles.footer, { backgroundColor: orderFooterTokens.footerBackground }]}>
          {/* 🚀 Pendant le countdown : slide-to-send-now à la place du bouton Payer */}
          {canCancel ? (
            <SendNowSlider
              countdown={countdown}
              onConfirm={triggerSendNow}
              isBaghera={isBaghera}
            />
          ) : (
            <TouchableOpacity 
              style={[
                styles.payBtn,
                { backgroundColor: orderFooterTokens.payBtnBackground },
                isBaghera && { borderRadius: 28, paddingVertical: 16, shadowOpacity: 0 },
              ]} 
              onPress={onPayNow} 
              activeOpacity={0.9}
            >
              <Text style={[
                styles.payBtnText,
                isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontWeight: '600', letterSpacing: 0.3 },
              ]}>
                {`Payer maintenant • ${total.toFixed(2)}€`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.9}>
              <Text style={styles.backButtonText}>{t("Retour au menu")}</Text>
            </TouchableOpacity>

            {/* 🍔 Fast-food: cancel cliquable pendant 10s uniquement */}
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { borderColor: orderFooterTokens.cancelBtnBorderColor },
                canCancel && styles.cancelBtnActive,
                (pendingOrder && !canCancel) && styles.cancelBtnDisabled,
              ]}
              onPress={canCancel ? onCancelOrder : (pendingOrder ? undefined : onCancelOrder)}
              activeOpacity={canCancel ? 0.7 : (pendingOrder ? 1 : 0.9)}
              disabled={pendingOrder && !canCancel}
            >
              <Text style={[
                styles.cancelBtnText,
                { color: orderFooterTokens.cancelBtnTextColor },
                canCancel && styles.cancelBtnTextActive,
                (pendingOrder && !canCancel) && styles.cancelBtnTextDisabled,
              ]}>
                {canCancel
                  ? `Annuler`
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
});
