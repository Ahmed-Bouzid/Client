/**
 * 🎨 BAGHERA THEME — Charte officielle MAISONVNK
 *
 * Source de vérité : Charte graphique Baghera (Brunch - Marseille)
 * Design : MAISONVNK
 *
 * Identité : Authenticité · Gourmandise · Convivialité · Fait maison
 *            Générosité · Modernité · Chaleur · Partage · Rires
 *
 * Style : dessins animés old school, trait brush, branding décalé
 * Logo  : illustration cartoon (2 personnages portant assiette géante)
 *
 * Polices officielles :
 *  - Sans Black    → Titres (majuscules épaisses et arrondies)
 *  - Roboto Mono   → Titres UI & sous-titres
 *  - Great Day     → Wordmark / mots clés / accents
 *  - Droid Sans    → Paragraphes / body
 */

// =============================================================================
// 🎨 PALETTE — Charte officielle
// =============================================================================
export const BAGHERA_PALETTE = {
	// ── COULEURS PRINCIPALES ──
	olive:      "#4F4D3D", // fond sombre, overlays
	slate:      "#AFBEC8", // bleu ardoise, badges froids
	espresso:   "#3E3236", // texte principal
	terracotta: "#915C4C", // CTA primaire, accents chauds
	linen:      "#E0D8D1", // background principal

	// ── COULEURS SECONDAIRES ──
	sage:   "#9C9977", // texte secondaire, meta, séparateurs
	salmon: "#BA806A", // hover CTA
	amber:  "#E0AB60", // prix, badges signature, accents dorés

	// ── UTILITAIRES ──
	white:     "#FFFFFF",
	nearBlack: "#1A1614",
};

// =============================================================================
// 🔤 FONTS BAGHERA — Charte officielle
// =============================================================================
export const BAGHERA_FONTS = {
	black:    "SansBlack",          // titres h1
	mono:     "RobotoMono-Regular", // UI labels, sous-titres
	monoBold: "RobotoMono-Bold",    // titres forts
	day:      "GreatDay",           // wordmark, accents
	dayBold:  "GreatDay-Bold",      // wordmark bold
	sans:     "DroidSans",          // body, paragraphes
	sansBold: "DroidSans-Bold",     // body gras
};

// =============================================================================
// 🎨 THEME OBJECT (compatible structure DEFAULT_THEME)
// =============================================================================
export const BAGHERA_THEME = {
	primary:    [BAGHERA_PALETTE.terracotta, BAGHERA_PALETTE.salmon],
	secondary:  [BAGHERA_PALETTE.linen, BAGHERA_PALETTE.linen],
	accent:     [BAGHERA_PALETTE.slate, BAGHERA_PALETTE.slate],
	gold:       [BAGHERA_PALETTE.amber, BAGHERA_PALETTE.salmon],
	success:    [BAGHERA_PALETTE.sage, BAGHERA_PALETTE.sage],
	warning:    [BAGHERA_PALETTE.amber, BAGHERA_PALETTE.amber],
	error:      [BAGHERA_PALETTE.terracotta, BAGHERA_PALETTE.terracotta],
	danger:     [BAGHERA_PALETTE.terracotta, BAGHERA_PALETTE.terracotta],
	dark:       [BAGHERA_PALETTE.espresso, BAGHERA_PALETTE.nearBlack],
	background: [BAGHERA_PALETTE.linen, BAGHERA_PALETTE.linen],
	smoke:      [BAGHERA_PALETTE.sage, BAGHERA_PALETTE.olive],
	fire:       [BAGHERA_PALETTE.terracotta, BAGHERA_PALETTE.salmon],
	ember:      [BAGHERA_PALETTE.terracotta, BAGHERA_PALETTE.salmon],
	orange:     BAGHERA_PALETTE.terracotta,
	rouge:      BAGHERA_PALETTE.terracotta,
	dore:       BAGHERA_PALETTE.amber,
	dark_bg:    BAGHERA_PALETTE.espresso,
	card:       BAGHERA_PALETTE.white,
	elevated:   BAGHERA_PALETTE.linen,
	card_dark:  BAGHERA_PALETTE.olive,
	text:           BAGHERA_PALETTE.espresso,
	textSecondary:  BAGHERA_PALETTE.olive,
	textMuted:      BAGHERA_PALETTE.sage,
	textAccent:     BAGHERA_PALETTE.terracotta,
	textInverse:    BAGHERA_PALETTE.linen,
	glass:       "rgba(224, 216, 209, 0.10)",
	glassBorder: "rgba(224, 216, 209, 0.25)",
	overlay:     "rgba(62, 50, 54, 0.80)",
	fireOverlay: "rgba(145, 92, 76, 0.18)",
	shadowColor: BAGHERA_PALETTE.espresso,
	fontRegular: BAGHERA_FONTS.sans,
	fontBold:    BAGHERA_FONTS.sansBold,
	fontSerif:   BAGHERA_FONTS.black,
};

