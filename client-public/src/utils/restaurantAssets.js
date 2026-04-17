/**
 * 🎨 restaurantAssets.js - Helper pour charger les assets par restaurant
 * 
 * Gère:
 * - Images de la page Welcome (4 images + logo)
 * - Polices personnalisées par restaurant
 * 
 * Structure des assets:
 * assets/images/restaurants/{restaurant-id}/welcome/image1-4.png
 * assets/images/restaurants/{restaurant-id}/logo.png
 * assets/fonts/{restaurant-name}/font.otf
 */

// 🏪 Configuration des restaurants avec assets personnalisés
const RESTAURANT_CONFIG = {
  // Cucina Di Nini
  "6970ef6594abf8bacd9d804d": {
    id: "cucina",
    name: "Cucina Di Nini",
    hasCustomAssets: true,
    font: {
      family: "Artisia",
      file: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/cucina fonts/Artisia-wowow.ttf"),
    },
    logo: null,
    background: null,
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
    font: {
      family: "Soulway",
      file: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/fonts/soulway-font/soulwayfont-demo.otf"),
    },
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
 * Obtenir le logo d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {ImageSource} Source de l'image logo
 */
export function getRestaurantLogo(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  return config?.logo || DEFAULT_ASSETS.logo;
}

/**
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
 * Obtenir la configuration de police d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} { family, file }
 */
export function getRestaurantFont(restaurantId) {
  const config = RESTAURANT_CONFIG[restaurantId];
  return config?.font || DEFAULT_ASSETS.font;
}

/**
 * Vérifier si un restaurant a des assets personnalisés
 * @param {string} restaurantId - ID du restaurant
 * @returns {boolean}
 */
export function hasCustomAssets(restaurantId) {
  return !!RESTAURANT_CONFIG[restaurantId]?.hasCustomAssets;
}

/**
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
};
