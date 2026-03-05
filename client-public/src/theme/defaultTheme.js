/**
 * 🎨 DEFAULT THEME — Thème neutre générique
 *
 * Ce fichier est le fallback universel utilisé quand :
 * - La config du restaurant n'est pas encore chargée
 * - La config est incomplète ou invalide
 * - Un restaurant n'a pas de thème défini
 *
 * ⚠️ Ce thème est NEUTRE : il ne représente aucun restaurant spécifique.
 * Les thèmes spécifiques (Grillz, Italia...) sont gérés par la BDD via useRestaurantConfig.
 */

// =============================================================================
// THÈME GÉNÉRIQUE PAR DÉFAUT (neutre, professionnel)
// =============================================================================
export const DEFAULT_THEME = {
	// Gradients principaux (pour LinearGradient)
	primary: ["#4A90D9", "#2C5F8A"],
	secondary: ["#5C6BC0", "#3949AB"],
	accent: ["#26A69A", "#00796B"],
	gold: ["#FFC107", "#FF8F00"],
	success: ["#43A047", "#2E7D32"],
	warning: ["#FB8C00", "#E65100"],
	error: ["#E53935", "#B71C1C"],
	danger: ["#E53935", "#B71C1C"],
	dark: ["#263238", "#37474F"],
	background: ["#F5F6FA", "#EAECF0"],
	smoke: ["#607D8B", "#455A64"],
	fire: ["#FF5722", "#BF360C"],
	ember: ["#FF6F00", "#E65100"],

	// Couleurs unitaires
	orange: "#FF6D00",
	rouge: "#C62828",
	dore: "#F9A825",

	// Backgrounds purs
	dark_bg: "#263238", // ⚠️ gardé pour accès direct si besoin
	card: "#FFFFFF",
	elevated: "#F0F2F5",
	card_dark: "#2C2C2C",

	// Textes
	text: "#1A1A2E",
	textSecondary: "#4A4A6A",
	textMuted: "#9E9E9E",
	textAccent: "#2C5F8A",
	textInverse: "#FFFFFF",

	// Transparences/verre
	glass: "rgba(74, 144, 217, 0.10)",
	glassBorder: "rgba(74, 144, 217, 0.25)",
	overlay: "rgba(26, 26, 46, 0.80)",
	fireOverlay: "rgba(255, 87, 34, 0.18)",

	// Ombres
	shadowColor: "#2C5F8A",

	// Polices (optionnel — à surcharger par thème restaurant si dispo)
	fontRegular: undefined, // Ex: "Poppins-Regular" si fourni par le restaurant
	fontBold: undefined, // Ex: "Poppins-Bold"
};

// =============================================================================
// THÈME FAST-FOOD (générique pour les fast-foods)
// =============================================================================
export const FASTFOOD_THEME = {
	primary: ["#F44336", "#B71C1C"],
	secondary: ["#FF9800", "#E65100"],
	accent: ["#FFC107", "#FF8F00"],
	gold: ["#FFC107", "#FFB300"],
	success: ["#4CAF50", "#2E7D32"],
	warning: ["#FF9800", "#E65100"],
	error: ["#F44336", "#B71C1C"],
	danger: ["#F44336", "#B71C1C"],
	dark: ["#212121", "#424242"],
	background: ["#FFF8E1", "#FFECB3"],
	smoke: ["#616161", "#424242"],
	fire: ["#FF5722", "#BF360C"],
	ember: ["#FF6F00", "#E65100"],

	orange: "#FF6D00",
	rouge: "#B71C1C",
	dore: "#FFC107",

	card: "#FFFFFF",
	elevated: "#FFF3E0",
	card_dark: "#212121",

	text: "#212121",
	textSecondary: "#616161",
	textMuted: "#9E9E9E",
	textAccent: "#B71C1C",
	textInverse: "#FFFFFF",

	glass: "rgba(244, 67, 54, 0.10)",
	glassBorder: "rgba(244, 67, 54, 0.25)",
	overlay: "rgba(33, 33, 33, 0.85)",
	fireOverlay: "rgba(255, 87, 34, 0.22)",

	shadowColor: "#B71C1C",
	fontRegular: undefined,
	fontBold: undefined,
};

