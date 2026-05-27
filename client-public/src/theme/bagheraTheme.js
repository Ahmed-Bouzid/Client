/**
 * 🎨 BAGHERA THEME — Phase 3.1
 *
 * Tokens du tenant Baghera (brunch premium Marseille).
 * Source de vérité : tailwind.config.ts du repo Next.js déployé
 *   → https://baghera-iota.vercel.app
 *
 * Ambiance : lumière du Sud, slow mornings, écrin chaleureux minimal,
 * inspirations Tokyo/Melbourne. Wordmark typographique (PAS de logo image).
 *
 * 🛡️ Iso-référentiel STRICT avec le site Next.js :
 *  - palette recopiée exact (cream/sand/ink/coal/smoke/sage/ember)
 *  - fonts Google Fonts : Instrument Serif (serif) + Inter (sans)
 *  - letter-spacing tightest (-0.04em) / ultra (-0.06em)
 *  - easing custom "silk" cubic-bezier(0.6, 0.05, 0.1, 1)
 *
 * Pattern cohérent avec defaultTheme.js helpers :
 *  - Helpers `getXxxBagheraTokens()` purs, signature stable
 *  - Branchés via styleKey === 'baghera' dans Phases 3.2 → 3.5
 *
 * 📝 DETTE PHASE 1.3 — Comme defaultTheme.js, ces tokens sont in-file
 * temporaires. Migration BDD via RestaurantThemeAssignment.style en Phase 1.3
 * (post-démo). Signature des helpers garantie stable.
 *
 * @see CLIENT-end/client-public/src/theme/defaultTheme.js (pattern référentiel)
 * @see CLIENT-end/client-public/assets/baghera/ (assets pipeline)
 */

// =============================================================================
// 🎨 PALETTE BAGHERA — recopie exacte tailwind.config.ts
// =============================================================================
export const BAGHERA_PALETTE = {
	// Backgrounds (tons crème/sable du Sud)
	cream: "#F4ECDF", // background principal (canvas)
	creamSoft: "#FAF5EC", // surface élevée (cards)
	sand: "#E7D9C2", // accent chaud (separators, hover)

	// Textes (tons encre profonde)
	ink: "#0E0E0C", // texte principal (titres, body)
	coal: "#1B1A17", // texte alternatif (sous-titres)
	smoke: "#6E6A62", // texte secondaire (meta, captions)

	// Accents
	sage: "#C8D2BD", // vert doux (badges veggie, success)
	ember: "#F26B1F", // CTA orange signature (boutons primaires)
	emberSoft: "#F58A45", // hover/highlight CTA
	emberDeep: "#C24E10", // pressed CTA / accent fort
};

// =============================================================================
// 🔤 FONTS BAGHERA
// =============================================================================
// Familles enregistrées via Font.loadAsync dans Phase 3.2 (WelcomeScreenBaghera)
// avec les fichiers TTF de client-public/assets/baghera/fonts/.
export const BAGHERA_FONTS = {
	serif: "InstrumentSerif", // titres, wordmark "Baghera."
	serifItalic: "InstrumentSerif-Italic",
	sans: "Inter", // body, UI
	sansItalic: "Inter-Italic",
};

// Letter-spacing tokens (équivalent Tailwind tracking-tightest / ultra).
// React Native attend des valeurs absolues (pixels) → conversion approximative
// basée sur fontSize 64 (wordmark hero) :
//   tightest -0.04em ≈ -2.6 px @ 64
//   ultra    -0.06em ≈ -3.8 px @ 64
// On expose le ratio (em) pour calculs dynamiques côté composants.
export const BAGHERA_LETTER_SPACING = {
	tightest: -0.04,
	ultra: -0.06,
};

// Easing custom "silk" — pour Animated.timing(...).easing
// React Native : Easing.bezier(0.6, 0.05, 0.1, 1)
// (le composant consommateur fera l'import : import { Easing } from 'react-native')
export const BAGHERA_EASING_SILK = [0.6, 0.05, 0.1, 1];

