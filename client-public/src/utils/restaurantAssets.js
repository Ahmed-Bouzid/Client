/**
 * restaurantAssets.js — Phase 0.4-B
 *
 * Coexistence de 2 APIs pendant la transition Phase 0.4 :
 *  - NEW API (preferred): RESTAURANT_CONFIG_BY_STYLEKEY + getRestaurantAssetsByStyleKey(styleKey)
 *    Source de vérité, indexée par styleKey, paths réels branchés.
 *  - LEGACY API (deprecated): RESTAURANT_CONFIG[restaurantId] + 6 exports legacy
 *    Vue dérivée iso-comportement strict (logo + welcomeImages = null comme avant).
 *    Cleanup planifié Phase 0.6 après migration de tous les consommateurs.
 *
 * Single consumer migrating in Phase 0.4-C: WelcomeScreen.jsx (currently uses
 * getRestaurantAssets via L52+L71). All other legacy exports are dead code.
 *
 * Structure des assets:
 * assets/images/restaurants/{tenant-slug-id}/welcome/imageN.png
 * assets/images/restaurants/{tenant-slug-id}/logo.png
 * assets/images/restaurants/{tenant-slug-id}/.../font.(otf|ttf)
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🆕 NEW API — Source of truth indexed by styleKey
// ═══════════════════════════════════════════════════════════════════════════
const RESTAURANT_CONFIG_BY_STYLEKEY = {
  cucina: {
    restaurantId: "6970ef6594abf8bacd9d804d",
    name: "Cucina Di Nini",
    hasCustomAssets: true,
    font: {
      family: "Artisia",
      file: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/cucina fonts/Artisia-wowow.ttf"),
    },
    logo: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/logo.png"),
    welcomeImages: {
      image1: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini2.png"),
      image2: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini3.png"),
      image3: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini4.png"),
      image4: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini5.png"),
    },
    decorativeAssets: {
      bg: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini1.png"),
    },
  },
  grillz: {
    restaurantId: "695e4300adde654b80f6911a",
    name: "Le Grillz",
    hasCustomAssets: true,
    font: {
      family: "Soulway",
      file: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/fonts/soulway-font/soulwayfont-demo.otf"),
    },
    logo: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/logo.png"),
    welcomeImages: {
      image1: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken1.png"),
      image2: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken2.png"),
      image3: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken3.png"),
      image4: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken4.png"),
    },
    decorativeAssets: {
      bgLeft: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chickenleft.png"),
      bgRight: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chickenright.png"),
      menuPreview: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/screenMenu.png"),
    },
  },
};

/**
 * 🆕 NEW API — Obtenir la config complète d'un tenant via son styleKey.
 *
 * @param {string} styleKey - Identifiant du style/tenant ("cucina", "grillz", ...)
 * @returns {object|null} Config complète ou null si styleKey inconnu/invalide.
 */
export function getRestaurantAssetsByStyleKey(styleKey) {
  // LEGACY 0.4-B — BDD normalization grills→grillz (consolidate Phase 0.6)
  // Le backend retourne actuellement styleKey="grills" (avec S) pour Le Grillz
  // alors que la convention frontend est "grillz" (avec Z). Normalisation locale
  // stricte : uniquement la valeur exacte "grills" est mappée vers "grillz".
  const normalizedKey = styleKey === "grills" ? "grillz" : styleKey;
  return RESTAURANT_CONFIG_BY_STYLEKEY[normalizedKey] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ LEGACY API — Vue dérivée iso-comportement strict
// ═══════════════════════════════════════════════════════════════════════════
// Cucina + Grillz : logo + welcomeImages restent null comme aujourd'hui pour
// préserver le rendu actuel des render branches L1004-1064/L1637-1697 de
// WelcomeScreen.jsx. Le branchement réel des assets se fera via la NEW API
// en Phase 0.4-C lors de la migration WelcomeScreen.
// `font` est partagé par référence avec la NEW API (single physical require).
// `id` + `name` conservés pour fidélité 1-pour-1 avec la version actuelle.
const RESTAURANT_CONFIG = {
  // Cucina Di Nini
  "6970ef6594abf8bacd9d804d": {
    id: "cucina",
    name: "Cucina Di Nini",
    hasCustomAssets: true,
    font: RESTAURANT_CONFIG_BY_STYLEKEY.cucina.font,
    logo: null,
    welcomeImages: {
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    },
  },

  // Le Grillz
  "695e4300adde654b80f6911a": {
    id: "grillz",
    name: "Le Grillz",
    hasCustomAssets: true,
    font: RESTAURANT_CONFIG_BY_STYLEKEY.grillz.font,
    logo: null,
    welcomeImages: {
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    },
  },
};

// 🎨 Assets par défaut
const DEFAULT_ASSETS = {
  font: {
    family: "System",
    file: null,
  },
  logo: null,
  welcomeImages: {
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  },
};

/**
 * LEGACY API — to remove in Phase 0.6 after WelcomeScreen migration to NEW API
 * Obtenir la config complète d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} Config avec logo, images, font
 */
export function getRestaurantAssets(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  
  if (!config || !config.hasCustomAssets) {
    return {
      ...DEFAULT_ASSETS,
      isCustom: false,
      restaurantId: null,
    };
  }
  
  return {
    font: config.font || DEFAULT_ASSETS.font,
    logo: config.logo || DEFAULT_ASSETS.logo,
    welcomeImages: {
      ...DEFAULT_ASSETS.welcomeImages,
      ...config.welcomeImages,
    },
    isCustom: true,
    restaurantId,
  };
}

/**
 * LEGACY API — to remove in Phase 0.6 (no consumer found in current codebase)
 * Obtenir le logo d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {ImageSource} Source de l'image logo
 */
export function getRestaurantLogo(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  return config?.logo || DEFAULT_ASSETS.logo;
}

/**
 * LEGACY API — to remove in Phase 0.6 (no consumer found in current codebase)
 * Obtenir les images Welcome d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} { image1, image2, image3, image4 }
 */
export function getWelcomeImages(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  if (!config?.welcomeImages || Object.keys(config.welcomeImages).length === 0) {
    return DEFAULT_ASSETS.welcomeImages;
  }
  return {
    ...DEFAULT_ASSETS.welcomeImages,
    ...config.welcomeImages,
  };
}

/**
 * LEGACY API — to remove in Phase 0.6 (only dead import in WelcomeScreen.jsx L52)
 * Obtenir la configuration de police d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} { family, file }
 */
export function getRestaurantFont(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  return config?.font || DEFAULT_ASSETS.font;
}

/**
 * LEGACY API — to remove in Phase 0.6 (no consumer found in current codebase)
 * Vérifier si un restaurant a des assets personnalisés
 * @param {string} restaurantId - ID du restaurant
 * @returns {boolean}
 */
export function hasCustomAssets(restaurantId) {
  return !!RESTAURANT_CONFIG[restaurantId]?.hasCustomAssets;
}

/**
 * LEGACY API — to remove in Phase 0.6 (no consumer found in current codebase)
 * Liste des IDs de restaurants avec assets personnalisés
 */
export const CUSTOM_RESTAURANT_IDS = Object.keys(RESTAURANT_CONFIG);

export default {
  getRestaurantAssets,
  getRestaurantLogo,
  getWelcomeImages,
  getRestaurantFont,
  hasCustomAssets,
  CUSTOM_RESTAURANT_IDS,
  // 🆕 NEW API
  getRestaurantAssetsByStyleKey,
};