// =============================================================================
// THÈME FOODTRUCK (générique pour les food trucks)
// =============================================================================
export const FOODTRUCK_THEME = {
	primary: ["#FF7043", "#BF360C"],
	secondary: ["#FFCA28", "#F57F17"],
	accent: ["#66BB6A", "#2E7D32"],
	gold: ["#FFCA28", "#FF8F00"],
	success: ["#66BB6A", "#2E7D32"],
	warning: ["#FFCA28", "#F57F17"],
	error: ["#EF5350", "#B71C1C"],
	danger: ["#EF5350", "#B71C1C"],
	dark: ["#1B1B1B", "#2D2D2D"],
	background: ["#FFF8F0", "#FFE0D0"],
	smoke: ["#757575", "#424242"],
	fire: ["#FF7043", "#BF360C"],
	ember: ["#FF8C00", "#E65100"],

	orange: "#FF7043",
	rouge: "#BF360C",
	dore: "#FFCA28",

	card: "#FFFFFF",
	elevated: "#FFF3E0",
	card_dark: "#1B1B1B",

	text: "#2C2C2C",
	textSecondary: "#5C5C5C",
	textMuted: "#9E9E9E",
	textAccent: "#FF7043",
	textInverse: "#FFFFFF",

	glass: "rgba(255, 112, 67, 0.10)",
	glassBorder: "rgba(255, 112, 67, 0.25)",
	overlay: "rgba(27, 27, 27, 0.85)",
	fireOverlay: "rgba(255, 112, 67, 0.22)",

	shadowColor: "#FF7043",
	fontRegular: undefined,
	fontBold: undefined,
};

// =============================================================================
// THÈME RESTAURANT CLASSIQUE (générique pour restaurants classiques)
// =============================================================================
export const CLASSIC_RESTAURANT_THEME = {
	primary: ["#5C6BC0", "#283593"],
	secondary: ["#26A69A", "#00695C"],
	accent: ["#AB47BC", "#6A1B9A"],
	gold: ["#FFC107", "#FF8F00"],
	success: ["#43A047", "#1B5E20"],
	warning: ["#FB8C00", "#E65100"],
	error: ["#E53935", "#B71C1C"],
	danger: ["#E53935", "#B71C1C"],
	dark: ["#212121", "#424242"],
	background: ["#FAFAFA", "#F0F0F5"],
	smoke: ["#78909C", "#546E7A"],
	fire: ["#FF5722", "#BF360C"],
	ember: ["#FF6F00", "#E65100"],

	orange: "#FB8C00",
	rouge: "#B71C1C",
	dore: "#FFC107",

	card: "#FFFFFF",
	elevated: "#F5F5F5",
	card_dark: "#212121",

	text: "#212121",
	textSecondary: "#616161",
	textMuted: "#9E9E9E",
	textAccent: "#283593",
	textInverse: "#FFFFFF",

	glass: "rgba(92, 107, 192, 0.10)",
	glassBorder: "rgba(92, 107, 192, 0.25)",
	overlay: "rgba(33, 33, 33, 0.80)",
	fireOverlay: "rgba(255, 87, 34, 0.15)",

	shadowColor: "#5C6BC0",
	fontRegular: undefined,
	fontBold: undefined,
};

// =============================================================================
// REGISTRY DES THÈMES PAR TYPE/CLÉ
// =============================================================================
const THEME_REGISTRY = {
	// Types génériques
	default: DEFAULT_THEME,
	standard: DEFAULT_THEME,
	classic: CLASSIC_RESTAURANT_THEME,
	restaurant: CLASSIC_RESTAURANT_THEME,
	fastfood: FASTFOOD_THEME,
	"fast-food": FASTFOOD_THEME,
	foodtruck: FOODTRUCK_THEME,
	"food-truck": FOODTRUCK_THEME,
	// Les thèmes spécifiques (grillz, italia) viennent exclusivement de la BDD
	// Ne pas les mettre ici pour éviter toute fuite de style entre restaurants
};

/**
 * Retourne le thème de base pour un type donné.
 * @param {string} typeOrKey - Type ou clé de style (ex: 'foodtruck', 'classic', 'grillz')
 * @returns {object} Thème de base complet
 */
export const getBaseThemeByType = (typeOrKey) => {
	if (!typeOrKey) return DEFAULT_THEME;
	const key = typeOrKey.toLowerCase();
	return THEME_REGISTRY[key] || DEFAULT_THEME;
};

/**
 * Fusionne un thème de base avec les données de la BDD.
 * Les données BDD ont priorité absolue sur le thème de base.
 * @param {object} dbStyle - Données de style depuis la BDD
 * @param {string} typeOrKey - Type de restaurant pour choisir la base
 * @returns {object} Thème complet et sûr (jamais undefined)
 */
export const buildSafeTheme = (dbStyle, typeOrKey) => {
	const base = getBaseThemeByType(typeOrKey);
	if (!dbStyle) return base;
	// Fusion : BDD surcharge la base, toutes les propriétés sont garanties
	return { ...base, ...dbStyle };
};

export default DEFAULT_THEME;
