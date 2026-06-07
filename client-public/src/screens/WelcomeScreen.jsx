/**
 * ═══════════════════════════════════════════════════════════════
 * WelcomeScreen.jsx — ÉTAPE 1 : PAGE D'ACCUEIL & CONNEXION CLIENT
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client :
 *   1. Affichage de la page d'accueil restaurant (logo, photos, ambiance)
 *   2. Saisie du prénom et numéro de téléphone
 *   3. Appel API : création/reprise de réservation + obtention du token client
 *   4. Stockage des credentials (AsyncStorage) puis callback onJoin → MenuScreen
 *
 * Fonctionnalités secondaires :
 *   - Détection de session existante → proposition de reprise
 *   - Thème conditionnel par restaurant (Grillz, Cucina, défaut)
 *   - Animations d'entrée/sortie selon le restaurant
 *   - Chargement de polices custom
 */

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
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
import { secureSessionStore } from "shared-api/utils/secureSessionStore";
import { deviceIdentity } from "shared-api/utils/deviceIdentity";
import RNUUID from "react-native-uuid";

import { getRestaurantAssets } from "../utils/restaurantAssets";
import useOrderLookup from "../hooks/useOrderLookup";
import useThemeKey from "../hooks/useThemeKey";
import { getWelcomeFormTokens } from "../theme/defaultTheme";
import WelcomeScreenGrillz from "./WelcomeScreenGrillz";
import WelcomeScreenBaghera from "./WelcomeScreenBaghera";

