/**
 * Design Tokens - Border Radius
 * 
 * Système de border radius pour cohérence visuelle.
 * 
 * Niveaux:
 * - none: Pas d'arrondi (carré)
 * - sm: Légèrement arrondi (inputs, petits éléments)
 * - md: Moyennement arrondi (cards, buttons)
 * - lg: Bien arrondi (modals, large cards)
 * - xl: Très arrondi (bottom sheets)
 * - pill: Complètement arrondi (pills, badges, rounded buttons)
 * - circle: Cercle parfait (avatars, icon buttons)
 */

export const radius = {
  // Base values
  none: 0,
  sm: 8,
  md: 12,
  base: 16,    // Valeur par défaut
  lg: 20,
  xl: 24,
  '2xl': 32,
  pill: 9999,  // Arrondi complet (pill-shaped)
  circle: '50%', // Cercle (pour width === height)

  // Semantic radius (noms significatifs)
  component: {
    button: {
      small: 8,
      medium: 12,
      large: 16,
      pill: 9999,  // Boutons pill-shaped (comme templates)
    },
    input: 12,
    card: 16,
    modal: 24,
    bottomSheet: {
      top: 24,     // Arrondi uniquement en haut
    },
    badge: 8,
    pill: 9999,    // Pills/tags arrondis complets
    avatar: 9999,  // Avatars ronds
    icon: 8,       // Icon containers
  },

  // Screen-specific radius
  screen: {
    container: 0,  // Pas d'arrondi pour conteneurs plein écran
    section: 16,   // Sections dans l'écran
  },
};

/**
 * Helper pour obtenir un radius spécifique
 */
export const getRadius = (size = 'base') => {
  return radius[size] !== undefined ? radius[size] : radius.base;
};

/**
 * Helper pour créer des border radius partiels
 * (utile pour bottom sheets, modals, etc.)
 */
export const getPartialRadius = {
  top: (size = 'lg') => ({
    borderTopLeftRadius: radius[size] || radius.base,
    borderTopRightRadius: radius[size] || radius.base,
  }),
  bottom: (size = 'lg') => ({
    borderBottomLeftRadius: radius[size] || radius.base,
    borderBottomRightRadius: radius[size] || radius.base,
  }),
  left: (size = 'lg') => ({
    borderTopLeftRadius: radius[size] || radius.base,
    borderBottomLeftRadius: radius[size] || radius.base,
  }),
  right: (size = 'lg') => ({
    borderTopRightRadius: radius[size] || radius.base,
    borderBottomRightRadius: radius[size] || radius.base,
  }),
};

export default radius;
