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

/**
 * Phase 0.3.3-C — Tokens scopés à la zone Boutons paiement (Payment.jsx L1471-L1700)
 *
 * Couvre :
 *  - Card pay button (gradient + shadow)
 *  - 🍎 Apple Pay button (gradient + icon — NON-NÉGOCIABLE Apple HIG)
 *  - Counter pay button (fast-food, gradient + shadow)
 *  - InfoNote (icon + border override)
 *  - PaidSection title color (override Grillz)
 *  - Disabled gradients universels
 *
 * Convention :
 *  - `*Key`        → string clé de palette à résoudre via `theme[key]`
 *  - `*Override`   → objet style RN (ou null si pas d'override) pour pattern array `[base, override]`
 *  - `*Gradient`   → tableau de couleurs prêt à passer à <LinearGradient colors={...} />
 *
 * Sites NON-thémables documentés (préservés hardcoded dans le helper pour centralisation) :
 *  - 🍎 ApplePay active gradient + icon : Apple HIG (jamais teintable)
 *  - Counter brand orange : sémantique métier "comptoir" cross-tenant
 *  - InfoNote #4facfe : brand info universelle Stripe-like
 *  - Disabled gradients : états système universels (asymétrie Card/ApplePay/Counter
 *    préservée — micro-dette UI Phase 0.6, cf. Brain log)
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {object} tokens scopés à la zone Boutons paiement
 */
export const getPaymentButtonsTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		// === DISABLED STATES (universels, ni thémables ni Apple-spécifiques) ===
		// Asymétrie préservée tel quel (Card symétrique, ApplePay/Counter asymétriques).
		// Micro-dette UI Phase 0.6 — cf. Brain log "asymétrie gradients disabled".
		cardDisabledGradient: ["#ccc", "#ccc"],
		applePayDisabledGradient: ["#ccc", "#999"],
		counterDisabledGradient: ["#ccc", "#999"],

		// === CARD PAY BUTTON (thémable) ===
		// Clé de palette résolue côté JSX via theme[tokens.cardActiveGradientKey]
		cardActiveGradientKey: isGrillz ? "primary" : "success",
		cardShadowOverride: isGrillz ? { shadowColor: "#EA580C" } : null,

		// === 🍎 APPLE PAY (NON-NÉGOCIABLE Apple Human Interface Guidelines) ===
		// 🍎 Bouton noir/foncé OBLIGATOIRE — jamais thémable, jamais teinté.
		// 🍎 Cf. https://developer.apple.com/design/human-interface-guidelines/apple-pay
		applePayActiveGradient: ["#000", "#333"],
		// 🍎 Contraste blanc obligatoire sur fond noir Apple Pay
		iconOnApple: "#fff",

		// === COUNTER PAY (brand fast-food, sémantique métier cross-tenant) ===
		// Orange "comptoir" indépendant du theme — pas de variante Grillz.
		// Seul l'effet d'ombre est thémable (cohérence visuelle Grillz orange profond).
		counterActiveGradient: ["#FF8C00", "#FF6B00"],
		counterShadowOverride: isGrillz ? { shadowColor: "#EA580C" } : null,

		// === INFO NOTE ===
		// Brand info universelle — non thémable cross-tenant.
		// Si un futur tenant veut son propre bleu info → créer un nouveau token
		// infoBrandColor à ce moment-là, pas avant (YAGNI).
		infoIconColor: "#4facfe",
		infoNoteBorderOverride: isGrillz ? { borderColor: "#2A2A2A" } : null,

		// === PAID SECTION ===
		// Override Grillz only sur le titre "Déjà payés (n)".
		// Côté JSX : pattern [styles.base, tokens.paidSectionTitleColor && { color: tokens.paidSectionTitleColor }]
		paidSectionTitleColor: isGrillz ? "#A1A1AA" : null,

		// === ICON UNIVERSEL ===
		// ⚠️ DUPLICATION INTENTIONNELLE avec getPaymentItemTokens.iconOnPrimary
		// et getPaymentContainerTokens.iconOnPrimary — micro-dette Phase 0.6
		// (factoriser en THEME_CONSTANTS.iconOnPrimary lors du cleanup).
		iconOnPrimary: "#fff",
	};
};

