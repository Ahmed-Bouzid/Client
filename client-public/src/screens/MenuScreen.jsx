/**
 * MenuScreen - Page du menu (nouveau design Foodmood)
 */

import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from 'expo-font';
import useProductStore from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useOrderStore } from "../stores/useOrderStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OrderSummary from "./OrderSummary";
import DietaryPreferences from "./DietaryPreferences";
import AddOnFlow from "../components/menu/AddOnFlow";
import { useStyleUpdates } from "../hooks/useSocketClient";

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
  // States
  const [selectedCategory, setSelectedCategory] = useState("sandwich");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [addOnsModalVisible, setAddOnsModalVisible] = useState(false);
  const [currentProductWithAddOns, setCurrentProductWithAddOns] = useState(null);
  
  // Stores - EXACTEMENT comme Menu.jsx
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const { cart, addItem, removeItem, updateQuantity: updateCartQuantity, getTotalItems, getTotalPrice, initCart } = useCartStore();
  const { currentOrder, addToOrder, updateOrderQuantity, fetchActiveOrder, submitOrder } = useOrderStore();
  
  // États pour userName
  const [userName, setUserName] = useState(null);

  // ⭐ WebSocket - Écouter les changements de style en temps réel
  const { style: liveStyle, isConnected: socketConnected } = useStyleUpdates(restaurantId);

  // Mettre à jour quand un nouveau style est appliqué en temps réel
  useEffect(() => {
    if (liveStyle && liveStyle.config) {
      Alert.alert(
        "🎨 Nouveau style",
        "L'apparence du menu a été mise à jour !",
        [{ text: "OK" }]
      );
      // Note: Pour appliquer dynamiquement, il faudrait un state de style
      // et utiliser buildSafeTheme comme dans l'ancien Menu.jsx
    }
  }, [liveStyle]);

  // 🎨 Charger la police DXNacky
  useEffect(() => {
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
  }, []);

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
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const clientToken = await AsyncStorage.getItem("clientToken");
        if (clientToken) {
          await fetchProducts(clientToken);
        } else {
          console.warn("⚠️ Client doit rejoindre une table d'abord");
        }
      } catch (error) {
        console.error("❌ Error loading products:", error);
      }
    };
    loadProducts();
  }, []);

  // Catégories avec leurs emojis
  const categories = [
    { id: "entrees", name: "Entrées", emoji: "🥗" },
    { id: "sandwich", name: "Sandwichs", emoji: "🥪" },
    { id: "pizzas", name: "Pizzas", emoji: "🍕" },
    { id: "desserts", name: "Desserts", emoji: "🍰" },
    { id: "boissons", name: "Boissons", emoji: "🥤" },
    { id: "cafes", name: "Cafés", emoji: "☕" },
  ];

  // Produits filtrés - mix API + mock
  const sandwichProducts = products.filter((p) => {
    const category = p.category?.toLowerCase() || '';
    return category.includes('sandwich') || category.includes('autre'); // Les vrais sont en "autre"
  });

  const filteredProducts = selectedCategory === "sandwich" 
    ? sandwichProducts 
    : products.filter((p) => p.category?.toLowerCase() === selectedCategory);

  // Tous les produits disponibles (seulement le store, plus de mocks)
  const allAvailableProducts = products;
  
  // Produits filtrés par catégorie (utilise le store)
  const cartItems = allAvailableProducts.filter(p => cart[p._id] && cart[p._id] > 0);
  
  // Total du panier (utilise TOUS les produits, pas juste ceux du store)
  const totalItems = getTotalItems();
  const totalAmount = getTotalPrice(allAvailableProducts);

  // Handler pour ajouter un produit - Vérifie si a des addOns
  const handleAddProduct = async (item) => {
    // Si le produit a des add-ons, ouvrir le flow AddOn
    if (item.allowedAddOns && item.allowedAddOns.length > 0) {
      setCurrentProductWithAddOns(item);
      setAddOnsModalVisible(true);
      return;
    }
    
    // Sinon ajout direct
    addToOrder(item, userName);
    await addItem(item._id, 1);
  };

  // Handler quand AddOn flow est complété
  const handleAddOnComplete = async (finalItem) => {
    // finalItem contient selectedAddOns, addOnsTotal, finalPrice
    addToOrder(finalItem, userName);
    await addItem(finalItem._id, 1);
    setAddOnsModalVisible(false);
    setCurrentProductWithAddOns(null);
  };

  // Handler pour retirer un produit
  const handleRemoveProduct = async (item) => {
    const currentQty = cart[item._id] || 0;
    if (currentQty <= 1) {
      // Retirer complètement
      updateOrderQuantity(item, 0);
      await removeItem(item._id, 1);
    } else {
      // Diminuer la quantité
      updateOrderQuantity(item, currentQty - 1);
      await removeItem(item._id, 1);
    }
  };

  // Handler pour commander - OUVRE OrderSummary
  const handlePayPress = async () => {
    // Vérifier qu'il y a des articles dans la commande
    if (currentOrder.length === 0 && getTotalItems() === 0) {
      Alert.alert("Panier vide", "Veuillez ajouter des articles avant de commander.");
      return;
    }

    setShowOrderSummary(true);
  };

  // Handler pour modifier quantité depuis OrderSummary
  const handleQuantityChange = async (item, newQuantity) => {
    const currentQty = cart[item._id] || 0;
    
    if (newQuantity === 0) {
      // Supprimer complètement
      updateOrderQuantity(item, 0);
      await removeItem(item._id, currentQty);
    } else if (newQuantity > currentQty) {
      // Augmenter
      const diff = newQuantity - currentQty;
      updateOrderQuantity(item, newQuantity);
      await addItem(item._id, diff);
    } else {
      // Diminuer
      const diff = currentQty - newQuantity;
      updateOrderQuantity(item, newQuantity);
      await removeItem(item._id, diff);
    }
  };

  // Handler quand l'utilisateur confirme dans OrderSummary
  const handleConfirmOrder = async () => {
    try {
      // 📤 Soumettre la commande au serveur
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

  // Render category tab (avec ligne rouge)
  const renderCategory = (category) => {
    const isSelected = selectedCategory === category.id;
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

  // Render carte produit
  const renderProduct = ({ item }) => {
    const qty = cart[item._id] || 0;

    return (
      <View style={styles.productCard}>
        {/* Image produit (rond) */}
        <View style={styles.productImageContainer}>
          <Image source={PANINI_IMAGE} style={styles.productImage} resizeMode="cover" />
        </View>

        {/* Infos */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Prix + Boutons */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price?.toFixed(2) || '0.00'}€</Text>
            
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddProduct(item)}
              >
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => handleRemoveProduct(item)}
                >
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{qty}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => handleAddProduct(item)}
                >
                  <Ionicons name="add" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Navigation avec fond décoratif audacieux */}
      <View style={styles.navContainer}>
        {/* Fond dégradé principal */}
        <LinearGradient
          colors={[COLORS.primary + "25", COLORS.accent + "20", COLORS.background]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Formes organiques complexes */}
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
        
        {/* Bannière avec motifs sandwich */}
        <LinearGradient
          colors={["#146845", "#34311C", "#1F4D2E", "#146845"]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {/* Motifs sandwich subtils */}
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
          
          {/* Navigation content */}
          <View style={styles.nav}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FCF7DE" />
            </TouchableOpacity>
            
            {/* Bannière restaurant centrée */}
            <View style={styles.restaurantBanner}>
              <View style={styles.bannerContent}>
                <Text style={[styles.restaurantName, fontLoaded && { fontFamily: 'DXNacky' }]}>
                  Cucina Di Nini
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
      </View>

      {/* Section principale */}
      <View style={styles.mainContainer}>
        {/* Catégories horizontales */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
        >
          {categories.map(renderCategory)}
        </ScrollView>

        {/* Liste des produits */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Barre du bas */}
      {totalItems > 0 && (
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

          <TouchableOpacity 
            style={styles.placeOrderBtn} 
            onPress={handlePayPress}
          >
            <Text style={styles.placeOrderText}>Commander</Text>
          </TouchableOpacity>
        </View>
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
          onUpdateQuantity={handleQuantityChange}
          onConfirm={handleConfirmOrder}
          onBackToMenu={() => setShowOrderSummary(false)}
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
