/**
 * ═══════════════════════════════════════════════════════════════
 * WelcomeScreenBaghera.jsx — Charte officielle MAISONVNK
 * ═══════════════════════════════════════════════════════════════
 *
 * Welcome screen du tenant BAGHERA (Brunch - Marseille).
 * Applique à 100% la charte graphique officielle MAISONVNK.
 *
 * Design :
 *  - Background linen (#E0D8D1) — fond beige chaud de la charte
 *  - Logo cartoon centré (2 personnages portant l'assiette de pancakes)
 *  - Wordmark "BAGHERA" en Great Day (font signature charte)
 *  - Tagline "Brunch · Marseille" en Roboto Mono
 *  - Input fond blanc, bordure sage
 *  - CTA "Commander" terracotta (#915C4C) — CTA primaire charte
 *  - CTA "Réserver" outline espresso (#3E3236)
 *
 * Polices charte :
 *  - Great Day     → wordmark
 *  - Sans Black    → titres
 *  - Roboto Mono   → labels UI
 *  - Droid Sans    → body / input
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
	ScrollView,
	Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Font from "expo-font";

import {
	BAGHERA_PALETTE,
	BAGHERA_FONTS,
	getWelcomeBagheraTokens,
} from "../theme/bagheraTheme";
import { getRestaurantAssetsByStyleKey } from "../utils/restaurantAssets";
import { useClientTableStore } from "../stores/useClientTableStore";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

const CARTOON_LOGO = require("../../assets/baghera/baghera-logo.png");
const BB_LOGO = require("../../assets/baghera/bb-logo.png");

// ─────────────────────────────────────────────
// Calendrier minimaliste Baghera
// ─────────────────────────────────────────────
const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_NAMES = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function CalendarPicker({ selectedDate, onSelect, fontsLoaded }) {
	const today = new Date();
	today.setHours(0,0,0,0);
	const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

	const prevMonth = () => setView(v => {
		const d = new Date(v.year, v.month - 1, 1);
		return { year: d.getFullYear(), month: d.getMonth() };
	});
	const nextMonth = () => setView(v => {
		const d = new Date(v.year, v.month + 1, 1);
		return { year: d.getFullYear(), month: d.getMonth() };
	});

	// Build grid: cells = [null...] padding + days
	const firstDay = new Date(view.year, view.month, 1);
	// JS Sunday=0, we want Monday=0
	const startPad = (firstDay.getDay() + 6) % 7;
	const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
	const cells = Array(startPad).fill(null).concat(
		Array.from({ length: daysInMonth }, (_, i) => i + 1)
	);

	const isSelected = (d) => {
		if (!selectedDate || !d) return false;
		const s = new Date(selectedDate);
		return s.getFullYear() === view.year && s.getMonth() === view.month && s.getDate() === d;
	};
	const isPast = (d) => {
		if (!d) return false;
		const cell = new Date(view.year, view.month, d);
		return cell < today;
	};

	const f = (font) => fontsLoaded ? { fontFamily: font } : {};

	return (
		<View style={calStyles.cal}>
			{/* Header mois */}
			<View style={calStyles.header}>
				<TouchableOpacity onPress={prevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
					<Ionicons name="chevron-back" size={18} color={BAGHERA_PALETTE.espresso} />
				</TouchableOpacity>
				<Text style={[calStyles.monthLabel, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.espresso }]}>
					{MONTH_NAMES[view.month]} {view.year}
				</Text>
				<TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
					<Ionicons name="chevron-forward" size={18} color={BAGHERA_PALETTE.espresso} />
				</TouchableOpacity>
			</View>
			{/* Jours de la semaine */}
			<View style={calStyles.weekRow}>
				{DAY_NAMES.map(d => (
					<Text key={d} style={[calStyles.dayName, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>{d}</Text>
				))}
			</View>
			{/* Grille */}
			<View style={calStyles.grid}>
				{cells.map((d, i) => (
					<TouchableOpacity
						key={i}
						style={[
							calStyles.cell,
							isSelected(d) && calStyles.cellSelected,
							!d && { backgroundColor: 'transparent' },
						]}
						onPress={() => d && !isPast(d) && onSelect(new Date(view.year, view.month, d))}
						activeOpacity={d && !isPast(d) ? 0.7 : 1}
						disabled={!d || isPast(d)}
					>
						{d ? (
							<Text style={[
								calStyles.cellText,
								f(BAGHERA_FONTS.sans),
								isSelected(d) && { color: '#fff', fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined },
								isPast(d) && { color: BAGHERA_PALETTE.sage, opacity: 0.4 },
								!isSelected(d) && !isPast(d) && { color: BAGHERA_PALETTE.espresso },
							]}>{d}</Text>
						) : null}
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}

// ─────────────────────────────────────────────
// Sélecteur d'heure minimaliste
// ─────────────────────────────────────────────
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07 → 22
const MINUTES = ["00", "15", "30", "45"];

function TimePicker({ selectedTime, onSelect, fontsLoaded }) {
	const f = (font) => fontsLoaded ? { fontFamily: font } : {};
	const [selH, setSelH] = useState(null);
	const [selM, setSelM] = useState(null);

	useEffect(() => {
		if (selectedTime) {
			const [h, m] = selectedTime.split(":");
			if (h) setSelH(parseInt(h, 10));
			if (m) setSelM(m);
		}
	}, [selectedTime]);

	const pick = (h, m) => {
		const nh = h ?? selH;
		// Si on choisit une heure sans minute → défaut "00"
		const nm = m ?? selM ?? "00";
		if (m === null && selM === null) setSelM("00");
		if (nh !== null) {
			onSelect(`${String(nh).padStart(2,'0')}:${nm}`);
		}
	};

	return (
		<View style={calStyles.timePicker}>
			{/* Heures */}
			<View style={calStyles.timeCol}>
				<Text style={[calStyles.timeLabel, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>{t("Heure")}</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
				>
					{HOURS.map(h => (
						<TouchableOpacity
							key={h}
							style={[calStyles.timePill, selH === h && calStyles.timePillSelected]}
							onPress={() => { setSelH(h); pick(h, null); }}
							activeOpacity={0.7}
						>
							<Text style={[
								calStyles.timePillText,
								f(BAGHERA_FONTS.sans),
								selH === h ? { color: '#fff', fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined } : { color: BAGHERA_PALETTE.espresso },
							]}>{String(h).padStart(2,'0')}h</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>
			{/* Minutes */}
			<View style={[calStyles.timeCol, { marginTop: 10 }]}>
				<Text style={[calStyles.timeLabel, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>{t("Minutes")}</Text>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{MINUTES.map(m => (
						<TouchableOpacity
							key={m}
							style={[calStyles.timePill, selM === m && calStyles.timePillSelected, { flex: 1 }]}
							onPress={() => { setSelM(m); pick(null, m); }}
							activeOpacity={0.7}
						>
							<Text style={[
								calStyles.timePillText,
								f(BAGHERA_FONTS.sans),
								selM === m ? { color: '#fff', fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined } : { color: BAGHERA_PALETTE.espresso },
							]}>:{m}</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>
		</View>
	);
}

const calStyles = StyleSheet.create({
	cal: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 14,
		borderWidth: 1,
		borderColor: '#E0D8D1',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	navBtn: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#F5F1EE',
		alignItems: 'center',
		justifyContent: 'center',
	},
	monthLabel: {
		fontSize: 14,
		letterSpacing: 0.5,
	},
	weekRow: {
		flexDirection: 'row',
		marginBottom: 6,
	},
	dayName: {
		width: '14.28%',
		textAlign: 'center',
		fontSize: 11,
		letterSpacing: 0.5,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	cell: {
		width: '14.28%',
		aspectRatio: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
	},
	cellSelected: {
		backgroundColor: BAGHERA_PALETTE.espresso,
	},
	cellText: {
		fontSize: 13,
	},
	timePicker: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 14,
		borderWidth: 1,
		borderColor: '#E0D8D1',
	},
	timeCol: {
		gap: 8,
	},
	timeLabel: {
		fontSize: 10,
		letterSpacing: 1.5,
		textTransform: 'uppercase',
	},
	timePill: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#F5F1EE',
		alignItems: 'center',
	},
	timePillSelected: {
		backgroundColor: BAGHERA_PALETTE.espresso,
	},
	timePillText: {
		fontSize: 13,
	},
});

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
	const { t } = useTranslation();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const logoAnim = useRef(new Animated.Value(30)).current;
	const scrollRef = useRef(null);
	const [fontsLoaded, setFontsLoaded] = useState(false);
	const [inputModalVisible, setInputModalVisible] = useState(false);
	const floatingInputRef = useRef(null);

	// ── Réservation modale ──
	const { restaurantId: storeRestaurantId } = useClientTableStore();
	// Baghera a un ID fixe en BDD — fallback si le store n'est pas encore initialisé (hors QR code)
	const bagheraRestaurantId = getRestaurantAssetsByStyleKey("baghera")?.restaurantId;
	const restaurantId = storeRestaurantId || bagheraRestaurantId;
	const [reservModalVisible, setReservModalVisible] = useState(false);
	const [reservSuccess, setReservSuccess] = useState(false);
	const [reservLoading, setReservLoading] = useState(false);
	const [reservFormError, setReservFormError] = useState("");
	const [reservForm, setReservForm] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		nbPersonnes: "2",
		date: null,   // Date object
		time: "",     // "HH:MM"
		notes: "",
	});

	const resetReservModal = () => {
		setReservForm({ firstName: "", lastName: "", phone: "", email: "", nbPersonnes: "2", date: null, time: "", notes: "" });
		setReservFormError("");
		setReservSuccess(false);
		setReservLoading(false);
	};

	// 🔤 Charger les polices de la charte officielle (chargement individuel — 1 échec n'invalide pas les autres)
	useEffect(() => {
		const loadFonts = async () => {
			const fontMap = {
				[BAGHERA_FONTS.black]:    bagheraConfig.font.file,
				[BAGHERA_FONTS.mono]:     bagheraConfig.fontMono.file,
				[BAGHERA_FONTS.monoBold]: bagheraConfig.fontMonoBold.file,
				[BAGHERA_FONTS.day]:      bagheraConfig.fontDay.file,
				[BAGHERA_FONTS.dayBold]:  bagheraConfig.fontDayBold.file,
				[BAGHERA_FONTS.sans]:     bagheraConfig.fontSans.file,
				[BAGHERA_FONTS.sansBold]: bagheraConfig.fontSansBold.file,
			};
			await Promise.allSettled(
				Object.entries(fontMap).map(([family, file]) =>
					Font.loadAsync({ [family]: file })
						.catch((e) => { console.error(`[Baghera] ❌ Font FAILED: "${family}" →`, e?.message); })
				)
			);
			setFontsLoaded(true);
		};
		loadFonts();
	}, []);

	// 🎬 Animation entrée
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(logoAnim, {
				toValue: 0,
				tension: 60,
				friction: 10,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const handleCommanderPress = () => {
		if (!name.trim()) {
			Alert.alert(t("Votre prénom"), t("Merci d'entrer votre prénom pour commencer."));
			return;
		}
		handleContinueWithEmail();
	};

	const handleReserverPress = () => {
		resetReservModal();
		setReservModalVisible(true);
	};

	const handleSubmitReservation = async () => {
		const { firstName, lastName, phone, email, nbPersonnes, date, time, notes } = reservForm;
		if (!firstName.trim()) { setReservFormError("Prénom requis."); return; }
		if (!lastName.trim())  { setReservFormError("Nom requis."); return; }
		if (!phone.trim())    { setReservFormError("Téléphone requis."); return; }
		if (!email.trim())    { setReservFormError("Email requis."); return; }
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setReservFormError("Email invalide."); return; }
		if (!date)            { setReservFormError("Choisissez une date."); return; }
		if (!time)            { setReservFormError("Choisissez une heure."); return; }
		const isoDate = new Date(date).toISOString();
		if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
			setReservFormError(t("Heure invalide."));
			return;
		}
		const nb = parseInt(nbPersonnes, 10);
		if (isNaN(nb) || nb < 1 || nb > 50) {
			setReservFormError(t("Nombre de personnes invalide."));
			return;
		}
		setReservFormError("");
		setReservLoading(true);
		try {
			const res = await fetch(`${API_CONFIG.BASE_URL}/reservations/online`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					phone: phone.trim(),
					email: email.trim(),
					nbPersonnes: nb,
					reservationDate: isoDate,
					reservationTime: time.trim(),
					restaurantId,
					notes: notes.trim(),
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				// Les erreurs de validation arrivent dans data.errors (array) ou data.message
				const msg = data.message ||
					(data.errors && data.errors.map(e => e.message).join(" ")) ||
					t("Une erreur est survenue.");
				setReservFormError(msg);
				return;
			}
			setReservSuccess(true);
		} catch (e) {
			setReservFormError(t("Impossible de contacter le serveur. Vérifiez votre connexion."));
		} finally {
			setReservLoading(false);
		}
	};

	// Font helpers
	const f = (font) => fontsLoaded ? { fontFamily: font } : {};

	return (
		<KeyboardAvoidingView
			style={[styles.root, { backgroundColor: tokens.canvasBackground }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 20}
		>
			<StatusBar
				translucent
				backgroundColor="transparent"
				barStyle="dark-content"
			/>

			{/* Debug clear */}
			<TouchableOpacity
				style={styles.clearButton}
				onPress={handleClearStorage}
				activeOpacity={0.6}
			>
				<Ionicons name="trash-outline" size={14} color={BAGHERA_PALETTE.sage} />
			</TouchableOpacity>

			<ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				keyboardDismissMode="interactive"
			>
				{/* ── Session active ── */}
				{existingSession && (
					<View style={styles.resumeCard}>
						<Ionicons name="refresh" size={20} color={BAGHERA_PALETTE.terracotta} />
						<View style={styles.resumeTextWrap}>
							<Text style={[styles.resumeTitle, f(BAGHERA_FONTS.sansBold)]}>
								t("Session en cours")
							</Text>
							<Text style={[styles.resumeSubtitle, f(BAGHERA_FONTS.sans)]}>
								Reprendre pour{" "}
								<Text style={{ fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined }}>
									{existingSession.clientName}
								</Text>{" "}?
							</Text>
						</View>
						<View style={styles.resumeButtons}>
							<TouchableOpacity
								style={[styles.resumeBtn, { backgroundColor: BAGHERA_PALETTE.terracotta }]}
								onPress={handleResumeSession}
								activeOpacity={0.85}
							>
								<Text style={[styles.resumeBtnText, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.linen }]}>
									{t("Reprendre")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.resumeBtn, styles.resumeBtnSecondary, { borderColor: BAGHERA_PALETTE.espresso }]}
								onPress={handleNewSession}
								activeOpacity={0.85}
							>
								<Text style={[styles.resumeBtnText, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso }]}>
									{t("Nouvelle session")}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				<Animated.View
					style={[
						styles.content,
						{ opacity: fadeAnim, transform: [{ translateY: logoAnim }] },
					]}
				>
					{/* ── Logo cartoon officiel ── */}
					<View style={styles.logoWrap}>
						<Image
							source={CARTOON_LOGO}
							style={styles.cartoonLogo}
							resizeMode="contain"
						/>
					</View>

{/* ── Wordmark BB-logo (temporairement masqué — déjà dans baghera-logo) */}
				{/* <Image source={BB_LOGO} style={styles.wordmarkImage} resizeMode="contain" /> */}

					{/* ── Tagline (Roboto Mono) ── */}
					<Text style={[styles.tagline, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>
						Brunch · Marseille
					</Text>

					{/* ── Badge table ── */}
					{tableNumber && (
						<View style={styles.tableBadge}>
							<Ionicons name="restaurant-outline" size={13} color={BAGHERA_PALETTE.sage} />
							<Text style={[styles.tableBadgeText, f(BAGHERA_FONTS.mono)]}>
								Table {tableNumber}
							</Text>
						</View>
					)}

					{/* ── Séparateur ── */}
					<View style={styles.divider} />

					{/* ── Input prénom — zone fantôme (tap → modal flottant) ── */}
				<TouchableOpacity
					style={[styles.inputWrap, { backgroundColor: tokens.inputBackground, borderColor: tokens.inputBorderColor }]}
					onPress={() => setInputModalVisible(true)}
					activeOpacity={1}
				>
					<Ionicons name="person-outline" size={17} color={BAGHERA_PALETTE.sage} style={styles.inputIcon} />
					<Text style={[styles.input, f(BAGHERA_FONTS.sans), { color: name ? tokens.inputTextColor : tokens.inputPlaceholderColor }]}>
						{name || t("Votre prénom")}
					</Text>
				</TouchableOpacity>

					{/* ── Erreur ── */}
					{error ? (
						<Text style={[styles.error, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.terracotta }]}>
							{error}
						</Text>
					) : null}

					{/* ── CTA Commander ── */}
					<TouchableOpacity
						style={[
							styles.ctaPrimary,
							{ backgroundColor: BAGHERA_PALETTE.espresso },
							loading && { opacity: 0.6 },
						]}
						onPress={handleCommanderPress}
						activeOpacity={0.85}
						disabled={loading}
					>
						<Text style={[styles.ctaPrimaryText, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.linen }]}>
							{loading ? t("Connexion…") : t("Commander")}
						</Text>
					</TouchableOpacity>

					{/* ── CTA Réserver (outline linen) ── */}
					<TouchableOpacity
						style={[
							styles.ctaSecondary,
							{ borderColor: BAGHERA_PALETTE.linen, backgroundColor: "rgba(224, 216, 209, 0.15)" },
						]}
						onPress={handleReserverPress}
						activeOpacity={0.85}
					>
						<Text style={[styles.ctaSecondaryText, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.linen }]}>
							{t("Réserver")}
						</Text>
					</TouchableOpacity>

					{/* ── Valeurs de la marque (Roboto Mono) ── */}
					<Text style={[styles.values, f(BAGHERA_FONTS.mono), { color: "#E0D8D1" }]}>
						DU FAIT MAISON - DE LA GÉNÉROSITÉ - DU PARTAGE
					</Text>
					<LanguageSwitcher style={styles.langSwitcher} compact />
				</Animated.View>
			</ScrollView>

			{/* ── Modal input flottant ── */}
			<Modal
				visible={inputModalVisible}
				transparent
				animationType="none"
				onRequestClose={() => setInputModalVisible(false)}
			>
				<KeyboardAvoidingView
					style={styles.floatingModalContainer}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					keyboardVerticalOffset={0}
				>
					{/* Zone tap pour fermer — transparente, l'écran en dessous reste visible */}
					<TouchableOpacity
						style={styles.floatingBackdrop}
						activeOpacity={1}
						onPress={() => setInputModalVisible(false)}
					/>
					{/* Input flottant — même style exact que le fantôme */}
					<View style={[styles.inputWrap, styles.floatingInput, { backgroundColor: tokens.inputBackground, borderColor: tokens.inputBorderColor }]}>
						<Ionicons name="person-outline" size={17} color={BAGHERA_PALETTE.sage} style={styles.inputIcon} />
						<TextInput
							ref={floatingInputRef}
							style={[styles.input, f(BAGHERA_FONTS.sans), { color: tokens.inputTextColor }]}
							placeholder={t("Votre prénom")}
							placeholderTextColor={tokens.inputPlaceholderColor}
							value={name}
							onChangeText={setName}
							autoCapitalize="words"
							autoCorrect={false}
							maxLength={30}
							autoFocus
							onSubmitEditing={() => setInputModalVisible(false)}
							returnKeyType="done"
						/>
					</View>
				</KeyboardAvoidingView>
			</Modal>

		{/* ── Modale Réservation ── */}
		<Modal
			visible={reservModalVisible}
			transparent
			animationType="slide"
			onRequestClose={() => { setReservModalVisible(false); resetReservModal(); }}
		>
			<View style={styles.reservBackdrop}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.reservSheet}
				>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.reservScrollContent}
					>
						{/* ── Header ── */}
						<View style={styles.reservHeader}>
							<Text style={[styles.reservTitle, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.espresso }]}>
								{t("Réservation")}
							</Text>
							<TouchableOpacity
								onPress={() => { setReservModalVisible(false); resetReservModal(); }}
								activeOpacity={0.7}
								style={styles.reservCloseBtn}
							>
								<Ionicons name="close" size={22} color={BAGHERA_PALETTE.espresso} />
							</TouchableOpacity>
						</View>

						{reservSuccess ? (
							/* ── Confirmation ── */
							<View style={styles.reservSuccessWrap}>
								<Ionicons name="checkmark-circle" size={56} color={BAGHERA_PALETTE.terracotta} />
								<Text style={[styles.reservSuccessTitle, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.espresso }]}>
									{t("Confirmée")} !
								</Text>
								<Text style={[styles.reservSuccessBody, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.sage }]}>
									Nous avons bien reçu votre demande pour{" "}
									<Text style={{ fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined, color: BAGHERA_PALETTE.espresso }}>
										{reservForm.nbPersonnes} personne{parseInt(reservForm.nbPersonnes, 10) > 1 ? "s" : ""}
									</Text>
									{" "}le{" "}
									<Text style={{ fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined, color: BAGHERA_PALETTE.espresso }}>
									{reservForm.date ? new Date(reservForm.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ""}
									</Text>
									{" "}à{" "}
									<Text style={{ fontFamily: fontsLoaded ? BAGHERA_FONTS.sansBold : undefined, color: BAGHERA_PALETTE.espresso }}>
										{reservForm.time}
									</Text>
									.{"\n\n"}Nous vous contacterons par téléphone pour confirmer.
								</Text>
								<TouchableOpacity
									style={[styles.reservSubmitBtn, { backgroundColor: BAGHERA_PALETTE.espresso, marginTop: 24 }]}
									onPress={() => { setReservModalVisible(false); resetReservModal(); }}
									activeOpacity={0.85}
								>
									<Text style={[styles.reservSubmitText, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.linen }]}>
										{t("Fermer")}
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							/* ── Formulaire ── */
							<View style={styles.reservForm}>
								{/* Prénom + Nom */}
								<View style={styles.reservRow}>
									<View style={[styles.reservInputWrap, { flex: 1, marginRight: 8 }]}>
										<TextInput
											style={[styles.reservInput, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso }]}
											placeholder={t("Prénom *")}
											placeholderTextColor={BAGHERA_PALETTE.sage}
											value={reservForm.firstName}
											onChangeText={(v) => setReservForm((p) => ({ ...p, firstName: v }))}
											autoCapitalize="words"
											autoCorrect={false}
											maxLength={40}
										/>
									</View>
									<View style={[styles.reservInputWrap, { flex: 1 }]}>
										<TextInput
											style={[styles.reservInput, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso }]}
											placeholder={t("Nom *")}
											placeholderTextColor={BAGHERA_PALETTE.sage}
											value={reservForm.lastName}
											onChangeText={(v) => setReservForm((p) => ({ ...p, lastName: v }))}
											autoCapitalize="words"
											autoCorrect={false}
											maxLength={40}
										/>
									</View>
								</View>

								{/* Téléphone */}
								<View style={styles.reservInputWrap}>
									<Ionicons name="call-outline" size={16} color={BAGHERA_PALETTE.sage} style={styles.reservInputIcon} />
									<TextInput
										style={[styles.reservInput, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso }]}
										placeholder={t("Téléphone *")}
										placeholderTextColor={BAGHERA_PALETTE.sage}
										value={reservForm.phone}
										onChangeText={(v) => setReservForm((p) => ({ ...p, phone: v }))}
										keyboardType="phone-pad"
										maxLength={20}
									/>
								</View>

							{/* Email */}
							<View style={styles.reservInputWrap}>
								<Ionicons name="mail-outline" size={16} color={BAGHERA_PALETTE.sage} style={styles.reservInputIcon} />
								<TextInput
									style={[styles.reservInput, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso }]}
									placeholder={t("Email *")}
									placeholderTextColor={BAGHERA_PALETTE.sage}
									value={reservForm.email}
									onChangeText={(v) => setReservForm((p) => ({ ...p, email: v }))}
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
									maxLength={100}
								/>
							</View>

							{/* Calendrier */}
							<View>
								<Text style={[styles.reservFieldLabel, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>{t("DATE *")}</Text>
								<CalendarPicker
									selectedDate={reservForm.date}
									onSelect={(d) => setReservForm((p) => ({ ...p, date: d }))}
									fontsLoaded={fontsLoaded}
								/>
							</View>

							{/* Heure */}
							<View>
								<Text style={[styles.reservFieldLabel, f(BAGHERA_FONTS.mono), { color: BAGHERA_PALETTE.sage }]}>{t("HEURE *")}</Text>
								<TimePicker
									selectedTime={reservForm.time}
									onSelect={(t) => setReservForm((p) => ({ ...p, time: t }))}
									fontsLoaded={fontsLoaded}
								/>
								</View>

								{/* Notes (optionnel) */}
								<View style={[styles.reservInputWrap, { minHeight: 72, alignItems: "flex-start", paddingTop: 12 }]}>
									<TextInput
										style={[styles.reservInput, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.espresso, textAlignVertical: "top" }]}
										placeholder={t("Notes (allergie, occasion spéciale…)")}
										placeholderTextColor={BAGHERA_PALETTE.sage}
										value={reservForm.notes}
										onChangeText={(v) => setReservForm((p) => ({ ...p, notes: v }))}
										multiline
										maxLength={200}
									/>
								</View>

								{/* Erreur */}
								{reservFormError ? (
									<Text style={[styles.reservError, f(BAGHERA_FONTS.sans), { color: BAGHERA_PALETTE.terracotta }]}>
										{reservFormError}
									</Text>
								) : null}

								{/* Submit */}
								<TouchableOpacity
									style={[styles.reservSubmitBtn, { backgroundColor: BAGHERA_PALETTE.espresso }, reservLoading && { opacity: 0.6 }]}
									onPress={handleSubmitReservation}
									activeOpacity={0.85}
									disabled={reservLoading}
								>
									<Text style={[styles.reservSubmitText, f(BAGHERA_FONTS.sansBold), { color: BAGHERA_PALETTE.linen }]}>
										{reservLoading ? t("Envoi en cours…") : t("Confirmer la réservation")}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</Modal>

	</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: "center",
		paddingTop: 60,
		paddingBottom: 40,
		paddingHorizontal: 24,
	},
	clearButton: {
		position: "absolute",
		top: 52,
		right: 20,
		zIndex: 10,
		padding: 8,
	},

	// ── Resume session ──
	resumeCard: {
		width: "100%",
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 16,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#E0D8D1",
		shadowColor: "#3E3236",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
		gap: 12,
	},
	resumeTextWrap: { flex: 1, marginLeft: 10 },
	resumeTitle: {
		fontSize: 14,
		color: "#3E3236",
	},
	resumeSubtitle: {
		fontSize: 13,
		color: "#9C9977",
		marginTop: 2,
	},
	resumeButtons: {
		flexDirection: "row",
		gap: 10,
	},
	resumeBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	resumeBtnSecondary: {
		backgroundColor: "transparent",
		borderWidth: 1,
	},
	resumeBtnText: {
		fontSize: 13,
	},

	// ── Main content ──
	content: {
		width: "100%",
		alignItems: "center",
	},

	// ── Logo cartoon ──
	logoWrap: {
		marginBottom: 8,
	},
	cartoonLogo: {
		width: 400,
		height: 400,
	},

	// ── Wordmark image ──
	wordmarkImage: {
		width: 280,
		height: 100,
		marginTop: 4,
	},

	// ── Tagline ──
	tagline: {
		fontSize: 13,
		textAlign: "center",
		letterSpacing: 2,
		marginTop: 6,
		textTransform: "uppercase",
	},

	// ── Table badge ──
	tableBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		marginTop: 12,
		backgroundColor: "#fff",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#E0D8D1",
	},
	tableBadgeText: {
		fontSize: 12,
		color: "#9C9977",
		letterSpacing: 1,
	},

	// ── Divider ──
	divider: {
		width: 48,
		height: 2,
		backgroundColor: "rgba(224, 216, 209, 0.4)",
		borderRadius: 2,
		marginVertical: 28,
	},

	// ── Input ──
	inputWrap: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 16,
		marginBottom: 12,
	},
	inputIcon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 15,
	},

	// ── Modal flottant ──
	floatingModalContainer: {
		flex: 1,
		justifyContent: "flex-end",
	},
	floatingBackdrop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	floatingInput: {
		marginHorizontal: 24,
		marginBottom: 16,
		width: undefined,
	},

	// ── Error ──
	error: {
		fontSize: 13,
		marginBottom: 8,
		textAlign: "center",
	},

	// ── CTA Commander ──
	ctaPrimary: {
		width: "100%",
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
		marginBottom: 12,
		shadowColor: "#915C4C",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 4,
	},
	ctaPrimaryText: {
		fontSize: 16,
		letterSpacing: 0.5,
	},

	// ── CTA Réserver ──
	ctaSecondary: {
		width: "100%",
		paddingVertical: 15,
		borderRadius: 14,
		borderWidth: 1.5,
		alignItems: "center",
		marginBottom: 32,
	},
	ctaSecondaryText: {
		fontSize: 15,
	},

	// ── Valeurs ──
	values: {
		fontSize: 10,
		letterSpacing: 1.5,
		textAlign: "center",
		opacity: 0.7,
	},
	langSwitcher: {
		marginTop: 16,
		marginBottom: 4,
	},

	// ── Modale Réservation ──
	reservBackdrop: {
		flex: 1,
		backgroundColor: "rgba(62, 50, 54, 0.55)",
		justifyContent: "flex-end",
	},
	reservSheet: {
		backgroundColor: "#FAFAF8",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: "92%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.12,
		shadowRadius: 16,
		elevation: 12,
	},
	reservScrollContent: {
		padding: 24,
		paddingBottom: 40,
	},
	reservHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 24,
	},
	reservTitle: {
		fontSize: 18,
		letterSpacing: 0.3,
	},
	reservCloseBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#E0D8D1",
		alignItems: "center",
		justifyContent: "center",
	},
	reservForm: {
		gap: 12,
	},
	reservRow: {
		flexDirection: "row",
	},
	reservInputWrap: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E0D8D1",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 14,
	},
	reservInputIcon: {
		marginRight: 10,
	},
	reservInput: {
		flex: 1,
		fontSize: 14,
	},
	reservError: {
		fontSize: 13,
		textAlign: "center",
		marginTop: 4,
	},
	reservSubmitBtn: {
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
		marginTop: 8,
	},
	reservSubmitText: {
		fontSize: 16,
		letterSpacing: 0.5,
	},
	reservSuccessWrap: {
		alignItems: "center",
		paddingVertical: 24,
	},
	reservSuccessTitle: {
		fontSize: 20,
		marginTop: 16,
		marginBottom: 12,
	},
	reservSuccessBody: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 22,
	},
	reservFieldLabel: {
		fontSize: 10,
		letterSpacing: 1.5,
		textTransform: "uppercase",
		marginBottom: 8,
	},
});