/**
 * Phase 0.3.3-D1 — Tokens scopés à la zone Modal Stripe web (Payment.jsx L1728-L1763)
 *
 * Couvre uniquement le wrapper Modal RN web (View card + Title + Subtitle).
 * NE COUVRE PAS l'iframe Stripe Elements (theming via Stripe appearance API
 * côté WebStripeCheckout — strictement hors périmètre theming SunnyGo).
 *
 * Pattern Override : retourne un objet style RN (ou null) à appliquer en seconde
 * position du tableau JSX [styles.base, tokens.xxxOverride]. Cohérent avec B/C
 * (toggleRowBackground, infoNoteBorderOverride). Le tableau RN ignore null.
 *
 * Pourquoi pas de tokens *Key palette ? Les couleurs Grillz dark (#141414, #3F3F46)
 * ne mappent à AUCUNE clé de palette du theme. Override inline obligatoire.
 *
 * Stratégie strangler : Cucina = défaut visuel via StyleSheet de base
 * (webModalCard / webModalTitle / webModalSubtitle), Grillz = override via tokens.
 *
 * Sites NON-thémables documentés :
 *  - webModalBackdrop scrim rgba(0,0,0,0.5) : système universel (cross-tenant)
 *  - Stripe Elements iframe : géré par Stripe appearance API (hors périmètre)
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {object} tokens scopés à la zone Modal Stripe web
 */
export const getPaymentModalTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		// === MODAL CARD (background + border, override Grillz only) ===
		cardOverride: isGrillz
			? { backgroundColor: "#141414", borderColor: "#3F3F46" }
			: null,

		// === MODAL TITLE color (override Grillz only) ===
		titleOverride: isGrillz ? { color: "#F8FAFC" } : null,

		// === MODAL SUBTITLE color (override Grillz only) ===
		subtitleOverride: isGrillz ? { color: "#D4D4D8" } : null,
	};
};

/**
 * Phase 0.4-A — Tokens scopés à la zone Container + Empty state d'OrderScreen.jsx
 *
 * Couvre :
 *  - Background du container racine (View top-level)
 *  - Couleur du texte "Aucune commande" (empty state)
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {{ background: string, emptyTextColor: string }}
 */
export const getOrderContainerTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		background: isGrillz ? "#0D0D0D" : "#FEF7F0",
		emptyTextColor: isGrillz ? "#F8FAFC" : "#1F2937",
	};
};

/**
 * Phase 0.4-A — Tokens scopés à la zone Header d'OrderScreen.jsx
 *
 * Couvre :
 *  - Couleur du titre "Ma commande en cours"
 *  - Couleur de l'icône chevron-left (back button)
 *
 * Note : `backIconColor` Grillz = #F59E0B (orange ambré) ≠ #F97316 (orange foncé
 * utilisé pour les prix). 2 nuances d'orange volontaires dans la palette Grillz.
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {{ titleColor: string, backIconColor: string }}
 */
export const getOrderHeaderTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		titleColor: isGrillz ? "#F8FAFC" : "#1F2937",
		backIconColor: isGrillz ? "#F59E0B" : "#1F2937",
	};
};

/**
 * Phase 0.4-A — Tokens scopés à la zone Summary d'OrderScreen.jsx
 *
 * Couvre la ligne récap (texte article principal + date + prix total).
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {{ textColor: string, dateColor: string, priceColor: string }}
 */
export const getOrderSummaryTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		textColor: isGrillz ? "#F8FAFC" : "#1F2937",
		dateColor: isGrillz ? "#A3A3A3" : "#9CA3AF",
		priceColor: isGrillz ? "#F97316" : "#EA580C",
	};
};

