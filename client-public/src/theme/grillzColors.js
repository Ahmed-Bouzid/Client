/**
 * 🔥 Théma Grillz - Palette basée sur l'identité visuelle du restaurant
 *
 * Design inspiré des flyers officiels :
 * - Logo flammes orange/rouge dynamique
 * - Thématique barbecue premium
 * - Certification Halal dorée
 * - Ambiance street food authentique
 */

// 🔥 Couleurs principales Grillz
export const GRILLZ_COLORS = {
	//  ===== PRIMAIRES =====
	primary: {
		fire: "#FF6B35", // Orange flamme signature
		ember: "#FF8C42", // Orange plus doux
		flame: "#D73027", // Rouge feu dynamique
		gold: "#FFD700", // Doré premium (Halal)
		amber: "#FFBF00", // Ambre chaleureux
	},

	// ===== BACKGROUNDS =====
	background: {
		dark: "#1a1a1a", // Noir profond principal
		card: "#2a2a2a", // Gris foncé cartes
		elevated: "#3a3a3a", // Gris plus clair (elevated)
		smoke: "#4a4a4a", // Gris fumée
	},

	// ===== TEXTES =====
	text: {
		primary: "#FFF8F0", // Blanc crème principal
		secondary: "#E0E0E0", // Gris clair secondaire
		muted: "#B0B0B0", // Gris terne
		accent: "#FFD700", // Doré pour highlights
	},

	// ===== ÉTATS =====
	success: {
		main: "#228B22", // Vert robuste
		light: "#32CD32", // Vert plus clair
		bg: "rgba(34, 139, 34, 0.1)",
	},
	warning: {
		main: "#FF8C00", // Orange sombre
		light: "#FFA500", // Orange clair
		bg: "rgba(255, 140, 0, 0.1)",
	},
	error: {
		main: "#DC143C", // Rouge crimson
		light: "#FF4500", // Rouge-orange
		bg: "rgba(220, 20, 60, 0.1)",
	},

	// ===== BORDURES & OMBRES =====
	border: {
		subtle: "rgba(255, 215, 0, 0.1)", // Doré transparent
		medium: "rgba(255, 107, 53, 0.2)", // Orange transparent
		strong: "rgba(215, 48, 39, 0.3)", // Rouge transparent
	},

	// ===== OVERLAYS =====
	overlay: {
		dark: "rgba(26, 26, 26, 0.9)", // Overlay sombre
		fire: "rgba(255, 107, 53, 0.2)", // Overlay orange
		smoke: "rgba(74, 74, 74, 0.8)", // Overlay fumée
	},
};

// 🎨 Gradients Grillz (pour LinearGradient)
export const GRILLZ_GRADIENTS = {
	// Gradient principal flamme
	fire: [GRILLZ_COLORS.primary.fire, GRILLZ_COLORS.primary.flame],
	fireVertical: [GRILLZ_COLORS.primary.fire, GRILLZ_COLORS.primary.flame],

	// Gradient doré premium
	gold: [GRILLZ_COLORS.primary.gold, GRILLZ_COLORS.primary.amber],
	goldVertical: [GRILLZ_COLORS.primary.gold, GRILLZ_COLORS.primary.amber],

	// Gradient ember doux
	ember: [GRILLZ_COLORS.primary.ember, GRILLZ_COLORS.primary.fire],

	// Gradient background sombre
	dark: [GRILLZ_COLORS.background.dark, GRILLZ_COLORS.background.card],
	darkVertical: [GRILLZ_COLORS.background.dark, GRILLZ_COLORS.background.card],

	// Gradient success
	success: [GRILLZ_COLORS.success.main, GRILLZ_COLORS.success.light],
};

// 🌟 Configuration pour remplacer PREMIUM_COLORS
export const GRILLZ_PREMIUM = {
	// Compatible avec l'ancien système
	primary: GRILLZ_GRADIENTS.fire,
	primaryVertical: GRILLZ_GRADIENTS.fireVertical,
	gold: GRILLZ_GRADIENTS.gold,
	dark: GRILLZ_GRADIENTS.dark,
	success: GRILLZ_GRADIENTS.success,

	// Nouvelles options Grillz
	ember: GRILLZ_GRADIENTS.ember,
	smoke: [GRILLZ_COLORS.background.smoke, GRILLZ_COLORS.background.dark],
};

// 🎯 Export default pour remplacement facile
export default GRILLZ_COLORS;
