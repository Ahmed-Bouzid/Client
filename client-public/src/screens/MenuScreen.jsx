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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import * as Font from 'expo-font';
import useProductStore from "../stores/useProductStore";
import { useOrderStore } from "../stores/useOrderStore";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import OrderSummary from "./OrderSummary";
import DietaryPreferences from "./DietaryPreferences";
import AddOnFlow from "../components/menu/AddOnFlow";
import { useStyleUpdates } from "../hooks/useSocketClient";
import useTheme from "../hooks/useThemeNew"; // 🎨 NOUVEAU: Hook thème

// Image placeholder
const PANINI_IMAGE = require("../../assets/images/menu/image-fond/panini.png");

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
  
  // States - Cucina et Grillz commencent sans catégorie sélectionnée (message commercial)
  const [selectedCategory, setSelectedCategory] = useState((isCucina || isGrillz) ? null : "sandwich");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [addOnsModalVisible, setAddOnsModalVisible] = useState(false);
  const [currentProductWithAddOns, setCurrentProductWithAddOns] = useState(null);
  
  // 🔥 GRILLZ: Product Detail Modal
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Stores - EXACTEMENT comme Menu.jsx
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const { currentOrder, addToOrder, updateOrderQuantity, submitOrder, initCart, getTotalItems, getTotalPrice } = useOrderStore();
  
  // Store restaurant pour le nom + catégorie
  const restaurantName = useRestaurantStore((state) => state.name);
  const restaurantCategory = useRestaurantStore((state) => state.category);
  const fetchRestaurantInfo = useRestaurantStore((state) => state.fetchRestaurantInfo);
  
  // 🎨 NOUVEAU: Hook thème avec caching multi-level
  const { 
    colors: themeColors, 
    gradients: themeGradients, 
    getGradient,
    getColor,
    hasSandwichPattern,
    bannerType,
    loading: themeLoading,
    error: themeError,
    isReady: themeReady
  } = useTheme(restaurantId);
  
  // États pour userName
  const [userName, setUserName] = useState(null);

  // ⭐ WebSocket - Écouter les changements de style en temps réel
  const { style: liveStyle, isConnected: socketConnected } = useStyleUpdates(restaurantId);

  // Mettre à jour quand un nouveau style est appliqué en temps réel
  useEffect(() => {
    if (liveStyle && liveStyle.config) {
      console.log("🎨 [MenuScreen] Nouveau style reçu via WebSocket");
    }
  }, [liveStyle]);

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
  
  // Charger les produits - EXACTEMENT comme Menu.jsx
  // ── PARCOURS : charge le menu complet depuis l'API ──
  useEffect(() => {
    const loadProducts = async () => {
      try {
		const clientToken = await clientAuthService.getClientToken();
        if (clientToken) {
          await fetchProducts(clientToken, restaurantId);
        } else {
          console.warn("⚠️ Client doit rejoindre une table d'abord");
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
  const categories = useMemo(
    () => isCucina ? cucinaCategories : getCategories(),
    [products, isCucina]
  );

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
      Alert.alert("Panier vide", "Veuillez ajouter des articles avant de commander.");
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
      Alert.alert("Erreur", "Impossible d'envoyer la commande: " + error.message);
    }
  };

  // 🔥 GRILLZ: Fonction pour ouvrir la modale détail produit
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailQty(currentOrder.find(o => o._id === product._id)?.quantity || 1);
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
    });
  };
  
  const handleDetailAddToCart = () => {
    if (selectedProduct) {
      const existing = currentOrder.find(o => o._id === selectedProduct._id);
      const targetQty = (existing?.quantity || 0) + detailQty;
      if (existing) {
        updateOrderQuantity(selectedProduct, targetQty);
      } else {
        addToOrder(selectedProduct, userName);
        if (detailQty > 1) {
          updateOrderQuantity(selectedProduct, detailQty);
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
    
    // Style par défaut pour autres restos (Cucina inclus)
    // Si Cucina: wrap dans TouchableOpacity pour ouvrir la modale
    const CardContent = (
      <>
        <View style={styles.productImageContainer}>
          <Image source={PANINI_IMAGE} style={styles.productImage} resizeMode="cover" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price?.toFixed(2) || '0.00'}€</Text>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddProduct(item)}>
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => handleRemoveProduct(item)}>
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{qty}</Text>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => handleAddProduct(item)}>
                  <Ionicons name="add" size={16} color="#FFF" />
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
    
    // Autres restos: carte non cliquable
    return (
      <View style={styles.productCard}>
        {CardContent}
      </View>
    );
  };


  // 🎨 Render Banner - Générique ou spécifique au restaurant
  const renderBanner = () => {
    const isCucinaRestaurant = restaurantId === '6970ef6594abf8bacd9d804d';
    const isGrillzRestaurant = restaurantId === '695e4300adde654b80f6911a';
    
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
                  {restaurantName || "Restaurant"}
                </Text>
                <View style={styles.bannerDivider} />
                <Text style={styles.menuSubtitle}>Menu</Text>
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
                  {restaurantName || "Restaurant"}
                </Text>
                <View style={styles.bannerDivider} />
                <Text style={styles.menuSubtitle}>Menu</Text>
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
        isCucina && { backgroundColor: '#146845' }
      ]}>
        {/* Fond dégradé principal - caché pour Grillz et Cucina */}
        {!isGrillz && !isCucina && (
          <LinearGradient
            colors={[COLORS.primary + "25", COLORS.accent + "20", COLORS.background]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        
        {/* Formes organiques complexes - cachées pour Grillz et Cucina */}
        {!isGrillz && !isCucina && (
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
                      Prêt à vous régaler ?
                    </Text>
                    <Text style={{ 
                      color: '#AAAAAA', 
                      fontSize: 16, 
                      textAlign: 'center',
                      lineHeight: 24,
                    }}>
                      Sélectionnez une catégorie pour découvrir nos délicieux chickens et accompagnements
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
              isCucina && selectedCategory === null ? (
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
                    Sélectionnez une catégorie pour découvrir nos délicieuses spécialités italiennes
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Barre du bas - Style identique à l'image de référence pour Le Grillz */}
      {totalItems > 0 && (
        isGrillz ? (
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
                <Text style={{ color: '#777', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Total Amount</Text>
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
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>{totalAmount.toFixed(2)}€</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePayPress}>
              <Text style={styles.placeOrderText}>Commander</Text>
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
        />
      </Modal>

      {/* Modal Allergies/Restrictions */}
      <DietaryPreferences
        visible={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
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
                marginBottom: 30,
                textAlign: 'center',
              }}>
                {selectedProduct?.price?.toFixed(2) || '0.00'}€
              </Text>
              
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
