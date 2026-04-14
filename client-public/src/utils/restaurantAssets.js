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
    logo: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/logo.png"),
    background: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/panini1.png"),
    welcomeImages: {
      // image1: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/image1.png"),
      // image2: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/image2.png"),
      // image3: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/image3.png"),
      // image4: require("../../assets/images/restaurants/cucina-6970ef6594abf8bacd9d804d/welcome/image4.png"),
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
    logo: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/logo.png"),
    welcomeImages: {
      image1: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken1.png"),
      image2: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken2.png"),
      image3: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken3.png"),
      image4: require("../../assets/images/restaurants/grillz-695e4300adde654b80f6911a/welcome/chicken4.png"),
    },
  },
};

// 🎨 Assets par défaut
const DEFAULT_ASSETS = {
  font: {
    family: "System",
    file: null,
  },
  logo: require("../../assets/images/menu/image-fond/Logo.png"),
  welcomeImages: {
    image1: require("../../assets/images/menu/image-fond/image1.png"),
    image2: require("../../assets/images/menu/image-fond/image2.png"),
    image3: require("../../assets/images/menu/image-fond/image3.jpg"),
    image4: require("../../assets/images/menu/image-fond/image4.png"),
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
