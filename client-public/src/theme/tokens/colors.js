/**
 * Design Tokens - Colors
 * 
 * Palette de couleurs générale basée sur les templates de design.
 * Ce thème est le thème par défaut, applicable à tous les restaurants.
 * 
 * Structure:
 * - Primary: Couleur principale (CTA, accents)
 * - Secondary: Couleur secondaire (navy/dark)
 * - Background: Fond de l'app
 * - Surface: Surfaces (cards, modals)
 * - Text: Hiérarchie de texte
 * - Status: Success, warning, error, info
 */

export const colors = {
  // Primary colors
  primary: {
    main: '#E63946',      // Rouge/corail principal (boutons, CTA)
    light: '#FF6B75',     // Variant plus clair
    dark: '#CC2936',      // Variant plus foncé
    contrast: '#FFFFFF',  // Texte sur primary
  },

  // Secondary colors
  secondary: {
    main: '#2D3142',      // Navy profond
    light: '#4A4E69',     // Variant plus clair
    dark: '#1E2235',      // Variant plus foncé (texte principal)
    contrast: '#FFFFFF',  // Texte sur secondary
  },

  // Background & Surface
  background: {
    default: '#F5EEE6',   // Beige/crème clair (fond app)
    paper: '#FFFFFF',     // Blanc pur (cards, modals)
    subtle: '#FAF7F2',    // Variant très léger
  },

  surface: {
    default: '#FFFFFF',   // Surface principale (cards)
    elevated: '#FFFFFF',  // Surface élevée (avec shadow)
    overlay: 'rgba(0, 0, 0, 0.5)', // Overlay pour modals
  },

  // Text hierarchy
  text: {
    primary: '#1E2235',   // Texte principal (titres, important)
    secondary: '#6C757D', // Texte secondaire (descriptions)
    tertiary: '#9CA3AF',  // Texte tertiaire (hints, disabled)
    inverse: '#FFFFFF',   // Texte sur fond foncé
    link: '#E63946',      // Liens
  },

  // Status colors
  status: {
    success: '#4CAF50',   // Vert (confirmations)
    warning: '#FF9800',   // Orange (alertes)
    error: '#F44336',     // Rouge (erreurs)
    info: '#2196F3',      // Bleu (informations)
  },

  // Functional colors
  border: {
    light: '#E5E7EB',     // Bordures légères
    medium: '#D1D5DB',    // Bordures moyennes
    dark: '#9CA3AF',      // Bordures foncées
  },

  // Special colors
  badge: {
    calories: '#FFF3E0',  // Badge calories (background)
    caloriesText: '#FF6F00', // Badge calories (texte)
    allergen: '#FFEBEE',  // Badge allergène (background)
    allergenText: '#C62828', // Badge allergène (texte)
  },

  // Shadow colors (utilisés avec shadowColor)
  shadow: {
    default: '#000000',
    colored: '#2D3142',   // Shadow avec teinte
  },
};

export default colors;
