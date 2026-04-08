/**
 * Theme - Default Theme
 * 
 * Thème par défaut GÉNÉRAL pour tous les restaurants.
 * Combine tous les design tokens en un objet cohérent.
 * 
 * Ce thème servira de base. Les déclinaisons par restaurant
 * pourront override certaines valeurs plus tard.
 */

import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';
import { shadows, getShadow } from './tokens/shadows';
import { radius, getRadius, getPartialRadius } from './tokens/radius';

/**
 * Default Theme Object
 * 
 * Structure complète du thème avec tous les tokens
 */
export const defaultTheme = {
  // Colors
  colors,

  // Typography
  typography,

  // Spacing
  spacing,

  // Shadows
  shadows,
  getShadow, // Helper function

  // Border Radius
  radius,
  getRadius, // Helper function
  getPartialRadius, // Helper function

  // Meta (pour identifier le thème)
  meta: {
    name: 'default',
    version: '1.0.0',
    type: 'general', // 'general' ou 'restaurant-specific'
  },
};

/**
 * Export default theme
 */
export default defaultTheme;

/**
 * Type definitions (pour TypeScript si besoin plus tard)
 * 
 * Theme {
 *   colors: Colors
 *   typography: Typography
 *   spacing: Spacing
 *   shadows: Shadows
 *   radius: Radius
 *   meta: ThemeMeta
 * }
 */
