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
 *
 * 📝 DETTE PHASE 1.3 — TOKENS COMPONENT-SCOPED INLINE
 * Les tokens component-scoped ajoutés en Phase 0.3.3 (ex: getPaymentItemTokens)
 * embarquent leurs valeurs (couleurs, gradients) en dur dans ce fichier JS,
 * branchées sur styleKey via if/else. C'est temporaire — en Phase 1.3 ces
 * valeurs migreront vers le payload BDD via enrichissement de
 * RestaurantThemeAssignment.style (cf. Brain 04-SunnyGo/theming-roadmap.md).
 * Les helpers garderont leur signature (styleKey → tokens), seule la source
 * des valeurs changera (BDD au lieu de in-file).
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

// =============================================================================
// COMPONENT-SCOPED TOKENS — Phase 0.3.3 strangler migration
// =============================================================================
// Ces helpers retournent les tokens spécifiques à un sous-composant donné,
// branchés sur styleKey. Permet de migrer Payment.jsx hors des `isGrillzTheme`
// hardcodés sans toucher la structure des THEMES globaux (DEFAULT_THEME etc.).
//
// Convention : les overrides "Grillz only" (ex: itemTextIdle) renvoient `null`
// quand non applicables — ainsi le composant peut faire :
//   <View style={[styles.base, tokens.override]} />
// React Native ignore proprement `null` dans les arrays de style.
//
// Phase 1.3 : les valeurs hardcodées ici migreront vers le payload BDD.
// =============================================================================

/**
 * 🎨 Tokens pour le sous-composant PremiumPaymentItem (Payment.jsx Zone A).
 *
 * @param {string|null|undefined} styleKey - Clé de style du restaurant courant
 *   (ex: "grillz", "cucina", null pendant boot).
 * @returns {{
 *   itemBackground: { paid: string[], selected: string[], idle: string[] },
 *   checkboxEmpty: object|null,
 *   checkboxInner: object|null,
 *   itemTextIdle: string|null,
 *   itemSubtextIdle: string|null,
 *   itemPriceIdle: string|null,
 *   iconOnPrimary: string,
 *   successIcon: string,
 *   itemGradientIdle: string[],
 * }}
 */
export const getPaymentItemTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		// Fond gradient de la card item (3 états)
		itemBackground: {
			paid: ["rgba(56, 239, 125, 0.2)", "rgba(17, 153, 142, 0.1)"],
			selected: isGrillz
				? ["rgba(234, 88, 12, 0.35)", "rgba(249, 115, 22, 0.2)"]
				: ["rgba(102, 126, 234, 0.3)", "rgba(118, 75, 162, 0.2)"],
			idle: isGrillz
				? ["rgba(26, 26, 26, 0.95)", "rgba(20, 20, 20, 0.95)"]
				: ["rgba(255,255,255,0.95)", "rgba(248,249,250,0.95)"],
		},
		// Checkbox idle (override Grillz only, null sinon)
		checkboxEmpty: isGrillz
			? { backgroundColor: "#1A1A1A", borderColor: "#3F3F46" }
			: null,
		checkboxInner: isGrillz ? { backgroundColor: "#2A2A2A" } : null,
		// Couleurs texte item idle (override Grillz only)
		itemTextIdle: isGrillz ? "#D4D4D8" : null,
		itemSubtextIdle: isGrillz ? "#A1A1AA" : null,
		itemPriceIdle: isGrillz ? "#D4D4D8" : null,
		// Icônes — valeurs identiques tous thèmes (haut contraste sur gradient coloré)
		iconOnPrimary: "#fff",
		successIcon: "#38ef7d",
		// Gradient prix badge idle (Grillz dark / default light)
		itemGradientIdle: isGrillz
			? ["#2A2A2A", "#1F1F1F"]
			: ["#e9ecef", "#dee2e6"],
	};
};

/**
 * 🎨 Tokens pour le Container racine + Header de Payment.jsx (Zone B).
 *
 * @param {string|null|undefined} styleKey - Clé de style du restaurant courant
 *   (ex: "grillz", "cucina", null pendant boot).
 * @returns {{
 *   containerBackground: string[]|null,
 *   bgDecorSecondaryKey: string,
 *   headerIconGradientKey: string,
 *   headingColor: string|null,
 *   bodyMutedColor: string|null,
 *   toggleRowBackground: object|null,
 *   toggleActiveOverride: object|null,
 *   toggleIconInactive: string,
 *   iconOnPrimary: string,
 * }}
 */
export const getPaymentContainerTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		// T1 — Gradient racine du container (3 stops). Côté Cucina retourne null
		// pour que le JSX puisse appliquer la fallback `theme.background || [theme.dark, theme.card]`
		// via l'opérateur || (null, pas undefined, pour comportement prévisible).
		containerBackground: isGrillz
			? ["#0D0D0D", "#171717", "#0F0F0F"]
			: null,

		// T2 et T3 retournent une clé de palette du theme, à résoudre côté JSX
		// via theme[tokens.xxxKey]. Pattern volontaire pour garder le helper pur,
		// sans couplage runtime au theme.
		bgDecorSecondaryKey: isGrillz ? "accent" : "success",
		headerIconGradientKey: isGrillz ? "primary" : "success",

		// T4 / T5 — Couleurs typographiques (override Grillz only)
		headingColor: isGrillz ? "#F8FAFC" : null,
		bodyMutedColor: isGrillz ? "#A1A1AA" : null,

		// T6 — Background du toggle row "Mes articles / Toute la table" (Grillz only)
		toggleRowBackground: isGrillz
			? { backgroundColor: "rgba(255,255,255,0.08)" }
			: null,

		// T7 — Override couleur du toggle actif (default Cucina = styles.clientToggleBtnActive
		// reste actif via le pattern d'array, l'override Grillz écrase juste le bg en dernière position)
		toggleActiveOverride: isGrillz ? { backgroundColor: "#EA580C" } : null,

		// T8 — Couleur icône du toggle inactif
		toggleIconInactive: isGrillz ? "#A1A1AA" : "#666",

		// T9 — Icônes sur fond gradient primary/secondary/accent (commun aux 2 thèmes).
		// ⚠️ DUPLICATION INTENTIONNELLE avec getPaymentItemTokens.iconOnPrimary —
		// micro-dette Phase 0.6 (factoriser en THEME_CONSTANTS.iconOnPrimary).
		iconOnPrimary: "#fff",
	};
};

export default DEFAULT_THEME;