// =============================================================================
// 🎯 HELPERS TOKENS
// =============================================================================

/**
 * 🌅 WELCOME TOKENS BAGHERA
 */
export const getWelcomeBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		canvasBackground:            BAGHERA_PALETTE.terracotta,
		wordmarkColor:               BAGHERA_PALETTE.espresso,
		wordmarkFontFamily:          BAGHERA_FONTS.black,
		wordmarkLetterSpacing:       2,
		taglineColor:                BAGHERA_PALETTE.linen,
		taglineFontFamily:           BAGHERA_FONTS.mono,
		ctaPrimaryBackground:        BAGHERA_PALETTE.espresso,
		ctaPrimaryTextColor:         BAGHERA_PALETTE.linen,
		ctaPrimaryPressedBackground: BAGHERA_PALETTE.nearBlack,
		ctaPrimaryFontFamily:        BAGHERA_FONTS.sansBold,
		ctaSecondaryBackground:      "transparent",
		ctaSecondaryBorderColor:     BAGHERA_PALETTE.linen,
		ctaSecondaryTextColor:       BAGHERA_PALETTE.linen,
		ctaSecondaryFontFamily:      BAGHERA_FONTS.sans,
		inputBackground:             BAGHERA_PALETTE.linen,
		inputBorderColor:            BAGHERA_PALETTE.linen,
		inputTextColor:              BAGHERA_PALETTE.espresso,
		inputIconColor:              BAGHERA_PALETTE.sage,
		inputPlaceholderColor:       BAGHERA_PALETTE.sage,
		inputFontFamily:             BAGHERA_FONTS.sans,
		errorTextColor:              BAGHERA_PALETTE.amber,
	};
};

/**
 * 🍽️ MENU TOKENS BAGHERA
 */
export const getMenuBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		background:              BAGHERA_PALETTE.linen,
		headerTitleColor:        BAGHERA_PALETTE.espresso,
		headerTitleFont:         BAGHERA_FONTS.black,
		headerSubtitleColor:     BAGHERA_PALETTE.sage,
		headerSubtitleFont:      BAGHERA_FONTS.mono,
		headerBackIconColor:     BAGHERA_PALETTE.espresso,
		tabActiveBackground:     BAGHERA_PALETTE.espresso,
		tabActiveTextColor:      BAGHERA_PALETTE.linen,
		tabInactiveBackground:   "transparent",
		tabInactiveTextColor:    BAGHERA_PALETTE.sage,
		tabInactiveBorderColor:  BAGHERA_PALETTE.sage,
		tabFontFamily:           BAGHERA_FONTS.mono,
		cardBackground:          BAGHERA_PALETTE.white,
		cardBorderColor:         BAGHERA_PALETTE.linen,
		cardShadowColor:         "rgba(62, 50, 54, 0.08)",
		productNameColor:        BAGHERA_PALETTE.espresso,
		productNameFontFamily:   BAGHERA_FONTS.sansBold,
		productDescriptionColor: BAGHERA_PALETTE.sage,
		productDescriptionFont:  BAGHERA_FONTS.sans,
		productPriceColor:       BAGHERA_PALETTE.amber,
		productPriceFontFamily:  BAGHERA_FONTS.mono,
		badgeSignatureBackground: BAGHERA_PALETTE.terracotta,
		badgeSignatureTextColor:  BAGHERA_PALETTE.linen,
		badgeVeggieBackground:    BAGHERA_PALETTE.sage,
		badgeVeggieTextColor:     BAGHERA_PALETTE.espresso,
		ctaAddBackground: BAGHERA_PALETTE.terracotta,
		ctaAddTextColor:  BAGHERA_PALETTE.linen,
		ctaAddFont:       BAGHERA_FONTS.sansBold,
	};
};

