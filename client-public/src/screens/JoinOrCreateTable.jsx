import React, { useState, useRef, useEffect } from "react";
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
	tableNumber = null, // ⭐ NOUVEAU : Numéro de table pour affichage
	onJoin = () => {},
}) {
	const [name, setName] = useState("");
	const [allergies, setAllergies] = useState("");
	const [restrictions, setRestrictions] = useState("");
	const [observations, setObservations] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState([]); // ⭐ VIDÉ : plus de données mockées
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

	// ⭐ AMÉLIORÉ : Utilise tableNumber si fourni, sinon "?"
	const displayTableNumber = tableNumber || "?";

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
			const token = await clientAuthService.getClientToken();
			const clientId = await getOrCreateClientId();

			const body = {
				clientName: name.trim(),
				clientId: clientId, // ⭐ ENVOYER le clientId
				allergies,
				restrictions,
				notes: observations,
				tableId: tableId,
				restaurantId:
					restaurantId || (await AsyncStorage.getItem("restaurantId")),
				reservationDate: new Date().toISOString(),
				reservationTime: `${String(new Date().getHours()).padStart(
					2,
					"0"
				)}:${String(new Date().getMinutes()).padStart(2, "0")}`,
			};

			console.log("Création réservation avec:", body);

			const response = await fetch(
				"http://192.168.1.185:3000/reservations/client/reservations",
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
				console.log("Réponse serveur brute:", text);
				Alert.alert("Erreur", "Réponse serveur inattendue.");
				setLoading(false);
				return;
			}

			if (!response.ok) {
				console.log("Erreur serveur:", data);
				Alert.alert(
					"Erreur",
					data.message || "Erreur lors de la création de la réservation."
				);
				setLoading(false);
				return;
			}

			// ⭐ SIMPLIFIÉ : Plus de distinction joinable/non-joinable
			// L'API retourne toujours la réservation créée/rejointe
			const reservationId = data._id || data.reservation?._id;

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

			console.log("✅ Réservation créée:", {
				reservationId,
				tableId,
				tableNumber,
				clientId,
				clientName: name.trim(),
			});

			// ⭐ RETOURNER toutes les infos nécessaires au parent
			onJoin?.(name.trim(), reservationId, tableId, tableNumber, clientId);

			Alert.alert(
				"✅ Succès",
				`Bienvenue ${name.trim()} !\nVous êtes à la table ${displayTableNumber}.`,
				[{ text: "OK" }]
			);
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
					<Text style={styles.subtitle}>
						Vous êtes à la table{" "}
						<Text style={styles.tableHighlight}>{displayTableNumber}</Text>
					</Text>

					{/* 👥 Participants List (if any) */}
					{participants.length > 0 && (
						<View style={styles.participantsContainer}>
							<BlurView
								intensity={20}
								tint="light"
								style={styles.participantsBlur}
							>
								<Text style={styles.participantsTitle}>
									Déjà à cette table :
								</Text>
								<FlatList
									data={participants}
									keyExtractor={(item, index) => index.toString()}
									renderItem={({ item }) => (
										<View style={styles.participantItem}>
											<MaterialIcons
												name="person"
												size={16}
												color={PREMIUM_COLORS.primary[0]}
											/>
											<Text style={styles.participantName}>{item}</Text>
										</View>
									)}
									scrollEnabled={false}
								/>
							</BlurView>
						</View>
					)}

					{/* 📋 Form Card */}
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
							<Animated.View
								style={[
									styles.inputWrapper,
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
								<View style={styles.inputContainer}>
									<LinearGradient
										colors={PREMIUM_COLORS.secondary}
										style={styles.inputIcon}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons name="warning" size={20} color="#fff" />
									</LinearGradient>
									<TextInput
										style={styles.input}
										placeholder="Allergies éventuelles"
										value={allergies}
										onChangeText={setAllergies}
										placeholderTextColor="#999"
										editable={!loading}
									/>
								</View>
							</Animated.View>

							{/* Restrictions Dropdown */}
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
											!loading && setShowRestrictionsOptions((prev) => !prev)
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
											name={
												showRestrictionsOptions ? "expand-less" : "expand-more"
											}
											size={24}
											color="#667eea"
										/>
									</TouchableOpacity>

									{showRestrictionsOptions && !loading && (
										<View style={styles.dropdownList}>
											{[
												"Aucune",
												"Halal",
												"Casher",
												"Vegan",
												"Gluten Free",
											].map((option, index) => (
												<TouchableOpacity
													key={option}
													style={[
														styles.dropdownItem,
														restrictions === option &&
															styles.dropdownItemSelected,
														index === 0 && styles.dropdownItemFirst,
														index === 4 && styles.dropdownItemLast,
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
															styles.dropdownItemText,
															restrictions === option &&
																styles.dropdownItemTextSelected,
														]}
													>
														{option}
													</Text>
													{restrictions === option && (
														<MaterialIcons
															name="check"
															size={20}
															color="#fff"
														/>
													)}
												</TouchableOpacity>
											))}
										</View>
									)}
								</View>
							</Animated.View>

							{/* Observations Input */}
							<Animated.View
								style={[
									styles.inputWrapper,
									{
										opacity: inputAnimations[3],
										transform: [
											{
												translateX: inputAnimations[3].interpolate({
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
										colors={PREMIUM_COLORS.success}
										style={styles.inputIcon}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									>
										<MaterialIcons name="notes" size={20} color="#fff" />
									</LinearGradient>
									<TextInput
										style={styles.input}
										placeholder="Observations (optionnel)"
										value={observations}
										onChangeText={setObservations}
										placeholderTextColor="#999"
										editable={!loading}
									/>
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

					{/* 🔧 Debug Info (dev only) */}
					{__DEV__ && tableId && (
						<View style={styles.debugInfo}>
							<Text style={styles.debugText}>
								Table ID: {tableId.substring(0, 10)}...
							</Text>
							{tableNumber && (
								<Text style={styles.debugText}>Numéro: {tableNumber}</Text>
							)}
						</View>
					)}
				</Animated.View>
			</KeyboardAvoidingView>
		</LinearGradient>
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
	participantsTitle: {
		fontWeight: "700",
		marginBottom: 12,
		color: "#333",
		fontSize: 16,
	},
	participantItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 6,
		gap: 8,
	},
	participantName: {
		fontSize: 15,
		color: "#444",
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
		overflow: "visible",
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
		zIndex: 1,
	},
	dropdownWrapper: {
		position: "relative",
		// ⭐ AJOUTEZ :
		overflow: "visible",
		zIndex: 1000,
	},
	dropdownText: {
		flex: 1,
		padding: 14,
		fontSize: 16,
		color: "#333",
		zIndex: 1000,
	},
	dropdownPlaceholder: {
		color: "#999",
		zIndex: 1000,
	},
	dropdownList: {
		position: "absolute",
		top: "100%",
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		borderRadius: 16,
		marginTop: 8,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 16,
		elevation: 12,
		zIndex: 100000,
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		paddingHorizontal: 16,
		overflow: "hidden",
		zIndex: 100000,
	},
	dropdownItemFirst: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	dropdownItemLast: {
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
	},
	dropdownItemSelected: {
		backgroundColor: "transparent",
	},
	dropdownItemText: {
		fontSize: 16,
		color: "#333",
	},
	dropdownItemTextSelected: {
		fontWeight: "bold",
		color: "#fff",
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
		zIndex: 1,
		overflow: "hidden",
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	loadingSpinner: {
		// Spinning handled via Animated if needed
	},
	debugInfo: {
		marginTop: 24,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	debugText: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 11,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
	},
});
