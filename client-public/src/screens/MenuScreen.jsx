/**
 * ═══════════════════════════════════════════════════════════════
 * MenuScreen.jsx — ÉTAPE 2 : CONSULTATION MENU & CONSTITUTION DU PANIER
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client :
 *   1. Charge le menu complet depuis l'API (GET /products/restaurant/:id)
 *   2. Affiche les catégories (pills) et les produits filtrés
 *   3. L'utilisateur sélectionne des plats → ajout au panier (useOrderStore)
 *   4. Gestion des add-ons (options produit) via modal AddOnFlow
 *   5. Bouton "Commander" → ouvre OrderSummary (récapitulatif)
 *   6. Validation → soumission commande (POST /orders) ou navigation fast-food
 *
 * Fonctionnalités secondaires :
 *   - Thème conditionnel par restaurant (Grillz dark, Cucina vert, défaut)
 *   - Modal détail produit (zoom image, description)
 *   - Préférences alimentaires (allergènes, restrictions)
 *   - WebSocket pour mise à jour du style en temps réel
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Easing } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import * as Font from 'expo-font';
import useProductStore from "../stores/useProductStore";
import { useOrderStore } from "../stores/useOrderStore";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import OrderSummary from "./OrderSummary";
import DietaryPreferences from "./DietaryPreferences";
import AddOnFlow from "../components/menu/AddOnFlow";
import { useStyleUpdates } from "../hooks/useSocketClient";
import socketService from "../services/socketService";
import useTheme from "../hooks/useThemeNew"; // 🎨 NOUVEAU: Hook thème
import useThemeKey from "../hooks/useThemeKey";
import { useTranslation } from "../hooks/useTranslation";
import { BAGHERA_PALETTE, BAGHERA_FONTS, getMenuBagheraTokens } from "../theme/bagheraTheme";

// Image placeholder
const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");

// =============================================================================
// 🎨 BAGHERA — Mapping image cohérente par produit (Unsplash + fallback local)
// =============================================================================
// Stratégie 3 niveaux :
//   1. Match exact par nom normalisé (ex. "espresso", "cappuccino", "mimosa")
//      → URL Unsplash dédiée et photogenique du produit réel.
//   2. Fallback catégorie : si pas de match exact, on pioche dans une liste
//      d'URLs cohérentes pour la grande famille (cafés, cocktails, jus, brunch,
//      desserts, plats, viandes, veggie). Choix déterministe par hash du nom
//      → 2 produits différents dans la même catégorie ont 2 photos différentes.
//   3. Fallback local : si l'URL distante 404 (rare), un <BagheraProductImage>
//      bascule sur l'asset local cohérent (5 visuels Baghera d'ambiance).
//
// Toutes les URLs Unsplash sont en 400×400 fit=crop, q=80, auto=format → pèsent
// ~25-40 KB chacune et sont cachées par défaut par <Image> RN.
// =============================================================================
const BAGHERA_IMG_BRUNCH = require("../../assets/baghera/hero-brunch.jpg");
const BAGHERA_IMG_BAGHEERA = require("../../assets/baghera/signature-bagheera.jpg");
const BAGHERA_IMG_MOWGLI = require("../../assets/baghera/signature-mowgli.jpg");
const BAGHERA_IMG_SHEREKAN = require("../../assets/baghera/signature-shere-kan.jpg");
const BAGHERA_IMG_ATELIER = require("../../assets/baghera/ambiance-atelier.jpg");

// Helper builder Unsplash → 400×400 crop optimisé
const u = (id) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80&auto=format`;

// Pools catégories — plusieurs URLs par famille pour varier visuellement
const POOL_COFFEE = [
  u('1510707577719-ae7c14805e3a'), // espresso shot
  u('1495474472287-4d71bcdd2085'), // pour-over chemex
  u('1517256064527-09c73fc73e38'), // latte art top view
  u('1497935586351-b67a49e012bf'), // cappuccino mug
];
const POOL_COCKTAIL = [
  u('1551538827-9c037cb4f32a'), // aperol spritz
  u('1551024709-8f23befc6f87'), // red cocktail
  u('1567696911980-2eed69a46042'), // mimosa flute
  u('1514362545857-3bc16c4c7d1b'), // bar cocktail dark
];
const POOL_JUICE = [
  u('1600271886742-f049cd451bba'), // orange juice glass
  u('1610970881699-44a5587cabec'), // green juice
  u('1546173159-315724a31696'), // detox green
  u('1564631027894-5bdb17618445'), // smoothie fruits
];
const POOL_BRUNCH = [
  u('1551892589-865f69869476'), // eggs benedict
  u('1567620905732-2d1ec7ab7445'), // pancakes stack
  u('1541519481457-763224276691'), // avocado toast
  u('1525351484163-7529414344d8'), // brunch table flat lay
];
const POOL_VEGGIE = [
  u('1546069901-ba9599a7e63c'), // buddha bowl
  u('1505253758473-96b7015fcd40'), // green salad
  u('1540420773420-3366772f4999'), // veggie bowl
  u('1543353071-10c8ba85a904'), // hummus mezze
];
const POOL_MEAT = [
  u('1546833999-b9f581a1996d'), // burger
  u('1565299624946-b28f40a0ca4b'), // pizza slice
  u('1432139509613-5c4255815697'), // steak plate
  u('1551183053-bf91a1d81141'), // pasta bowl
];
const POOL_DESSERT = [
  u('1565958011703-44f9829ba187'), // cheesecake
  u('1551024601-bec78aea704b'), // tiramisu
  u('1488477181946-6428a0291777'), // chocolate cake
  u('1505253213348-5fa3e9a1a1c8'), // dessert plated
];

// Mapping par catégorie (sortie : [pool, fallbackLocal])
const BAGHERA_CATEGORY_MAP = {
  drink: [POOL_COFFEE, BAGHERA_IMG_ATELIER],
  cocktail: [POOL_COCKTAIL, BAGHERA_IMG_ATELIER],
  juice: [POOL_JUICE, BAGHERA_IMG_MOWGLI],
  brunch: [POOL_BRUNCH, BAGHERA_IMG_BRUNCH],
  veggie: [POOL_VEGGIE, BAGHERA_IMG_MOWGLI],
  meat: [POOL_MEAT, BAGHERA_IMG_SHEREKAN],
  dessert: [POOL_DESSERT, BAGHERA_IMG_BAGHEERA],
};

// Mapping exact par nom normalisé (priorité absolue)
// Clé = stripAccents(item.name) en lowercase
const BAGHERA_EXACT_MAP = {
  // Cafés
  'espresso': u('1510707577719-ae7c14805e3a'),
  'cappuccino': u('1497935586351-b67a49e012bf'),
  'flat white': u('1517256064527-09c73fc73e38'),
  'latte': u('1517256064527-09c73fc73e38'),
  'filter — origines': u('1495474472287-4d71bcdd2085'),
  'filter origines': u('1495474472287-4d71bcdd2085'),
  'filter': u('1495474472287-4d71bcdd2085'),
  'cafe filtre': u('1495474472287-4d71bcdd2085'),
  'noisette': u('1497935586351-b67a49e012bf'),
  'macchiato': u('1497935586351-b67a49e012bf'),
  'americano': u('1510707577719-ae7c14805e3a'),
  'matcha': u('1545048702-79362596cdc9'),
  'chai latte': u('1545048702-79362596cdc9'),
  // Cocktails
  'bloody baghera': u('1551024709-8f23befc6f87'),
  'bloody mary': u('1551024709-8f23befc6f87'),
  'mimosa': u('1567696911980-2eed69a46042'),
  'spritz sauvage': u('1551538827-9c037cb4f32a'),
  'spritz': u('1551538827-9c037cb4f32a'),
  'aperol spritz': u('1551538827-9c037cb4f32a'),
  'mojito': u('1551538827-9c037cb4f32a'),
  // Jus
  'sun booster': u('1600271886742-f049cd451bba'),
  'detox green': u('1610970881699-44a5587cabec'),
  'jus orange': u('1600271886742-f049cd451bba'),
  'jus pomme': u('1564631027894-5bdb17618445'),
  // Brunch / Salé
  'shere kan': u('1525351484163-7529414344d8'), // brunch table — saumon fumé / œufs / toast
  'baloo': u('1567620905732-2d1ec7ab7445'),     // pancakes stack
  'shanti': u('1546069901-ba9599a7e63c'),       // bowl houmous / légumes
  'raksha': u('1541519481457-763224276691'),    // avocado toast / œuf poché
  'mowgli': u('1505253758473-96b7015fcd40'),    // salade fraîche
  'bagheera': u('1488477181946-6428a0291777'),  // chocolate cake — dessert signature
};

// Normalise une string (lowercase + retire accents)
const stripAccents = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Hash 32-bit déterministe
const hashString = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Détecte la catégorie d'un produit via mots-clés (ordre = priorité)
const detectBagheraCategory = (item) => {
  const hay = stripAccents(`${item?.name || ''} ${item?.category || ''} ${item?.description || ''}`);
  // Boissons sucrées / alcool
  if (/(spritz|mojito|cocktail|mocktail|bloody|mimosa|gin|vodka|rhum|aperol|martini|negroni|margarita|champagne|prosecco|vin|wine|biere|bière|beer|ipa|lager)/.test(hay)) return 'cocktail';
  if (/(jus|juice|smoothie|milkshake|detox|booster|limonade|lemonade)/.test(hay)) return 'juice';
  if (/(cafe|espresso|cappuccino|cappucino|latte|flat white|ristretto|americano|macchiato|noisette|matcha|the |thé|tea|chai|chocolat chaud|cacao|infusion|rooibos)/.test(hay)) return 'drink';
  // Sucré
  if (/(dessert|gateau|gâteau|cake|tarte|patisserie|pâtisserie|cookie|brownie|tiramisu|cheesecake|fondant|mousse|panna|cotta|glace|sorbet|macaron|eclair|éclair|crème|creme|caramel|praline|praliné|sucre|sucré)/.test(hay)) return 'dessert';
  // Veggie / salade / bowl
  if (/(salade|salad|bowl|buddha|veggie|vegan|végé|legume|légume|crudité|quinoa|houmous|hummus|burrata|gaspacho|soupe)/.test(hay)) return 'veggie';
  // Brunch / œufs / toast
  if (/(brunch|oeuf|œuf|egg|omelette|benedict|pancake|gaufre|crêpe|crepe|granola|porridge|toast|tartine|avocat|avocado|saumon)/.test(hay)) return 'brunch';
  // Plats / viandes / pizzas / pâtes
  if (/(burger|sandwich|panini|pizza|pasta|pâtes|pates|risotto|lasagne|spaghetti|steak|tartare|boeuf|bœuf|poulet|chicken|magret|saumon|thon|crevette|gambas|frites)/.test(hay)) return 'meat';
  return null;
};

/**
 * Retourne { uri, fallback } pour un produit Baghera.
 *  - uri      → URL Unsplash (ou BDD si présente)
 *  - fallback → require local Baghera utilisé si l'URL 404
 *  - Si pas de match du tout, retourne directement le require local.
 */