// =============================================================================
// 🎨 THEME OBJECT (compatible structure DEFAULT_THEME)
// =============================================================================
// Permet un fallback générique si un consommateur lit le theme en bloc plutôt
// que via les helpers tokens. Mappe la palette Baghera sur les clés conventionnelles.
export const BAGHERA_THEME = {
	// Gradients (Baghera privilégie les aplats — gradients = doublons palette)
	primary: [BAGHERA_PALETTE.ember, BAGHERA_PALETTE.emberDeep],
	secondary: [BAGHERA_PALETTE.sand, BAGHERA_PALETTE.cream],
	accent: [BAGHERA_PALETTE.sage, BAGHERA_PALETTE.sage],
	gold: [BAGHERA_PALETTE.ember, BAGHERA_PALETTE.emberSoft],
	success: [BAGHERA_PALETTE.sage, BAGHERA_PALETTE.sage],
	warning: [BAGHERA_PALETTE.emberSoft, BAGHERA_PALETTE.ember],
	error: [BAGHERA_PALETTE.emberDeep, BAGHERA_PALETTE.emberDeep],
	danger: [BAGHERA_PALETTE.emberDeep, BAGHERA_PALETTE.emberDeep],
	dark: [BAGHERA_PALETTE.coal, BAGHERA_PALETTE.ink],
	background: [BAGHERA_PALETTE.cream, BAGHERA_PALETTE.creamSoft],
	smoke: [BAGHERA_PALETTE.smoke, BAGHERA_PALETTE.coal],
	fire: [BAGHERA_PALETTE.ember, BAGHERA_PALETTE.emberDeep],
	ember: [BAGHERA_PALETTE.ember, BAGHERA_PALETTE.emberDeep],

	// Couleurs unitaires
	orange: BAGHERA_PALETTE.ember,
	rouge: BAGHERA_PALETTE.emberDeep,
	dore: BAGHERA_PALETTE.emberSoft,

	// Backgrounds purs
	dark_bg: BAGHERA_PALETTE.coal,
	card: BAGHERA_PALETTE.creamSoft,
	elevated: BAGHERA_PALETTE.sand,
	card_dark: BAGHERA_PALETTE.coal,

	// Textes
	text: BAGHERA_PALETTE.ink,
	textSecondary: BAGHERA_PALETTE.coal,
	textMuted: BAGHERA_PALETTE.smoke,
	textAccent: BAGHERA_PALETTE.ember,
	textInverse: BAGHERA_PALETTE.cream,

	// Transparences/verre (cream à 10%/25% sur fond ink)
	glass: "rgba(244, 236, 223, 0.10)",
	glassBorder: "rgba(244, 236, 223, 0.25)",
	overlay: "rgba(14, 14, 12, 0.80)",
	fireOverlay: "rgba(242, 107, 31, 0.18)",

	// Ombre (ember signature pour halo CTA)
	shadowColor: BAGHERA_PALETTE.ember,

	// Polices
	fontRegular: BAGHERA_FONTS.sans,
	fontBold: BAGHERA_FONTS.sans,
	fontSerif: BAGHERA_FONTS.serif,
};

// =============================================================================
// 🎯 HELPERS TOKENS (alignés sur defaultTheme.js getXxxTokens(styleKey))
// =============================================================================
// Convention : chaque helper accepte styleKey et retourne un objet tokens.
// Branche `baghera` retourne valeurs Baghera, autres branches → null/undefined
// pour signaler au caller que ce helper ne s'applique pas à ce styleKey.
//
// Pattern d'usage côté consommateur :
//   const tokens = getWelcomeBagheraTokens(styleKey);
//   if (tokens) { ...apply baghera... }
//
// Cette discipline évite que les helpers Baghera polluent les autres tenants.

