import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	FlatList,
	Alert,
	Animated,
	Dimensions,
	StatusBar,
	Modal,
	TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { clientAuthService } from "../../../shared-api/services/clientAuthService.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClientTableStore } from "../stores/useClientTableStore.js";
import RNUUID from "react-native-uuid";

const { width, height } = Dimensions.get("window");

// 🎨 Premium Design System
const PREMIUM_COLORS = {
	primary: ["#667eea", "#764ba2"],
	secondary: ["#f093fb", "#f5576c"],
	accent: ["#4facfe", "#00f2fe"],
	success: ["#11998e", "#38ef7d"],
	dark: ["#0f0c29", "#302b63", "#24243e"],
	glass: "rgba(255, 255, 255, 0.15)",
	glassBorder: "rgba(255, 255, 255, 0.25)",
	text: "#ffffff",
	textMuted: "rgba(255, 255, 255, 0.7)",
	inputBg: "rgba(255, 255, 255, 0.95)",
};

export default function JoinOrCreateTable({
	tableId = null,
	tableNumber = null,
	onJoin = () => {},
}) {
	// ...hooks et états...

	// Log la liste des guests (participants) et le statut de la table à chaque changement
	useEffect(() => {
		// ...
	}, [participants, tableAvailable]);
	const [name, setName] = useState("");
	const [allergies, setAllergies] = useState("");
	const [restrictions, setRestrictions] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState([]);
	const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
	const [showRestrictionsOptions, setShowRestrictionsOptions] = useState(false);
	const [loading, setLoading] = useState(false);

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

	const { restaurantId } = useClientTableStore();

	// 🎬 Entrance animations
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
			])
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
				const urlGuests = `${API_BASE_URL}/client-tables/${tableId}/guests`;
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

	// 🆕 Stocke le nom du créateur et la disponibilité de la table
	const [creatorName, setCreatorName] = useState(null);
	const [tableAvailable, setTableAvailable] = useState(null);

	// 🆕 Commandes publiques de la réservation (accessibles à tous les guests)
	const [orders, setOrders] = useState([]);
	const [reservationIdState, setReservationIdState] = useState(null);

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
						`${API_BASE_URL}/client-orders/${reservationId}`
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

	const handleJoin = async () => {
		if (!name.trim()) return setError("Veuillez entrer un nom.");
		if (!tableId) return setError("Table non identifiée.");

		setLoading(true);
		setError("");

		try {
			// ⭐ Stocker tableId et pseudo AVANT de générer le token
			await AsyncStorage.setItem("pseudo", name.trim());
			await AsyncStorage.setItem("tableId", tableId);

			// Toujours passer le pseudo à getClientToken (stockage géré dans le service)
			const token = await clientAuthService.getClientToken(name.trim());
			const clientId = await getOrCreateClientId();

			const body = {
				clientName: name.trim(),
				clientId: clientId,
				allergies,
				restrictions,
				tableId: tableId,
				restaurantId:
					restaurantId || (await AsyncStorage.getItem("restaurantId")),
				reservationDate: new Date().toISOString(),
				reservationTime: `${String(new Date().getHours()).padStart(
					2,
					"0"
				)}:${String(new Date().getMinutes()).padStart(2, "0")}`,
			};

			const response = await fetch(
				`${API_BASE_URL}/reservations/client/reservations`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				}
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
					data.message || "Erreur lors de la création de la réservation."
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
					tableNumber.toString()
				);
			}
			await AsyncStorage.setItem("currentClientName", name.trim());
			await AsyncStorage.setItem("currentClientId", clientId);
			// Note: pseudo et tableId déjà stockés avant getClientToken

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
				"Impossible de rejoindre la table. Veuillez réessayer."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<LinearGradient
				colors={PREMIUM_COLORS.dark}
				style={styles.background}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<StatusBar barStyle="light-content" />

				{/* 🌟 Animated Background Circles */}
				<View style={styles.bgCircles}>
					<LinearGradient
						colors={[...PREMIUM_COLORS.primary, "transparent"]}
						style={[styles.bgCircle, styles.bgCircle1]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					/>
					<LinearGradient
						colors={[...PREMIUM_COLORS.secondary, "transparent"]}
						style={[styles.bgCircle, styles.bgCircle2]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					/>
					<LinearGradient
						colors={[...PREMIUM_COLORS.accent, "transparent"]}
						style={[styles.bgCircle, styles.bgCircle3]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					/>
				</View>

				<KeyboardAvoidingView
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					keyboardVerticalOffset={Platform.OS === "ios" ? -300 : 0}
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
						{/* 🍽️ Premium Table Icon */}
						<Animated.View
							style={[
								styles.tableIconContainer,
								{ transform: [{ scale: tableIconScale }] },
							]}
						>
							<LinearGradient
								colors={PREMIUM_COLORS.accent}
								style={styles.tableIconGradient}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<Ionicons name="restaurant" size={48} color="#fff" />
							</LinearGradient>
							<View style={styles.tableNumberBadge}>
								<Text style={styles.tableNumberBadgeText}>
									{displayTableNumber}
								</Text>
							</View>
						</Animated.View>

						{/* 📝 Welcome Title */}
						<Text style={styles.title}>Bienvenue !</Text>

						{/* Situation 1 : Table ouverte (isAvailable true) - Vous êtes le créateur */}
						{tableAvailable === true && (
							<Text style={styles.subtitle}>
								Vous êtes à la table{" "}
								<Text style={styles.tableHighlight}>{displayTableNumber}</Text>
							</Text>
						)}

						{/* Situation 2 : Table fermée (isAvailable false) - Vous êtes invité */}
						{tableAvailable === false &&
							participants.length > 0 &&
							participants[0] && (
								<Text style={styles.subtitle}>
									Vous êtes à la table{" "}
									<Text style={styles.tableHighlight}>
										{displayTableNumber}
									</Text>{" "}
									de {participants[0]}
								</Text>
							)}

						{/* 👥 Guests Dropdown Button (seulement si table occupée) */}
						{tableAvailable === false && participants.length > 0 && (
							<View style={styles.participantsContainer}>
								<BlurView
									intensity={20}
									tint="light"
									style={styles.participantsBlur}
								>
									<TouchableOpacity
										style={styles.inputContainer}
										onPress={() => setShowGuestsDropdown(true)}
										activeOpacity={0.8}
									>
										<LinearGradient
											colors={PREMIUM_COLORS.primary}
											style={styles.inputIcon}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
										>
											<MaterialIcons name="group" size={20} color="#fff" />
										</LinearGradient>
										<Text style={styles.dropdownText}>
											{participants.length === 1
												? `1 personne à cette table`
												: `${participants.length} personnes à cette table`}
										</Text>
										<MaterialIcons
											name="expand-more"
											size={24}
											color={PREMIUM_COLORS.primary[0]}
										/>
									</TouchableOpacity>
								</BlurView>
							</View>
						)}

						{/* 📋 Form Card */}

						{/* Les commandes publiques ne sont plus affichées ici, elles seront affichées sur la page paiement. */}
						<View style={styles.formCard}>
							<BlurView intensity={25} tint="light" style={styles.formBlur}>
								{/* Name Input */}
								<Animated.View
									style={[
										styles.inputWrapper,
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
									<View style={styles.inputContainer}>
										<LinearGradient
											colors={PREMIUM_COLORS.primary}
											style={styles.inputIcon}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
										>
											<MaterialIcons name="person" size={20} color="#fff" />
										</LinearGradient>
										<TextInput
											style={styles.input}
											placeholder="Votre nom / pseudo"
											value={name}
											onChangeText={setName}
											autoCapitalize="words"
											placeholderTextColor="#999"
											editable={!loading}
										/>
									</View>
								</Animated.View>

								{/* Allergies Input */}

								{/* Restrictions Dropdown Button */}
								<Animated.View
									style={[
										styles.inputWrapper,
										{
											opacity: inputAnimations[2].interpolate({
												inputRange: [0, 1],
												outputRange: [1, 1],
											}),
											transform: [
												{
													translateX: inputAnimations[2].interpolate({
														inputRange: [0, 1],
														outputRange: [-30, 0],
													}),
												},
											],
										},
									]}
								>
									<View style={styles.dropdownWrapper}>
										<TouchableOpacity
											style={styles.inputContainer}
											onPress={() =>
												!loading && setShowRestrictionsOptions(true)
											}
											disabled={loading}
										>
											<LinearGradient
												colors={PREMIUM_COLORS.accent}
												style={styles.inputIcon}
												start={{ x: 0, y: 0 }}
												end={{ x: 1, y: 1 }}
											>
												<MaterialIcons
													name="restaurant-menu"
													size={20}
													color="#fff"
												/>
											</LinearGradient>
											<Text
												style={[
													styles.dropdownText,
													!restrictions && styles.dropdownPlaceholder,
												]}
											>
												{restrictions || "Restrictions alimentaires"}
											</Text>
											<MaterialIcons
												name="expand-more"
												size={24}
												color="#667eea"
											/>
										</TouchableOpacity>
									</View>
								</Animated.View>
							</BlurView>
						</View>

						{/* ⚠️ Error Message */}
						{error ? (
							<View style={styles.errorContainer}>
								<LinearGradient
									colors={["#ff416c", "#ff4b2b"]}
									style={styles.errorGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<MaterialIcons name="error-outline" size={20} color="#fff" />
									<Text style={styles.errorText}>{error}</Text>
								</LinearGradient>
							</View>
						) : null}

						{/* 🚀 Premium Join Button */}
						<Animated.View style={{ transform: [{ scale: buttonScale }] }}>
							<TouchableOpacity
								onPress={handleJoin}
								onPressIn={handlePressIn}
								onPressOut={handlePressOut}
								disabled={!name.trim() || loading}
								activeOpacity={0.9}
							>
								<LinearGradient
									colors={
										!name.trim() || loading
											? ["#ccc", "#999"]
											: PREMIUM_COLORS.success
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
												{tableId ? "Rejoindre la table" : "Créer une table"}
											</Text>
										</>
									)}
								</LinearGradient>
							</TouchableOpacity>
						</Animated.View>
					</Animated.View>
				</KeyboardAvoidingView>
			</LinearGradient>

			{/* MODAL DROPDOWN RESTRICTIONS */}
			<Modal
				transparent
				visible={showRestrictionsOptions}
				animationType="fade"
				onRequestClose={() => setShowRestrictionsOptions(false)}
			>
				<TouchableWithoutFeedback
					onPress={() => setShowRestrictionsOptions(false)}
				>
					<View style={styles.modalOverlay}>
						<TouchableWithoutFeedback>
							<View style={styles.modalDropdown}>
								{["Aucune", "Halal", "Casher", "Vegan", "Gluten Free"].map(
									(option, index) => (
										<TouchableOpacity
											key={option}
											style={[
												styles.modalDropdownItem,
												restrictions === option &&
													styles.modalDropdownItemSelected,
												index === 0 && styles.modalDropdownItemFirst,
												index === 4 && styles.modalDropdownItemLast,
											]}
											onPress={() => {
												setRestrictions(option);
												setShowRestrictionsOptions(false);
											}}
										>
											{restrictions === option && (
												<LinearGradient
													colors={PREMIUM_COLORS.success}
													style={StyleSheet.absoluteFill}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 0 }}
												/>
											)}
											<Text
												style={[
													styles.modalDropdownItemText,
													restrictions === option &&
														styles.modalDropdownItemTextSelected,
												]}
											>
												{option}
											</Text>
											{restrictions === option && (
												<MaterialIcons name="check" size={20} color="#fff" />
											)}
										</TouchableOpacity>
									)
								)}
							</View>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>

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
										color={PREMIUM_COLORS.primary[0]}
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
		</>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: "100%",
		height: "100%",
	},
	bgCircles: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
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
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		width: "100%",
	},
	content: {
		width: "100%",
		maxWidth: 400,
		alignItems: "center",
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
		color: PREMIUM_COLORS.text,
		marginBottom: 8,
		textAlign: "center",
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 18,
		color: PREMIUM_COLORS.textMuted,
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
		borderColor: PREMIUM_COLORS.glassBorder,
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
		borderColor: PREMIUM_COLORS.glassBorder,
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
		color: "#4facfe",
		fontWeight: "bold",
		fontSize: 14,
		marginLeft: 10,
	},
});
