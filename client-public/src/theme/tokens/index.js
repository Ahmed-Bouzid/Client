/**
 * Design Tokens - Index
 * 
 * Export central de tous les design tokens
 */

export { colors, default as colorsDefault } from './colors';
export { typography, default as typographyDefault } from './typography';
export { spacing, default as spacingDefault } from './spacing';
export { shadows, getShadow, default as shadowsDefault } from './shadows';
export { radius, getRadius, getPartialRadius, default as radiusDefault } from './radius';

// ═══════════════════════════════════════════════════════════════════════════
// THEME OVERRIDES (Per-theme customizations)
// ═══════════════════════════════════════════════════════════════════════════

export const themeOverrides = {
  // LIGHT THEME (Default - Blue gradient)
  light: {
    name: "Light",
    type: "default",
    colors: {
      primary: "#2563EB",        // Blue
      primaryLight: "#60A5FA",
      primaryDark: "#1E40AF",
    },
    gradients: {
      primary: ["#2563EB", "#1E40AF"],
    },
  },
  
  // CUCINA DI NINI THEME (Green with sandwich patterns)
  cucina: {
    name: "Cucina Di Nini",
    type: "premium",
    restaurantId: "6970ef6594abf8bacd9d804d", // 🎯 ONLY for Cucina
    colors: {
      primary: "#146845",        // Dark green
      secondary: "#34311C",      // Brown
    },
    gradients: {
      primary: ["#146845", "#34311C", "#1F4D2E", "#146845"],
    },
    specialFeatures: {
      hasSandwichPattern: true,
      bannerType: "sandwich",
    },
  },
  
  // LE GRILLZ THEME (BBQ - Orange/Red flames)
  grillz: {
    name: "Le Grillz",
    type: "premium",
    restaurantId: "695e4300adde654b80f6911a", // 🎯 For Le Grillz
    colors: {
      primary: "#FF5722",        // Orange
      primaryDark: "#BF360C",
    },
    gradients: {
      primary: ["#FF5722", "#BF360C"],
    },
    specialFeatures: {
      hasSandwichPattern: false,
      bannerType: "flames",
    },
  },
};

/**
 * Mérger tokens complets + overrides thème
 */
export function mergeThemeTokens(themeKey, customizations = {}) {
  const { colors: baseColors } = colorsDefault;
  const themeOverride = themeOverrides[themeKey];
  
  if (!themeOverride) {
    console.warn(`Theme ${themeKey} not found, using 'light'`);
    return mergeThemeTokens('light', customizations);
  }
  
  return {
    colors: {
      ...baseColors,
      ...themeOverride.colors,
      ...customizations.colors,
    },
    typography: typographyDefault,
    spacing: spacingDefault,
    shadows: shadowsDefault,
    radius: radiusDefault,
    gradients: themeOverride.gradients || {},
    theme: themeKey,
    themeName: themeOverride.name,
    themeType: themeOverride.type,
    ...themeOverride.specialFeatures,
  };
}

/**
 * Get available themes
 */
export function getAvailableThemes() {
  return Object.entries(themeOverrides).map(([key, config]) => ({
    id: key,
    name: config.name,
    type: config.type,
  }));
}

/**
 * Get theme for specific restaurant
 */
export function getThemeForRestaurant(restaurantId) {
  for (const [key, config] of Object.entries(themeOverrides)) {
    if (config.restaurantId === restaurantId) {
      return key;
    }
  }
  return 'light'; // Default theme
}