/**
 * 🛒 ORDER TOKENS BAGHERA
 */
export const getOrderBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		containerBackground: BAGHERA_PALETTE.linen,
		emptyTextColor:      BAGHERA_PALETTE.sage,
		headerTitleColor:    BAGHERA_PALETTE.espresso,
		headerTitleFont:     BAGHERA_FONTS.black,
		headerBackIconColor: BAGHERA_PALETTE.espresso,
		summaryTextColor:  BAGHERA_PALETTE.espresso,
		summaryDateColor:  BAGHERA_PALETTE.sage,
		summaryPriceColor: BAGHERA_PALETTE.amber,
		summaryPriceFont:  BAGHERA_FONTS.mono,
		cardBackground:    BAGHERA_PALETTE.white,
		cardBorderOverride: { borderWidth: 1, borderColor: BAGHERA_PALETTE.linen },
		productNameColor:  BAGHERA_PALETTE.espresso,
		productNameFont:   BAGHERA_FONTS.sansBold,
		productPriceColor: BAGHERA_PALETTE.amber,
		productPriceFont:  BAGHERA_FONTS.mono,
		footerBackground:     BAGHERA_PALETTE.linen,
		payBtnBackground:     BAGHERA_PALETTE.terracotta,
		payBtnTextColor:      BAGHERA_PALETTE.linen,
		payBtnFont:           BAGHERA_FONTS.sansBold,
		cancelBtnBorderColor: BAGHERA_PALETTE.sage,
		cancelBtnTextColor:   BAGHERA_PALETTE.sage,
	};
};

/**
 * 💳 PAYMENT TOKENS BAGHERA
 */
export const getPaymentBagheraTokens = (styleKey) => {
	if ((styleKey || "").toLowerCase() !== "baghera") return null;
	return {
		background:     BAGHERA_PALETTE.linen,
		titleColor:     BAGHERA_PALETTE.espresso,
		titleFont:      BAGHERA_FONTS.black,
		subtitleColor:  BAGHERA_PALETTE.sage,
		subtitleFont:   BAGHERA_FONTS.mono,
		itemBackground:  BAGHERA_PALETTE.white,
		itemBorderColor: BAGHERA_PALETTE.linen,
		itemTextColor:   BAGHERA_PALETTE.espresso,
		itemTextFont:    BAGHERA_FONTS.sans,
		itemPriceColor:  BAGHERA_PALETTE.amber,
		itemPriceFont:   BAGHERA_FONTS.mono,
		methodActiveBackground:    BAGHERA_PALETTE.espresso,
		methodActiveTextColor:     BAGHERA_PALETTE.linen,
		methodInactiveBackground:  BAGHERA_PALETTE.white,
		methodInactiveBorderColor: BAGHERA_PALETTE.sage,
		methodInactiveTextColor:   BAGHERA_PALETTE.sage,
		payCtaBackground: BAGHERA_PALETTE.terracotta,
		payCtaTextColor:  BAGHERA_PALETTE.linen,
		payCtaFont:       BAGHERA_FONTS.sansBold,
		modalCardOverride: {
			backgroundColor: BAGHERA_PALETTE.white,
			borderColor:     BAGHERA_PALETTE.linen,
		},
		modalTitleOverride:    { color: BAGHERA_PALETTE.espresso },
		modalSubtitleOverride: { color: BAGHERA_PALETTE.sage },
	};
};

export default BAGHERA_THEME;
