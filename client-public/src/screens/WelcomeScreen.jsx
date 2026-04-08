/**
 * WelcomeScreen - Page d'onboarding avec photos de plats
 * 
 * Design inspiré du template Foodmood:
 * - Photos de plats en haut
 * - Logo restaurant centré
 * - Slogan
 * - Boutons Continue (Facebook + Google)
 * - Bouton principal dark "Continue with Email"
 * - Lien "Already a member? Log in"
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from 'expo-font';
import { useTheme } from "../theme";
import { Button } from "../components";
import { useClientTableStore } from "../stores/useClientTableStore";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import RNUUID from "react-native-uuid";

export default function WelcomeScreen({
  tableId = null,
  tableNumber = null,
  onJoin = () => {},
}) {
  const { theme } = useTheme();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 RESTAURANT CONFIG - Seules ces valeurs changent selon le restaurant
  // ═══════════════════════════════════════════════════════════════════════════
  const RESTAURANT_CONFIG = {
    // Images des plats (4 images)
    images: {
      image1: require("../../assets/images/menu/image-fond/image1.png"),
      image2: require("../../assets/images/menu/image-fond/image2.png"),
      image3: require("../../assets/images/menu/image-fond/image3.jpg"),
      image4: require("../../assets/images/menu/image-fond/image4.png"),
    },
    // Logo du restaurant
    logo: require("../../assets/images/menu/image-fond/logocucina.png"),
    // Nom du restaurant
    name: "Cucina Di Nini",
    // Couleur de fond
    backgroundColor: "#FFFFFF",
  };
  // ═══════════════════════════════════════════════════════════════════════════
  
  // States
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [creatorName, setCreatorName] = useState(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const image1Anim = useRef(new Animated.Value(0)).current;
  const image2Anim = useRef(new Animated.Value(0)).current;
  const image3Anim = useRef(new Animated.Value(0)).current;
  const image4Anim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Stores
  const { restaurantId } = useClientTableStore();
  const restaurantName = useRestaurantStore((state) => state.name);
  const fetchRestaurantInfo = useRestaurantStore((state) => state.fetchRestaurantInfo);
  
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
  
  // 🔄 Vérifier si une session active existe (reconnexion auto)
  useEffect(() => {
    if (!tableId) return;
    const checkExistingSession = async () => {
      try {
        const savedTableId = await AsyncStorage.getItem("currentTableId");
        const savedReservationId = await AsyncStorage.getItem("currentReservationId");
        const savedClientName = await AsyncStorage.getItem("currentClientName");
        const savedClientId = await AsyncStorage.getItem("currentClientId");
        const savedTableNumber = await AsyncStorage.getItem("currentTableNumber");

        if (savedTableId === tableId && savedReservationId && savedClientName) {
          setExistingSession({
            reservationId: savedReservationId,
            clientName: savedClientName,
            clientId: savedClientId,
            tableNumber: savedTableNumber,
          });
          setCreatorName(savedClientName);
        } else {
          setExistingSession(null);
        }
      } catch (e) {
        setExistingSession(null);
      }
    };
    checkExistingSession();
  }, [tableId]);

  // Handler pour reprendre la session existante
  const handleResumeSession = async () => {
    if (!existingSession) return;
    setLoading(true);
    try {
      onJoin({
        reservationId: existingSession.reservationId,
        clientId: existingSession.clientId,
        clientName: existingSession.clientName,
        tableNumber: existingSession.tableNumber,
        isResumed: true,
      });
    } catch (err) {
      Alert.alert("Erreur", "Impossible de reprendre la session");
    } finally {
      setLoading(false);
    }
  };

  // Handler pour démarrer une nouvelle session
  const handleNewSession = async () => {
    // Effacer la session existante
    await AsyncStorage.multiRemove([
      "currentTableId",
      "currentReservationId", 
      "currentClientName",
      "currentClientId",
      "currentTableNumber",
    ]);
    setExistingSession(null);
    setShowEmailForm(true);
  };
  
  // Fetch restaurant info
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantInfo(restaurantId);
    }
  }, [restaurantId]);
  
  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      // Stagger image animations
      Animated.timing(image1Anim, {
        toValue: 1,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(image2Anim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(image3Anim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(image4Anim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        Animated.spring(keyboardAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.spring(keyboardAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    );
    
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
  
  // Handle join table - LOGIQUE COMPLÈTE DE RÉSERVATION
  const handleContinueWithEmail = async () => {
    if (!name.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }
    
    if (!tableId) {
      console.error("❌ [JOIN] tableId manquant !");
      setError("Table non identifiée.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // ⭐ Stocker tableId et pseudo
      await AsyncStorage.setItem("pseudo", name.trim());
      await AsyncStorage.setItem("tableId", tableId);
      
      // ⭐ Récupérer restaurantId (store ou AsyncStorage)
      const finalRestaurantId = restaurantId || (await AsyncStorage.getItem("restaurantId"));
      
      if (!finalRestaurantId) {
        setError("Restaurant non identifié.");
        setLoading(false);
        return;
      }
      
      // Générer un token client simple pour les commandes
      const token = await clientAuthService.getClientToken(
        name.trim(),
        tableId,
        finalRestaurantId,
      );
      
      // ⭐ Récupérer ou créer clientId
      let clientId = await AsyncStorage.getItem("clientId");
      if (!clientId) {
        clientId = RNUUID.v4();
        await AsyncStorage.setItem("clientId", clientId);
      }
      
      const body = {
        clientName: name.trim(),
        clientId: clientId,
        tableId: tableId,
        restaurantId: finalRestaurantId,
        reservationDate: new Date().toISOString(),
        reservationTime: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      };
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/reservations/client/reservations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert("Erreur", "Réponse serveur inattendue.");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        console.error("❌ [JOIN] Réponse non-OK:", response.status, data.message);
        Alert.alert("Erreur", data.message || "Erreur lors de la création de la réservation.");
        setLoading(false);
        return;
      }
      
      const reservationObj = data.reservation || data;
      const reservationId = reservationObj._id;
      
      if (!reservationId) {
        Alert.alert("Erreur", "Aucun ID de réservation retourné.");
        setLoading(false);
        return;
      }
      
      // ⭐ Stocker les infos importantes dans AsyncStorage
      await AsyncStorage.setItem("currentReservationId", reservationId);
      await AsyncStorage.setItem("currentTableId", tableId);
      if (tableNumber) {
        await AsyncStorage.setItem("currentTableNumber", tableNumber.toString());
      }
      await AsyncStorage.setItem("currentClientName", name.trim());
      await AsyncStorage.setItem("currentClientId", clientId);
      
      // ⭐ Appeler onJoin avec un objet (format attendu par App.jsx)
      onJoin?.({
        reservationId: reservationId,
        clientId: clientId,
        userName: name.trim(),
      });
      
    } catch (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  // Clear AsyncStorage (debug)
  const handleClearStorage = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Effacer toutes les données ?");
      if (!confirmed) return;
    } else {
      Alert.alert(
        "Confirmation",
        "Effacer toutes les données ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Effacer", style: "destructive", onPress: async () => {
            await AsyncStorage.clear();
          }},
        ]
      );
      return;
    }
    
    await AsyncStorage.clear();
    if (Platform.OS === "web") {
      window.location.reload();
    }
  };
  
  // Si on affiche le formulaire
  if (showEmailForm) {
    return (
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowEmailForm(false)}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.formTitle, { ...theme.typography.styles.h2, color: theme.colors.text.primary }]}>
              Rejoindre la Table {tableNumber || "?"}
            </Text>
            
            <Text style={[styles.formSubtitle, { ...theme.typography.styles.body, color: theme.colors.text.secondary }]}>
              Entrez vos informations pour continuer
            </Text>
            
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, { backgroundColor: "rgba(255,255,255,0.95)", borderColor: error ? theme.colors.error.main : "transparent" }]}>
                <Ionicons name="person-outline" size={22} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text.primary }]}
                  placeholder="Votre nom"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, { backgroundColor: "rgba(255,255,255,0.95)", borderColor: "transparent" }]}>
                <Ionicons name="call-outline" size={22} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text.primary }]}
                  placeholder="Téléphone (optionnel)"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error.main }]}>{error}</Text>
            ) : null}
            
            {/* Continue Button */}
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleContinueWithEmail}
              loading={loading}
              disabled={loading || !name.trim()}
              style={{ marginTop: 32 }}
            >
              {loading ? "Connexion..." : "Continuer →"}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
  
  // Page d'onboarding principale
  return (
    <View style={[styles.container, { backgroundColor: RESTAURANT_CONFIG.backgroundColor }]}>
      {/* StatusBar transparent pour fullscreen */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      {/* Clear button (debug) */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearStorage}
      >
        <Ionicons name="trash-outline" size={18} color={theme.colors.text.tertiary} />
      </TouchableOpacity>

      {/* 🔄 REPRISE DE SESSION - si session active détectée */}
      {existingSession && (
        <View style={styles.resumeSessionCard}>
          <View style={styles.resumeSessionContent}>
            <Ionicons name="refresh" size={28} color="#F87171" />
            <View style={styles.resumeSessionText}>
              <Text style={styles.resumeSessionTitle}>Session en cours</Text>
              <Text style={styles.resumeSessionSubtitle}>
                Reprendre la commande de{" "}
                <Text style={{ fontWeight: "700" }}>{existingSession.clientName}</Text> ?
              </Text>
            </View>
          </View>
          <View style={styles.resumeSessionButtons}>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={handleResumeSession}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resumeBtnSecondary}
              onPress={handleNewSession}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnSecondaryText}>Nouvelle session</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Food Images - Décalées et tailles différentes */}
          <Animated.View style={[styles.foodImageWrapper, styles.foodImage1, { opacity: image1Anim }]}>
            <Image
              source={RESTAURANT_CONFIG.images.image1}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[styles.foodImageWrapper, styles.foodImage2, { opacity: image2Anim }]}>
            <Image
              source={RESTAURANT_CONFIG.images.image2}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[styles.foodImageWrapper, styles.foodImage3, { opacity: image3Anim }]}>
            <Image
              source={RESTAURANT_CONFIG.images.image3}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[styles.foodImageWrapper, styles.foodImage4, { opacity: image4Anim }]}>
            <Image
              source={RESTAURANT_CONFIG.images.image4}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          {/* Logo + Restaurant Name - SANS cercle, logo GROS */}
          <View style={styles.logoContainer}>
            <Image
              source={RESTAURANT_CONFIG.logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
            
            <Text style={styles.welcomeText}>
              Bienvenue chez
            </Text>
            
            <Text style={[styles.restaurantNameBig, fontLoaded && { fontFamily: 'DXNacky' }]}>
              Cucina{'\n'}Di{'\n'}Nini
            </Text>
          </View>
          
          {/* Slogan */}
          <Text style={[styles.slogan, { ...theme.typography.styles.body, color: theme.colors.text.secondary }]}>
            What you eat is what you eat
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Bloc flottant Input + Boutons (monte avec le clavier) */}
      <Animated.View
        style={[
          styles.floatingInputSection,
          {
            transform: [{
              translateY: keyboardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -240], // Monte de 240px quand clavier visible (moins car déjà plus haut)
              }),
            }],
          },
        ]}
      >
        {/* Google button + Input sur la même ligne */}
        <View style={styles.inputRow}>
          {/* Google button carré */}
          <TouchableOpacity
            style={[styles.googleButtonSquare, { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0", ...theme.shadows.soft }]}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={22} color="#DB4437" />
          </TouchableOpacity>
          
          {/* Input Nom */}
          <View style={[styles.inputContainerInline, { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }]}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIconMain} />
            <TextInput
              style={styles.textInputMain}
              placeholder="Votre nom"
              placeholderTextColor="#AAA"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>
        
        {/* Main CTA */}
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.colors.secondary.main, ...theme.shadows.medium }]}
          onPress={handleContinueWithEmail}
          activeOpacity={0.8}
          disabled={!name.trim()}
        >
          <Text style={styles.mainButtonText}>
            Commençons !
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Tout blanc
  },
  clearButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 1000,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    paddingBottom: 60,
  },
  
  // Food Images - Ajustements ENCORE PLUS agressifs
  foodImageWrapper: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 200,
  },
  foodImage1: {
    top: -180,
    left: -20,
    width: 280,
    height: 300,
  },
  foodImage2: {
    top: 0,
    right: -120,
    width: 240,
    height: 220,
  },
  foodImage3: {
    bottom: 360,
    left: -210,
    width: 340,
    height: 300,
  },
  foodImage4: {
    bottom: 280,
    right: -110,
    width: 200,
    height: 200,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  
  // Logo - ENCORE PLUS GROS, ENCORE PLUS HAUT
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 24,
  },
  logoImage: {
    height: 180, // 300 * 0.8 = 240 (réduction de 20%)
    marginBottom: 24,
    top: -100,
  },
  
  // Bienvenue
  welcomeText: {
    textAlign: "center",
    fontSize: 15,
    color: "#888",
    marginTop: -10,
    marginBottom: 6,
    letterSpacing: 2,
    textTransform: "uppercase",
     top: -130,
  },
  restaurantNameBig: {
    textAlign: "center",
    fontSize: 72, // Plus grand pour la police custom
    fontWeight: "normal", // La police custom gère le poids
    color: "#2D3142",
    letterSpacing: 2,
    marginBottom: 16,
    top: -120,
  },
  restaurantName: {
    textAlign: "center",
    marginBottom: 16,
  },
  
  // Slogan
  slogan: {
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  
  // Bloc flottant qui monte avec le clavier
  floatingInputSection: {
    position: "absolute",
    bottom: 120,
    left: 32,
    right: 32,
    // Pas de background, pas de shadow, pas de bordure visible
  },
  
  // Social Button (single, full width)
  socialButtonSingle: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  
  // Row avec Google carré + Input
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  googleButtonSquare: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainerInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
  },
  
  // Main Button - TEXTE VISIBLE
  mainButton: {
    width: "100%",
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  
  // Input sur page principale
  inputWrapperMain: {
    width: "100%",
    marginBottom: 16,
  },
  inputContainerMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  inputIconMain: {
    marginRight: 12,
  },
  textInputMain: {
    flex: 1,
    fontSize: 16,
    color: "#2D3142",
  },
  
  // Form (when showing email form)
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  formContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 40,
  },
  formTitle: {
    marginBottom: 8,
  },
  formSubtitle: {
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RESUME SESSION CARD
  // ═══════════════════════════════════════════════════════════════════════
  resumeSessionCard: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : StatusBar.currentHeight + 16,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  resumeSessionContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resumeSessionText: {
    flex: 1,
    marginLeft: 14,
  },
  resumeSessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  resumeSessionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  resumeSessionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: "#F87171",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resumeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resumeBtnSecondary: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resumeBtnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});