/**
 * 🌅 WELCOME TOKENS BAGHERA — Phase 3.2
 *
 * Tokens du WelcomeScreenBaghera (wordmark + sous-titre + CTA).
 *
 * @param {string} styleKey
 * @returns {object|null} Tokens si baghera, sinon null.
 */
export const getWelcomeBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		// === CANVAS (background principal) ===
		canvasBackground: BAGHERA_PALETTE.cream,

		// === WORDMARK "Baghera." (Instrument Serif géant) ===
		wordmarkColor: BAGHERA_PALETTE.ink,
		wordmarkFontFamily: BAGHERA_FONTS.serif,
		// Letter-spacing absolu pour fontSize ~96 (wordmark hero) :
		//   ultra (-0.06em) ≈ -5.76 px
		wordmarkLetterSpacing: -5.76,

		// === SOUS-TITRE "Le brunch comme un art de vivre" ===
		subtitleColor: BAGHERA_PALETTE.smoke,
		subtitleFontFamily: BAGHERA_FONTS.sans,

		// === CTA PRIMAIRE "Commander" (ember plein) ===
		ctaPrimaryBackground: BAGHERA_PALETTE.ember,
		ctaPrimaryTextColor: BAGHERA_PALETTE.cream,
		ctaPrimaryPressedBackground: BAGHERA_PALETTE.emberDeep,

		// === CTA SECONDAIRE "Réserver" (outline ink) ===
		ctaSecondaryBackground: "transparent",
		ctaSecondaryBorderColor: BAGHERA_PALETTE.ink,
		ctaSecondaryTextColor: BAGHERA_PALETTE.ink,

		// === HERO IMAGE (overlay subtil pour lisibilité texte) ===
		heroOverlayColor: "rgba(244, 236, 223, 0.55)", // cream 55%

		// === INPUT (formulaire nom client, fond crème sur canvas crème) ===
		inputBackground: BAGHERA_PALETTE.creamSoft,
		inputBorderColor: BAGHERA_PALETTE.sand,
		inputTextColor: BAGHERA_PALETTE.ink,
		inputIconColor: BAGHERA_PALETTE.smoke,
		inputPlaceholderColor: BAGHERA_PALETTE.smoke,

		// === ERROR ===
		errorTextColor: BAGHERA_PALETTE.emberDeep,
	};
};

/**
 * 🍽️ MENU TOKENS BAGHERA — Phase 3.3
 *
 * Tokens du MenuScreen (cards plats, catégories, prix).
 *
 * @param {string} styleKey
 * @returns {object|null}
 */
export const getMenuBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		// === CANVAS ===
		background: BAGHERA_PALETTE.cream,

		// === HEADER (titre catégorie, back button) ===
		headerTitleColor: BAGHERA_PALETTE.ink,
		headerSubtitleColor: BAGHERA_PALETTE.smoke,
		headerBackIconColor: BAGHERA_PALETTE.ink,

		// === TABS CATÉGORIES (Salé, Sucré, Signatures, Matcha...) ===
		tabActiveBackground: BAGHERA_PALETTE.ink,
		tabActiveTextColor: BAGHERA_PALETTE.cream,
		tabInactiveBackground: "transparent",
		tabInactiveTextColor: BAGHERA_PALETTE.smoke,
		tabInactiveBorderColor: BAGHERA_PALETTE.sand,

		// === CARD PLAT ===
		cardBackground: BAGHERA_PALETTE.creamSoft,
		cardBorderColor: BAGHERA_PALETTE.sand,
		cardShadowColor: "rgba(14, 14, 12, 0.08)", // ink 8%
		productNameColor: BAGHERA_PALETTE.ink,
		productNameFontFamily: BAGHERA_FONTS.serif,
		productDescriptionColor: BAGHERA_PALETTE.smoke,
		productPriceColor: BAGHERA_PALETTE.ember,
		productPriceFontFamily: BAGHERA_FONTS.sans,

		// === BADGES (signature, veggie, nouveau) ===
		badgeSignatureBackground: BAGHERA_PALETTE.ember,
		badgeSignatureTextColor: BAGHERA_PALETTE.cream,
		badgeVeggieBackground: BAGHERA_PALETTE.sage,
		badgeVeggieTextColor: BAGHERA_PALETTE.ink,

		// === CTA AJOUTER AU PANIER ===
		ctaAddBackground: BAGHERA_PALETTE.ember,
		ctaAddTextColor: BAGHERA_PALETTE.cream,
	};
};

