import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

export default function AdminUnlockScreen({ onUnlock }) {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async () => {
		if (!password.trim()) {
			Alert.alert("Erreur", "Veuillez entrer un mot de passe");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/admin-auth/verify-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			if (response.ok) {
				onUnlock();
			} else {
				Alert.alert("Erreur", "Mot de passe incorrect");
			}
		} catch (error) {
			console.error("Erreur:", error);
			Alert.alert("Erreur", "Impossible de vérifier le mot de passe");
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
});
