/**
 * Design Tokens - Spacing
 * 
 * Scale de spacing cohérente pour:
 * - Padding
 * - Margin
 * - Gap (entre éléments)
 * 
 * Base: 4px (permet une grille cohérente)
 * Progression: 4, 8, 12, 16, 24, 32, 48, 64
 */

export const spacing = {
  // Base scale (multiples de 4)
  0: 0,
  xs: 4,     // Très petit (micro-spacing)
  sm: 8,     // Petit (spacing serré)
  md: 12,    // Moyen-petit
  base: 16,  // Base (défaut)
  lg: 24,    // Large
  xl: 32,    // Très large
  '2xl': 48, // Extra large
  '3xl': 64, // Énorme (sections)
  '4xl': 80, // Mega (hero sections)

  // Semantic spacing (noms significatifs)
  component: {
    padding: {
      xs: 8,    // Padding minimal (badges, pills)
      sm: 12,   // Padding petit (buttons small)
      md: 16,   // Padding moyen (buttons, inputs)
      lg: 24,   // Padding large (cards)
      xl: 32,   // Padding très large (containers)
    },
    gap: {
      xs: 4,    // Gap très serré (inline icons)
      sm: 8,    // Gap serré (form elements)
      md: 12,   // Gap moyen (card content)
      lg: 16,   // Gap large (sections)
      xl: 24,   // Gap très large (screens)
    },
  },

  // Screen margins (padding horizontal des écrans)
  screen: {
    horizontal: 20,  // Padding horizontal standard
    vertical: 24,    // Padding vertical standard
    top: 16,         // Padding top (sous header)
    bottom: 32,      // Padding bottom (au-dessus de navigation)
  },

  // Card spacing
  card: {
    padding: 16,       // Padding interne des cards
    gap: 12,           // Espace entre éléments dans card
    margin: 12,        // Marge entre cards
  },

  // List spacing
  list: {
    gap: 12,           // Espace entre items
    gapCompact: 8,     // Espace serré
    gapRelaxed: 16,    // Espace relâché
  },

  // Form spacing
  form: {
    fieldGap: 16,      // Espace entre champs
    labelGap: 8,       // Espace label → input
    sectionGap: 24,    // Espace entre sections
  },

  // Button spacing
  button: {
    paddingVertical: 14,    // Padding vertical (hauteur)
    paddingHorizontal: 24,  // Padding horizontal (largeur)
    gap: 8,                 // Espace entre icon et texte
  },
};

export default spacing;
