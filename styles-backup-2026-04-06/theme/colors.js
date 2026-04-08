/**
 * 🎨 Thème par défaut (fallback offline / chargement)
 * En production, les couleurs viennent de la BDD via useRestaurantConfig.
 * Ce fichier sert de fallback quand la config n'est pas encore chargée.
 */

// Palette par défaut - Structure compatible avec la config BDD (Style.config)
export const GRILLZ_THEME = {
	// Gradients principaux (pour LinearGradient) - Flammes vives du BBQ
	primary: ["#FF5722", "#BF360C"], // Orange-rouge vif → Rouge foncé
	fire: ["#FF5722", "#BF360C"], // Alias pour primary
	gold: ["#FF8C00", "#FF6F00"], // Orange doré → Orange intense
	secondary: ["#FF8C00", "#FF6F00"], // Alias de gold
	ember: ["#FF6F00", "#E65100"], // Orange intense → Orange profond
	accent: ["#FF6F00", "#E65100"], // Alias de ember
	smoke: ["#424242", "#212121"], // Gris fumée → Noir charbon

	// Couleurs unitaires (raccourcis pour accès rapide) - Tons chauds du feu
	orange: "#FF6F00",
	rouge: "#BF360C",
	dore: "#FF8C00",

	// États - Palette chaleureuse
	success: ["#FF8C00", "#FF6F00"], // Orange doré (pas de vert, tout en BBQ)
	warning: ["#FF9800", "#F57C00"], // Orange warning
	error: ["#D84315", "#BF360C"], // Rouge foncé
	danger: ["#D84315", "#BF360C"], // Alias de error

	// Backgrounds purs (pour backgroundColor) - Charbon et fumée
	dark: "#1C1C1C", // Noir charbon principal
	card: "#2C2C2C", // Gris charbon cartes
	elevated: "#3C3C3C", // Gris fumée
	background: ["#1C1C1C", "#2C2C2C"], // Dark gradient (pour LinearGradient)

	// Textes - Blanc chaud
	text: "#FFF8E1", // Blanc crème chaud
	textSecondary: "#FFE0B2", // Crème orangé
	textMuted: "#BCAAA4", // Beige terne
	textAccent: "#FF8C00", // Orange doré pour highlights

	// Transparences - Braises et fumée
	glass: "rgba(255, 111, 0, 0.12)",
	glassBorder: "rgba(255, 140, 0, 0.25)", // Orange transparent
	overlay: "rgba(28, 28, 28, 0.92)", // Overlay charbon
	fireOverlay: "rgba(255, 87, 34, 0.25)", // Overlay feu
};

/**
 * PREMIUM_COLORS - Alias complet vers le thème par défaut.
 * Utilisé comme fallback dans les StyleSheet statiques seulement.
 * Pour le JSX dynamique, préférer `theme` via useRestaurantConfig.
 */
export const PREMIUM_COLORS = {
	primary: GRILLZ_THEME.primary,
	secondary: GRILLZ_THEME.secondary,
	accent: GRILLZ_THEME.accent,
	success: GRILLZ_THEME.success,
	warning: GRILLZ_THEME.warning,
	error: GRILLZ_THEME.error,
	danger: GRILLZ_THEME.danger,
	dark: [GRILLZ_THEME.dark, GRILLZ_THEME.card],
	background: GRILLZ_THEME.background,
	text: GRILLZ_THEME.text,
	textMuted: GRILLZ_THEME.textMuted,
	textSecondary: GRILLZ_THEME.textSecondary,
	textAccent: GRILLZ_THEME.textAccent,
	glass: GRILLZ_THEME.glass,
	glassBorder: GRILLZ_THEME.glassBorder,
	overlay: GRILLZ_THEME.overlay,
	// Clés spécifiques conservées pour compatibilité
	gold: GRILLZ_THEME.gold,
	ember: GRILLZ_THEME.ember,
	fire: GRILLZ_THEME.fire,
	smoke: GRILLZ_THEME.smoke,
	orange: GRILLZ_THEME.orange,
	rouge: GRILLZ_THEME.rouge,
	dore: GRILLZ_THEME.dore,
	card: GRILLZ_THEME.card,
	elevated: GRILLZ_THEME.elevated,
	fireOverlay: GRILLZ_THEME.fireOverlay,
};
