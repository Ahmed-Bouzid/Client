/**
 * ═══════════════════════════════════════════════════════════════
 * WelcomeScreenBaghera.jsx — Phase 3.2 (démo client 13 mai 2026)
 * ═══════════════════════════════════════════════════════════════
 *
 * Welcome screen autonome pour le tenant BAGHERA (brunch premium Marseille).
 * Mirror du site Next.js déployé : https://baghera-iota.vercel.app
 *
 * Design :
 *  - Background cream (#F4ECDF) — pas d'image hero plein écran (l'image est
 *    réservée à un cadre signature plus bas)
 *  - Wordmark typographique "Baghera." en Instrument Serif géant (PAS de logo image)
 *  - Sous-titre Inter "Le brunch comme un art de vivre"
 *  - Section signature image hero-brunch.jpg en cadre arrondi
 *  - Input nom (cream-soft, bordure sand)
 *  - 2 CTA : "Commander" (ember plein) + "Réserver" (outline ink)
 *
 * Pattern :
 *  - Composant autonome (pas de spread d'animations parent comme Grillz)
 *  - Props minimales : tableNumber, name, setName, error, loading, onJoin handlers
 *  - Tokens via getWelcomeBagheraTokens (pure function, branchée styleKey='baghera')
 *  - Fonts chargées en local via Font.loadAsync (Instrument Serif + Inter)
 *  - Animations légères : fadeIn + slideUp wordmark (pas de complexité Grillz)
 *
 * ⚠️ Iso-strict avec WelcomeScreen.jsx parent :
 *  - Reçoit handlers (handleNewSession, handleResumeSession) inchangés
 *  - Pas de modification du flow de session existant
 *  - Existing session card supportée (reprise commande)
 */

import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Animated,
	StatusBar,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Font from "expo-font";

import {
	BAGHERA_PALETTE,
	BAGHERA_FONTS,
	getWelcomeBagheraTokens,
} from "../theme/bagheraTheme";
import { getRestaurantAssetsByStyleKey } from "../utils/restaurantAssets";

const HERO_IMAGE = require("../../assets/baghera/hero-brunch.jpg");
const LOGO_IMAGE = require("../../assets/baghera/logo.png");

