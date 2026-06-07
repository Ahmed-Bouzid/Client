/**
 * WelcomeScreenGrillz.jsx — Phase 0.4-C.1
 *
 * Extraction 1-pour-1 du sous-arbre Grillz de WelcomeScreen.jsx (L770-1290).
 * Iso-comportement strict : pixel-identique à la version inline pré-extraction.
 *
 * API massive (~28 props) acceptée temporairement (props drilling planifié).
 * Cleanup en cascade prévu :
 *  - 0.4-C.2 : restaurantConfig prop supprimée (migration vers
 *    getRestaurantAssetsByStyleKey('grillz') interne au child)
 *  - 0.4-C.4 : anims Grillz-only (bgLeftAnim, bgRightAnim, exitTextAnim,
 *    exitLogoAnim, exitInputAnim, keyboardAnim) déplaçables dans le child
 *    si confirmé sans dépendance séquence parent. Styles split aussi.
 *  - Phase 0.6 : refactor en useWelcomeScreenState() hook custom centralisant
 *    state/handlers (réduction massive props drilling).
 *
 * Constants déplacées depuis parent (scope unique Grillz vérifié) :
 *  - GRILLZ_BG_LEFT, GRILLZ_BG_RIGHT, GRILLZ_MENU_PREVIEW (require directs)
 *  - GRILLZ_RESPONSIVE (recalculé local via scale/vScale dérivés Dimensions)
 *  - chicken1-4.png + logo.png (require directs inline JSX)
 *
 * Branche d'activation : if (isGrillz) dans WelcomeScreen.jsx.
 * Future intégration WelcomeScreenBaghera attendue Phase 3.
 */

import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getRestaurantAssetsByStyleKey } from "../utils/restaurantAssets";

// 📱 RESPONSIVE SCALING - Design basé sur iPhone 16 Pro Max (440x956)
// Constantes design dupliquées localement depuis WelcomeScreen.jsx (L213-214).
// Utilisées pour le recalcul scale/vScale local (voir commentaire ci-dessous).
const DESIGN_WIDTH = 440;  // iPhone 16 Pro Max width
const DESIGN_HEIGHT = 956; // iPhone 16 Pro Max height

// Phase 0.4-C.2 — Assets Grillz consommés via getRestaurantAssetsByStyleKey('grillz')
// au runtime (cf. composant ci-dessous). Les anciennes consts module-level
// GRILLZ_BG_LEFT/RIGHT, GRILLZ_MENU_PREVIEW + 5 require inline JSX (chicken1-4 +
// logo) ont été supprimés au profit de la NEW API restaurantAssets.