const getBagheraProductSource = (item) => {
  if (!item) return { local: BAGHERA_IMG_BRUNCH };

  // 1) URL BDD prioritaire
  if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
    return { uri: item.image, fallback: BAGHERA_IMG_BRUNCH };
  }

  const nameKey = stripAccents(item.name || '');

  // 2) Match exact par nom
  if (nameKey && BAGHERA_EXACT_MAP[nameKey]) {
    return { uri: BAGHERA_EXACT_MAP[nameKey], fallback: BAGHERA_IMG_BRUNCH };
  }

  // 3) Détection catégorie + pool d'URLs
  const cat = detectBagheraCategory(item);
  if (cat && BAGHERA_CATEGORY_MAP[cat]) {
    const [pool, fallbackLocal] = BAGHERA_CATEGORY_MAP[cat];
    const uri = pool[hashString(nameKey || cat) % pool.length];
    return { uri, fallback: fallbackLocal };
  }

  // 4) Fallback local pur (rotation par hash)
  const fallbacks = [BAGHERA_IMG_BAGHEERA, BAGHERA_IMG_MOWGLI, BAGHERA_IMG_SHEREKAN, BAGHERA_IMG_BRUNCH];
  return { local: fallbacks[hashString(nameKey || 'baghera') % fallbacks.length] };
};

/**
 * Composant <Image> wrapper : tente l'URI distante, bascule sur le require
 * local si erreur réseau (404, offline, timeout). Évite les icônes "image
 * cassée" disgracieuses.
 */