export default function WelcomeScreen({
  tableId = null,
  tableNumber = null,
  onJoin = () => {},
  onLookupOrder = () => {},
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  
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

  // Phase 0.4-C.3 — Tokens du formulaire Welcome (input + CTA + erreur).
  // styleKey lu via useThemeKey (single source of truth, Phase 0.2.5).
  // Null-safe: getWelcomeFormTokens normalise styleKey null/undefined vers
  // la branche default (cucina) iso-strict avec valeurs hardcoded actuelles.
  const { styleKey } = useThemeKey();
  const welcomeFormTokens = getWelcomeFormTokens(styleKey);

  // States
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  
  // 🔍 Order lookup — détection auto quand le user tape # dans le champ téléphone
  const orderLookup = useOrderLookup();
  const isOrderLookupMode = phone.startsWith("#");

  const isCmdCode = (value) => /^#[A-Z0-9]{4}$/i.test(String(value || "").trim());
  const normalizeCmdCode = (value) => {
    const cleaned = String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    return cleaned ? `#${cleaned}` : "";
  };

  const handleNameChange = (text) => {
    if (text.startsWith("#")) {
      const code = text
        .slice(1)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4);
      setName(`#${code}`);
      return;
    }

    setName(text);
  };
  
  // Gestion unifiée du champ téléphone / order number
  const handlePhoneChange = (text) => {
    // Mode lookup : commence par #
    if (text.startsWith("#")) {
      // Garder # + max 4 caractères alphanumériques (format CMD)
      const code = text
        .slice(1)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4);
      const formatted = "#" + code;
      setPhone(formatted);
      orderLookup.setOrderNumber(formatted);
      return;
    }
    // Quitter le mode lookup si on efface le #
    if (phone.startsWith("#") && !text.startsWith("#")) {
      setPhone("");
      orderLookup.setOrderNumber("");
      return;
    }
    // Mode téléphone : 06/07 XX XX XX XX
    const digits = text.replace(/\D/g, '');
    if (digits.length >= 1 && digits[0] !== '0') return;
    if (digits.length >= 2 && digits[1] !== '6' && digits[1] !== '7') { setPhone('0'); return; }
    let formatted = '';
    for (let i = 0; i < digits.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += digits[i];
    }
    setPhone(formatted);
  };
  

  
  const handleLookupOrder = async () => {
    const result = await orderLookup.lookup({ restaurantId });
    if (result) {
      onLookupOrder(result);
    }
  };

  const logPrimaryCtaPress = (_source, _action) => {};
  
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
  
  // 📱 RESPONSIVE SCALING - Design basé sur iPhone 16 Pro Max (440x956)
  // Ces valeurs sont utilisées pour que le design soit IDENTIQUE sur tous les appareils
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const DESIGN_WIDTH = 440;  // iPhone 16 Pro Max width
  const DESIGN_HEIGHT = 956; // iPhone 16 Pro Max height
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const vScale = SCREEN_HEIGHT / DESIGN_HEIGHT;

  // Stores
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
  
  // ── PARCOURS : détection session existante au démarrage ──
  // Vérifie AsyncStorage pour proposer la reprise d'une session précédente
  useEffect(() => {
    if (!tableId) return;
    const checkExistingSession = async () => {
      try {
        const savedTableId = await AsyncStorage.getItem("currentTableId");
        const savedReservationId = await AsyncStorage.getItem("currentReservationId");
        const savedClientName = await AsyncStorage.getItem("currentClientName");
        const savedClientId = await secureSessionStore.getString(
          secureSessionStore.keys.CLIENT_ID,
        );
        const savedTableNumber = await AsyncStorage.getItem("currentTableNumber");
        const savedCreatedAt = await AsyncStorage.getItem("currentSessionCreatedAt");

        if (savedTableId === tableId && savedReservationId && savedClientName) {
          setExistingSession({
            reservationId: savedReservationId,
            clientName: savedClientName,
            clientId: savedClientId,
            tableNumber: savedTableNumber,
            createdAt: savedCreatedAt ? Number(savedCreatedAt) : 0,
          });
        } else {
          setExistingSession(null);
        }
      } catch (e) {
        setExistingSession(null);
      }
    };
    checkExistingSession();
  }, [tableId]);

  // ── PARCOURS : reprend une session existante (skip le formulaire) ──
  const handleResumeSession = async () => {
    if (!existingSession) return;
    setLoading(true);
    try {
      // Rafraîchir le token si possible (silencieux, sans bloquer la reprise)
      try {
        if (existingSession.clientName && restaurantId && restaurantId !== "DEFAULT") {
          await clientAuthService.getClientToken(
            existingSession.clientName,
            tableId !== "DEFAULT" ? tableId : null,
            restaurantId,
            existingSession.clientId,
          );
        }
      } catch {
        // Échec silencieux — on continue avec le token stocké
      }

      // Reprendre directement sans validation backend.
      // Si la session est expirée côté serveur, le MenuScreen le détectera
      // via ses propres appels API et appellera onReservationClosed.
      onJoin({
        reservationId: existingSession.reservationId,
        clientId: existingSession.clientId,
        userName: existingSession.clientName,
        tableNumber: existingSession.tableNumber,
        isResumed: true,
      });
    } catch (err) {
      console.error("❌ [ResumeSession] Erreur:", err);
      Alert.alert("Erreur", "Impossible de reprendre la session");
    } finally {
      setLoading(false);
    }
  };

  // Handler pour démarrer une nouvelle session
  // ⚠️ On garde currentTableId + currentReservationId pour que le 2e client
  // rejoigne la MÊME table/réservation (sinon il crée une résa séparée et ne
  // voit pas les commandes des autres clients de la table).
  // On efface uniquement l'identité client (clientId + nom) pour forcer la
  // génération d'un nouveau clientId stable côté backend.
  const handleNewSession = async () => {
    await AsyncStorage.multiRemove([
      "currentClientName",
    ]);
	await secureSessionStore.remove(secureSessionStore.keys.CLIENT_ID);
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
    if (Platform.OS === "web") {
      return undefined;
    }

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
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
  // ── PARCOURS PRINCIPAL : connexion utilisateur ──
  // 1. Valide prénom + tableId
  // 2. Génère/récupère clientId (UUID stable)
  // 3. Obtient un token client (JWT)
  // 4. Crée/reprend une réservation (POST /reservations/client/reservations)
  // 5. Stocke credentials dans AsyncStorage
  // 6. Appelle onJoin() → App.jsx navigue vers MenuScreen
  const handleContinueWithEmail = async () => {
    if (!name?.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }

    // Si un code CMD est saisi dans le champ nom, déclencher la recherche commande
    if (isCmdCode(name)) {
      const cmdCode = normalizeCmdCode(name);
      setPhone(cmdCode);
      orderLookup.setOrderNumber(cmdCode);
      setError("");
      const lookupResult = await orderLookup.lookup({ restaurantId, orderNumber: cmdCode });
      if (lookupResult) {
        onLookupOrder(lookupResult);
      }
      return;
    }

    if (!tableId || tableId === "DEFAULT") {
      setError("Table non identifiée. Re-scanner le QR code.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // ⭐ Stocker tableId et pseudo
      await AsyncStorage.multiSet([
        ["pseudo", name.trim()],
        ["tableId", tableId],
      ]);
      
      // ⭐ Récupérer restaurantId (store ou AsyncStorage)
      const finalRestaurantId = restaurantId || (await AsyncStorage.getItem("restaurantId"));
      
      if (!finalRestaurantId) {
        console.error("❌ [JOIN] Restaurant ID manquant!");
        setError("Restaurant non identifié.");
        setLoading(false);
        return;
      }

      // ⭐ Récupérer ou créer clientId (UUID stable)
      let clientId = await secureSessionStore.getString(
        secureSessionStore.keys.CLIENT_ID,
      );
      if (!clientId) {
        clientId = RNUUID.v4();
      await secureSessionStore.setString(
        secureSessionStore.keys.CLIENT_ID,
        String(clientId),
      );
      }
      
      // Générer un token client simple pour les commandes
      const token = await clientAuthService.getClientToken(
        name.trim(),
        tableId,
        finalRestaurantId,
        clientId,
      );
      
      const body = {
        clientName: name.trim(),
        clientId: clientId,
        tableId: tableId,
        restaurantId: finalRestaurantId,
        reservationDate: new Date().toISOString(),
        reservationTime: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      };
      
      const requestHeaders = await deviceIdentity.getAuthHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/reservations/client/reservations`,
        {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(body),
        },
      );
      
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("❌ [JOIN] Erreur parsing JSON:", text);
        Alert.alert("Erreur", "Réponse serveur inattendue.");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        console.error("❌ [JOIN] Réponse non-OK:", response.status, data.message);
        const isDuplicateName =
          response.status === 409 && data?.error === "duplicate_client_name";
        Alert.alert(
          isDuplicateName ? "Prénom déjà utilisé" : "Erreur",
          data.message || "Erreur lors de la création de la réservation.",
        );
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

      // 🔐 Identité stable : si le backend a réémis un token + résolu un clientId
      // (cas reco / réinstall app), on adopte la nouvelle identité.
      let effectiveClientId = clientId;
      if (data.resolvedClientId && data.resolvedClientId !== clientId) {
        effectiveClientId = data.resolvedClientId;
        await secureSessionStore.setString(
          secureSessionStore.keys.CLIENT_ID,
          String(effectiveClientId),
        );
      }
      if (data.token) {
        await secureSessionStore.setString(
          secureSessionStore.keys.CLIENT_TOKEN,
          data.token,
        );
      }
      
      // ⭐ Stocker les infos importantes dans AsyncStorage
      const storePairs = [
        ["currentReservationId", reservationId],
        ["currentTableId", tableId],
        ["currentClientName", name.trim()],
        ["currentSessionCreatedAt", String(Date.now())],
      ];
      if (tableNumber) {
        storePairs.push(["currentTableNumber", tableNumber.toString()]);
      }
      await AsyncStorage.multiSet(storePairs);
		await secureSessionStore.setString(
			secureSessionStore.keys.CLIENT_ID,
			String(effectiveClientId),
		);
      
      // ⭐ Appeler onJoin avec un objet (format attendu par App.jsx)
      onJoin?.({
        reservationId: reservationId,
        clientId: effectiveClientId,
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
    // Vérification avant animation
    if (!name.trim()) {
      setError("Veuillez entrer votre nom");
      return;
    }

    if (!tableId || tableId === "DEFAULT") {
      setError("Table non identifiée. Re-scanner le QR code.");
      return;
    }

    // Si le client tape un code CMD dans le champ nom, ne pas l'utiliser comme pseudo
    if (isCmdCode(name)) {
      const cmdCode = normalizeCmdCode(name);
      setPhone(cmdCode);
      orderLookup.setOrderNumber(cmdCode);
      setError("");
      const lookupResult = await orderLookup.lookup({ restaurantId, orderNumber: cmdCode });
      if (lookupResult) {
        onLookupOrder(lookupResult);
      }
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
  
  // Page d'onboarding principale
  // Phase 0.4-C.4 — isGrillz/isCucina dérivés du styleKey (single source of truth
  // useThemeKey, Phase 0.2.5) plutôt que des hash MongoDB hardcodés. Le hack
  // BDD 'grills'→'grillz' est géré cf. Phase 0.6 (consolidation BDD).
  // Iso-comportement steady-state préservé ; pendant le boot, le remplissage
  // est progressif (Phase 0.3 strangler) — isGrillz reste false jusqu'à ce
  // que styleKey soit résolu, même sémantique qu'avec restaurantId=null.
  const isGrillz = styleKey === 'grillz' || styleKey === 'grills';
  const isCucina = styleKey === 'cucina';
  // 🆕 Phase 3.2 — Baghera tenant (démo client 13 mai 2026)
  const isBaghera = styleKey === 'baghera';
  const isNameLookupMode = !isGrillz && name.startsWith("#");
  const isNameLookupValid = /^#[A-Z0-9]{4}$/.test(name);

  // 🆕 Phase 3.2 — Routing Baghera (avant Grillz/Cucina pour priorité démo)
  // Composant autonome avec sa propre palette/fonts (PAS de spread d'animations
  // parent comme Grillz — Baghera utilise des animations internes simples).
  if (isBaghera) {
    return (
      <WelcomeScreenBaghera
        tableNumber={tableNumber}
        name={name}
        setName={setName}
        loading={loading}
        error={error}
        existingSession={existingSession}
        handleResumeSession={handleResumeSession}
        handleContinueWithEmail={handleContinueWithEmail}
        handleNewSession={handleNewSession}
        handleClearStorage={handleClearStorage}
      />
    );
  }

  // Si Grillz, on utilise ImageBackground avec overlay sombre
  // Position absolute pour passer PAR-DESSUS le SafeAreaView parent
  if (isGrillz) {
    return (
      <WelcomeScreenGrillz
        // === STATE & DERIVED ===
        tableNumber={tableNumber}
        name={name}
        setName={setName}
        phone={phone}
        loading={loading}
        error={error}
        existingSession={existingSession}
        fontLoaded={fontLoaded}
        orderLookup={orderLookup}
        isOrderLookupMode={isOrderLookupMode}
        // === HANDLERS ===
        handleClearStorage={handleClearStorage}
        handleResumeSession={handleResumeSession}
        handleNewSession={handleNewSession}
        handlePhoneChange={handlePhoneChange}
        handleLookupOrder={handleLookupOrder}
        handleExitAnimation={handleExitAnimation}
        logPrimaryCtaPress={logPrimaryCtaPress}
        // === ANIMS — Grillz-only ===
        bgLeftAnim={bgLeftAnim}
        bgRightAnim={bgRightAnim}
        exitTextAnim={exitTextAnim}
        exitLogoAnim={exitLogoAnim}
        exitInputAnim={exitInputAnim}
        keyboardAnim={keyboardAnim}
        // === ANIMS — Shared ===
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        image1Anim={image1Anim}
        image2Anim={image2Anim}
        image3Anim={image3Anim}
        image4Anim={image4Anim}
        exitImage1Anim={exitImage1Anim}
        exitImage2Anim={exitImage2Anim}
        exitImage3Anim={exitImage3Anim}
        exitImage4Anim={exitImage4Anim}
        // === STYLES ===
        styles={styles}
      />
    );
  }

  // 🍝 CUCINA DI NINI - fond panini italien
  const CUCINA_BG = require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini1.png");
  const CUCINA_LOGO = require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/logo.png");
  
  if (isCucina) {
    const cucinaContent = (
      <View style={{ 
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...(Platform.OS === 'web' ? {
          width: '100%',
          height: '100%',
          minHeight: '100dvh',
        } : {}),
        zIndex: 9999,
      }}>
        {/* Background panini */}
        <ImageBackground 
          source={CUCINA_BG}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          {/* Overlay sombre */}
          <View pointerEvents="none" style={{ 
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
                  <Text style={styles.resumeSessionTitle}>{t("Session en cours")}</Text>
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
                  <Text style={styles.resumeBtnText}>{t("Reprendre")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resumeBtnSecondary}
                  onPress={handleNewSession}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resumeBtnSecondaryText}>{t("Nouvelle session")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* 🍕 4 Images de nourriture dans les coins */}
          {/* Image 1 - Haut gauche */}
          <Image 
            pointerEvents="none"
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
            pointerEvents="none"
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
            pointerEvents="none"
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
            pointerEvents="none"
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
              backgroundColor: welcomeFormTokens.inputBackground,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: welcomeFormTokens.inputBorderColor,
            }}>
              <Ionicons name="person-outline" size={20} color={welcomeFormTokens.inputIconColor} style={{ marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, color: welcomeFormTokens.inputTextColor, fontSize: 16 }}
                placeholder={isNameLookupMode ? "Code commande ex: #FA24" : "Votre nom"}
                placeholderTextColor={welcomeFormTokens.inputPlaceholderColor}
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize={isNameLookupMode ? "characters" : "words"}
                autoCorrect={false}
                maxLength={isNameLookupMode ? 5 : 40}
              />
            </View>
            
            
            {/* Error message */}
            {error ? (
              <Text style={{ color: welcomeFormTokens.errorTextColor, textAlign: 'center', marginBottom: 10 }}>{error}</Text>
            ) : null}
            {orderLookup.error && isNameLookupMode ? (
              <Text style={{ color: welcomeFormTokens.errorTextColor, textAlign: 'center', marginBottom: 10 }}>{orderLookup.error}</Text>
            ) : null}
            
            {/* Bouton Rejoindre */}
            <TouchableOpacity
              onPress={handleContinueWithEmail}
              disabled={isNameLookupMode ? (!isNameLookupValid || orderLookup.loading) : (loading || !name.trim())}
              activeOpacity={0.8}
              style={{
                backgroundColor: welcomeFormTokens.ctaBackground,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: isNameLookupMode
                  ? (isNameLookupValid && !orderLookup.loading ? 1 : 0.5)
                  : (name.trim() && !loading ? 1 : 0.5),
              }}
            >
              <Text style={{ 
                color: welcomeFormTokens.ctaTextColor, 
                fontSize: 18, 
                fontWeight: '700',
              }}>
                {isNameLookupMode
                  ? (orderLookup.loading ? "Recherche..." : "Récupérer une commande")
                  : (loading ? "Chargement..." : "Commencer la commande")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      </View>
    );

    if (Platform.OS === "web") {
      return cucinaContent;
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {cucinaContent}
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
              <Text style={styles.resumeSessionTitle}>{t("Session en cours")}</Text>
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
              <Text style={styles.resumeBtnText}>{t("Reprendre")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resumeBtnSecondary}
              onPress={handleNewSession}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnSecondaryText}>{t("Nouvelle session")}</Text>
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
          
          {/* Logo + Restaurant Name */}
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
              backgroundColor: '#FFFFFF', 
              borderColor: '#E0E0E0', 
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
              backgroundColor: '#FFFFFF', 
              borderColor: '#E0E0E0',
              marginRight: 62, // 50px (bouton) + 12px (gap)
            }
          ]}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIconMain} />
            <TextInput
              style={styles.textInputMain}
              placeholder={isNameLookupMode ? "Code commande ex: #FA24" : "Votre nom"}
              placeholderTextColor="#AAA"
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize={isNameLookupMode ? "characters" : "words"}
              autoCorrect={false}
              maxLength={isNameLookupMode ? 5 : 40}
            />
          </View>
        </View>

        {orderLookup.error && isNameLookupMode ? (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{orderLookup.error}</Text>
        ) : null}
        {error ? (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{error}</Text>
        ) : null}
        
        {/* Main CTA */}
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.colors.secondary.main, ...theme.shadows.medium }]}
          onPress={handleContinueWithEmail}
          activeOpacity={0.8}
          disabled={isNameLookupMode ? (!isNameLookupValid || orderLookup.loading) : (!name.trim() || loading)}
        >
          <Text style={styles.mainButtonText}>
            {isNameLookupMode
              ? (orderLookup.loading ? "Recherche..." : "Récupérer une commande")
              : "Commençons !"}
          </Text>
        </TouchableOpacity>
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
  
  // ── OR Separator (Grillz order lookup) ──
  orSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  orText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
    marginHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