export default function WelcomeScreenBaghera({
	tableNumber = null,
	name = "",
	setName = () => {},
	loading = false,
	error = "",
	existingSession = null,
	handleResumeSession = () => {},
	handleNewSession = () => {},
	handleContinueWithEmail = () => {},
	handleClearStorage = () => {},
}) {
	const tokens = getWelcomeBagheraTokens("baghera") || {};
	const bagheraConfig = getRestaurantAssetsByStyleKey("baghera");

	const [fontsLoaded, setFontsLoaded] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;

	// 🔤 Charger les polices Baghera (Instrument Serif + Inter)
	useEffect(() => {
		const loadFonts = async () => {
			try {
				await Font.loadAsync({
					[BAGHERA_FONTS.serif]: bagheraConfig.font.file,
					[BAGHERA_FONTS.serifItalic]: bagheraConfig.fontItalic.file,
					[BAGHERA_FONTS.sans]: bagheraConfig.fontSans.file,
					[BAGHERA_FONTS.sansItalic]: bagheraConfig.fontSansItalic.file,
				});
				setFontsLoaded(true);
			} catch (err) {
				console.warn("[WelcomeScreenBaghera] Fonts load error:", err);
				setFontsLoaded(false); // Fallback System
			}
		};
		loadFonts();
	}, []);

	// 🎬 Animations d'entrée (fade + slide subtil)
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 700,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 700,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	// 🔘 Press handlers
	const handleCommanderPress = () => {
		if (!name.trim()) {
			Alert.alert("Votre prénom", "Merci d'entrer votre prénom pour commencer.");
			return;
		}
		handleContinueWithEmail();
	};

	const handleReserverPress = () => {
		Alert.alert(
			"Réservation",
			"La réservation en ligne sera disponible très prochainement. Pour réserver, contactez-nous au 04 XX XX XX XX.",
			[{ text: "OK" }]
		);
	};

	// Style du wordmark : font family seulement si chargée (sinon System fallback)
	const wordmarkFontStyle = fontsLoaded
		? { fontFamily: BAGHERA_FONTS.serif }
		: { fontWeight: "300" };
	const sansFontStyle = fontsLoaded
		? { fontFamily: BAGHERA_FONTS.sans }
		: {};

	return (
		<KeyboardAvoidingView
			style={[styles.root, { backgroundColor: tokens.canvasBackground }]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<StatusBar
				translucent
				backgroundColor="transparent"
				barStyle="dark-content"
			/>

			{/* Clear button (debug) — top-right */}
			<TouchableOpacity
				style={styles.clearButton}
				onPress={handleClearStorage}
				activeOpacity={0.7}
			>
				<Ionicons name="trash-outline" size={16} color={BAGHERA_PALETTE.smoke} />
			</TouchableOpacity>

			{/* Resume session card (si session active) */}
			{existingSession && (
				<View style={styles.resumeCard}>
					<View style={styles.resumeHeader}>
						<Ionicons name="refresh" size={22} color={BAGHERA_PALETTE.ember} />
						<View style={styles.resumeTextWrap}>
							<Text style={[styles.resumeTitle, sansFontStyle]}>
								Session en cours
							</Text>
							<Text style={[styles.resumeSubtitle, sansFontStyle]}>
								Reprendre la commande de{" "}
								<Text style={{ fontWeight: "700" }}>
									{existingSession.clientName}
								</Text>{" "}
								?
							</Text>
						</View>
					</View>
					<View style={styles.resumeButtons}>
						<TouchableOpacity
							style={[
								styles.resumeBtn,
								{ backgroundColor: BAGHERA_PALETTE.ember },
							]}
							onPress={handleResumeSession}
							activeOpacity={0.85}
						>
							<Text
								style={[
									styles.resumeBtnText,
									sansFontStyle,
									{ color: BAGHERA_PALETTE.cream },
								]}
							>
								Reprendre
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.resumeBtn,
								styles.resumeBtnSecondary,
								{ borderColor: BAGHERA_PALETTE.ink },
							]}
							onPress={handleNewSession}
							activeOpacity={0.85}
						>
							<Text
								style={[
									styles.resumeBtnText,
									sansFontStyle,
									{ color: BAGHERA_PALETTE.ink },
								]}
							>
								Nouvelle session
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}

			{/* Main content */}
			<Animated.View
				style={[
					styles.content,
					{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
				]}
			>
				{/* Wordmark "Baghera." avec logo en filigrane derrière */}
				<View style={styles.wordmarkWrap}>
					<Image
						source={LOGO_IMAGE}
						style={styles.logoBackdrop}
						resizeMode="contain"
					/>
					<Text
						style={[
							styles.wordmark,
							wordmarkFontStyle,
							{
								color: tokens.wordmarkColor,
								letterSpacing: tokens.wordmarkLetterSpacing,
							},
						]}
					>
						Bag<Text style={{ color: tokens.ctaPrimaryBackground }}>h</Text>era<Text style={{ color: tokens.ctaPrimaryBackground }}>.</Text>
					</Text>
				</View>

				{/* Sous-titre */}
				<Text
					style={[
						styles.subtitle,
						sansFontStyle,
						{ color: tokens.subtitleColor },
					]}
				>
					Le brunch comme un art de vivre
				</Text>

				{/* Hero image (cadre signature) */}
				<View style={styles.heroFrame}>
					<Image
						source={HERO_IMAGE}
						style={styles.heroImage}
						resizeMode="cover"
					/>
				</View>

				{/* Table number badge (si présent) */}
				{tableNumber && (
					<View style={styles.tableBadge}>
						<Ionicons
							name="restaurant-outline"
							size={14}
							color={BAGHERA_PALETTE.smoke}
						/>
						<Text style={[styles.tableBadgeText, sansFontStyle]}>
							Table {tableNumber}
						</Text>
					</View>
				)}

				{/* Input nom */}
				<View style={styles.inputWrap}>
					<Ionicons
						name="person-outline"
						size={18}
						color={tokens.inputIconColor}
						style={styles.inputIcon}
					/>
					<TextInput
						style={[
							styles.input,
							sansFontStyle,
							{
								backgroundColor: tokens.inputBackground,
								borderColor: tokens.inputBorderColor,
								color: tokens.inputTextColor,
							},
						]}
						placeholder="Votre prénom"
						placeholderTextColor={tokens.inputPlaceholderColor}
						value={name}
						onChangeText={setName}
						autoCapitalize="words"
						autoCorrect={false}
						maxLength={30}
					/>
				</View>

				{/* Error message */}
				{error ? (
					<Text style={[styles.error, sansFontStyle, { color: tokens.errorTextColor }]}>
						{error}
					</Text>
				) : null}

				{/* CTA Commander (ember plein) */}
				<TouchableOpacity
					style={[
						styles.ctaPrimary,
						{ backgroundColor: tokens.ctaPrimaryBackground },
						loading && { opacity: 0.6 },
					]}
					onPress={handleCommanderPress}
					activeOpacity={0.85}
					disabled={loading}
				>
					<Text
						style={[
							styles.ctaPrimaryText,
							sansFontStyle,
							{ color: tokens.ctaPrimaryTextColor },
						]}
					>
						{loading ? "Connexion…" : "Commander"}
					</Text>
				</TouchableOpacity>

				{/* CTA Réserver (outline ink) */}
				<TouchableOpacity
					style={[
						styles.ctaSecondary,
						{
							backgroundColor: tokens.ctaSecondaryBackground,
							borderColor: tokens.ctaSecondaryBorderColor,
						},
					]}
					onPress={handleReserverPress}
					activeOpacity={0.85}
				>
					<Text
						style={[
							styles.ctaSecondaryText,
							sansFontStyle,
							{ color: tokens.ctaSecondaryTextColor },
						]}
					>
						Réserver
					</Text>
				</TouchableOpacity>

				{/* Footer signature (slow mornings) */}
				<Text style={[styles.footer, sansFontStyle, { color: BAGHERA_PALETTE.smoke }]}>
					Marseille · Slow mornings
				</Text>
			</Animated.View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 28,
	},
	clearButton: {
		position: "absolute",
		top: 50,
		right: 20,
		padding: 8,
		zIndex: 10,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "stretch",
		paddingTop: 12,
	},
	wordmarkWrap: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		marginTop: -20,
		marginBottom: 28,
		position: "relative",
	},
	logoBackdrop: {
		position: "absolute",
		width: 280,
		height: 140,
		opacity: 0.95,
		top: -19,
	},
	wordmark: {
		fontSize: 88,
		lineHeight: 96,
		textAlign: "center",
		marginBottom: 0,
	},
	logo: {
		width: 240,
		height: 120,
		alignSelf: "center",
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 17,
		lineHeight: 24,
		textAlign: "center",
		marginBottom: 28,
		fontStyle: "italic",
		letterSpacing: 0.2,
	},
	heroFrame: {
		width: "100%",
		height: 200,
		borderRadius: 18,
		overflow: "hidden",
		marginBottom: 24,
		backgroundColor: BAGHERA_PALETTE.sand,
	},
	heroImage: {
		width: "100%",
		height: "100%",
	},
	tableBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: BAGHERA_PALETTE.creamSoft,
		borderWidth: 1,
		borderColor: BAGHERA_PALETTE.sand,
		marginBottom: 16,
	},
	tableBadgeText: {
		fontSize: 12,
		color: BAGHERA_PALETTE.smoke,
		letterSpacing: 0.3,
	},
	inputWrap: {
		position: "relative",
		marginBottom: 8,
	},
	inputIcon: {
		position: "absolute",
		left: 16,
		top: 18,
		zIndex: 1,
	},
	input: {
		height: 54,
		borderRadius: 14,
		borderWidth: 1,
		paddingLeft: 44,
		paddingRight: 16,
		fontSize: 16,
	},
	error: {
		fontSize: 13,
		textAlign: "center",
		marginTop: 6,
		marginBottom: 4,
	},
	ctaPrimary: {
		height: 56,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 16,
		shadowColor: BAGHERA_PALETTE.ember,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 4,
	},
	ctaPrimaryText: {
		fontSize: 16,
		fontWeight: "600",
		letterSpacing: 0.3,
	},
	ctaSecondary: {
		height: 54,
		borderRadius: 14,
		borderWidth: 1.5,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 12,
	},
	ctaSecondaryText: {
		fontSize: 15,
		fontWeight: "500",
		letterSpacing: 0.3,
	},
	footer: {
		fontSize: 11,
		textAlign: "center",
		marginTop: 32,
		letterSpacing: 1.5,
		textTransform: "uppercase",
	},
	resumeCard: {
		position: "absolute",
		top: 60,
		left: 20,
		right: 20,
		backgroundColor: BAGHERA_PALETTE.creamSoft,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: BAGHERA_PALETTE.sand,
		zIndex: 5,
		shadowColor: BAGHERA_PALETTE.ink,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
	resumeHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		marginBottom: 12,
	},
	resumeTextWrap: {
		flex: 1,
	},
	resumeTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: BAGHERA_PALETTE.ink,
		marginBottom: 2,
	},
	resumeSubtitle: {
		fontSize: 13,
		color: BAGHERA_PALETTE.smoke,
	},
	resumeButtons: {
		flexDirection: "row",
		gap: 8,
	},
	resumeBtn: {
		flex: 1,
		height: 40,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	resumeBtnSecondary: {
		backgroundColor: "transparent",
		borderWidth: 1,
	},
	resumeBtnText: {
		fontSize: 13,
		fontWeight: "600",
	},
});
