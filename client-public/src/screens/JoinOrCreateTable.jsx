import React, { useState, useRef, useEffect } from "react";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import useSocketClient from "../hooks/useSocketClient.js"; // ⚡ WebSocket pour orders
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Platform,
	Alert,
	Animated,
	Dimensions,
	StatusBar,
	Modal,
	TouchableWithoutFeedback,
	ImageBackground,
	ScrollView,
	Image,
	ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClientTableStore } from "../stores/useClientTableStore.js";
import { useRestaurantStore } from "../stores/useRestaurantStore.js";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";
import { buildSafeTheme, DEFAULT_THEME } from "../theme/defaultTheme";
import RNUUID from "react-native-uuid";

const { width, height } = Dimensions.get("window");

// 🎨 Mapping statique des images de fond custom (Metro ne supporte pas require() dynamique)
const CUSTOM_BACKGROUNDS = {
	"grillz-flyer.jpg": require("../../../assets/grillz-flyer.jpg"),
	// Ajouter ici d'autres images custom au fur et à mesure
};

export default function JoinOrCreateTable({
	tableId = null,
	tableNumber = null,
	onJoin = () => {},
}) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState([]);
	const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
	const [loading, setLoading] = useState(false);
	const [creatorName, setCreatorName] = useState(null);
	const [tableAvailable, setTableAvailable] = useState(null);

	const [orders, setOrders] = useState([]);
	const [reservationIdState, setReservationIdState] = useState(null);
	const [hasJoinedTable, setHasJoinedTable] = useState(false);
	const [restaurantLoaded, setRestaurantLoaded] = useState(false);

	// 🔄 Session reprise (re-scan QR) : si une session active existe pour cette table
	const [existingSession, setExistingSession] = useState(null); // { reservationId, clientName, clientId, tableNumber }


	// 🎨 Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const tableIconAnim = useRef(new Animated.Value(0)).current;
	const buttonScale = useRef(new Animated.Value(1)).current;
	const inputAnimations = useRef([
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
	]).current;

	// 📜 Ref pour le ScrollView
	const scrollViewRef = useRef(null);

	// 🔄 Key pour forcer unmount/remount COMPLET de la page (simule un reload)
	const [componentKey, setComponentKey] = useState(0);

	const { restaurantId } = useClientTableStore();
	const restaurantName = useRestaurantStore((state) => state.name);
	const category = useRestaurantStore((state) => state.category);
	const fetchRestaurantInfo = useRestaurantStore(
		(state) => state.fetchRestaurantInfo,
	);
	const isFoodtruck = category === "foodtruck";

	// 🎨 Config dynamique du restaurant (style depuis la BDD)
	const { config, loading: configLoading } = useRestaurantConfig(restaurantId);

	// 🚀 ARCHITECTURE 100% JSON-DRIVEN : Lecture des flags depuis config.style
	const useCustomBackground = config?.style?.useCustomBackground || false;

	// 🖼️ Image de fond : priorité à l'URL Cloudinary, sinon assets locaux
	const backgroundImageUrl = config?.style?.backgroundImageUrl;
	const backgroundImage = useCustomBackground
		? backgroundImageUrl
			? { uri: backgroundImageUrl } // URL Cloudinary
			: config?.style?.backgroundImage
				? CUSTOM_BACKGROUNDS[config.style.backgroundImage] || null // Asset local
				: null
		: null;

	// 🎨 Thème dynamique selon le restaurant — fallback neutre si config absente
	const theme = buildSafeTheme(config?.style, config?.styleKey);

	// �🎬 Entrance animations
	useEffect(() => {
		// Main fade in
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: false,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: false,
			}),
		]).start();

		// Table icon pulse
		Animated.loop(
			Animated.sequence([
				Animated.timing(tableIconAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: false,
				}),
				Animated.timing(tableIconAnim, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: false,
				}),
			]),
		).start();

		// Staggered input animations
		inputAnimations.forEach((anim, index) => {
			Animated.timing(anim, {
				toValue: 1,
				duration: 500,
				delay: 200 + index * 100,
				useNativeDriver: false,
			}).start();
		});
	}, []);

	// ⚡ WebSocket: Écouter les mises à jour d'orders (paiement) en temps réel
	const { on, off } = useSocketClient(restaurantId, tableId);

	useEffect(() => {
		if (!restaurantId || !tableId) return;

		const handleOrderUpdate = (payload) => {
			if (payload.type === "order_updated" && payload.data) {
				// Mettre à jour la commande dans le state local
				setOrders((prevOrders) =>
					prevOrders.map((order) =>
						order._id === payload.data._id ? payload.data : order,
					),
				);
			}
		};

		on("order", handleOrderUpdate);
		return () => off("order", handleOrderUpdate);
	}, [restaurantId, tableId, on, off]);

	// 🔄 SIMULE UN RELOAD COMPLET : Force unmount/remount de TOUTE la page
	// ⚡ Solution au bug "bande grise" : la redirection garde les composants en cache
	//    (LinearGradient, StatusBar, BlurView, etc.). Un reload les recrée de zéro.
	//    On applique la key au container root pour forcer un remount total.
	useEffect(() => {
		// Incrémenter la key → TOUT le composant détruit et recréé = état 100% propre
		setComponentKey((prev) => prev + 1);
	}, [orders.length, hasJoinedTable]); // Se déclenche quand on revient (orders change après paiement)

	// 🎨 Button press animation
	const handlePressIn = () => {
		Animated.spring(buttonScale, {
			toValue: 0.95,
			useNativeDriver: false,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(buttonScale, {
			toValue: 1,
			friction: 3,
			useNativeDriver: false,
		}).start();
	};

	// Le numéro de table est toujours récupéré via l'API
	const [tableNumberState, setTableNumberState] = useState("");
	const displayTableNumber = tableNumberState || "";

	// Récupère le numéro de table et les guests via la route publique uniquement
	useEffect(() => {
		async function fetchTableInfo() {
			if (!tableId) return;
			try {
				const urlGuests = `${API_CONFIG.BASE_URL}/client-tables/${tableId}/guests`;
				const resGuests = await fetch(urlGuests);
				let data;
				if (resGuests.ok) {
					const text = await resGuests.text();
					try {
						data = JSON.parse(text);
					} catch (e) {
						data = null;
					}
					if (data && data.number) {
						setTableNumberState(data.number);
					}
					if (typeof data.isAvailable === "boolean") {
						setTableAvailable(data.isAvailable);
					} else {
						setTableAvailable(null);
					}
					if (Array.isArray(data.guests)) {
						setParticipants(data.guests);
					} else {
						setParticipants([]);
					}
				} else {
					setParticipants([]);
					setTableAvailable(null);
				}
			} catch (e) {
				setParticipants([]);
				setTableAvailable(null);
			}
		}
		fetchTableInfo();
	}, [tableId, tableNumber]);

	// Récupère la reservationId depuis AsyncStorage (persistant après join)
	useEffect(() => {
		async function fetchReservationIdAndOrders() {
			let reservationId = reservationIdState;
			if (!reservationId) {
				reservationId = await AsyncStorage.getItem("currentReservationId");
				setReservationIdState(reservationId);
			}
			if (reservationId) {
				try {
					const res = await fetch(
						`${API_CONFIG.BASE_URL}/client-orders/${reservationId}`,
					);
					if (res.ok) {
						const data = await res.json();
						setOrders(Array.isArray(data.orders) ? data.orders : []);
					} else {
						setOrders([]);
					}
				} catch (e) {
					setOrders([]);
				}
			}
		}
		fetchReservationIdAndOrders();
	}, [reservationIdState]);

	// 🏪 Charger les infos restaurant au montage
	useEffect(() => {
		if (restaurantId) {
			fetchRestaurantInfo(restaurantId).then(() => {
				setRestaurantLoaded(true);
			});
		}
		// ⚠️ NE PAS mettre fetchRestaurantInfo dans les deps (cause boucle infinie)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [restaurantId]);

	// 🔄 Vérifier si une session active existe pour ce tableId (détection re-scan QR)
	useEffect(() => {
		if (!tableId) return;
		const checkExistingSession = async () => {
			try {
				const savedTableId = await AsyncStorage.getItem("currentTableId");
				const savedReservationId = await AsyncStorage.getItem("currentReservationId");
				const savedClientName = await AsyncStorage.getItem("currentClientName");
				const savedClientId = await AsyncStorage.getItem("currentClientId");
				const savedTableNumber = await AsyncStorage.getItem("currentTableNumber");

				// Session existante si : même table + reservationId sauvegardé + nom client
				if (savedTableId === tableId && savedReservationId && savedClientName) {
					setExistingSession({
						reservationId: savedReservationId,
						clientName: savedClientName,
						clientId: savedClientId,
						tableNumber: savedTableNumber,
					});
				} else {
					setExistingSession(null);
				}
			} catch (e) {
				setExistingSession(null);
			}
		};
		checkExistingSession();
	}, [tableId]);

	// ✅ Reprendre la session existante sans re-saisir le formulaire
	const handleResumeSession = () => {
		if (!existingSession) return;
		const { reservationId, clientName, clientId, tableNumber: savedTN } = existingSession;
		setExistingSession(null); // reset card
		onJoin?.(clientName, reservationId, tableId, savedTN || displayTableNumber, clientId);
	};


	const isInitialLoading = !restaurantId || configLoading || !restaurantLoaded;
	if (isInitialLoading) {
		return (
			<LinearGradient
				colors={DEFAULT_THEME.dark}
				style={styles.initialLoader}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<View style={styles.initialLoaderContent}>
					<ActivityIndicator size="large" color={DEFAULT_THEME.primary[0]} />
					<Text style={styles.initialLoaderText}>
						Chargement du restaurant...
					</Text>
				</View>
			</LinearGradient>
		);
	}

	// Table icon scale interpolation
	const tableIconScale = tableIconAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.1],
	});

	// ⭐ NOUVEAU : Récupérer le clientId depuis AsyncStorage ou en créer un
	const getOrCreateClientId = async () => {
		let clientId = await AsyncStorage.getItem("clientId");
		if (!clientId) {
			clientId = RNUUID.v4();
			await AsyncStorage.setItem("clientId", clientId);
		}
		return clientId;
	};

	const handleClearStorage = async () => {
		try {
			await AsyncStorage.clear();
			Alert.alert("✅ Succès", "AsyncStorage vidé ! Redémarrez l'app.", [
				{ text: "OK" },
			]);
		} catch (e) {
			Alert.alert("❌ Erreur", "Impossible de vider le storage");
		}
	};

	const handleJoin = async () => {
		if (!name.trim()) return setError("Veuillez entrer votre nom.");
		if (isFoodtruck && !phone.trim())
			return setError("Veuillez entrer votre numéro de téléphone.");
		if (!tableId) {
			console.error("❌ [JOIN] tableId manquant !");
			return setError("Table non identifiée.");
		}

		setLoading(true);
		setError("");

		try {
			// ⭐ Stocker tableId et pseudo
			await AsyncStorage.setItem("pseudo", name.trim());
			await AsyncStorage.setItem("tableId", tableId);
			if (isFoodtruck) {
				await AsyncStorage.setItem("clientPhone", phone.trim());
			}

			const clientId = await getOrCreateClientId();

			// Générer un token client simple pour les commandes
			const token = await clientAuthService.getClientToken(
				name.trim(),
				tableId,
				restaurantId,
				clientId,
			);

			const finalRestaurantId =
				restaurantId || (await AsyncStorage.getItem("restaurantId"));
			const body = {
				clientName: name.trim(),
				clientId: clientId,
				...(isFoodtruck && { clientPhone: phone.trim() }),
				tableId: tableId,
				restaurantId: finalRestaurantId,
				reservationDate: new Date().toISOString(),
				reservationTime: `${String(new Date().getHours()).padStart(
					2,
					"0",
				)}:${String(new Date().getMinutes()).padStart(2, "0")}`,
			};

			const response = await fetch(
				`${API_CONFIG.BASE_URL}/reservations/client/reservations`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				},
			);

			const text = await response.text();

			let data;
			try {
				data = JSON.parse(text);
			} catch {
				console.error("❌ [JOIN] Réponse non-JSON:", text);
				Alert.alert("Erreur", "Réponse serveur inattendue.");
				setLoading(false);
				return;
			}

			if (!response.ok) {
				console.error(
					"❌ [JOIN] Réponse non-OK:",
					response.status,
					data.message,
				);
				Alert.alert(
					"Erreur",
					data.message || "Erreur lors de la création de la réservation.",
				);
				setLoading(false);
				return;
			}

			const reservationObj = data.reservation || data;
			const reservationId = reservationObj._id;
			setReservationIdState(reservationId); // pour déclencher le fetch des commandes
			const guestsArr =
				data.guests ||
				(reservationObj.tableId && reservationObj.tableId.guests) ||
				[];
			setParticipants(guestsArr);
			const creatorName =
				guestsArr.length > 0 ? guestsArr[0] : data.creatorName || null;
			setCreatorName(creatorName || null);

			// LOG les guests reçus après join

			const tableObj =
				reservationObj.tableId && typeof reservationObj.tableId === "object"
					? reservationObj.tableId
					: reservationObj.table;
			const isAvailable =
				tableObj && typeof tableObj.isAvailable === "boolean"
					? tableObj.isAvailable
					: null;
			setTableAvailable(isAvailable);
			// LOG le statut de la table après join

			if (!tableNumber && tableObj && tableObj.number) {
				setTableNumberState(tableObj.number);
			}

			if (!reservationId) {
				Alert.alert("Erreur", "Aucun ID de réservation retourné.");
				setLoading(false);
				return;
			}

			// ⭐ Stocker les infos importantes dans AsyncStorage
			await AsyncStorage.setItem("currentReservationId", reservationId);
			await AsyncStorage.setItem("currentTableId", tableId);
			if (tableNumber) {
				await AsyncStorage.setItem(
					"currentTableNumber",
					tableNumber.toString(),
				);
			}
			await AsyncStorage.setItem("currentClientName", name.trim());
			await AsyncStorage.setItem("currentClientId", clientId);
			if (isFoodtruck) {
				await AsyncStorage.setItem("currentClientPhone", phone.trim());
			}
			// Note: pseudo et tableId déjà stockés avant getClientToken

			// ⭐ Marquer que l'utilisateur a rejoint dans cette session
			setHasJoinedTable(true);

			onJoin?.(name.trim(), reservationId, tableId, tableNumber, clientId);

			let welcomeMsg = `Bienvenue ${name.trim()} !\nVous êtes à la table ${displayTableNumber}.`;
			if (isAvailable === false) {
				welcomeMsg = `Bienvenue ${name.trim()} !\nVous êtes à la table ${displayTableNumber} de ${creatorName}.`;
			}
			Alert.alert("✅ Succès", welcomeMsg, [{ text: "OK" }]);
		} catch (err) {
			console.error("❌ [JOIN] Exception attrapée:", err?.message, err);
			setError(err.message || "Erreur réseau");
			Alert.alert(
				"Erreur",
				"Impossible de rejoindre la table. Veuillez réessayer.",
			);
		} finally {
			setLoading(false);
		}
	};

	// 🔑 Forcer re-render complet quand le thème change
	const renderKey = `${componentKey}-${config?.styleKey || "default"}`;

	return (
		<ImageBackground
			key={renderKey} // 🔄 Change quand thème change → force remount avec bonnes couleurs
			source={backgroundImage}
			style={styles.background}
			resizeMode="cover"
			imageStyle={useCustomBackground ? { opacity: 0.3 } : undefined}
		>
			{/* � Overlay conditionnel : Custom background ou Standard */}
			{useCustomBackground ? (
				<>
					{/* Overlay flou sombre pour backgrounds custom */}
					<BlurView intensity={25} tint="dark" style={styles.blurOverlay}>
						<LinearGradient
							colors={
								config?.styleKey === "italia"
									? [
											"rgba(0, 0, 0, 0.7)",
											"rgba(0, 146, 70, 0.25)", // Vert italien transparent
											"rgba(0, 0, 0, 0.8)",
										]
									: [
											"rgba(0, 0, 0, 0.7)",
											"rgba(213, 48, 39, 0.3)", // Rouge BBQ
											"rgba(0, 0, 0, 0.8)",
										]
							}
							style={styles.gradientOverlay}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						/>
					</BlurView>

					{/* 🔥 Éléments décoratifs (custom background only) */}
					<View style={styles.flameElements}>
						<View style={styles.flameContainer}>
							<LinearGradient
								colors={[theme.orange, "transparent"]}
								style={[styles.flame, styles.flame1]}
								start={{ x: 0, y: 1 }}
								end={{ x: 0, y: 0 }}
							/>
							<LinearGradient
								colors={[theme.rouge, "transparent"]}
								style={[styles.flame, styles.flame2]}
								start={{ x: 0, y: 1 }}
								end={{ x: 0, y: 0 }}
							/>
							<LinearGradient
								colors={[theme.dore, "transparent"]}
								style={[styles.flame, styles.flame3]}
								start={{ x: 0, y: 1 }}
								end={{ x: 0, y: 0 }}
							/>
						</View>
					</View>
				</>
			) : (
				<>
					{/* Overlay général pour restaurants standards */}
					<BlurView intensity={30} tint="dark" style={styles.blurOverlay}>
						<LinearGradient
							colors={[
								"rgba(15, 12, 41, 0.85)",
								"rgba(48, 43, 99, 0.75)",
								"rgba(36, 36, 62, 0.85)",
							]}
							style={styles.gradientOverlay}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						/>
					</BlurView>

					{/* Cercles décoratifs (Standard) */}
					<View style={styles.bgCircles}>
						<LinearGradient
							colors={[...theme.primary, "transparent"]}
							style={[styles.bgCircle, styles.bgCircle1]}
						/>
						<LinearGradient
							colors={[...theme.accent, "transparent"]}
							style={[styles.bgCircle, styles.bgCircle2]}
						/>
					</View>
				</>
			)}

			<StatusBar
				barStyle="light-content"
				translucent={false}
				backgroundColor="transparent"
			/>

			{/* 🔧 Debug Button */}
			<TouchableOpacity
				style={styles.debugButton}
				onPress={handleClearStorage}
				activeOpacity={0.7}
			>
				<MaterialIcons name="delete-sweep" size={24} color="#fff" />
			</TouchableOpacity>

			{/* Contenu principal avec gestion clavier native iOS */}
			<ScrollView
				ref={scrollViewRef}
				style={styles.scrollContainer}
				contentContainerStyle={styles.scrollContent}
				automaticallyAdjustKeyboardInsets={true}
				keyboardDismissMode="interactive"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<Animated.View
					style={[
						styles.content,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					{/* � Logo et Titre conditionnels : Custom ou Standard */}
					{useCustomBackground ? (
						<>
							{/* 🇮🇹 Logo conditionnel : Italia ou Grillz */}
							<Animated.View
								style={[
									styles.grillzLogoContainer,
									{ transform: [{ scale: tableIconScale }] },
								]}
							>
								<Image
									source={
										config?.styleKey === "italia"
											? require("../../../assets/italiashop.png")
											: require("../../../assets/foodtruck.png")
									}
									style={styles.foodtruckImageHighQuality}
									resizeMode="contain"
								/>
								{!isFoodtruck && restaurantLoaded && displayTableNumber && (
									<View style={styles.grillzTableBadge}>
										<Text style={styles.grillzTableText}>
											{displayTableNumber}
										</Text>
									</View>
								)}
							</Animated.View>

							{/* Titre de bienvenue stylisé */}
							<View style={styles.grillzTitleContainer}>
								<Text style={styles.grillzPreTitle}>Bonjour</Text>
								<View style={styles.grillzMainTitleContainer}>
									<Text style={styles.grillzMainTitle}>Bienvenue chez</Text>
									<LinearGradient
										colors={
											config?.styleKey === "italia"
												? Array.isArray(theme.gold)
													? theme.gold
													: ["#F1BF00", "#DAA520"]
												: [theme.dore || "#FF8C00", theme.orange || "#FF6F00"]
										}
										style={styles.grillzNameGradient}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 0 }}
									>
										<Text style={styles.grillzName}>
											{restaurantName || "Restaurant"}
										</Text>
									</LinearGradient>
								</View>
								<Text style={styles.grillzSubTitle}>
									{isFoodtruck ? "Food Truck" : "Restaurant"}
								</Text>
							</View>

							{/* Situation 2 : Table fermée - Rejoignez-nous */}
							{tableAvailable === false &&
								participants.length > 0 &&
								participants[0] && (
									<Text style={styles.grillzSubtitle}>
										Rejoignez{" "}
										<Text style={styles.grillzTableHighlight}>nos clients</Text>
									</Text>
								)}
						</>
					) : (
						<>
							{/* 🎨 Logo et Titre Standard */}
							<Animated.View
								style={[
									styles.tableIconContainer,
									{ transform: [{ scale: tableIconScale }] },
								]}
							>
								<LinearGradient
									colors={theme.primary}
									style={styles.tableIconGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<MaterialIcons
										name="table-restaurant"
										size={48}
										color="#fff"
									/>
								</LinearGradient>
								{!isFoodtruck && restaurantLoaded && displayTableNumber && (
									<View style={styles.tableNumberBadge}>
										<Text style={styles.tableNumberBadgeText}>
											{displayTableNumber}
										</Text>
									</View>
								)}
							</Animated.View>

							{/* Titre Standard */}
							<Text style={styles.title}>
								{restaurantName || "Bienvenue"} ✨
							</Text>
							{tableAvailable === false &&
								participants.length > 0 &&
								participants[0] && (
									<Text style={styles.subtitle}>
										Rejoignez{" "}
										<Text style={styles.tableHighlight}>{participants[0]}</Text>{" "}
										à table
									</Text>
								)}
						</>
					)}

					{/* 👥 Dropdown invités (conditionné selon le type de restaurant) */}
					{!isFoodtruck &&
						tableAvailable === false &&
						participants.length > 0 && (
							<View
								style={
									useCustomBackground
										? styles.grillzParticipantsContainer
										: styles.participantsContainer
								}
							>
								<BlurView
									intensity={25}
									tint="light"
									style={
										useCustomBackground
											? styles.grillzParticipantsBlur
											: styles.participantsBlur
									}
								>
									<TouchableOpacity
										style={
											useCustomBackground
												? styles.grillzInputContainer
												: styles.inputContainer
										}
										onPress={() => setShowGuestsDropdown(true)}
										activeOpacity={0.8}
									>
										<LinearGradient
											colors={
												useCustomBackground
													? [theme.orange, theme.rouge]
													: theme.primary
											}
											style={
												useCustomBackground
													? styles.grillzInputIcon
													: styles.inputIcon
											}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
										>
											<MaterialIcons name="group" size={22} color="#fff" />
										</LinearGradient>
										<Text
											style={
												useCustomBackground
													? styles.grillzDropdownText
													: styles.dropdownText
											}
										>
											{participants.length === 1
												? `1 personne à cette table`
												: `${participants.length} personnes à cette table`}
										</Text>
										<MaterialIcons
											name="expand-more"
											size={24}
											color={
												useCustomBackground ? theme.orange : theme.primary[0]
											}
										/>
									</TouchableOpacity>
								</BlurView>
							</View>
						)}

					{/* 🔄 REPRISE DE SESSION — card visible si re-scan QR avec session active */}
					{existingSession && (
						<View style={styles.resumeSessionCard}>
							<BlurView intensity={30} tint="light" style={styles.resumeSessionBlur}>
								<View style={styles.resumeSessionContent}>
									<MaterialIcons name="replay" size={28} color={theme.primary?.[0] || "#667eea"} />
									<View style={styles.resumeSessionText}>
										<Text style={styles.resumeSessionTitle}>Session en cours</Text>
										<Text style={styles.resumeSessionSubtitle}>
											Reprendre la commande de{" "}
											<Text style={{ fontWeight: "700" }}>{existingSession.clientName}</Text>
											{" "}?
										</Text>
									</View>
								</View>
								<View style={styles.resumeSessionButtons}>
									<TouchableOpacity
										style={[styles.resumeBtn, { backgroundColor: theme.primary?.[0] || "#667eea" }]}
										onPress={handleResumeSession}
										activeOpacity={0.8}
									>
										<Text style={styles.resumeBtnText}>Reprendre</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.resumeBtnSecondary}
										onPress={() => setExistingSession(null)}
										activeOpacity={0.8}
									>
										<Text style={styles.resumeBtnSecondaryText}>Nouvelle session</Text>
									</TouchableOpacity>
								</View>
							</BlurView>
						</View>
					)}

					{/* 📋 Formulaire avec inputs stylisés (conditionnel) */}
					<View
						style={
							useCustomBackground ? styles.grillzFormCard : styles.formCard
						}
					>
						<BlurView
							intensity={30}
							tint="light"
							style={
								useCustomBackground ? styles.grillzFormBlur : styles.formBlur
							}
						>
							{/* Input Nom */}
							<Animated.View
								style={[
									useCustomBackground
										? styles.grillzInputWrapper
										: styles.inputWrapper,
									{
										opacity: inputAnimations[0],
										transform: [
											{
												translateX: inputAnimations[0].interpolate({
													inputRange: [0, 1],
													outputRange: [-30, 0],
												}),
											},
										],
									},
								]}
							>
								<View
									style={
										useCustomBackground
											? styles.grillzInputContainer
											: styles.inputContainer
									}
								>
									<LinearGradient
										colors={
											useCustomBackground
												? [theme.orange, theme.rouge]
												: theme.primary
										}
										style={
											useCustomBackground
												? styles.grillzInputIcon
												: styles.inputIcon
										}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons name="person" size={22} color="#fff" />
									</LinearGradient>
									<TextInput
										style={
											useCustomBackground ? styles.grillzInput : styles.input
										}
										placeholder="Votre nom ou prénom"
										value={name}
										onChangeText={setName}
										autoCapitalize="words"
										placeholderTextColor={
											useCustomBackground ? "rgba(255,255,255,0.6)" : "#999"
										}
										editable={!loading}
									/>
								</View>
							</Animated.View>

							{/* Input Téléphone (foodtruck uniquement) */}
							{isFoodtruck && (
								<Animated.View
									style={[
										useCustomBackground
											? styles.grillzInputWrapper
											: styles.inputWrapper,
										{
											opacity: inputAnimations[1],
											transform: [
												{
													translateX: inputAnimations[1].interpolate({
														inputRange: [0, 1],
														outputRange: [-30, 0],
													}),
												},
											],
										},
									]}
								>
									<View
										style={
											useCustomBackground
												? styles.grillzInputContainer
												: styles.inputContainer
										}
									>
										<LinearGradient
											colors={
												useCustomBackground
													? [theme.orange, theme.rouge]
													: theme.primary
											}
											style={
												useCustomBackground
													? styles.grillzInputIcon
													: styles.inputIcon
											}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
										>
											<MaterialIcons name="phone" size={22} color="#fff" />
										</LinearGradient>
										<TextInput
											style={
												useCustomBackground ? styles.grillzInput : styles.input
											}
											placeholder="Votre numéro de téléphone"
											value={phone}
											onChangeText={setPhone}
											keyboardType="phone-pad"
											placeholderTextColor={
												useCustomBackground ? "rgba(255,255,255,0.6)" : "#999"
											}
											editable={!loading}
										/>
									</View>
								</Animated.View>
							)}
						</BlurView>
					</View>

					{/* ⚠️ Message d'erreur (conditionnel) */}
					{error ? (
						<View
							style={
								useCustomBackground
									? styles.grillzErrorContainer
									: styles.errorContainer
							}
						>
							<LinearGradient
								colors={
									useCustomBackground
										? [theme.rouge, "#8B0000"]
										: ["#ff6b6b", "#ee5a5a"]
								}
								style={
									useCustomBackground
										? styles.grillzErrorGradient
										: styles.errorGradient
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<MaterialIcons name="warning" size={22} color="#fff" />
								<Text
									style={
										useCustomBackground
											? styles.grillzErrorText
											: styles.errorText
									}
								>
									{error}
								</Text>
							</LinearGradient>
						</View>
					) : null}

					{/* 🚀 Join Button (conditionnel) */}
					<Animated.View style={{ transform: [{ scale: buttonScale }] }}>
						<TouchableOpacity
							onPress={handleJoin}
							onPressIn={handlePressIn}
							onPressOut={handlePressOut}
							disabled={
								!name.trim() || loading || (isFoodtruck && !phone.trim())
							}
							activeOpacity={0.9}
						>
							<LinearGradient
								colors={
									!name.trim() || loading || (isFoodtruck && !phone.trim())
										? ["#ccc", "#999"]
										: useCustomBackground
											? [theme.dore, theme.orange]
											: theme.success
								}
								style={styles.joinButton}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								{loading ? (
									<View style={styles.loadingContainer}>
										<Animated.View style={styles.loadingSpinner}>
											<MaterialIcons name="refresh" size={24} color="#fff" />
										</Animated.View>
										<Text style={styles.joinButtonText}>Connexion...</Text>
									</View>
								) : (
									<>
										<MaterialIcons
											name={tableId ? "login" : "add-circle"}
											size={24}
											color="#fff"
										/>

										<Text style={styles.joinButtonText}>
											{tableId
												? !isFoodtruck
													? "Commencer votre commande"
													: "Rejoindre la table"
												: "Créer une table"}
										</Text>
									</>
								)}
							</LinearGradient>
						</TouchableOpacity>
					</Animated.View>
				</Animated.View>
			</ScrollView>

			{/* MODAL DROPDOWN GUESTS */}
			<Modal
				transparent
				visible={showGuestsDropdown}
				animationType="fade"
				onRequestClose={() => setShowGuestsDropdown(false)}
			>
				<TouchableWithoutFeedback onPress={() => setShowGuestsDropdown(false)}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalDropdown}>
							<Text style={styles.modalTitle}>
								{participants.length === 1
									? "1 personne à cette table"
									: `${participants.length} personnes à cette table`}
							</Text>
							{participants.map((item, index) => (
								<View
									key={item + index}
									style={[
										styles.modalGuestItem,
										index === 0 && styles.modalGuestItemFirst,
										index === participants.length - 1 &&
											styles.modalGuestItemLast,
									]}
								>
									<MaterialIcons
										name="person"
										size={20}
										color={theme.orange}
										style={{ marginRight: 10 }}
									/>
									<Text style={styles.modalGuestText}>{item}</Text>
									{index === 0 && (
										<Text style={styles.creatorBadge}>(créateur)</Text>
									)}
								</View>
							))}
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	// 🔄 RESUME SESSION CARD
	resumeSessionCard: {
		marginBottom: 16,
		borderRadius: 16,
		overflow: "hidden",
	},
	resumeSessionBlur: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(102, 126, 234, 0.3)",
	},
	resumeSessionContent: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		gap: 12,
	},
	resumeSessionText: {
		flex: 1,
	},
	resumeSessionTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1a1a2e",
		marginBottom: 2,
	},
	resumeSessionSubtitle: {
		fontSize: 13,
		color: "#666",
	},
	resumeSessionButtons: {
		flexDirection: "row",
		gap: 10,
	},
	resumeBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	resumeBtnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 14,
	},
	resumeBtnSecondary: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.08)",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.1)",
	},
	resumeBtnSecondaryText: {
		color: "#333",
		fontWeight: "600",
		fontSize: 13,
	},

	// 🔥 FOND ET STRUCTURE GRILLZ
	scrollContainer: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 40,
	},
	background: {
		flex: 1,
		width: "100%",
		height: Dimensions.get("screen").height, // 🔥 Force hauteur écran complet (pas "window" qui exclut StatusBar)
		position: "absolute", // 🔥 Position absolue pour ignorer SafeAreaView padding
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	blurOverlay: {
		...StyleSheet.absoluteFillObject,
	},
	gradientOverlay: {
		...StyleSheet.absoluteFillObject,
	},

	// 🔥 ÉLÉMENTS DÉCORATIFS FLAMMES
	flameElements: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
		pointerEvents: "none",
	},
	flameContainer: {
		...StyleSheet.absoluteFillObject,
	},
	flame: {
		position: "absolute",
		borderRadius: 999,
		opacity: 0.4,
	},
	flame1: {
		width: width * 0.3,
		height: width * 0.6,
		top: height * 0.1,
		right: -width * 0.1,
	},
	flame2: {
		width: width * 0.25,
		height: width * 0.5,
		bottom: height * 0.2,
		left: -width * 0.05,
	},
	flame3: {
		width: width * 0.2,
		height: width * 0.4,
		top: height * 0.6,
		right: width * 0.1,
	},

	container: {
		flex: 1,
		width: "100%",
	},
	initialLoader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},
	initialLoaderContent: {
		alignItems: "center",
		gap: 12,
	},
	initialLoaderText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
	},
	content: {
		width: "100%",
		maxWidth: 400,
		alignItems: "center",
		justifyContent: "flex-start",
		alignSelf: "center",
	},

	// 🔥 LOGO ET ICÔNE GRILLZ
	grillzLogoContainer: {
		marginBottom: 10,
		position: "relative",
	},
	grillzLogoGradient: {
		width: 110,
		height: 150,
		borderRadius: 55,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#BF360C",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.6,
		shadowRadius: 20,
	},
	grillzTableBadge: {
		position: "absolute",
		bottom: -8,
		right: -8,
		backgroundColor: "#FF8C00",
		width: 45,
		height: 45,
		borderRadius: 22.5,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 10,
		borderWidth: 2,
		borderColor: "#fff",
	},
	grillzTableText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	foodtruckImageHighQuality: {
		width: 200,
		height: 200,
	},

	// 🔥 TITRES GRILLZ STYLISÉS
	grillzTitleContainer: {
		alignItems: "center",
		marginBottom: 20,
	},
	grillzPreTitle: {
		fontSize: 24,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 5,
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	grillzMainTitleContainer: {
		alignItems: "center",
		marginBottom: 8,
	},
	grillzMainTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 5,
		textShadowColor: "rgba(0, 0, 0, 0.6)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 4,
	},
	grillzNameGradient: {
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 25,
		shadowColor: "#FF6F00",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 8,
	},
	grillzName: {
		fontSize: 32,
		fontWeight: "900",
		color: "#fff",
		letterSpacing: 2,
		textShadowColor: "rgba(0, 0, 0, 0.6)",
		textShadowOffset: { width: 2, height: 2 },
		textShadowRadius: 4,
	},
	grillzSubTitle: {
		fontSize: 16,
		color: "rgba(255, 255, 255, 0.85)",
		fontWeight: "500",
		textAlign: "center",
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},

	// 🔥 SOUS-TITRES ET INDICATIONS
	grillzSubtitle: {
		fontSize: 18,
		color: "rgba(255, 255, 255, 0.9)",
		marginBottom: 25,
		textAlign: "center",
		fontWeight: "500",
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	grillzTableHighlight: {
		color: "#FF8C00",
		fontWeight: "bold",
		fontSize: 22,
		textShadowColor: "rgba(0, 0, 0, 0.6)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},

	// 🔥 PARTICIPANTS/INVITÉS
	grillzParticipantsContainer: {
		width: "100%",
		marginBottom: 15,
		borderRadius: 18,
		overflow: "hidden",
	},
	grillzParticipantsBlur: {
		padding: 18,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	grillzDropdownText: {
		flex: 1,
		padding: 16,
		fontSize: 16,
		color: "#fff",
		fontWeight: "500",
	},

	// 🔥 FORMULAIRE GRILLZ
	grillzFormCard: {
		width: "100%",
		borderRadius: 25,
		marginBottom: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.2,
		shadowRadius: 20,
		elevation: 12,
		overflow: "hidden",
	},
	grillzFormBlur: {
		padding: 20,
		borderRadius: 25,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.15)",
		backgroundColor: "rgba(255, 255, 255, 0.08)",
	},
	grillzInputWrapper: {
		marginBottom: 12,
	},
	grillzInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 18,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	grillzInputIcon: {
		width: 52,
		height: 52,
		justifyContent: "center",
		alignItems: "center",
	},
	grillzInput: {
		flex: 1,
		padding: 16,
		fontSize: 16,
		color: "#fff",
		fontWeight: "500",
	},

	// 🔥 ERREURS GRILLZ
	grillzErrorContainer: {
		width: "100%",
		marginBottom: 20,
		borderRadius: 15,
		overflow: "hidden",
	},
	grillzErrorGradient: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		gap: 12,
	},
	grillzErrorText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "600",
		flex: 1,
	},

	// 🔥 BOUTON GRILLZ
	grillzJoinButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
		paddingHorizontal: 45,
		borderRadius: 18,
		gap: 15,
		shadowColor: "#BF360C",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.4,
		shadowRadius: 20,
		elevation: 12,
	},
	grillzJoinButtonText: {
		color: "#fff",
		fontSize: 19,
		fontWeight: "bold",
		letterSpacing: 0.5,
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	grillzLoadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	grillzLoadingSpinner: {
		// Animation flammes si besoin
	},

	// 🔥 STYLES LEGACY (à garder pour compatibilité)
	bgCircles: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
		pointerEvents: "none",
	},
	bgCircle: {
		position: "absolute",
		borderRadius: 999,
		opacity: 0.3,
	},
	bgCircle1: {
		width: width * 0.8,
		height: width * 0.8,
		top: -width * 0.2,
		right: -width * 0.2,
	},
	bgCircle2: {
		width: width * 0.6,
		height: width * 0.6,
		bottom: height * 0.1,
		left: -width * 0.2,
	},
	bgCircle3: {
		width: width * 0.4,
		height: width * 0.4,
		top: height * 0.4,
		right: -width * 0.1,
	},
	tableIconContainer: {
		marginBottom: 24,
		position: "relative",
	},
	tableIconGradient: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#4facfe",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	tableNumberBadge: {
		position: "absolute",
		bottom: -5,
		right: -5,
		backgroundColor: "#fff",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	tableNumberBadgeText: {
		fontSize: 18,
		fontWeight: "bold",
		color: DEFAULT_THEME.primary[0],
	},
	title: {
		fontSize: 36,
		fontWeight: "800",
		color: "#fff",
		marginBottom: 8,
		textAlign: "center",
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 18,
		color: "rgba(255, 255, 255, 0.8)",
		marginBottom: 32,
		textAlign: "center",
	},
	tableHighlight: {
		color: "#4facfe",
		fontWeight: "bold",
		fontSize: 22,
	},
	participantsContainer: {
		width: "100%",
		marginBottom: 20,
		borderRadius: 16,
		overflow: "hidden",
	},
	participantsBlur: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	formCard: {
		width: "100%",
		borderRadius: 24,
		marginBottom: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 10,
		overflow: "hidden",
	},
	formBlur: {
		padding: 20,
		borderRadius: 24,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
		backgroundColor: "rgba(255, 255, 255, 0.85)",
	},
	inputWrapper: {
		marginBottom: 16,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#e9ecef",
	},
	inputIcon: {
		width: 48,
		height: 48,
		justifyContent: "center",
		alignItems: "center",
	},
	input: {
		flex: 1,
		padding: 14,
		fontSize: 16,
		color: "#333",
	},
	dropdownWrapper: {
		position: "relative",
	},
	dropdownText: {
		flex: 1,
		padding: 14,
		fontSize: 16,
		color: "#333",
	},
	dropdownPlaceholder: {
		color: "#999",
	},
	errorContainer: {
		width: "100%",
		marginBottom: 20,
		borderRadius: 12,
		overflow: "hidden",
	},
	errorGradient: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		gap: 10,
	},
	errorText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
		flex: 1,
	},
	joinButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		paddingHorizontal: 40,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#11998e",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 10,
	},
	joinButtonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
		letterSpacing: 0.5,
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	loadingSpinner: {
		// Spinning handled via Animated if needed
	},

	// MODAL STYLES
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	modalDropdown: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 0,
		width: "90%",
		maxWidth: 350,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		padding: 20,
		paddingBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		textAlign: "center",
	},
	modalDropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		position: "relative",
		overflow: "hidden",
	},
	modalDropdownItemFirst: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	modalDropdownItemLast: {
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		borderBottomWidth: 0,
	},
	modalDropdownItemSelected: {
		backgroundColor: "transparent",
	},
	modalDropdownItemText: {
		fontSize: 16,
		color: "#333",
		flex: 1,
	},
	modalDropdownItemTextSelected: {
		fontWeight: "bold",
		color: "#fff",
	},
	modalGuestItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	modalGuestItemFirst: {
		marginTop: 0,
	},
	modalGuestItemLast: {
		borderBottomWidth: 0,
	},
	modalGuestText: {
		fontSize: 16,
		color: "#333",
		flex: 1,
	},
	creatorBadge: {
		color: "#FF6F00",
		fontWeight: "bold",
		fontSize: 14,
		marginLeft: 10,
	},
	debugButton: {
		position: "absolute",
		top: 50,
		right: 20,
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "rgba(255, 59, 48, 0.9)",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
		zIndex: 1000,
	},
});