export default function WelcomeScreenGrillz({
  // === STATE & DERIVED ===
  tableNumber,
  name,
  setName,
  phone,
  loading,
  error,
  existingSession,
  fontLoaded,
  orderLookup,
  isOrderLookupMode,

  // === HANDLERS ===
  handleClearStorage,
  handleResumeSession,
  handleNewSession,
  handlePhoneChange,
  handleLookupOrder,
  handleExitAnimation,
  logPrimaryCtaPress,

  // === ANIMS — Grillz-only ===
  bgLeftAnim,
  bgRightAnim,
  exitTextAnim,
  exitLogoAnim,
  exitInputAnim,
  keyboardAnim,

  // === ANIMS — Shared with Cucina/default ===
  fadeAnim,
  slideAnim,
  image1Anim,
  image2Anim,
  image3Anim,
  image4Anim,
  exitImage1Anim,
  exitImage2Anim,
  exitImage3Anim,
  exitImage4Anim,

  // === STYLES ===
  styles,
}) {
  const { t } = useTranslation();
  // Phase 0.4-C.2 — Assets Grillz via NEW API restaurantAssets (getRestaurantAssetsByStyleKey).
  // Source unique de vérité, indexée par styleKey. Suppression de la prop
  // restaurantConfig héritée de la copie 1-pour-1 0.4-C.1.
  const grillzConfig = getRestaurantAssetsByStyleKey('grillz');

  // Recalcul local des helpers responsive (déplacé depuis parent en 0.4-C.1).
  // Dimensions est un singleton RN, valeurs identiques au parent garanties.
  // Aucun listener orientation utilisé (parent ne le faisait pas non plus).
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const vScale = SCREEN_HEIGHT / DESIGN_HEIGHT;

  // 🔒 GRILLZ LOCKED VALUES - Valeurs responsive verrouillées (déplacé depuis parent L214-222).
  const GRILLZ_RESPONSIVE = {
    chicken1: { width: 224 * scale, height: 224 * scale, top: -50 * vScale, left: -50 * scale },
    chicken2: { width: 192 * scale, height: 192 * scale, top: -10 * vScale, right: -60 * scale },
    chicken3: { width: 192 * scale, height: 192 * scale, bottom: 220 * vScale, left: -110 * scale },
    chicken4: { width: 208 * scale, height: 208 * scale, bottom: 100 * vScale, right: -130 * scale },
    logo: { width: 290 * scale, height: 325 * scale, top: '28%' },
    bienvenue: { top: '26%', fontSize: 28 * scale },
  };

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
        source={grillzConfig.decorativeAssets.menuPreview} 
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
            source={grillzConfig.decorativeAssets.bgLeft} 
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
            source={grillzConfig.decorativeAssets.bgRight} 
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
        
        {/* 🍗 4 Images de nourriture dans les coins - GRILLZ (RESPONSIVE + FADE) */}
        {/* Image 1 - Haut gauche */}
        <Animated.Image 
          source={grillzConfig.welcomeImages.image1}
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
          source={grillzConfig.welcomeImages.image2}
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
          source={grillzConfig.welcomeImages.image3}
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
          source={grillzConfig.welcomeImages.image4}
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
            // LEGACY 0.6 — was restaurantConfig.images.image1 (null via LEGACY restaurantAssets pour Grillz). Dead JSX intentionnel iso-strict (rien d'affiché actuellement). Décision Phase 0.6: supprimer ce sous-arbre ou décider visuel.
            source={null}
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
            // LEGACY 0.6 — was restaurantConfig.images.image2 (null via LEGACY restaurantAssets pour Grillz). Dead JSX intentionnel iso-strict.
            source={null}
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
            // LEGACY 0.6 — was restaurantConfig.images.image3 (null via LEGACY restaurantAssets pour Grillz). Dead JSX intentionnel iso-strict.
            source={null}
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
            // LEGACY 0.6 — was restaurantConfig.images.image4 (null via LEGACY restaurantAssets pour Grillz). Dead JSX intentionnel iso-strict.
            source={null}
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
          fontFamily: fontLoaded ? grillzConfig.font.family : undefined,
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
          source={grillzConfig.logo}
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
                  outputRange: [0, -310],
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
              placeholder={t("Votre nom")}
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>
        
        {/* Input Téléphone / Order Lookup */}
        <View style={styles.inputRow}>
          <View style={[styles.googleButtonSquare, { opacity: 0 }]} />
          <View style={[
            styles.inputContainerInline, 
            { 
              backgroundColor: '#1E1E1E', 
              borderColor: isOrderLookupMode ? (orderLookup.isValid ? '#4CAF50' : '#D35400') : '#D35400',
              marginRight: 62,
            }
          ]}>
            <Ionicons 
              name={isOrderLookupMode ? "receipt-outline" : "call-outline"} 
              size={20} 
              color={isOrderLookupMode ? (orderLookup.isValid ? '#4CAF50' : '#FF8A50') : '#FF8A50'} 
              style={styles.inputIconMain} 
            />
            <TextInput
              style={[styles.textInputMain, { color: '#FFFFFF', backgroundColor: 'transparent' }]}
              placeholder={isOrderLookupMode ? "Code commande ex: #FA24" : "Votre téléphone"}
              placeholderTextColor="#777"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType={isOrderLookupMode ? "default" : "phone-pad"}
              autoCorrect={false}
              autoCapitalize={isOrderLookupMode ? "characters" : "none"}
              maxLength={isOrderLookupMode ? 5 : 14}
            />
            {isOrderLookupMode && phone.length > 1 && (
              <Ionicons
                name={orderLookup.isValid ? "checkmark-circle" : "close-circle"}
                size={20}
                color={orderLookup.isValid ? "#4CAF50" : "#FF6B6B"}
              />
            )}
          </View>
        </View>
        
        {/* Error message */}
        {error ? (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{error}</Text>
        ) : null}
        {orderLookup.error && isOrderLookupMode ? (
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{orderLookup.error}</Text>
        ) : null}
        
        {/* CTA Button — switch entre "Rejoindre" et "Retrouver" selon le mode */}
        <TouchableOpacity
          onPress={() => {
            const action = isOrderLookupMode ? "lookup" : "start-with-animation";
            logPrimaryCtaPress("grillz-hero", action);
            if (isOrderLookupMode) {
              handleLookupOrder();
              return;
            }
            handleExitAnimation();
          }}
          activeOpacity={0.8}
          disabled={isOrderLookupMode ? (!orderLookup.isValid || orderLookup.loading) : (!name.trim() || loading)}
          style={{ marginTop: 16 }}
        >
          <LinearGradient
            colors={isOrderLookupMode 
              ? (orderLookup.isValid ? ['#D35400', '#E67E22'] : ['#444', '#555'])
              : ['#D35400', '#E67E22']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: isOrderLookupMode 
                ? (orderLookup.isValid && !orderLookup.loading ? 1 : 0.5)
                : (name.trim() ? 1 : 0.5),
              shadowColor: '#FF5722',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
          >
            {isOrderLookupMode && (
              <Ionicons name="search" size={18} color="#FFFFFF" />
            )}
            <Text style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: '700',
              letterSpacing: 0.5,
            }}>
              {isOrderLookupMode
                ? (orderLookup.loading ? "Recherche..." : "Retrouver ma commande")
                : (loading ? "Chargement..." : `Rejoindre la table ${tableNumber || ""}`)
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      </View>
    </View>
  );
}
