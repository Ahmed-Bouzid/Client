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
  ImageBackground,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from 'expo-font';
import { useTheme } from "../theme";
import { Button } from "../components";
import { useClientTableStore } from "../stores/useClientTableStore";
import { useRestaurantStore } from "../stores/useRestaurantStore";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import RNUUID from "react-native-uuid";

import { getRestaurantAssets, getRestaurantFont } from "../utils/restaurantAssets";

export default function WelcomeScreen({
  tableId = null,
  tableNumber = null,
  onJoin = () => {},
}) {
  const { theme } = useTheme();
  
  console.log("👋 [WelcomeScreen] Montage/remount avec props:", { tableId, tableNumber });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 RESTAURANT CONFIG - Seules ces valeurs changent selon le restaurant
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 Récupérer le restaurantId depuis le store (source de vérité : useClientTableStore)
  const { restaurantId } = useClientTableStore();
  
  // 🎨 Charger les assets dynamiquement selon le restaurant
  const restaurantAssets = React.useMemo(() => {
    return getRestaurantAssets(restaurantId);
  }, [restaurantId]);
  
  const RESTAURANT_CONFIG = {
    images: restaurantAssets.welcomeImages,
    logo: restaurantAssets.logo,
    name: useRestaurantStore.getState().name || "Restaurant",
    backgroundColor: "#FFFFFF",
    font: restaurantAssets.font,
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
  
  // 🎬 Exit animations (transition vers MenuScreen)
  const exitInputAnim = useRef(new Animated.Value(0)).current;
  const exitImage1Anim = useRef(new Animated.Value(0)).current;
  const exitImage2Anim = useRef(new Animated.Value(0)).current;
  const exitImage3Anim = useRef(new Animated.Value(0)).current;
  const exitImage4Anim = useRef(new Animated.Value(0)).current;
  const exitTextAnim = useRef(new Animated.Value(0)).current;
  const exitLogoAnim = useRef(new Animated.Value(0)).current;
  const bgLeftAnim = useRef(new Animated.Value(0)).current;
  const bgRightAnim = useRef(new Animated.Value(0)).current;
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // 📱 RESPONSIVE SCALING - Design basé sur iPhone 16 Pro Max (440x956)
  // Ces valeurs sont utilisées pour que le design soit IDENTIQUE sur tous les appareils
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const DESIGN_WIDTH = 440;  // iPhone 16 Pro Max width
  const DESIGN_HEIGHT = 956; // iPhone 16 Pro Max height
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const vScale = SCREEN_HEIGHT / DESIGN_HEIGHT;
  
  // 🔒 GRILLZ LOCKED VALUES - Valeurs responsive verrouillées
  const GRILLZ_RESPONSIVE = {
    chicken1: { width: 224 * scale, height: 224 * scale, top: -50 * vScale, left: -50 * scale },
    chicken2: { width: 192 * scale, height: 192 * scale, top: -10 * vScale, right: -60 * scale },
    chicken3: { width: 192 * scale, height: 192 * scale, bottom: 220 * vScale, left: -110 * scale },
    chicken4: { width: 208 * scale, height: 208 * scale, bottom: 100 * vScale, right: -130 * scale },
    logo: { width: 290 * scale, height: 325 * scale, top: '28%' },
    bienvenue: { top: '26%', fontSize: 28 * scale },
  };
  
  // Stores
  console.log("👋 [WelcomeScreen] Store restaurantId:", restaurantId);
  
  const restaurantName = useRestaurantStore((state) => state.name);
  const fetchRestaurantInfo = useRestaurantStore((state) => state.fetchRestaurantInfo);
  
  // 🎨 Charger la police selon le restaurant
  useEffect(() => {
    const loadFont = async () => {
      try {
        const fontConfig = RESTAURANT_CONFIG.font;
        
        // Si le restaurant a une police personnalisée
        if (fontConfig && fontConfig.file) {
          await Font.loadAsync({
            [fontConfig.family]: fontConfig.file,
          });
          setFontLoaded(true);
        } else {
          // Pas de police custom, utiliser la police système
          setFontLoaded(false);
        }
      } catch (error) {
        console.warn('Police custom non chargée:', error);
        setFontLoaded(false);
      }
    };
    loadFont();
  }, [restaurantId, RESTAURANT_CONFIG.font]);
  
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
    // Reste sur la page welcome, ne pas ouvrir le formulaire séparé
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
    console.log("📝 [WelcomeScreen] handleContinueWithEmail appelé");
    console.log("   - name:", name.trim());
    console.log("   - tableId (prop):", tableId);
    console.log("   - restaurantId (store):", restaurantId);
    
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
      
      console.log("🔍 [JOIN] IDs résolus:");
      console.log("   - finalRestaurantId:", finalRestaurantId);
      console.log("   - tableId:", tableId);
      
      if (!finalRestaurantId) {
        console.error("❌ [JOIN] Restaurant ID manquant!");
        setError("Restaurant non identifié.");
        setLoading(false);
        return;
      }

      // ⭐ Récupérer ou créer clientId (UUID stable)
      let clientId = await AsyncStorage.getItem("clientId");
      if (!clientId) {
        clientId = RNUUID.v4();
        await AsyncStorage.setItem("clientId", clientId);
      }

      console.log("✅ [JOIN] ClientId:", clientId);
      
      // Générer un token client simple pour les commandes
      const token = await clientAuthService.getClientToken(
        name.trim(),
        tableId,
        finalRestaurantId,
        clientId,
      );
      
      console.log("✅ [JOIN] Token client généré");
      
      const body = {
        clientName: name.trim(),
        clientId: clientId,
        tableId: tableId,
        restaurantId: finalRestaurantId,
        reservationDate: new Date().toISOString(),
        reservationTime: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      };
      
      console.log("📤 [JOIN] Envoi réservation:", JSON.stringify(body, null, 2));
      
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
      
      console.log("📥 [JOIN] Réponse reçue - Status:", response.status);
      
      const text = await response.text();
      console.log("📥 [JOIN] Réponse texte:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("❌ [JOIN] Erreur parsing JSON:", text);
        Alert.alert("Erreur", "Réponse serveur inattendue.");
        setLoading(false);
        return;
      }
      
      console.log("📥 [JOIN] Réponse JSON parsée:", data);
      
      if (!response.ok) {
        console.error("❌ [JOIN] Réponse non-OK:", response.status, data.message);
        Alert.alert("Erreur", data.message || "Erreur lors de la création de la réservation.");
        setLoading(false);
        return;
      }
      
      console.log("✅ [JOIN] Réponse OK reçue");
      
      const reservationObj = data.reservation || data;
      const reservationId = reservationObj._id;
      
      console.log("✅ [JOIN] Reservation ID:", reservationId);
      
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
      console.log("🎉 [JOIN] Succès! Appel onJoin callback");
      onJoin?.({
        reservationId: reservationId,
        clientId: clientId,
        userName: name.trim(),
      });
      
    } catch (error) {
      console.error("❌ [JOIN] Exception:", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  // 🎬 Animation de sortie complexe (Grillz uniquement)
  const handleExitAnimation = async () => {
    console.log("🎬 [WelcomeScreen] Démarrage animation de sortie");
    
    // Vérification avant animation
    if (!name.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }
    
    // Fermer le clavier
    Keyboard.dismiss();
    
    // Désactiver le bouton pendant l'animation
    setLoading(true);
    
    // Séquence d'animation
    Animated.sequence([
      // PHASE 1 : Sortie des UI elements (400ms)
      Animated.parallel([
        // Input + bouton → bas
        Animated.timing(exitInputAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Images → côtés
        Animated.timing(exitImage1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(exitImage2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(exitImage3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(exitImage4Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Texte "BIENVENUE CHEZ" → fade out
        Animated.timing(exitTextAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // PHASE 2 : Background split + Logo fade (600ms)
      Animated.parallel([
        // Background gauche → gauche
        Animated.timing(bgLeftAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Background droite → droite
        Animated.timing(bgRightAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Logo → fade out (avec petit delay)
        Animated.timing(exitLogoAnim, {
          toValue: 1,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      // Callback : Navigation à la fin de l'animation
      console.log("✅ [Animation] Terminée, navigation vers MenuScreen");
      await handleContinueWithEmail();
    });
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
  // 🔥 LE GRILLZ = fond BBQ avec image poulet
  const isGrillz = restaurantId === '695e4300adde654b80f6911a';
  // 🍝 CUCINA = fond panini italien
  const isCucina = restaurantId === '6970ef6594abf8bacd9d804d';
  
  // Images de fond pour Grillz (pré-découpées)
  const GRILLZ_BG_LEFT = require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chickenleft.png");
  const GRILLZ_BG_RIGHT = require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chickenright.png");
  const GRILLZ_MENU_PREVIEW = require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/screenMenu.png");
  
  // Si Grillz, on utilise ImageBackground avec overlay sombre
  // Position absolute pour passer PAR-DESSUS le SafeAreaView parent
  if (isGrillz) {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web';
    
    return (
      <View style={{ 
        position: isWeb ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Sur web, utiliser height: 100% pour edge-to-edge
        ...(isWeb ? { 
          width: '100%', 
          height: '100%',
          minHeight: '100dvh', // Dynamic viewport height
        } : {}),
        zIndex: 9999,
        backgroundColor: '#000', // Fallback noir
      }}>
        {/* 🖼️ Menu preview en arrière-plan (visible quand les images se séparent) */}
        <ImageBackground 
          source={GRILLZ_MENU_PREVIEW} 
          style={{ ...StyleSheet.absoluteFillObject }}
          resizeMode="cover"
        />
        
        {/* 🎬 Background split en 2 pour l'animation de sortie */}
        <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
          {/* Moitié gauche */}
          <Animated.View 
            style={{ 
              width: screenWidth, // 100% pour afficher l'image complète
              height: '100%',
              transform: [{
                translateX: bgLeftAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -screenWidth * 0.5],
                }),
              }],
            }}
          >
            <ImageBackground 
              source={GRILLZ_BG_LEFT} 
              style={{ width: '100%', height: '100%', marginLeft: -screenWidth * 0.5 }}
              resizeMode="cover"
              imageStyle={{ alignSelf: 'flex-end' }}
            >
              {/* Overlay sombre */}
              <View style={{ 
                ...StyleSheet.absoluteFillObject, 
                backgroundColor: 'rgba(0, 0, 0, 0.6)' 
              }} />
            </ImageBackground>
          </Animated.View>
          
          {/* Moitié droite */}
          <Animated.View 
            style={{ 
              width: screenWidth, // 100% pour afficher l'image complète
              height: '100%',
              transform: [{
                translateX: bgRightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, screenWidth * 0.5],
                }),
              }],
            }}
          >
            <ImageBackground 
              source={GRILLZ_BG_RIGHT} 
              style={{ width: '100%', height: '100%', marginLeft: -screenWidth * 0.5 }}
              resizeMode="cover"
              imageStyle={{ alignSelf: 'flex-start' }}
            >
              {/* Overlay sombre */}
              <View style={{ 
                ...StyleSheet.absoluteFillObject, 
                backgroundColor: 'rgba(0, 0, 0, 0.6)' 
              }} />
            </ImageBackground>
          </Animated.View>
        </View>
        
        {/* Container de contenu (par-dessus le background) */}
        <View style={{ ...StyleSheet.absoluteFillObject }}>
          {/* StatusBar transparent pour fullscreen */}
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />
          
          {/* Clear button (debug) */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearStorage}
          >
            <Ionicons name="trash-outline" size={18} color="#888" />
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
          
          {/* 🍗 4 Images de nourriture dans les coins - GRILLZ (RESPONSIVE + FADE) */}
          {/* Image 1 - Haut gauche */}
          <Animated.Image 
            source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken1.png")}
            style={{
              position: 'absolute',
              top: GRILLZ_RESPONSIVE.chicken1.top,
              left: GRILLZ_RESPONSIVE.chicken1.left,
              width: GRILLZ_RESPONSIVE.chicken1.width,
              height: GRILLZ_RESPONSIVE.chicken1.height,
              transform: [{ rotate: '15deg' }],
              zIndex: 2,
              opacity: exitImage1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
            resizeMode="contain"
          />
          {/* Image 2 - Haut droit */}
          <Animated.Image 
            source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken2.png")}
            style={{
              position: 'absolute',
              top: GRILLZ_RESPONSIVE.chicken2.top,
              right: GRILLZ_RESPONSIVE.chicken2.right,
              width: GRILLZ_RESPONSIVE.chicken2.width,
              height: GRILLZ_RESPONSIVE.chicken2.height,
              transform: [{ rotate: '-10deg' }],
              zIndex: 2,
              opacity: exitImage2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
            resizeMode="contain"
          />
          {/* Image 3 - Bas gauche */}
          <Animated.Image 
            source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken3.png")}
            style={{
              position: 'absolute',
              bottom: GRILLZ_RESPONSIVE.chicken3.bottom,
              left: GRILLZ_RESPONSIVE.chicken3.left,
              width: GRILLZ_RESPONSIVE.chicken3.width,
              height: GRILLZ_RESPONSIVE.chicken3.height,
              transform: [{ rotate: '25deg' }],
              zIndex: 2,
              opacity: exitImage3Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
            resizeMode="contain"
          />
          {/* Image 4 - Bas droit */}
          <Animated.Image 
            source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken4.png")}
            style={{
              position: 'absolute',
              bottom: GRILLZ_RESPONSIVE.chicken4.bottom,
              right: GRILLZ_RESPONSIVE.chicken4.right,
              width: GRILLZ_RESPONSIVE.chicken4.width,
              height: GRILLZ_RESPONSIVE.chicken4.height,
              transform: [{ rotate: '-20deg' }],
              zIndex: 2,
              opacity: exitImage4Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
            resizeMode="contain"
          />
        
        {/* Contenu sans scroll */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              flex: 1,
              zIndex: 5,
            },
          ]}
        >
          {/* 🎬 Food Images avec animations de sortie */}
          <Animated.View style={[
            styles.foodImageWrapper, 
            styles.foodImage1, 
            { 
              opacity: image1Anim,
              transform: [{
                translateX: exitImage1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -400],
                }),
              }],
            }
          ]}>
            <Image
              source={RESTAURANT_CONFIG.images.image1}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[
            styles.foodImageWrapper, 
            styles.foodImage2, 
            { 
              opacity: image2Anim,
              transform: [{
                translateX: exitImage2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
              }],
            }
          ]}>
            <Image
              source={RESTAURANT_CONFIG.images.image2}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[
            styles.foodImageWrapper, 
            styles.foodImage3, 
            { 
              opacity: image3Anim,
              transform: [{
                translateX: exitImage3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -400],
                }),
              }],
            }
          ]}>
            <Image
              source={RESTAURANT_CONFIG.images.image3}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View style={[
            styles.foodImageWrapper, 
            styles.foodImage4, 
            { 
              opacity: image4Anim,
              transform: [{
                translateX: exitImage4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
              }],
            }
          ]}>
            <Image
              source={RESTAURANT_CONFIG.images.image4}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
          
        </Animated.View>
        
        {/* 🔒 Bienvenue chez - HORS du content, comme les chickens */}
        <View style={{
          position: 'absolute',
          top: GRILLZ_RESPONSIVE.bienvenue.top,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 20,
        }}>
          <Animated.Text style={[styles.welcomeText, { 
            top: 0,
            marginTop: 0,
            color: '#FF8A50',
            fontSize: GRILLZ_RESPONSIVE.bienvenue.fontSize, 
            letterSpacing: 6 * scale, 
            textTransform: 'uppercase',
            fontFamily: fontLoaded ? RESTAURANT_CONFIG.font.family : undefined,
            textShadowColor: 'rgba(0, 0, 0, 0.9)',
            textShadowOffset: { width: 0, height: 4 * scale },
            textShadowRadius: 12 * scale,
            opacity: exitTextAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }]}>
            Bienvenue chez
          </Animated.Text>
        </View>
          
        {/* 🔥 Logo Grillz - HORS du content, comme les chickens */}
        <View style={{
          position: 'absolute',
          top: GRILLZ_RESPONSIVE.logo.top,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 15,
        }}>
          <Animated.Image
            source={require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/logo.png")}
            style={{ 
              width: GRILLZ_RESPONSIVE.logo.width, 
              height: GRILLZ_RESPONSIVE.logo.height,
              opacity: exitLogoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
            resizeMode="contain"
          />
        </View>
        
        {/* 🔥 GRILLZ: Floating Input Section avec animations de sortie */}
        <Animated.View
          style={[
            styles.floatingInputSection,
            {
              zIndex: 50,
              opacity: exitInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: keyboardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -240],
                  }),
                },
                {
                  translateY: exitInputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 300],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Google button + Input sur la même ligne */}
          <View style={styles.inputRow}>
            {/* Google button carré */}
            <TouchableOpacity
              style={[styles.googleButtonSquare, { 
                backgroundColor: '#1E1E1E', 
                borderColor: '#D35400', 
              }]}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-google" size={22} color="#DB4437" />
            </TouchableOpacity>
            
            {/* Input Nom */}
            <View style={[
              styles.inputContainerInline, 
              { 
                backgroundColor: '#1E1E1E', 
                borderColor: '#D35400',
                marginRight: 62,
              }
            ]}>
              <Ionicons name="person-outline" size={20} color="#FF8A50" style={styles.inputIconMain} />
              <TextInput
                style={[styles.textInputMain, { color: '#FFFFFF', backgroundColor: 'transparent' }]}
                placeholder="Votre nom"
                placeholderTextColor="#777"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
          
          {/* Input Téléphone */}
          <View style={styles.inputRow}>
            <View style={[styles.googleButtonSquare, { opacity: 0 }]} />
            <View style={[
              styles.inputContainerInline, 
              { 
                backgroundColor: '#1E1E1E', 
                borderColor: '#D35400',
                marginRight: 62,
              }
            ]}>
              <Ionicons name="call-outline" size={20} color="#FF8A50" style={styles.inputIconMain} />
              <TextInput
                style={[styles.textInputMain, { color: '#FFFFFF', backgroundColor: 'transparent' }]}
                placeholder="Votre téléphone"
                placeholderTextColor="#777"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>
          
          {/* Error message */}
          {error ? (
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{error}</Text>
          ) : null}
          
          {/* CTA Button - Déclenche l'animation */}
          <TouchableOpacity
            onPress={handleExitAnimation}
            activeOpacity={0.8}
            disabled={!name.trim() || loading}
            style={{ marginTop: 16 }}
          >
            <LinearGradient
              colors={['#D35400', '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                opacity: name.trim() ? 1 : 0.5,
                shadowColor: '#FF5722',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}>
                {loading ? "Chargement..." : `Rejoindre la table ${tableNumber || ""}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        </View>
      </View>
    );
  }

  // 🍝 CUCINA DI NINI - fond panini italien
  const CUCINA_BG = require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini1.png");
  const CUCINA_LOGO = require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/logo.png");
  
  if (isCucina) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}>
        {/* Background panini */}
        <ImageBackground 
          source={CUCINA_BG}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          {/* Overlay sombre */}
          <View style={{ 
            ...StyleSheet.absoluteFillObject, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)' 
          }} />
          
          {/* StatusBar transparent pour fullscreen */}
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />

          {/* Clear button (debug) - CUCINA */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearStorage}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 🔄 REPRISE DE SESSION - si session active détectée (CUCINA) */}
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
          
          {/* 🍕 4 Images de nourriture dans les coins */}
          {/* Image 1 - Haut gauche */}
          <Image 
            source={require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini2.png")}
            style={{
              position: 'absolute',
              top: -50,
              left: -30,
              width: 200,
              height: 200,
              transform: [{ rotate: '40deg' }],
            }}
            resizeMode="contain"
          />
          {/* Image 2 - Haut droit */}
          <Image 
            source={require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini3.png")}
            style={{
              position: 'absolute',
              top: 30,
              right: -60,
              width: 180,
              height: 180,
              transform: [{ rotate: '35deg' }],
            }}
            resizeMode="contain"
          />
          {/* Image 3 - Bas gauche */}
          <Image 
            source={require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini4.png")}
            style={{
              position: 'absolute',
              bottom: 230,
              left: -80,
              width: 220,
              height: 220,
              transform: [{ rotate: '45deg' }],
            }}
            resizeMode="contain"
          />
          {/* Image 4 - Bas droit */}
          <Image 
            source={require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini5.png")}
            style={{
              position: 'absolute',
              bottom: 170,
              right: -50,
              width: 190,
              height: 190,
              transform: [{ rotate: '-30deg' }],
            }}
            resizeMode="contain"
          />
          
          {/* Contenu centré */}
          <View style={{ 
            flex: 1, 
            justifyContent: 'flex-start', 
            alignItems: 'center',
            paddingHorizontal: 30,
            paddingTop: 118,
          }}>
            {/* Logo - position fixe en haut */}
            <View>
              <Image
                source={CUCINA_LOGO}
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
              
              {/* Bienvenue chez */}
              <Text style={{ 
                color: '#FFFFFF',
                fontSize: 32,
                fontFamily: fontLoaded ? RESTAURANT_CONFIG.font.family : undefined,
                textAlign: 'center',
                marginTop: -45,
                letterSpacing: 2,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
              }}>
                Bienvenue chez
              </Text>
              
              {/* Nom du restaurant avec font custom */}
              <Text style={{ 
                color: '#FFFFFF',
                fontSize: 61,
                fontFamily: fontLoaded ? RESTAURANT_CONFIG.font.family : undefined,
                textAlign: 'center',
                marginTop: 10,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 3 },
                textShadowRadius: 8,
              }}>
                La Cucina Di Nini
              </Text>
            </View>
          </View>
          
          {/* Input section - position absolue en bas, monte avec clavier */}
          <Animated.View style={{
            position: 'absolute',
            bottom: 50,
            left: 30,
            right: 30,
            transform: [{
              translateY: keyboardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -320],
              }),
            }],
          }}>
            {/* Input Nom */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, color: '#FFFFFF', fontSize: 16 }}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            
            
            {/* Error message */}
            {error ? (
              <Text style={{ color: '#FF6B6B', textAlign: 'center', marginBottom: 10 }}>{error}</Text>
            ) : null}
            
            {/* Bouton Rejoindre */}
            <TouchableOpacity
              onPress={handleContinueWithEmail}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#E74C3C',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 18, 
                fontWeight: '700',
              }}>
                {loading ? "Chargement..." : "Commencer la commande"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      </View>
      </TouchableWithoutFeedback>
    );
  }

  // Autres restaurants: container normal
  const ContainerComponent = View;
  const containerProps = {
    style: [styles.container, { backgroundColor: RESTAURANT_CONFIG.backgroundColor }],
  };
  
  return (
    <ContainerComponent {...containerProps}>
      {/* StatusBar transparent pour fullscreen */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isGrillz ? "light-content" : "dark-content"}
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
          
          {/* Logo + Restaurant Name - Layout différent selon restaurant */}
          {restaurantId === '695e4300adde654b80f6911a' ? (
            // 🔥 LE GRILLZ: Bienvenue en haut, Logo en bas, tout descendu
            <View style={[styles.logoContainer, { marginTop: 180 }]}>
              <Text style={[styles.welcomeText, { 
                color: '#FF8A50',  // Orange feu BBQ
                marginBottom: -30, 
                fontSize: 28, 
                letterSpacing: 6, 
                textTransform: 'uppercase',
                fontFamily: fontLoaded ? 'BogotaBold' : undefined,
                // Ombre portée effet braise
                textShadowColor: 'rgba(211, 84, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
                top: -95,  // Descendu de 15px (était -110)
              }]}>
                Bienvenue chez
              </Text>
              
              <Image
                source={RESTAURANT_CONFIG.logo}
                style={[styles.logoImage, { width: 400, height: 400 }]}
                resizeMode="contain"
              />
            </View>
          ) : (
            // 🏪 AUTRES RESTOS: Logo en haut, texte en bas
            <View style={styles.logoContainer}>
              <Image
                source={RESTAURANT_CONFIG.logo}
                style={styles.logoImage}
                resizeMode="contain"
              />
              
              <Text style={styles.welcomeText}>
                Bienvenue chez
              </Text>
              
              <Text style={[styles.restaurantNameBig, fontLoaded && RESTAURANT_CONFIG.font?.family && { fontFamily: RESTAURANT_CONFIG.font.family }]}>
                {restaurantName ? restaurantName.split(' ').join('\n') : "Restaurant"}
              </Text>
            </View>
          )}
          
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
            style={[styles.googleButtonSquare, { 
              backgroundColor: isGrillz ? '#1E1E1E' : '#FFFFFF', 
              borderColor: isGrillz ? '#D35400' : '#E0E0E0', 
              ...theme.shadows.soft 
            }]}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={22} color="#DB4437" />
          </TouchableOpacity>
          
          {/* Input Nom - réduit de 50px à droite */}
          <View style={[
            styles.inputContainerInline, 
            { 
              backgroundColor: isGrillz ? '#1E1E1E' : '#FFFFFF', 
              borderColor: isGrillz ? '#D35400' : '#E0E0E0',
              marginRight: 62, // 50px (bouton) + 12px (gap)
            }
          ]}>
            <Ionicons name="person-outline" size={20} color={isGrillz ? '#FF8A50' : '#888'} style={styles.inputIconMain} />
            <TextInput
              style={[styles.textInputMain, isGrillz && { color: '#FFFFFF' }]}
              placeholder="Votre nom"
              placeholderTextColor={isGrillz ? '#777' : '#AAA'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>
        
        {/* 🔥 Input Téléphone - GRILLZ ONLY */}
        {isGrillz && (
          <View style={styles.inputRow}>
            {/* Spacer pour aligner avec le bouton Google */}
            <View style={[styles.googleButtonSquare, { opacity: 0 }]} />
            
            {/* Input Téléphone - réduit de 50px à droite */}
            <View style={[
              styles.inputContainerInline, 
              { 
                backgroundColor: '#1E1E1E', 
                borderColor: '#D35400',
                marginRight: 62, // 50px (bouton) + 12px (gap)
              }
            ]}>
              <Ionicons name="call-outline" size={20} color="#FF8A50" style={styles.inputIconMain} />
              <TextInput
                style={[styles.textInputMain, { color: '#FFFFFF' }]}
                placeholder="Votre téléphone"
                placeholderTextColor="#777"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>
        )}
        
        {/* Main CTA */}
        {isGrillz ? (
          <TouchableOpacity
            onPress={handleContinueWithEmail}
            activeOpacity={0.8}
            disabled={!name.trim()}
            style={{ marginTop: 16 }}
          >
            <LinearGradient
              colors={['#D35400', '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                opacity: name.trim() ? 1 : 0.5,
                shadowColor: '#FF5722',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}>
                Commençons ! 🔥
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
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
        )}
      </Animated.View>
    </ContainerComponent>
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
    top: -120,  // Baissée (était -180)
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
    bottom: 320,
    left: -180,
    width: 320,
    height: 280,
    transform: [{ rotate: '120deg' }],
  },
  foodImage4: {
    bottom: 280,
    right: -110,
    width: 250,   // 200 * 1.25 = 250 (agrandi 25%)
    height: 250,  // 200 * 1.25 = 250 (agrandi 25%)
    transform: [{ rotate: '45deg' }],  // Rotation 45°
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
     top: -200,
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
    bottom: 30,
    left: 32,
    right: 32,
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
    marginBottom: 10,
  },
  googleButtonSquare: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainerInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
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
