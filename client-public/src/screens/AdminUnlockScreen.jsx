import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

const ADMIN_UNLOCK_TOKEN_KEY = "admin_unlock_token";

export default function AdminUnlockScreen({ onUnlock }) {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [biometricAvailable, setBiometricAvailable] = useState(false);
	const [biometricLabel, setBiometricLabel] = useState("Face ID");
	const [biometricReason, setBiometricReason] = useState("");

	useEffect(() => {
		const checkBiometricAvailability = async () => {
			try {
				if (Platform.OS === "ios" && Constants.appOwnership === "expo") {
					setBiometricAvailable(false);
					setBiometricReason(
						"Face ID n'est pas supporté dans Expo Go. Utilise un build dev/TestFlight.",
					);
					return;
				}

				const hasHardware = await LocalAuthentication.hasHardwareAsync();
				const isEnrolled = await LocalAuthentication.isEnrolledAsync();
				const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
				const hasBiometricEnrollment =
					enrolledLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ||
					enrolledLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;

				if (!hasHardware) {
					setBiometricAvailable(false);
					setBiometricReason("Aucun capteur biométrique détecté sur cet appareil.");
					return;
				}

				if (!isEnrolled || !hasBiometricEnrollment) {
					setBiometricAvailable(false);
					setBiometricReason("Aucune biométrie active. Active Face ID dans Réglages.");
					return;
				}

				const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
				if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
					setBiometricLabel("Face ID");
				} else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
					setBiometricLabel("Touch ID");
				} else {
					setBiometricLabel("Biométrie");
				}

				setBiometricAvailable(true);
				setBiometricReason("");
			} catch (error) {
				console.warn("⚠️ [AdminUnlock] Vérification biométrie impossible:", error);
				setBiometricAvailable(false);
				setBiometricReason("La biométrie est indisponible pour le moment.");
			}
		};

		checkBiometricAvailability();
	}, []);

	const validateAdminToken = async (token) => {
		const response = await fetch(`${API_BASE_URL}/admin-auth/restaurants`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		return response.ok;
	};

	const handleSubmit = async () => {
		const normalizedPassword = password.trim();

		if (!normalizedPassword) {
			Alert.alert("Erreur", "Veuillez entrer un mot de passe");
			return;
		}

		console.log("🔐 [AdminUnlock] Tentative déverrouillage avec mot de passe");
		setLoading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/admin-auth/verify-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: normalizedPassword }),
			});

			const data = await response.json().catch(() => ({}));

			if (response.ok) {
				if (!data?.token) {
					Alert.alert("Erreur", "Réponse admin invalide");
					return;
				}

				await AsyncStorage.setItem(ADMIN_UNLOCK_TOKEN_KEY, data.token);
				console.log("✅ [AdminUnlock] Mot de passe correct!");
				onUnlock(data.token);
			} else {
				const backendMessage = data?.error || data?.message || "Erreur inconnue";
				console.warn("❌ [AdminUnlock] Échec vérification:", {
					status: response.status,
					error: backendMessage,
				});

				if (response.status === 429) {
					Alert.alert("Trop de tentatives", "Patientez un instant puis réessayez.");
					return;
				}

				Alert.alert("Erreur", backendMessage);
			}
		} catch (error) {
			console.error("❌ [AdminUnlock] Erreur réseau:", error);
			Alert.alert("Erreur", "Impossible de vérifier le mot de passe");
		} finally {
			setLoading(false);
		}
	};

	const handleBiometricSubmit = async () => {
		if (!biometricAvailable || loading) {
			return;
		}

		console.log("🔐 [AdminUnlock] Tentative déverrouillage avec biométrie");
		setLoading(true);
		try {
			const authResult = await LocalAuthentication.authenticateAsync({
				promptMessage: `Valider avec ${biometricLabel}`,
				cancelLabel: "Annuler",
				fallbackLabel: "Utiliser le code",
				disableDeviceFallback: false,
			});

			if (!authResult.success) {
				if (authResult.error && authResult.error !== "user_cancel") {
					console.warn("❌ [AdminUnlock] Biométrie refusée:", authResult.error);
					Alert.alert(
						"Biométrie indisponible",
						"Face ID n'a pas pu valider. Utilise le mot de passe admin.",
					);
				}
				return;
			}

			const storedToken = await AsyncStorage.getItem(ADMIN_UNLOCK_TOKEN_KEY);
			if (!storedToken) {
				Alert.alert(
					"Connexion initiale requise",
					"Utilise le mot de passe une première fois pour activer le déverrouillage biométrique.",
				);
				return;
			}

			const isTokenValid = await validateAdminToken(storedToken);
			if (!isTokenValid) {
				await AsyncStorage.removeItem(ADMIN_UNLOCK_TOKEN_KEY);
				Alert.alert(
					"Session expirée",
					"Le token admin a expiré. Rentre le mot de passe pour continuer.",
				);
				return;
			}

			console.log("✅ [AdminUnlock] Déverrouillage biométrique validé");
			onUnlock(storedToken);
		} catch (error) {
			console.error("❌ [AdminUnlock] Erreur biométrique:", error);
			Alert.alert("Erreur", "Impossible d'utiliser la biométrie pour le moment");
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.container}
		>
			<View style={styles.content}>
				<Ionicons name="lock-closed" size={64} color="#333" style={styles.icon} />

				<Text style={styles.title}>Accès Admin</Text>
				<Text style={styles.subtitle}>Entrez le mot de passe pour continuer</Text>
				{!!biometricReason && <Text style={styles.biometricHint}>{biometricReason}</Text>}

				<View style={styles.inputWrapper}>
					<TextInput
						style={styles.input}
						placeholder="Mot de passe"
						secureTextEntry={!showPassword}
						value={password}
						onChangeText={setPassword}
						editable={!loading}
						placeholderTextColor="#999"
					/>
					<TouchableOpacity
						onPress={() => setShowPassword(!showPassword)}
						style={styles.eyeIcon}
					>
						<Ionicons
							name={showPassword ? "eye" : "eye-off"}
							size={20}
							color="#666"
						/>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={[styles.button, loading && styles.buttonDisabled]}
					onPress={handleSubmit}
					disabled={loading}
				>
					<Text style={styles.buttonText}>
						{loading ? "Vérification..." : "Continuer"}
					</Text>
				</TouchableOpacity>

				{biometricAvailable && (
					<TouchableOpacity
						style={[styles.biometricButton, loading && styles.buttonDisabled]}
						onPress={handleBiometricSubmit}
						disabled={loading}
					>
						<Ionicons name="scan" size={18} color="#333" />
						<Text style={styles.biometricButtonText}>Utiliser {biometricLabel}</Text>
					</TouchableOpacity>
				)}
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
		justifyContent: "center",
		padding: 20,
	},
	content: {
		alignItems: "center",
	},
	icon: {
		marginBottom: 30,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		marginBottom: 30,
		textAlign: "center",
	},
	inputWrapper: {
		width: "100%",
		maxWidth: 300,
		marginBottom: 20,
		position: "relative",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 15,
		paddingVertical: 12,
		fontSize: 16,
		backgroundColor: "white",
		paddingRight: 40,
	},
	eyeIcon: {
		position: "absolute",
		right: 12,
		top: 12,
	},
	button: {
		backgroundColor: "#333",
		paddingHorizontal: 30,
		paddingVertical: 12,
		borderRadius: 8,
		width: "100%",
		maxWidth: 300,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	biometricButton: {
		marginTop: 12,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#333",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	biometricButtonText: {
		color: "#333",
		fontSize: 14,
		fontWeight: "600",
	},
	biometricHint: {
		fontSize: 12,
		color: "#8a5a00",
		textAlign: "center",
		marginBottom: 12,
		maxWidth: 320,
	},
});