/**
 * Phase 0.4-A — Tokens scopés à la zone Card produit d'OrderScreen.jsx
 *
 * Couvre :
 *  - Background de la card produit
 *  - Bordure (override inline : null côté Cucina, { borderWidth, borderColor }
 *    côté Grillz). Pattern spread conditionnel pour éviter de polluer Cucina
 *    avec borderWidth: 0 / borderColor: transparent. Cohérent avec
 *    `cardOverride` de getPaymentModalTokens (B/C/D1).
 *  - Couleur nom produit + prix produit
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {{
 *   cardBackground: string,
 *   cardBorderOverride: object|null,
 *   productNameColor: string,
 *   productPriceColor: string,
 * }}
 */
export const getOrderCardTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		cardBackground: isGrillz ? "#1A1A1A" : "#FFFFFF",
		// Override inline : Cucina sans bordure native (null), Grillz bordure foncée
		cardBorderOverride: isGrillz
			? { borderWidth: 1, borderColor: "#2A2A2A" }
			: null,
		productNameColor: isGrillz ? "#F8FAFC" : "#1F2937",
		productPriceColor: isGrillz ? "#F97316" : "#EA580C",
	};
};

/**
 * Phase 0.4-A — Tokens scopés à la zone Footer (boutons pay/cancel) d'OrderScreen.jsx
 *
 * Couvre :
 *  - Background du footer (zone fixe en bas)
 *  - Background du bouton Pay (état idle uniquement — variantes pending fast-food
 *    `payBtnDisabled` n'ont aucune variante Grillz, préservées telles quelles)
 *  - Bordure du bouton Cancel
 *  - Couleur du texte Cancel
 *
 * @param {string} styleKey - "grillz" | "cucina" | autre
 * @returns {{
 *   footerBackground: string,
 *   payBtnBackground: string,
 *   cancelBtnBorderColor: string,
 *   cancelBtnTextColor: string,
 * }}
 */
export const getOrderFooterTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		footerBackground: isGrillz ? "#0D0D0D" : "#FEF7F0",
		payBtnBackground: isGrillz ? "#EA580C" : "#F87171",
		cancelBtnBorderColor: isGrillz ? "#3F3F46" : "#D1D5DB",
		cancelBtnTextColor: isGrillz ? "#D4D4D8" : "#9CA3AF",
	};
};

/**
 * 📝 WELCOME FORM TOKENS — Phase 0.4-C.3
 *
 * Tokens du formulaire Welcome (input nom + bouton CTA) sur fond image
 * tenant (Cucina panini bg / Baghera hero bg / etc.).
 *
 * Iso-strict avec les valeurs hardcoded actuelles du bloc Cucina inline
 * (WelcomeScreen.jsx L1004-1067) : input glassmorphism blanc semi-transparent
 * + CTA rouge brique #E74C3C + erreur #FF6B6B + texte blanc.
 *
 * Branche grillz tient les valeurs équivalentes pour cohérence référentielle
 * (utilisées par WelcomeScreenGrillz Phase 0.4-C.4 cleanup destructif), mais
 * Grillz a un design d'inputs différent (#1E1E1E + bordure orange #D35400)
 * et son propre helper sera factorisé en Phase 0.6.
 *
 * 🛡️ Universel non-thémable : errorTextColor = #FF6B6B (signal d'erreur).
 *
 * @param {string} styleKey - Identifiant du style ("cucina", "grillz", ...)
 * @returns {object} Tokens du formulaire Welcome
 */
export const getWelcomeFormTokens = (styleKey) => {
	const isGrillz = (styleKey || "").toLowerCase() === "grillz";
	return {
		// === INPUT (glassmorphism Cucina sur fond image) ===
		inputBackground: isGrillz ? "#1E1E1E" : "rgba(255, 255, 255, 0.15)",
		inputBorderColor: isGrillz ? "#D35400" : "rgba(255, 255, 255, 0.3)",
		inputTextColor: "#FFFFFF",
		inputIconColor: isGrillz ? "#FF8A50" : "#FFFFFF",
		inputPlaceholderColor: isGrillz ? "#777" : "rgba(255, 255, 255, 0.6)",

		// === CTA BUTTON ===
		ctaBackground: isGrillz ? "#D35400" : "#E74C3C",
		ctaTextColor: "#FFFFFF",

		// === ERROR (universel non-thémable) ===
		errorTextColor: "#FF6B6B",
	};
};

export default DEFAULT_THEME;