/**
 * 🛒 CART/ORDER TOKENS BAGHERA — Phase 3.4
 *
 * Tokens des écrans Cart + OrderScreen (récap commande, items, footer).
 *
 * @param {string} styleKey
 * @returns {object|null}
 */
export const getOrderBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		// === CONTAINER ===
		containerBackground: BAGHERA_PALETTE.cream,
		emptyTextColor: BAGHERA_PALETTE.smoke,

		// === HEADER ===
		headerTitleColor: BAGHERA_PALETTE.ink,
		headerBackIconColor: BAGHERA_PALETTE.ink,

		// === SUMMARY (récap article + date + prix) ===
		summaryTextColor: BAGHERA_PALETTE.ink,
		summaryDateColor: BAGHERA_PALETTE.smoke,
		summaryPriceColor: BAGHERA_PALETTE.ember,

		// === CARD PRODUIT ===
		cardBackground: BAGHERA_PALETTE.creamSoft,
		cardBorderOverride: { borderWidth: 1, borderColor: BAGHERA_PALETTE.sand },
		productNameColor: BAGHERA_PALETTE.ink,
		productPriceColor: BAGHERA_PALETTE.ember,

		// === FOOTER (boutons pay/cancel) ===
		footerBackground: BAGHERA_PALETTE.cream,
		payBtnBackground: BAGHERA_PALETTE.ember,
		payBtnTextColor: BAGHERA_PALETTE.cream,
		cancelBtnBorderColor: BAGHERA_PALETTE.sand,
		cancelBtnTextColor: BAGHERA_PALETTE.smoke,
	};
};

/**
 * 💳 PAYMENT TOKENS BAGHERA — Phase 3.5
 *
 * Tokens du PaymentScreen (récap paiement, méthodes, modal Stripe).
 *
 * @param {string} styleKey
 * @returns {object|null}
 */
export const getPaymentBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		// === CONTAINER ===
		background: BAGHERA_PALETTE.cream,

		// === HEADER ===
		titleColor: BAGHERA_PALETTE.ink,
		subtitleColor: BAGHERA_PALETTE.smoke,

		// === ITEMS LISTE ===
		itemBackground: BAGHERA_PALETTE.creamSoft,
		itemBorderColor: BAGHERA_PALETTE.sand,
		itemTextColor: BAGHERA_PALETTE.ink,
		itemPriceColor: BAGHERA_PALETTE.ember,

		// === MÉTHODES PAIEMENT (toggles) ===
		methodActiveBackground: BAGHERA_PALETTE.ink,
		methodActiveTextColor: BAGHERA_PALETTE.cream,
		methodInactiveBackground: BAGHERA_PALETTE.creamSoft,
		methodInactiveBorderColor: BAGHERA_PALETTE.sand,
		methodInactiveTextColor: BAGHERA_PALETTE.smoke,

		// === CTA PAYER ===
		payCtaBackground: BAGHERA_PALETTE.ember,
		payCtaTextColor: BAGHERA_PALETTE.cream,

		// === MODAL STRIPE (web) — override card + title + subtitle ===
		modalCardOverride: {
			backgroundColor: BAGHERA_PALETTE.creamSoft,
			borderColor: BAGHERA_PALETTE.sand,
		},
		modalTitleOverride: { color: BAGHERA_PALETTE.ink },
		modalSubtitleOverride: { color: BAGHERA_PALETTE.smoke },
	};
};

export default BAGHERA_THEME;
