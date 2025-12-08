import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	FlatList,
	ImageBackground,
} from "react-native";
import { useTableStore } from "../stores/useTableStore.js";

export default function JoinOrCreateTable({
	tableId = null,
	onJoin,
}) {
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState(["Alice", "Bob", "Charlie"]);

	const { joinTable, tableId: storeTableId, restaurantId } = useTableStore();
	const finalTableId = tableId || storeTableId;

	const handleJoin = async () => {
		if (!name.trim()) {
			setError("Veuillez entrer un nom pour la table.");
			return;
		}

		if (!finalTableId) {
			setError("TableId manquant. Veuillez scanner le QR code de la table ou contacter le serveur.");
			return;
		}

		try {
			// Passer restaurantId depuis le store
			await joinTable(name, finalTableId, restaurantId);
			setError("");
			setParticipants((prev) => [...prev, name]);
			onJoin(name);
			setName("");
		} catch (err) {
			setError(err.message || "Erreur lors de la connexion");
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
					Bienvenue à vous. Vous êtes à la table {finalTableId?.number || finalTableId || "?"}
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
