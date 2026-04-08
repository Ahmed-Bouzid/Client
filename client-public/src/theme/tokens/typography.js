/**
 * Design Tokens - Typography
 * 
 * Système typographique basé sur les templates.
 * Utilise deux familles de fonts:
 * - Serif (élégant) pour les titres et headings
 * - Sans-serif (moderne) pour le body et UI
 * 
 * Note: Pour React Native, utiliser des fonts système
 * ou charger des custom fonts via expo-font
 */

export const typography = {
  // Font Families
  fontFamily: {
    serif: 'serif',          // Playfair Display, Georgia, ou system serif
    sans: 'sans-serif',      // Inter, SF Pro, Roboto, ou system sans-serif
    mono: 'monospace',       // Pour code ou données techniques
  },

  // Font Sizes
  fontSize: {
    xs: 12,    // Captions, hints
    sm: 14,    // Body small, secondary text
    base: 16,  // Body default
    lg: 18,    // Body large, emphasized
    xl: 20,    // Small headings
    '2xl': 24, // H3
    '3xl': 28, // H2
    '4xl': 32, // H1
    '5xl': 36, // Hero titles
  },

  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights (relative to font size)
  lineHeight: {
    tight: 1.2,   // Headings
    normal: 1.5,  // Body text
    relaxed: 1.75, // Spacious paragraphs
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },

  // Predefined Text Styles
  styles: {
    // Headings (serif)
    h1: {
      fontFamily: 'serif',
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'serif',
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: 'serif',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
    },

    // Body text (sans-serif)
    bodyLarge: {
      fontFamily: 'sans-serif',
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body: {
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // Captions & labels
    caption: {
      fontFamily: 'sans-serif',
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0.25,
    },
    label: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.25,
      textTransform: 'uppercase',
    },

    // Buttons
    button: {
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.5,
    },
    buttonSmall: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.25,
    },

    // Price
    price: {
      fontFamily: 'sans-serif',
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    priceSmall: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  },
};

export default typography;
