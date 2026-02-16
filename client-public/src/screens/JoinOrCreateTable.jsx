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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { clientAuthService } from "shared-api/services/clientAuthService.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClientTableStore } from "../stores/useClientTableStore.js";
import { useRestaurantStore } from "../stores/useRestaurantStore.js";
import useRestaurantConfig from "../hooks/useRestaurantConfig.js";
import RNUUID from "react-native-uuid";

const { width, height } = Dimensions.get("window");

// 🎨 Thème général pour les restaurants standards
const PREMIUM_COLORS = {
	primary: ["#667eea", "#764ba2"],
	secondary: ["#f093fb", "#f5576c"],
	accent: ["#4facfe", "#00f2fe"],
	success: ["#11998e", "#38ef7d"],
	warning: ["#f2994a", "#f2c94c"],
	dark: ["#0f0c29", "#302b63", "#24243e"],
	orange: "#FF6B35", // Pour compatibilité
	rouge: "#D53027",
	dore: "#FFD700",
};

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
	const backgroundImage =
		useCustomBackground && config?.style?.backgroundImage
			? CUSTOM_BACKGROUNDS[config.style.backgroundImage] || null
			: null;

	// 🎨 Thème dynamique selon le restaurant (fallback si pas de config)
	const theme = config?.style || PREMIUM_COLORS;

	// �🎬 Entrance animations
	useEffect(() => {
		// Main fade in
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();

		// Table icon pulse
		Animated.loop(
			Animated.sequence([
				Animated.timing(tableIconAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(tableIconAnim, {
					toValue: 0,
					duration: 1500,
					useNativeDriver: true,
				}),
			]),
		).start();

		// Staggered input animations
		inputAnimations.forEach((anim, index) => {
			Animated.timing(anim, {
				toValue: 1,
				duration: 500,
				delay: 200 + index * 100,
				useNativeDriver: true,
			}).start();
		});
	}, []);

	// ⚡ WebSocket: Écouter les mises à jour d'orders (paiement) en temps réel
	const { on, off } = useSocketClient(restaurantId, tableId);

	useEffect(() => {
		if (!restaurantId || !tableId) return;

		const handleOrderUpdate = (payload) => {
			console.log("📦 [JoinOrCreateTable] Order WebSocket:", payload.type);

			if (payload.type === "order_updated" && payload.data) {
				// Mettre à jour la commande dans le state local
				setOrders((prevOrders) =>
					prevOrders.map((order) =>
						order._id === payload.data._id ? payload.data : order,
					),
				);
				console.log(
					"✅ [JoinOrCreateTable] Order mis à jour:",
					payload.data._id,
					"paid:",
					payload.data.paid,
				);
			}
		};

		on("order", handleOrderUpdate);
		return () => off("order", handleOrderUpdate);
	}, [restaurantId, tableId, on, off]);

	// � DEBUG: Logger les dimensions et layout au mount et aux changements
	useEffect(() => {
		const dims = Dimensions.get("window");
		const screen = Dimensions.get("screen");
		console.log(
			"🐛 [LAYOUT DEBUG] Component mounted/updated:",
			"\n  📐 Window:",
			dims.width,
			"x",
			dims.height,
			"\n  📐 Screen:",
			screen.width,
			"x",
			screen.height,
			"\n  📱 StatusBar height (iOS):",
			Platform.OS === "ios" ? StatusBar.currentHeight || "N/A" : StatusBar.currentHeight,
			"\n  🔑 ComponentKey:",
			componentKey,
			"\n  📦 Orders:",
			orders.length,
			"\n  ✅ HasJoined:",
			hasJoinedTable,
		);
	}, [componentKey, orders.length, hasJoinedTable]);

	// 🔄 SIMULE UN RELOAD COMPLET : Force unmount/remount de TOUTE la page
	// ⚡ Solution au bug "bande grise" : la redirection garde les composants en cache
	//    (LinearGradient, StatusBar, BlurView, etc.). Un reload les recrée de zéro.
	//    On applique la key au container root pour forcer un remount total.
	useEffect(() => {
		console.log(
			"🔄 [REMOUNT TRIGGER] Avant key increment:",
			"orders.length=",
			orders.length,
			"hasJoinedTable=",
			hasJoinedTable,
		);
		// Incrémenter la key → TOUT le composant détruit et recréé = état 100% propre
		setComponentKey((prev) => {
			console.log("🔑 [REMOUNT] Incrementing key:", prev, "→", prev + 1);
			return prev + 1;
		});
	}, [orders.length, hasJoinedTable]); // Se déclenche quand on revient (orders change après paiement)

	// 🎨 Button press animation
	const handlePressIn = () => {
		Animated.spring(buttonScale, {
			toValue: 0.95,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(buttonScale, {
			toValue: 1,
			friction: 3,
			useNativeDriver: true,
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
				console.log("[FETCH] Guests URL:", urlGuests);
				const resGuests = await fetch(urlGuests);
				console.log("[FETCH] Guests status:", resGuests.status);
				let data;
				if (resGuests.ok) {
					const text = await resGuests.text();
					console.log("[FETCH] Guests body:", text);
					try {
						data = JSON.parse(text);
					} catch (e) {
						console.log("[FETCH] Guests: réponse non JSON");
						data = null;
					}
					if (data && data.number) {
						console.log("[FETCH] Numéro de table récupéré:", data.number);
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
			console.log("[DEBUG] Restaurant ID:", restaurantId);
			fetchRestaurantInfo(restaurantId).then(() => {
				setRestaurantLoaded(true);
			});
		}
	}, [restaurantId, fetchRestaurantInfo]);

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
		if (!tableId) return setError("Table non identifiée.");

		setLoading(true);
		setError("");

		try {
			// ⭐ Stocker tableId et pseudo
			await AsyncStorage.setItem("pseudo", name.trim());
			await AsyncStorage.setItem("tableId", tableId);
			if (isFoodtruck) {
				await AsyncStorage.setItem("clientPhone", phone.trim());
			}

			// Générer un token client simple pour les commandes
			const token = await clientAuthService.getClientToken(
				name.trim(),
				tableId,
				restaurantId,
			);
			const clientId = await getOrCreateClientId();

			const body = {
				clientName: name.trim(),
				clientId: clientId,
				...(isFoodtruck && { clientPhone: phone.trim() }),
				tableId: tableId,
				restaurantId:
					restaurantId || (await AsyncStorage.getItem("restaurantId")),
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
				Alert.alert("Erreur", "Réponse serveur inattendue.");
				setLoading(false);
				return;
			}

			if (!response.ok) {
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
			console.error("handleJoin error:", err);
			setError(err.message || "Erreur réseau");
			Alert.alert(
				"Erreur",
				"Impossible de rejoindre la table. Veuillez réessayer.",
			);
		} finally {
			setLoading(false);
		}
	};

	// 🐛 Handler pour tracker les changements de layout
	const handleRootLayout = (event) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		console.log(
			"🐛 [ROOT LAYOUT] Container position changed:",
			"\n  📍 X:",
			x,
			"Y:",
			y,
			"(⚠️ Si Y > 0, il y a un décalage!)",
			"\n  📐 Size:",
			width,
			"x",
			height,
			"\n  🔑 Key:",
			componentKey,
		);
	};

	// 🐛 Handler pour tracker le ScrollView
	const handleScrollViewLayout = (event) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		console.log(
			"🐛 [SCROLLVIEW LAYOUT] Position:",
			"\n  📍 X:",
			x,
			"Y:",
			y,
			"(⚠️ Si Y > 0 sans raison, le ScrollView est décalé!)",
			"\n  📐 Size:",
			width,
			"x",
			height,
		);
	};

	// 🐛 Log StatusBar config (une seule fois au mount)
	useEffect(() => {
		console.log(
			"🐛 [STATUSBAR] Config initiale:",
			"\n  ⚪ Translucent:",
			false,
			"(iOS ignore cette prop)",
			"\n  🎨 Background:",
			"transparent",
			"\n  📱 CurrentHeight:",
			StatusBar.currentHeight,
			"(null sur iOS, height en px sur Android)",
			"\n  🔑 Platform:",
			Platform.OS,
		);
	}, []);

	return (
		<ImageBackground
			key={componentKey} // 🔄 Change à chaque retour → force remount TOTAL
			source={backgroundImage}
			style={styles.background}
			resizeMode="cover"
			onLayout={handleRootLayout} // 🐛 Track layout changes
		>
			{/* � Overlay conditionnel : Custom background ou Standard */}
			{useCustomBackground ? (
				<>
					{/* Overlay flou sombre pour backgrounds custom */}
					<BlurView intensity={25} tint="dark" style={styles.blurOverlay}>
						<LinearGradient
							colors={[
								"rgba(0, 0, 0, 0.7)",
								"rgba(213, 48, 39, 0.3)",
								"rgba(0, 0, 0, 0.8)",
							]}
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
				onLayout={handleScrollViewLayout} // 🐛 Track ScrollView position
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
							{/* 🔥 Logo Grillz avec flammes */}
							<Animated.View
								style={[
									styles.grillzLogoContainer,
									{ transform: [{ scale: tableIconScale }] },
								]}
							>
								<Image
									source={require("../../../assets/foodtruck.png")}
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

							{/* Titre de bienvenue Grillz stylisé */}
							<View style={styles.grillzTitleContainer}>
								<Text style={styles.grillzPreTitle}>Bonjour</Text>
								<View style={styles.grillzMainTitleContainer}>
									<Text style={styles.grillzMainTitle}>Bienvenue chez</Text>
									<LinearGradient
										colors={[theme.dore, theme.orange]}
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
		color: "#667eea",
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
