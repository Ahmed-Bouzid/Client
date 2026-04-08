/**
 * Design Tokens - Shadows & Elevation
 * 
 * Système de shadows pour donner de la profondeur aux éléments.
 * Compatible React Native (iOS & Android).
 * 
 * Niveaux:
 * - none: Aucune ombre
 * - soft: Ombre très légère (subtile)
 * - medium: Ombre moyenne (cards standard)
 * - strong: Ombre prononcée (modals, sheets)
 * - floating: Ombre pour éléments flottants (FAB, tooltips)
 */

export const shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Soft shadow (très légère, subtile)
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Medium shadow (cards standard)
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Strong shadow (modals, bottom sheets)
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },

  // Floating shadow (FAB, tooltips)
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },

  // Colored shadows (pour effets spéciaux)
  colored: {
    primary: {
      shadowColor: '#E63946',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 3,
    },
    secondary: {
      shadowColor: '#2D3142',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 3,
    },
  },

  // Inner shadow (illusion de profondeur inverse)
  // Note: React Native ne supporte pas les inner shadows nativement
  // Utiliser un gradient ou border pour simuler
  inner: {
    // Placeholder pour documentation
    // Simuler avec: borderTopWidth + borderColor light
  },
};

/**
 * Helper function pour combiner shadow styles
 * Usage: { ...getShadow('medium') }
 */
export const getShadow = (level = 'medium') => {
  return shadows[level] || shadows.medium;
};

export default shadows;
