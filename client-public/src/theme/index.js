/**
 * Theme - Index
 * 
 * Export central de tout le système de thème
 */

// Theme object
export { defaultTheme, default as theme } from './theme';

// Theme Provider & Hook
export { ThemeProvider, useTheme, withTheme } from './ThemeProvider';

// Design Tokens (export individuel si besoin)
export {
  colors,
  typography,
  spacing,
  shadows,
  getShadow,
  radius,
  getRadius,
  getPartialRadius,
} from './tokens';
