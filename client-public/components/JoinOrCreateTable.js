import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	FlatList,
	ScrollView,
	ImageBackground,
} from "react-native";

export default function JoinOrCreateTable({
	tableId = "686af692bb4cba684ff3b757",
	onJoin,
}) {
	console.log("🔹 JoinOrCreateTable mounted"); // <--- ajouté
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState(["Alice", "Bob", "Charlie"]);

	const handleJoin = async () => {
		if (!name.trim()) {
			setError("Veuillez entrer un nom pour la table.");
			return;
		}

		try {
			const res = await fetch("http://192.168.1.185:3000/client/token", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pseudo: name,
					tableId: tableId,
					restaurantId: "686af511bb4cba684ff3b72e",
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Erreur serveur");

			// ✅ Stocker le token côté client
			await AsyncStorage.setItem("clientToken", data.token);

			setError("");
			setParticipants((prev) => [...prev, name]);
			onJoin(name);
			setName("");
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<ImageBackground
			source={require("../../assets/images/background.webp")}
			style={styles.background}
			resizeMode="cover"
		>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? -300 : 0}
			>
				<Text style={styles.title}>
					Bienvenue à vous. Vous êtes à la table {tableId.number || tableId}
				</Text>

				{participants.length > 0 && (
					<View style={styles.participantsContainer}>
						<Text style={styles.subtitle}>Déjà inscrits :</Text>
						<FlatList
							data={participants}
							keyExtractor={(item, index) => index.toString()}
							renderItem={({ item }) => (
								<Text style={styles.participant}>{item}</Text>
							)}
							scrollEnabled={false}
						/>
					</View>
				)}

				<TextInput
					style={styles.input}
					placeholder="Votre nom / pseudo"
					value={name}
					onChangeText={setName}
					autoCapitalize="words"
					placeholderTextColor="#888"
				/>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<TouchableOpacity
					style={[styles.button, !name.trim() && styles.buttonDisabled]}
					onPress={handleJoin}
					disabled={!name.trim()}
				>
					<Text style={styles.buttonText}>Rejoindre la table</Text>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		width: "100%",
	},
	title: {
		fontSize: 35,
		fontWeight: "bold",
		marginBottom: 25,
		textAlign: "center",
		color: "#ffffffff",
	},
	participantsContainer: {
		width: "80%",
		backgroundColor: "#fff",
		padding: 10,
		marginBottom: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ccc",
	},
	subtitle: {
		fontWeight: "bold",
		marginBottom: 5,
		color: "#555",
	},
	participant: {
		fontSize: 16,
		color: "#333",
		paddingVertical: 2,
	},
	input: {
		width: "80%",
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#fff",
		marginBottom: 10,
		fontSize: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	error: {
		color: "red",
		marginBottom: 15,
		fontSize: 14,
	},
	button: {
		backgroundColor: "#4CAF50",
		paddingVertical: 14,
		paddingHorizontal: 40,
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 2,
	},
	buttonDisabled: {
		backgroundColor: "#a5d6a7",
	},
	buttonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
		textAlign: "center",
	},
});