const BagheraProductImage = React.memo(function BagheraProductImage({ item, style, resizeMode = 'cover' }) {
  const source = useMemo(() => getBagheraProductSource(item), [item?.name, item?.category, item?.image]);
  const [errored, setErrored] = useState(false);

  // Cas 1 : pas d'URI → directement le local
  if (source.local) {
    return <Image source={source.local} style={style} resizeMode={resizeMode} />;
  }

  // Cas 2 : URI + fallback local
  if (errored && source.fallback) {
    return <Image source={source.fallback} style={style} resizeMode={resizeMode} />;
  }

  return (
    <Image
      source={{ uri: source.uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setErrored(true)}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 COULEURS
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  primary: "#FF6B6B",
  accent: "#4ECDC4", 
  background: "#F8F9FA",
  text: "#2D3142",
  textLight: "#666666",
  cardBg: "#FFFFFF",
  inputBg: "#F5F5F5",
  backimage: "#763f00",
};

export default function MenuScreen({
  restaurantId,
  tableId,
  reservationId,
  clientId,
  onBack = () => {},
  onNavigateToOrders = () => {},
  onNavigateToPayment = () => {},
  onAdd = () => {},
}) {
  // 🍝 CUCINA: Détection restaurant
  const isCucina = restaurantId === '6970ef6594abf8bacd9d804d';
  const isGrillz = restaurantId === '695e4300adde654b80f6911a';

  // 🆕 Phase 3.3 — BAGHERA tenant (démo 13 mai 2026)
  // Basé sur styleKey (single source of truth useThemeKey) au lieu d'un hash
  // restaurantId hardcodé, car Baghera n'a pas encore d'entrée en BDD.
  const { styleKey } = useThemeKey();
  const isBaghera = styleKey === 'baghera';
  const bagheraTokens = getMenuBagheraTokens(styleKey);
  
  // States - Cucina, Grillz et Baghera commencent sans catégorie sélectionnée (message commercial)
  const [selectedCategory, setSelectedCategory] = useState((isCucina || isGrillz || isBaghera) ? null : "sandwich");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [addOnsModalVisible, setAddOnsModalVisible] = useState(false);
  const [currentProductWithAddOns, setCurrentProductWithAddOns] = useState(null);
  
  // 🔥 GRILLZ: Product Detail Modal
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🎨 BAGHERA — underline animée qui glisse entre les catégories
  const tabLayoutsRef = useRef({}); // { catId: { x, width } }
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineW = useRef(new Animated.Value(0)).current;
  const underlineOpacity = useRef(new Animated.Value(0)).current;

  // 🎨 BAGHERA — modale "Le mot du chef" (storytelling au tap sur le logo panthère)
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyMounted, setStoryMounted] = useState(false); // garde la modale montée pendant l'anim de sortie
  const storyBackdrop = useRef(new Animated.Value(0)).current;
  const storyCard = useRef(new Animated.Value(0)).current;
  const storyLogoPulse = useRef(new Animated.Value(1)).current;

  const openStoryModal = () => {
    // micro-feedback sur le logo (pulse léger)
    Animated.sequence([
      Animated.timing(storyLogoPulse, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.timing(storyLogoPulse, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    setStoryMounted(true);
    setShowStoryModal(true);
  };

  const closeStoryModal = () => {
    Animated.parallel([
      Animated.timing(storyCard, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(storyBackdrop, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShowStoryModal(false);
        setStoryMounted(false);
      }
    });
  };

  useEffect(() => {
    if (!showStoryModal) return;
    storyBackdrop.setValue(0);
    storyCard.setValue(0);
    Animated.parallel([
      Animated.timing(storyBackdrop, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(storyCard, {
        toValue: 1,
        duration: 560,
        delay: 80,
        easing: Easing.bezier(0.6, 0.05, 0.1, 1), // BAGHERA silk
        useNativeDriver: true,
      }),
    ]).start();
  }, [showStoryModal]);

  useEffect(() => {
    if (!isBaghera) return;
    if (!selectedCategory) {
      Animated.timing(underlineOpacity, {
        toValue: 0, duration: 120, useNativeDriver: false,
      }).start();
      return;
    }
    const layout = tabLayoutsRef.current[selectedCategory];
    if (!layout) return;
    const targetW = layout.width * 0.7;
    const targetX = layout.x + (layout.width - targetW) / 2;
    Animated.parallel([
      Animated.timing(underlineX, { toValue: targetX, duration: 180, useNativeDriver: false }),
      Animated.timing(underlineW, { toValue: targetW, duration: 180, useNativeDriver: false }),
      Animated.timing(underlineOpacity, { toValue: 1, duration: 140, useNativeDriver: false }),
    ]).start();
  }, [selectedCategory, isBaghera]);
  
  // Stores - EXACTEMENT comme Menu.jsx
  const { t } = useTranslation();
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const { currentOrder, allOrders, addToOrder, updateOrderQuantity, submitOrder, initCart, getTotalItems, getTotalPrice } = useOrderStore();
  
  // Store restaurant pour le nom + catégorie
  const restaurantName = useRestaurantStore((state) => state.name);
  const restaurantCategory = useRestaurantStore((state) => state.category);
  const fetchRestaurantInfo = useRestaurantStore((state) => state.fetchRestaurantInfo);
  
  // 🎨 NOUVEAU: Hook thème avec caching multi-level
  const { 
    colors: themeColors, 
    gradients: themeGradients, 
    getGradient,
  } = useTheme(restaurantId);
  
  // États pour userName
  const [userName, setUserName] = useState(null);

  // ⭐ WebSocket - Écouter les changements de style en temps réel
  const { style: liveStyle } = useStyleUpdates(restaurantId);

  // 🎨 Charger la police DXNacky (Cucina uniquement)
  useEffect(() => {
    if (!isCucina) return;
    const loadFont = async () => {
      try {
        await Font.loadAsync({
          'DXNacky': require('../../assets/images/dx-nacky-font/dxnacky-light-free-personal-use.otf'),
        });
        setFontLoaded(true);
      } catch (error) {
        console.warn('Police DXNacky non chargée:', error);
        setFontLoaded(false);
      }
    };
    loadFont();
  }, [isCucina]);

  // 🏪 Charger les infos du restaurant (nom, etc)
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantInfo(restaurantId);
    } else {
      console.warn("⚠️ [MenuScreen] restaurantId est falsy dans useEffect restaurantInfo");
    }
  }, [restaurantId]);
  
  // Init cart avec userName
  useEffect(() => {
    const initializeCart = async () => {
      const name = await AsyncStorage.getItem("currentClientName");
      if (name) {
        setUserName(name);
        await initCart(name, false); // Ne pas clear le panier existant
      }
    };
    initializeCart();
  }, []);
  
  // Charger les commandes existantes (reprise de session)
  useEffect(() => {
    if (reservationId && clientId) {
      useOrderStore.getState().fetchOrdersByReservation(reservationId, clientId);
    }
  }, [reservationId, clientId]);

  // ⭐ SYNC TEMPS RÉEL — écouter les events socket pour rafraîchir les orders
  useEffect(() => {
    if (!reservationId && !tableId) return;

    // Rafraîchir allOrders si une order de cette table/réservation change
    const handleOrderEvent = (payload) => {
      const data = payload?.data || payload;
      const orderResaId = data?.reservationId?._id?.toString() || data?.reservationId?.toString();
      const orderTableId = data?.tableId?._id?.toString() || data?.tableId?.toString();
      const matchesResa = reservationId && orderResaId === reservationId.toString();
      const matchesTable = tableId && orderTableId === orderTableId.toString();
      if (matchesResa || matchesTable) {
        useOrderStore.getState().fetchOrdersByReservation(reservationId, clientId);
      }
    };

    // Rafraîchir si la session est fermée (table libérée côté frontend)
    const handleTableSession = (payload) => {
      const data = payload?.data || payload;
      const eventTableId = data?.tableId?._id?.toString() || data?.tableId?.toString();
      if (tableId && eventTableId === tableId.toString() && payload?.type === "closed") {
        useOrderStore.getState().fetchOrdersByReservation(reservationId, clientId);
      }
    };

    // ✅ GAP #5 FIX : Écouter les changements de réservation (annulation, modification)
    const handleReservationEvent = (payload) => {
      const { type, data } = payload || {};
      const resaId = data?._id?.toString() || data?.id?.toString();
      
      // Filtrer : uniquement notre réservation
      if (!reservationId || resaId !== reservationId.toString()) return;
      
      // Si réservation annulée → notifier client et retour à l'écran précédent
      if (type === "statusUpdated" && data.status === "cancelled") {
        Alert.alert(
          "Réservation annulée",
          "Votre réservation a été annulée par le restaurant. Merci de contacter le restaurant pour plus d'informations.",
          [{ text: "OK", onPress: () => onBack?.() }],
          { cancelable: false }
        );
      }
      
      // Si réservation modifiée (table, heure, etc.) → refresh orders pour sync
      if (type === "updated") {
        useOrderStore.getState().fetchOrdersByReservation(reservationId, clientId);
      }
    };

    socketService.on("order", handleOrderEvent);
    socketService.on("table-session", handleTableSession);
    socketService.on("reservation", handleReservationEvent); // ✅ AJOUTÉ

    return () => {
      socketService.off("order", handleOrderEvent);
      socketService.off("table-session", handleTableSession);
      socketService.off("reservation", handleReservationEvent); // ✅ AJOUTÉ
    };
  }, [reservationId, clientId, tableId, onBack]); // ✅ Ajout onBack dans les deps
  
  // Charger les produits - EXACTEMENT comme Menu.jsx
  // ── PARCOURS : charge le menu complet depuis l'API ──
  useEffect(() => {
    const loadProducts = async (retries = 3) => {
      try {
		const clientToken = await clientAuthService.getClientToken();
        if (clientToken) {
          await fetchProducts(clientToken, restaurantId);
        } else if (retries > 0) {
          // Token pas encore disponible — retry après un court délai
          console.log(`⏳ [MenuScreen] Token pas encore prêt, retry dans 500ms (${retries} restants)`);
          setTimeout(() => loadProducts(retries - 1), 500);
        } else {
          console.warn("⚠️ [MenuScreen] Pas de token après retries — retour au join");
          onBack?.();
        }
      } catch (error) {
        console.error("❌ Error loading products:", error);
      }
    };
    if (restaurantId) {
      loadProducts();
    } else {
      console.warn("⚠️ [MenuScreen] restaurantId est falsy dans useEffect produits");
    }
  }, [restaurantId]);

  // 🏷️ Générer les catégories dynamiquement depuis les produits
  const getCategories = () => {
    const uniqueCategories = new Set();
    products.forEach((p) => {
      if (p.category) {
        uniqueCategories.add(p.category.toLowerCase());
      }
    });
    
    // Mapper les catégories à emojis
    const categoryMap = {
      "sandwich": { name: "Sandwichs", emoji: "🥪" },
      "chicken": { name: "Poulet", emoji: "🍗" },
      "entrees": { name: "Entrées", emoji: "🥗" },
      "pizzas": { name: "Pizzas", emoji: "🍕" },
      "desserts": { name: "Desserts", emoji: "🍰" },
      "boissons": { name: "Boissons", emoji: "🥤" },
      "cafes": { name: "Cafés", emoji: "☕" },
      "autre": { name: "Autres", emoji: "🍽️" },
      "drink": { name: "Boissons", emoji: "🥤" },
      "hot": { name: "Chaud", emoji: "🔥" },
    };
    
    const categories = Array.from(uniqueCategories).map((cat) => ({
      id: cat,
      name: categoryMap[cat]?.name || cat.charAt(0).toUpperCase() + cat.slice(1),
      emoji: categoryMap[cat]?.emoji || "🍽️",
    }));
    
    // Trier: sandwich en premier, puis par ordre alphabétique
    return categories.sort((a, b) => {
      if (a.id === "sandwich") return -1;
      if (b.id === "sandwich") return 1;
      return a.name.localeCompare(b.name);
    });
  };
  
  // 🍝 CUCINA: Catégories fixes
  const cucinaCategories = [
    { id: "panini", name: "Panini", emoji: "🥪" },
    { id: "sides", name: "Sides", emoji: "🍟" },
    { id: "dessert", name: "Dessert", emoji: "🍰" },
    { id: "boissons", name: "Boissons", emoji: "🥤" },
  ];
  
  // Cucina = catégories fixes, autres = dynamiques
  const categories = isCucina ? cucinaCategories : getCategories();

  // Produits filtrés - utilise le selectedCategory pour filtrer
  const filteredProducts = useMemo(
    () => products.filter((p) => {
      if (!selectedCategory) return false;
      const pCategory = p.category?.toLowerCase() || '';
      const selectedCat = selectedCategory.toLowerCase();
      return pCategory === selectedCat;
    }),
    [products, selectedCategory]
  );

  // Total du panier (dérivé de currentOrder, source unique de vérité)
  const totalItems = getTotalItems();
  const totalAmount = getTotalPrice();

  // Handler pour ajouter un produit - Vérifie si a des addOns
  // ── PARCOURS : ajoute un article au panier (ou ouvre le modal add-ons) ──
  const handleAddProduct = (item) => {
    if (item.allowedAddOns && item.allowedAddOns.length > 0) {
      setCurrentProductWithAddOns(item);
      setAddOnsModalVisible(true);
      return;
    }
    
    // Sinon ajout direct (useOrderStore persiste automatiquement)
    addToOrder(item, userName);
  };

  // Handler quand AddOn flow est complété
  const handleAddOnComplete = (finalItem) => {
    // finalItem contient selectedAddOns, addOnsTotal, finalPrice
    addToOrder(finalItem, userName);
    setAddOnsModalVisible(false);
    setCurrentProductWithAddOns(null);
  };

  // Handler pour retirer un produit
  const handleRemoveProduct = (item) => {
    const currentQty = currentOrder.find(o => o._id === item._id)?.quantity || 0;
    if (currentQty <= 1) {
      // Retirer complètement
      updateOrderQuantity(item, 0);
    } else {
      // Diminuer la quantité
      updateOrderQuantity(item, currentQty - 1);
    }
  };

  // ── PARCOURS : ouvre le récapitulatif (OrderSummary modal) avant envoi ──
  const handlePayPress = async () => {
    // Vérifier qu'il y a des articles dans la commande
    if (currentOrder.length === 0) {
      Alert.alert(t("Panier vide"), t("Veuillez ajouter des articles avant de commander."));
      return;
    }

    setShowOrderSummary(true);
  };



  // ── PARCOURS : confirme et soumet la commande ──
  // Fast-food : skip BDD, navigue directement (10s d'annulation côté OrderScreen)
  // Restaurant/foodtruck : submitOrder() en BDD puis navigation
  const handleConfirmOrder = async () => {
    try {
      // 🍔 FAST-FOOD : ne pas envoyer en BDD immédiatement (délai 10s côté OrderScreen)
      if (restaurantCategory === "fast-food") {
        setShowOrderSummary(false);
        onNavigateToOrders?.();
        return;
      }

      // 📤 Soumettre la commande au serveur (restaurant classique / foodtruck)
      await submitOrder({
        tableId,
        restaurantId,
        reservationId,
        clientId,
        clientName: userName,
      });

      // Fermer le modal
      setShowOrderSummary(false);

      // ✅ Aller à OrderScreen avec les commandes déjà soumises
      onNavigateToOrders?.();
    } catch (error) {
      console.error("❌ Erreur soumission commande:", error);
      Alert.alert(t("Erreur"), t("Impossible d'envoyer la commande: ") + error.message);
    }
  };

  // 🔥 GRILLZ: Fonction pour ouvrir la modale détail produit
  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setDetailQty(currentOrder.find(o => o._id === product._id)?.quantity || 1);
    setSelectedOptions([]);
    setShowProductDetail(true);
    
    // Reset animations
    scaleAnim.setValue(0.8);
    fadeAnim.setValue(0);
    
    // Lancer animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Charger les options du produit depuis l'API
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${product._id}/options`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const options = await response.json();
        setProductOptions(Array.isArray(options) ? options : []);
      } else {
        setProductOptions([]);
      }
    } catch (error) {
      console.error('Erreur chargement options:', error);
      setProductOptions([]);
    }
  };
  
  const closeProductDetail = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowProductDetail(false);
      setSelectedProduct(null);
      setProductOptions([]);
      setSelectedOptions([]);
    });
  };

  const toggleOption = (optionId) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };
  
  const handleDetailAddToCart = () => {
    if (selectedProduct) {
      // Calculer le prix total avec options
      const optionsPrice = selectedOptions.reduce((sum, optId) => {
        const opt = productOptions.find(o => o._id === optId);
        return sum + (opt?.price || 0);
      }, 0);

      const productWithOptions = {
        ...selectedProduct,
        selectedOptions: selectedOptions.map(optId => {
          const opt = productOptions.find(o => o._id === optId);
          return { _id: opt._id, name: opt.name, price: opt.price };
        }),
        basePrice: selectedProduct.price,
        totalPrice: selectedProduct.price + optionsPrice,
      };

      const existing = currentOrder.find(o => o._id === selectedProduct._id);
      const targetQty = (existing?.quantity || 0) + detailQty;
      if (existing) {
        updateOrderQuantity(productWithOptions, targetQty);
      } else {
        addToOrder(productWithOptions, userName);
        if (detailQty > 1) {
          updateOrderQuantity(productWithOptions, detailQty);
        }
      }
      closeProductDetail();
    }
  };

  // Render category tab
  // 🔥 Le Grillz = Style tabs selon spec exacte
  const isGrillzTheme = restaurantId === '695e4300adde654b80f6911a';
  
  const renderCategory = (category) => {
    const isSelected = selectedCategory === category.id;
    
    // 🎨 BAGHERA — catégories minimalistes : texte serif italique + underline ember
    if (isBaghera) {
      return (
        <TouchableOpacity
          key={category.id}
          onPress={() => setSelectedCategory(category.id)}
          activeOpacity={0.7}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            tabLayoutsRef.current[category.id] = { x, width };
            if (selectedCategory === category.id) {
              const targetW = width * 0.7;
              const targetX = x + (width - targetW) / 2;
              underlineX.setValue(targetX);
              underlineW.setValue(targetW);
              underlineOpacity.setValue(1);
            }
          }}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{
            fontFamily: BAGHERA_FONTS.sans,
            fontSize: 15,
            lineHeight: 20,
            color: isSelected ? BAGHERA_PALETTE.espresso : BAGHERA_PALETTE.sage,
            letterSpacing: 0.3,
          }}>
            {category.name}
          </Text>
        </TouchableOpacity>
      );
    }
    
    if (isGrillzTheme) {
      // 🔥 GRILLZ: Catégories avec underline indicator
      return (
        <TouchableOpacity
          key={category.id}
          onPress={() => setSelectedCategory(category.id)}
          activeOpacity={0.7}
          style={{ 
            alignItems: 'center',
            marginHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          {/* TEXT */}
          <Text style={{ 
            color: isSelected ? '#FF8A50' : '#666',
            fontSize: 15,
            fontWeight: isSelected ? '600' : '400',
          }}>
            {category.name}
          </Text>
          
          {/* ACTIVE INDICATOR - underline 2px, alignée sur largeur texte */}
          {isSelected && (
            <View style={{
              height: 2,
              backgroundColor: '#FF8A50',
              alignSelf: 'center',
              marginTop: 5,
              width: '100%',
            }} />
          )}
        </TouchableOpacity>
      );
    }
    
    // Style par défaut pour autres restos
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render carte produit - 🔥 GRILLZ: Cards selon spec exacte
  const renderProduct = ({ item }) => {
    const qty = currentOrder.find(o => o._id === item._id)?.quantity || 0;
    
    if (isGrillzTheme) {
      // 🔥 GRILLZ: Card spec complète
      return (
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: '#141414',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          marginHorizontal: 6,
          marginBottom: 12,
        }}>
          {/* IMAGE - Cliquable pour ouvrir le détail */}
          <TouchableOpacity onPress={() => openProductDetail(item)} activeOpacity={0.8}>
            <Image 
              source={PANINI_IMAGE} 
              style={{ 
                width: 85, 
                height: 85, 
                borderRadius: 10,
                marginRight: 14,
                marginTop: 4,
              }} 
              resizeMode="cover" 
            />
          </TouchableOpacity>
          
          {/* CONTENT STACK - flex column */}
          <View style={{ flex: 1 }}>
            {/* ROW 1: TITLE + PRICE - Title cliquable */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: 6,
            }}>
              <TouchableOpacity onPress={() => openProductDetail(item)} activeOpacity={0.7} style={{ flex: 0.7 }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  marginRight: 8,
                }} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
              <Text style={{
                color: '#FF8A50',
                fontSize: 15,
                fontWeight: '600',
              }}>
                {item.price?.toFixed(2) || '0.00'}€
              </Text>
            </View>
            
            {/* DESCRIPTION - 2 lignes pour compenser les calories supprimées */}
            <Text style={{
              color: '#777',
              fontSize: 12,
              lineHeight: 17,
              marginBottom: 14,
            }} numberOfLines={2}>
              {item.description}
            </Text>
            
            {/* ROW: QUANTITY + BUTTON */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
            }}>
              {/* QUANTITY SELECTOR */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 8,
              }}>
                <TouchableOpacity
                  onPress={() => qty > 0 && handleRemoveProduct(item)}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="remove" size={14} color="#777" />
                </TouchableOpacity>
                
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '500',
                  marginHorizontal: 10,
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {qty}
                </Text>
                
                <TouchableOpacity
                  onPress={() => handleAddProduct(item)}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={14} color="#777" />
                </TouchableOpacity>
              </View>
              
              {/* ADD TO CART BUTTON */}
              <TouchableOpacity
                onPress={() => handleAddProduct(item)}
                style={{
                  backgroundColor: '#D35400',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  height: 34,
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  Add to cart
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    
    // Style par défaut pour autres restos (Cucina + Baghera inclus)
    // 🆕 Phase 3.3 — Baghera overrides inline (creamSoft + sand border + ember price)
    const bagheraCardOverride = isBaghera && bagheraTokens ? {
      backgroundColor: bagheraTokens.cardBackground,
      borderColor: bagheraTokens.cardBorderColor,
      borderWidth: 1,
      borderRadius: 24,
      padding: 16,
      shadowOpacity: 0,
      elevation: 0,
    } : null;
    const bagheraNameOverride = isBaghera && bagheraTokens ? {
      color: bagheraTokens.productNameColor,
      fontFamily: BAGHERA_FONTS.black,
      fontSize: 19,
      fontWeight: '400',
      letterSpacing: -0.2,
      marginBottom: 6,
    } : null;
    const bagheraDescOverride = isBaghera && bagheraTokens ? {
      color: bagheraTokens.productDescriptionColor,
      fontFamily: BAGHERA_FONTS.sans,
      fontSize: 13,
      lineHeight: 19,
    } : null;
    const bagheraPriceOverride = isBaghera && bagheraTokens ? {
      color: bagheraTokens.productPriceColor,
      fontFamily: BAGHERA_FONTS.mono,
      fontSize: 20,
      fontWeight: '400',
    } : null;
    const bagheraAddOverride = isBaghera && bagheraTokens ? {
      backgroundColor: bagheraTokens.ctaAddBackground,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 9,
    } : null;
    const bagheraQtyBtnOverride = isBaghera && bagheraTokens ? {
      backgroundColor: bagheraTokens.ctaAddBackground,
      width: 34,
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 0,
      paddingVertical: 0,
    } : null;

    // Si Cucina: wrap dans TouchableOpacity pour ouvrir la modale
    const CardContent = (
      <>
        <View style={styles.productImageContainer}>
          {isBaghera ? (
            <BagheraProductImage item={item} style={styles.productImage} />
          ) : (
            <Image source={PANINI_IMAGE} style={styles.productImage} resizeMode="cover" />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, bagheraNameOverride]}>{item.name}</Text>
          <Text style={[styles.productDescription, bagheraDescOverride]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, bagheraPriceOverride]}>{item.price?.toFixed(2) || '0.00'}€</Text>
            {qty === 0 ? (
              <TouchableOpacity style={[styles.addButton, bagheraAddOverride]} onPress={() => handleAddProduct(item)}>
                <Text style={styles.addButtonText}>{t("Ajouter")}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityControls}>
                <TouchableOpacity style={[styles.quantityBtn, bagheraQtyBtnOverride]} onPress={() => handleRemoveProduct(item)}>
                  <Ionicons name="remove" size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{qty}</Text>
                <TouchableOpacity style={[styles.quantityBtn, bagheraQtyBtnOverride]} onPress={() => handleAddProduct(item)}>
                  <Ionicons name="add" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </>
    );
    
    // Cucina: carte cliquable pour ouvrir la modale détail
    if (isCucina) {
      return (
        <TouchableOpacity 
          style={styles.productCard} 
          onPress={() => openProductDetail(item)}
          activeOpacity={0.8}
        >
          {CardContent}
        </TouchableOpacity>
      );
    }
    
    // Autres restos (Baghera + default): carte non cliquable, override Baghera inline
    return (
      <View style={[styles.productCard, bagheraCardOverride]}>
        {CardContent}
      </View>
    );
  };


  // 🎨 Render Banner - Générique ou spécifique au restaurant
  const renderBanner = () => {
    const isCucinaRestaurant = restaurantId === '6970ef6594abf8bacd9d804d';
    const isGrillzRestaurant = restaurantId === '695e4300adde654b80f6911a';
    
    // 🎨 BAGHERA — header croisé avec WelcomeScreenBaghera (wordmark serif + ember dot)
    if (isBaghera) {
      return (
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
            <TouchableOpacity
              onPress={openStoryModal}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Découvrir le mot du chef"
              hitSlop={{ top: 10, bottom: 10, left: 24, right: 24 }}
              style={{ alignItems: 'center' }}
            >
              <Animated.Image
                source={require("../../assets/baghera/baghera-logo.png")}
                style={{ width: 120, height: 120, transform: [{ scale: storyLogoPulse }] }}
                resizeMode="contain"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Text style={{
                  fontFamily: BAGHERA_FONTS.day,
                  fontSize: 36,
                  color: BAGHERA_PALETTE.sage,
                  letterSpacing: 0.5,
                }}>
                  {t("la carte")}
                </Text>
                <View style={{
                  width: 3, height: 3, borderRadius: 1.5,
                  backgroundColor: BAGHERA_PALETTE.terracotta,
                  marginLeft: 6, opacity: 0.8,
                }} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowDietaryModal(true)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="no-food" size={20} color={BAGHERA_PALETTE.sage} />
          </TouchableOpacity>
        </View>
      );
    }
    
    if (isGrillzRestaurant) {
      // 🔥 HEADER selon spec exacte
      return (
        <View style={{
          backgroundColor: '#0D0D0D',
          height: 70,
          paddingTop: 40,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
          {/* BACK ICON - zone cliquable 44px */}
          <TouchableOpacity 
            onPress={onBack} 
            style={{ 
              width: 44, 
              height: 44, 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* TITRE "Food Menu" - 18px semi-bold */}
          <Text style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '500',
          }}>
            Food Menu
          </Text>
        </View>
      );
    } else if (isCucinaRestaurant) {
      // 🟢 Bannière verte spécifique à Cucina Di Nini
      return (
        <LinearGradient
          colors={["#146845", "#34311C", "#1F4D2E", "#146845"]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {/* Motifs sandwich subtils - CUCINA ONLY */}
          <View style={styles.sandwichPatterns}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.sandwichIcon, { 
                left: (i * 160) % 360,
                top: (Math.floor(i / 3) * 40) + 20,
                opacity: 0.04 + (i % 2) * 0.02,
                transform: [{ rotate: `${i * 25}deg` }]
              }]}>
                {/* Sandwich simplifié et plus reconnaissable */}
                <View style={styles.simpleBread} />
                <View style={styles.simpleGreen} />
                <View style={styles.simpleOrange} />
                <View style={styles.simpleBread} />
              </View>
            ))}
          </View>
          
          {/* Navigation content - Cucina: plus de padding */}
          <View style={[styles.nav, { 
            paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 24) + 30,
            paddingBottom: 25,
          }]}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FCF7DE" />
            </TouchableOpacity>
            
            {/* Bannière restaurant centrée */}
            <View style={styles.restaurantBanner}>
              <View style={styles.bannerContent}>
                <Text style={[styles.restaurantName, fontLoaded && { fontFamily: 'DXNacky' }]}>
                  {restaurantName || t("Restaurant")}
                </Text>
                <View style={styles.bannerDivider} />
                <Text style={styles.menuSubtitle}>{t("Menu")}</Text>
              </View>
            </View>
            
            {/* Bouton Allergies */}
            <TouchableOpacity
              style={styles.allergyButton}
              onPress={() => setShowDietaryModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="no-food" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    } else {
      // 🔵 Bannière bleue générique pour tous les autres restaurants (utilise thème)
      const bannerGradient = getGradient('primary') || ["#2563EB", "#1E40AF"];
      
      return (
        <LinearGradient
          colors={bannerGradient}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {/* Navigation content */}
          <View style={styles.nav}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Bannière restaurant centrée */}
            <View style={styles.restaurantBanner}>
              <View style={styles.bannerContent}>
                <Text style={[styles.restaurantName, fontLoaded && { fontFamily: 'DXNacky' }]}>
                  {restaurantName || t("Restaurant")}
                </Text>
                <View style={styles.bannerDivider} />
                <Text style={styles.menuSubtitle}>{t("Menu")}</Text>
              </View>
            </View>
            
            {/* Bouton Allergies */}
            <TouchableOpacity
              style={styles.allergyButton}
              onPress={() => setShowDietaryModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="no-food" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }
  };


  // 🔥 Le Grillz = thème dark complet (isGrillz défini en haut)
  
  // Style du container - Cucina utilise tout l'écran
  let containerStyle = styles.container;
  if (isGrillz) {
    containerStyle = [styles.container, { backgroundColor: '#1a1a1a' }];
  } else if (isCucina) {
    // Position absolute pour couvrir tout l'écran comme WelcomeScreen
    containerStyle = { 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#146845',
    };
  } else if (isBaghera) {
    // 🆕 Phase 3.3 — Baghera : canvas cream, position absolute pour fullscreen
    containerStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: bagheraTokens?.background || BAGHERA_PALETTE.linen,
    };
  }

  // 🔥 BBQ Grill Lines Component - Lignes de grill visibles
  const GrillLines = () => (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, overflow: 'hidden', zIndex: 1 }}>
      {[...Array(15)].map((_, i) => (
        <View key={i} style={{
          position: 'absolute',
          top: i * 10,
          left: -20,
          right: -20,
          height: 3,
          backgroundColor: '#FF6B35',
          opacity: 0.3 - (i * 0.015),
          transform: [{ rotate: '-3deg' }],
        }} />
      ))}
    </View>
  );
  
  // 🔥 BBQ Heat Glow Component - Plus visible
  const HeatGlow = () => (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(255, 107, 53, 0.35)', 'rgba(211, 84, 0, 0.15)', 'transparent']}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250,
        zIndex: 0,
      }}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
    />
  );
  
  // 🔥 BBQ Smoke/Heat waves (effet chaleur montante)
  const HeatWaves = () => (
    <View pointerEvents="none" style={{ position: 'absolute', top: 120, left: 0, right: 0, height: 60, zIndex: 1, opacity: 0.2 }}>
      <LinearGradient
        colors={['transparent', 'rgba(255, 140, 80, 0.3)', 'transparent']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );

  return (
    <View style={containerStyle}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isGrillz || isCucina ? "light-content" : "dark-content"} />

      {/* 🔥 BBQ Effects - Seulement pour Le Grillz */}
      {isGrillz && <GrillLines />}
      {isGrillz && <HeatWaves />}

      {/* Navigation avec fond décoratif audacieux */}
      <View style={[
        styles.navContainer, 
        isGrillz && { backgroundColor: 'transparent' },
        isCucina && { backgroundColor: '#146845' },
        isBaghera && { backgroundColor: BAGHERA_PALETTE.linen }
      ]}>
        {/* Fond dégradé principal - caché pour Grillz, Cucina et Baghera */}
        {!isGrillz && !isCucina && !isBaghera && (
          <LinearGradient
            colors={[COLORS.primary + "25", COLORS.accent + "20", COLORS.background]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        
        {/* Formes organiques complexes - cachées pour Grillz, Cucina et Baghera */}
        {!isGrillz && !isCucina && !isBaghera && (
          <View style={styles.decorativeElements}>
            {/* Grande forme principale */}
            <View style={styles.mainBlob} />
            
            {/* Formes secondaires */}
            <View style={styles.secondaryBlob1} />
            <View style={styles.secondaryBlob2} />
            
            {/* Accents colorés */}
            <LinearGradient
              colors={[COLORS.accent, COLORS.accent + "80"]}
              style={styles.accentBlob1}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary + "60"]}
              style={styles.accentBlob2}
            />
            
            {/* Motif de points */}
            <View style={styles.dotsPattern}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.dot, { 
                  top: (i % 3) * 15 + 10, 
                  left: Math.floor(i / 3) * 20 + 50 
                }]} />
              ))}
            </View>
          </View>
        )}
        {/* Bannière dynamique selon le restaurant */}
        {renderBanner()}

      </View>

      {/* Section principale */}
      <View style={[
        styles.mainContainer, 
        isGrillz && { backgroundColor: '#0D0D0D' },
        isCucina && { backgroundColor: COLORS.background }
      ]}>
        {/* Catégories - CENTRÉES pour Grillz */}
        {isGrillz ? (
          <View style={{
            backgroundColor: 'transparent',
            paddingVertical: 10,
            marginBottom: 14,
          }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              {categories.map(renderCategory)}
            </ScrollView>
          </View>
        ) : isBaghera ? (
          <View style={{ height: 48 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 8,
                position: 'relative',
                alignItems: 'flex-start',
              }}
              style={{ height: 48 }}
            >
              {categories.map(renderCategory)}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 36,
                  left: 0,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: BAGHERA_PALETTE.terracotta,
                  width: underlineW,
                  opacity: underlineOpacity,
                  transform: [{ translateX: underlineX }],
                }}
              />
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            style={styles.categoriesScroll}
          >
            {categories.map(renderCategory)}
          </ScrollView>
        )}

        {/* Liste des produits - avec effet BBQ pour Grillz */}
        {isGrillz ? (
          <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
            {/* Effet BBQ - lueur orange en haut */}
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255, 107, 53, 0.2)', 'rgba(211, 84, 0, 0.08)', 'transparent']}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: 150,
                zIndex: 1,
              }}
            />
            {/* Effet BBQ - lueur orange en bas */}
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(211, 84, 0, 0.1)', 'rgba(255, 80, 0, 0.2)']}
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                height: 120,
                zIndex: 1,
              }}
            />
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[styles.productsContainer, { paddingTop: 0 }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                selectedCategory === null ? (
                  <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    paddingHorizontal: 40,
                    paddingTop: 100,
                  }}>
                    <Image 
                      source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/grilledchicken.png")}
                      style={{ width: 120, height: 120, marginBottom: 20 }}
                      resizeMode="contain"
                    />
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 30, 
                      fontWeight: '700',
                      textAlign: 'center',
                      marginBottom: 6,
                    }}>
                      Bonjour {userName || 'vous'} !
                    </Text>
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 24, 
                      fontWeight: '700',
                      textAlign: 'center',
                      marginBottom: 10,
                    }}>
                      {t("Prêt à vous régaler ?")}
                    </Text>
                    <Text style={{ 
                      color: '#AAAAAA', 
                      fontSize: 16, 
                      textAlign: 'center',
                      lineHeight: 24,
                    }}>
                      {t("Sélectionnez une catégorie pour découvrir nos délicieux chickens et accompagnements")}
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.productsContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isBaghera && selectedCategory === null ? (
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 36,
                  paddingTop: 20,
                }}>
                  {/* Filet décoratif supérieur */}
                  <View style={{
                    width: 40,
                    height: 1,
                    backgroundColor: BAGHERA_PALETTE.linen,
                    marginBottom: 28,
                  }} />

                  <Text style={{
                    fontFamily: BAGHERA_FONTS.black,
                    fontSize: 28,
                    lineHeight: 48,
                    color: BAGHERA_PALETTE.terracotta,
                    letterSpacing: 0.5,
                    paddingTop: 8,
                    marginBottom: 32,
                  }}>
                    {t('— Bienvenue')} {userName ? userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase() : ''}
                  </Text>

                  <Text style={{
                    fontFamily: BAGHERA_FONTS.day,
                    fontSize: 30,
                    color: BAGHERA_PALETTE.espresso,
                    textAlign: 'center',
                    lineHeight: 44,
                    paddingTop: 6,
                    includeFontPadding: false,
                    marginBottom: 18,
                  }}>
                    {t("Une carte pensée")}{'\n'}{t("comme un")}{' '}
                    <Text style={{
                      fontFamily: BAGHERA_FONTS.day,
                      color: BAGHERA_PALETTE.terracotta,
                    }}>
                      {t("art de vivre")}
                    </Text>
                    .
                  </Text>

                  <Text style={{
                    fontFamily: BAGHERA_FONTS.sans,
                    fontSize: 15,
                    color: BAGHERA_PALETTE.sage,
                    textAlign: 'center',
                    lineHeight: 23,
                    marginBottom: 32,
                    maxWidth: 320,
                  }}>
                    {t("Choisissez une catégorie ci-dessus pour commencer votre voyage gourmand.")}
                  </Text>

                  {/* Filet décoratif inférieur */}
                  <View style={{
                    width: 40,
                    height: 1,
                    backgroundColor: BAGHERA_PALETTE.linen,
                  }} />
                </View>
              ) : isCucina && selectedCategory === null ? (
                <View style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  paddingHorizontal: 40,
                  paddingTop: 100,
                }}>
                  <Text style={{ fontSize: 50, marginBottom: 20 }}>🍝</Text>
                  <Text style={{ 
                    color: '#333', 
                    fontSize: 30, 
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}>
                    Bonjour {userName || 'vous'} !
                  </Text>
                  <Text style={{ 
                    color: '#333', 
                    fontSize: 24, 
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 10,
                  }}>
                    Prêt à vous régaler ?
                  </Text>
                  <Text style={{ 
                    color: '#888888', 
                    fontSize: 16, 
                    textAlign: 'center',
                    lineHeight: 24,
                  }}>
                    {t("Sélectionnez une catégorie pour découvrir nos délicieuses spécialités italiennes")}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Barre du bas - Payer les commandes existantes (panier vide) */}
      {totalItems === 0 && allOrders.length > 0 && (
        isGrillz ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#121212',
            marginHorizontal: 16,
            marginBottom: 20,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <TouchableOpacity
              onPress={onNavigateToPayment}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#D35400',
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 30,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="card" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{t("Payer ma commande")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.bottomBar,
            isBaghera && {
              backgroundColor: BAGHERA_PALETTE.linen,
              borderTopWidth: 1,
              borderTopColor: BAGHERA_PALETTE.linen,
              shadowOpacity: 0,
              elevation: 0,
              justifyContent: 'center',
            },
          ]}>
            <TouchableOpacity
              style={[
                styles.placeOrderBtn,
                isBaghera && {
                  backgroundColor: BAGHERA_PALETTE.terracotta,
                  borderWidth: 0,
                  borderRadius: 28,
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                  shadowOpacity: 0,
                },
              ]}
              onPress={onNavigateToPayment}
            >
              <Text style={[
                styles.placeOrderText,
                isBaghera && { fontFamily: BAGHERA_FONTS.sans, fontSize: 15 },
              ]}>{t("Payer ma commande")}</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Barre du bas - Style identique à l'image de référence pour Le Grillz */}
      {totalItems > 0 && (
        isBaghera ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: BAGHERA_PALETTE.white,
            marginHorizontal: 16,
            marginBottom: 20,
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: BAGHERA_PALETTE.linen,
            shadowColor: BAGHERA_PALETTE.espresso,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 4,
          }}>
            {/* Gauche: cercle ember + total */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: BAGHERA_PALETTE.terracotta,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: BAGHERA_PALETTE.linen,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: BAGHERA_PALETTE.terracotta,
                }}>
                  <Text style={{ color: BAGHERA_PALETTE.terracotta, fontSize: 11, fontFamily: BAGHERA_FONTS.sans, fontWeight: '700' }}>{totalItems}</Text>
                </View>
              </View>

              <View>
                <Text style={{
                  fontFamily: BAGHERA_FONTS.sans,
                  color: BAGHERA_PALETTE.sage,
                  fontSize: 12,
                }}>{t("— total")}</Text>
                <Text style={{
                  fontFamily: BAGHERA_FONTS.mono,
                  color: BAGHERA_PALETTE.terracotta,
                  fontSize: 22,
                  marginTop: 2,
                }}>{totalAmount.toFixed(2)}€</Text>
              </View>
            </View>

            {/* Droite: bouton Commander pill ember */}
            <TouchableOpacity
              onPress={handlePayPress}
              activeOpacity={0.9}
              style={{
                backgroundColor: BAGHERA_PALETTE.terracotta,
                paddingHorizontal: 22,
                paddingVertical: 13,
                borderRadius: 26,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontFamily: BAGHERA_FONTS.sans,
                fontWeight: '600',
                letterSpacing: 0.3,
              }}>
                {t("Commander")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isGrillz ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#121212',
            marginHorizontal: 16,
            marginBottom: 20,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 20,
            // Floating card effect
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}>
            {/* Gauche: Icône panier dans cercle + Total */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Cercle avec icône panier */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#D35400',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                <Ionicons name="cart" size={22} color="#FFFFFF" />
                {/* Badge quantité */}
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#FFFFFF',
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#D35400', fontSize: 11, fontWeight: '700' }}>{totalItems}</Text>
                </View>
              </View>
              
              {/* Textes */}
              <View>
                <Text style={{ color: '#777', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>{t("Total Amount")}</Text>
                <Text style={{ color: '#FF8A50', fontSize: 20, fontWeight: '700' }}>{totalAmount.toFixed(2)}€</Text>
              </View>
            </View>

            {/* Droite: Bouton Place order - très arrondi */}
            <TouchableOpacity 
              onPress={handlePayPress}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#D35400',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 30,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
              }}>
                Place order
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomBar}>
            <View style={styles.cartPreview}>
              <View style={styles.cartIcon}>
                <Ionicons name="cart" size={22} color="#FFF" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.totalLabel}>{t("TOTAL")}</Text>
                <Text style={styles.totalValue}>{totalAmount.toFixed(2)}€</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePayPress}>
              <Text style={styles.placeOrderText}>{t("Commander")}</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* Modal OrderSummary */}
      <Modal
        visible={showOrderSummary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderSummary(false)}
      >
        <OrderSummary
          currentOrder={currentOrder}
          onUpdateQuantity={updateOrderQuantity}
          onConfirm={handleConfirmOrder}
          onBackToMenu={() => setShowOrderSummary(false)}
          isGrillzTheme={isGrillz}
          isBaghera={isBaghera}
        />
      </Modal>

      {/* Modal Allergies/Restrictions */}
      <DietaryPreferences
        visible={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
        isBaghera={isBaghera}
      />

      {/* Modal AddOn Flow */}
      {addOnsModalVisible && currentProductWithAddOns && (
        <AddOnFlow
          dish={currentProductWithAddOns}
          allowedAddOns={currentProductWithAddOns.allowedAddOns || []}
          onComplete={handleAddOnComplete}
          onCancel={() => {
            setAddOnsModalVisible(false);
            setCurrentProductWithAddOns(null);
          }}
        />
      )}
      
      {/* 🔥 GRILLZ & CUCINA: Modal Product Detail avec animation */}
      {(isGrillz || isCucina) && (
        <Modal
          visible={showProductDetail}
          transparent={true}
          animationType="none"
          onRequestClose={closeProductDetail}
        >
          <Animated.View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
            opacity: fadeAnim,
          }}>
            {/* Header avec bouton retour */}
            <TouchableOpacity 
              onPress={closeProductDetail}
              style={{
                position: 'absolute',
                top: 100,
                left: 16,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Contenu centré verticalement */}
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
              {/* Image centrée */}
              <Animated.View style={{
                alignItems: 'center',
                marginBottom: 30,
                transform: [{ scale: scaleAnim }],
              }}>
                <Image 
                  source={PANINI_IMAGE}
                  style={{
                    width: SCREEN_WIDTH * 0.65,
                    height: SCREEN_WIDTH * 0.65,
                    borderRadius: 20,
                  }}
                  resizeMode="cover"
                />
              </Animated.View>
              
              {/* Nom du produit */}
              <Text style={{
                color: '#FFFFFF',
                fontSize: 26,
                fontWeight: '700',
                marginBottom: 10,
                textAlign: 'center',
              }}>
                {selectedProduct?.name}
              </Text>
              
              {/* Description */}
              <Text style={{
                color: '#888',
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 20,
                textAlign: 'center',
              }} numberOfLines={3}>
                {selectedProduct?.description}
              </Text>
              
              {/* Prix */}
              <Text style={{
                color: '#FF8A50',
                fontSize: 28,
                fontWeight: '800',
                marginBottom: productOptions.length > 0 ? 20 : 30,
                textAlign: 'center',
              }}>
                {selectedProduct?.price?.toFixed(2) || '0.00'}€
              </Text>

              {/* Options/Suppléments */}
              {productOptions.length > 0 && (
                <View style={{
                  marginBottom: 24,
                  paddingHorizontal: 16,
                }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}>
                    Suppléments
                  </Text>
                  {productOptions.map(opt => {
                    const isSelected = selectedOptions.includes(opt._id);
                    return (
                      <TouchableOpacity
                        key={opt._id}
                        onPress={() => toggleOption(opt._id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor: isSelected ? 'rgba(211, 84, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                          borderRadius: 10,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? '#D35400' : 'rgba(255,255,255,0.1)',
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isSelected ? '#D35400' : '#555',
                          backgroundColor: isSelected ? '#D35400' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={{
                          flex: 1,
                          color: isSelected ? '#FFFFFF' : '#CCC',
                          fontSize: 15,
                          fontWeight: isSelected ? '600' : '400',
                        }}>
                          {opt.name}
                        </Text>
                        <Text style={{
                          color: '#FF8A50',
                          fontSize: 14,
                          fontWeight: '600',
                        }}>
                          +{opt.price?.toFixed(2)}€
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              
              {/* Quantity selector + Add to cart */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {/* Quantity */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#1E1E1E',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#333',
                }}>
                  <TouchableOpacity
                    onPress={() => detailQty > 1 && setDetailQty(detailQty - 1)}
                    style={{
                      width: 48,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="remove" size={20} color="#888" />
                  </TouchableOpacity>
                  
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '600',
                    marginHorizontal: 20,
                    minWidth: 24,
                    textAlign: 'center',
                  }}>
                    {detailQty}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => setDetailQty(detailQty + 1)}
                    style={{
                      width: 48,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                
                {/* Add to cart button */}
                <TouchableOpacity
                  onPress={handleDetailAddToCart}
                  style={{
                    flex: 1,
                    marginLeft: 16,
                    backgroundColor: '#D35400',
                    paddingVertical: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Add to cart
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          🐆 BAGHERA — Modale "Le mot du chef"
          Storytelling poétique au tap sur le logo panthère.
          Animation : backdrop blur fade + card silk-ease scale/translate.
          ═══════════════════════════════════════════════════════════════ */}
      {isBaghera && storyMounted && (
        <Modal
          transparent
          visible={showStoryModal}
          animationType="none"
          statusBarTranslucent
          onRequestClose={closeStoryModal}
        >
          {/* Backdrop blur + dim — tap-to-dismiss */}
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              opacity: storyBackdrop,
            }}
          >
            <BlurView
              intensity={28}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: BAGHERA_PALETTE.espresso,
                opacity: storyBackdrop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.42],
                }),
              }}
            />
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeStoryModal}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Carte poétique */}
          <View
            pointerEvents="box-none"
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 420,
                backgroundColor: BAGHERA_PALETTE.white,
                borderRadius: 22,
                paddingTop: 28,
                paddingBottom: 36,
                paddingHorizontal: 30,
                borderWidth: 1,
                borderColor: BAGHERA_PALETTE.linen,
                // Ombre douce, presque tirage papier
                shadowColor: BAGHERA_PALETTE.espresso,
                shadowOffset: { width: 0, height: 18 },
                shadowOpacity: 0.28,
                shadowRadius: 32,
                elevation: 14,
                opacity: storyCard,
                transform: [
                  {
                    translateY: storyCard.interpolate({
                      inputRange: [0, 1],
                      outputRange: [22, 0],
                    }),
                  },
                  {
                    scale: storyCard.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              }}
            >
              {/* Filigrane logo panthère, très discret */}
              <Image
                source={require("../../assets/baghera/baghera-logo.png")}
                resizeMode="contain"
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -28,
                  right: -24,
                  width: 200,
                  height: 200,
                  opacity: 0.05,
                  tintColor: BAGHERA_PALETTE.espresso,
                }}
              />

              {/* Point ember signature */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: BAGHERA_PALETTE.terracotta,
                }} />
              </View>

              {/* Eyebrow */}
              <Text style={{
                textAlign: 'center',
                fontFamily: BAGHERA_FONTS.mono,
                fontSize: 10.5,
                letterSpacing: 3,
                color: BAGHERA_PALETTE.sage,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                Le mot du chef
              </Text>

              {/* Titre serif — poétique */}
              <Text style={{
                textAlign: 'center',
                fontFamily: BAGHERA_FONTS.day,
                fontSize: 38,
                lineHeight: 52,
                color: BAGHERA_PALETTE.espresso,
                letterSpacing: -0.5,
                includeFontPadding: false,
                marginBottom: 28,
              }}>
                {t("Une carte qui")}{"\n"}{t("raconte.")}
              </Text>

              {/* Filet ember + sand, centré */}
              <View style={{ alignItems: 'center', marginBottom: 22 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 28, height: 1, backgroundColor: BAGHERA_PALETTE.linen }} />
                  <View style={{
                    width: 5, height: 5, borderRadius: 2.5,
                    backgroundColor: BAGHERA_PALETTE.terracotta,
                    marginHorizontal: 8,
                  }} />
                  <View style={{ width: 28, height: 1, backgroundColor: BAGHERA_PALETTE.linen }} />
                </View>
              </View>

              {/* Corps — prose */}
              <Text style={{
                fontFamily: BAGHERA_FONTS.sans,
                fontSize: 19,
                lineHeight: 31,
                color: '#3E3236',
                textAlign: 'center',
                marginBottom: 16,
              }}>
                Notre carte n’est pas une liste.{"\n"}C’est un{" "}
                <Text style={{ fontFamily: BAGHERA_FONTS.sansBold, color: '#E0AB60' }}>
                  carnet de saisons
                </Text>
                , écrit à quatre mains avec nos producteurs, et redessiné chaque semaine au gré du marché.
              </Text>

              <Text style={{
                fontFamily: BAGHERA_FONTS.sans,
                fontSize: 19,
                lineHeight: 31,
                color: '#3E3236',
                textAlign: 'center',
                marginBottom: 28,
              }}>
                Chaque plat est pensé comme une{" "}
                <Text style={{ fontFamily: BAGHERA_FONTS.sansBold, color: '#E0AB60' }}>
                  petite histoire
                </Text>
                {" "}— un produit juste, un geste précis, et juste assez de silence autour pour qu’il puisse parler.
              </Text>

              <Text style={{
                textAlign: 'right',
                fontFamily: BAGHERA_FONTS.dayBold,
                fontSize: 18,
                lineHeight: 28,
                includeFontPadding: false,
                color: BAGHERA_PALETTE.espresso,
                marginBottom: 24,
              }}>
                — Baghera.
              </Text>

              {/* Bouton refermer — croix discrète dans un rond */}
              <TouchableOpacity
                onPress={closeStoryModal}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Refermer"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: BAGHERA_PALETTE.linen,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <Ionicons name="close" size={18} color={BAGHERA_PALETTE.espresso} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 💄 STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Navigation avec fond décoratif audacieux
  navContainer: {
    position: "relative",
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  mainBlob: {
    position: "absolute",
    width: 200,
    height: 140,
    backgroundColor: COLORS.primary + "30",
    borderRadius: 70,
    top: -40,
    right: -60,
    transform: [{ rotate: "25deg" }, { scaleX: 1.3 }],
  },
  secondaryBlob1: {
    position: "absolute",
    width: 120,
    height: 80,
    backgroundColor: COLORS.accent + "25",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 60,
    top: 30,
    right: 80,
    transform: [{ rotate: "-20deg" }],
  },
  secondaryBlob2: {
    position: "absolute",
    width: 90,
    height: 60,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 30,
    top: -10,
    right: 220,
    transform: [{ rotate: "45deg" }, { scaleY: 1.5 }],
  },
  accentBlob1: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    top: 20,
    right: 40,
    opacity: 0.6,
  },
  accentBlob2: {
    position: "absolute",
    width: 40,
    height: 25,
    borderRadius: 20,
    top: 60,
    right: 150,
    opacity: 0.5,
    transform: [{ rotate: "-30deg" }],
  },
  dotsPattern: {
    position: "absolute",
    top: 0,
    right: 180,
  },
  dot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent + "60",
  },
  // 🎨 Styles de bannière avec motifs
  bannerGradient: {
    position: "relative",
    overflow: "hidden",
  },
  sandwichPatterns: {
    position: "absolute",
    width: "120%",
    height: "100%",
    left: "-10%",
  },
  sandwichIcon: {
    position: "absolute",
    width: 32,
    height: 16,
  },
  // Sandwich ultra simplifié
  simpleBread: {
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1.5,
    marginBottom: 1.5,
  },
  simpleGreen: {
    height: 2,
    backgroundColor: "#90EE90",
    marginBottom: 1,
    marginHorizontal: 3,
  },
  simpleOrange: {
    height: 2,
    backgroundColor: "#D96018", // Hot cinnamon
    marginBottom: 1.5,
    marginHorizontal: 2,
  },
  // 🔥 STYLES BBQ GRILLZ
  flamePatterns: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  flameIcon: {
    position: "absolute",
    width: 30,
    height: 45,
    alignItems: "center",
  },
  flameOuter: {
    position: "absolute",
    bottom: 0,
    width: 30,
    height: 40,
    backgroundColor: "#FF4500",
    borderRadius: 15,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.6,
  },
  flameInner: {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: 30,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.8,
  },
  flameCore: {
    position: "absolute",
    bottom: 0,
    width: 10,
    height: 18,
    backgroundColor: "#FFD700",
    borderRadius: 5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  grillPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.08,
  },
  grillLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FFB347",
  },
  smokeEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  // Bouton retour harmonisé avec palette
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D96018", // Hot cinnamon - terracotta chaud
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FCF7DE", // Pearl lusta - crème
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 0, // Aligné en haut
  },
  nav: {
    flexDirection: "row",
    alignItems: "flex-start", // Aligne tout en haut
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  restaurantBanner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // Aligne en haut
    paddingTop: 0, // Retire le padding
  },
  bannerContent: {
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 42, // Beaucoup plus grand et imposant
    fontWeight: "normal",
    color: "#FCF7DE", // Pearl lusta - crème élégant
    letterSpacing: 4,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerDivider: {
    width: 60,
    height: 3,
    backgroundColor: "#D96018", // Hot cinnamon - accent terracotta
    marginVertical: 10,
    borderRadius: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FCF7DE", // Pearl lusta
    opacity: 0.95,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  rightSpace: {
    width: 40,
  },
  allergyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 16,
  },

  // Section principale
  mainContainer: {
    flex: 1,
  },

  // Catégories avec ligne rouge
  categoriesScroll: {
    maxHeight: 80,
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  categoryTab: {
    alignItems: "center",
    justifyContent: "flex-end", // Aligner vers le bas
    paddingVertical: 12,
    minHeight: 60, // Hauteur fixe pour uniformiser
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryTabSelected: {
    borderBottomColor: COLORS.accent,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  categoryTextSelected: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Liste des produits
  productsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Carte produit
  productCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginBottom: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  productImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    marginRight: 12,
    marginTop: -10,
    marginLeft: -10,
    backgroundColor: COLORS.backimage,
  },
  productImage: {
    width: "100%",
    height: "100%",
    marginTop: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    minWidth: 24,
    textAlign: "center",
  },

  // Barre du bas
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cartPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  placeOrderBtn: {
    backgroundColor: "#D96018", // Hot cinnamon - comme le bouton retour
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FCF7DE", // Pearl lusta - crème
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeOrderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
