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
	Alert,
} from "react-native";
import { clientAuthService } from "../../shared-api/services/clientAuthService.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTableStore } from "../stores/useTableStore.js";
import RNUUID from "react-native-uuid";

export default function JoinOrCreateTable({
	tableId = null,
	tableNumber = null, // ⭐ NOUVEAU : Numéro de table pour affichage
	onJoin,
}) {
	const [name, setName] = useState("");
	const [allergies, setAllergies] = useState("");
	const [restrictions, setRestrictions] = useState("");
	const [observations, setObservations] = useState("");
	const [error, setError] = useState("");
	const [participants, setParticipants] = useState([]); // ⭐ VIDÉ : plus de données mockées
	const [showRestrictionsOptions, setShowRestrictionsOptions] = useState(false);
	const [loading, setLoading] = useState(false);

	const { restaurantId } = useTableStore();

	// ⭐ AMÉLIORÉ : Utilise tableNumber si fourni, sinon "?"
	const displayTableNumber = tableNumber || "?";

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
			onJoin(name.trim(), reservationId, tableId, tableNumber, clientId);

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
					Bienvenue à vous. Vous êtes à la table {displayTableNumber}
				</Text>

				{participants.length > 0 && (
					<View style={styles.participantsContainer}>
						<Text style={styles.subtitle}>Déjà à cette table :</Text>
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
					editable={!loading}
				/>
				<TextInput
					style={styles.input}
					placeholder="Allergies éventuelles"
					value={allergies}
					onChangeText={setAllergies}
					placeholderTextColor="#888"
					editable={!loading}
				/>
				<View style={styles.inputContainer}>
					<TouchableOpacity
						style={[styles.inputLikeButton, loading && styles.inputDisabled]}
						onPress={() =>
							!loading && setShowRestrictionsOptions((prev) => !prev)
						}
						disabled={loading}
					>
						<Text
							style={[styles.inputText, !restrictions && { color: "#888" }]}
						>
							{restrictions || "Restrictions alimentaires"}
						</Text>
					</TouchableOpacity>
					{showRestrictionsOptions && !loading && (
						<View style={styles.dropdownList}>
							{["Aucune", "Halal", "Casher", "Vegan", "Gluten Free"].map(
								(option) => (
									<TouchableOpacity
										key={option}
										style={[
											styles.dropdownItem,
											restrictions === option && styles.dropdownItemSelected,
										]}
										onPress={() => {
											setRestrictions(option);
											setShowRestrictionsOptions(false);
										}}
									>
										<Text
											style={[
												styles.dropdownItemText,
												restrictions === option &&
													styles.dropdownItemTextSelected,
											]}
										>
											{option}
										</Text>
									</TouchableOpacity>
								)
							)}
						</View>
					)}
				</View>

				<TextInput
					style={styles.input}
					placeholder="Observations (optionnel)"
					value={observations}
					onChangeText={setObservations}
					placeholderTextColor="#888"
					editable={!loading}
				/>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<TouchableOpacity
					style={[
						styles.button,
						(!name.trim() || loading) && styles.buttonDisabled,
					]}
					onPress={handleJoin}
					disabled={!name.trim() || loading}
				>
					{loading ? (
						<Text style={styles.buttonText}>Chargement...</Text>
					) : (
						<Text style={styles.buttonText}>
							{tableId ? "Rejoindre la table" : "Créer une table"}
						</Text>
					)}
				</TouchableOpacity>

				{/* ⭐ INFO : Afficher les IDs pour debug */}
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
		color: "#fff",
		textShadowColor: "rgba(0, 0, 0, 0.3)",
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	participantsContainer: {
		width: "80%",
		backgroundColor: "rgba(255, 255, 255, 0.9)",
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
		fontSize: 14,
	},
	participant: {
		fontSize: 14,
		color: "#333",
		paddingVertical: 2,
		paddingHorizontal: 5,
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
		color: "#000",
	},
	inputDisabled: {
		backgroundColor: "#f5f5f5",
		opacity: 0.7,
	},
	error: {
		color: "#ff6b6b",
		marginBottom: 15,
		fontSize: 14,
		textAlign: "center",
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		padding: 8,
		borderRadius: 6,
		width: "80%",
	},
	button: {
		backgroundColor: "#4CAF50",
		paddingVertical: 14,
		paddingHorizontal: 40,
		borderRadius: 10,
		marginTop: 10,
	},
	buttonDisabled: {
		backgroundColor: "#a5d6a7",
		opacity: 0.7,
	},
	buttonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
		textAlign: "center",
	},
	inputContainer: {
		width: "80%",
		marginBottom: 10,
		alignSelf: "center",
	},
	inputLikeButton: {
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ccc",
		paddingVertical: 12,
		paddingHorizontal: 12,
		justifyContent: "center",
	},
	inputText: {
		fontSize: 16,
		color: "#000",
	},
	dropdownList: {
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#ccc",
		marginTop: 4,
		overflow: "hidden",
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	dropdownItem: {
		paddingVertical: 12,
		paddingHorizontal: 12,
	},
	dropdownItemSelected: {
		backgroundColor: "#e0f7fa",
	},
	dropdownItemText: {
		color: "#000",
		fontSize: 16,
	},
	dropdownItemTextSelected: {
		fontWeight: "bold",
		color: "#00796B",
	},
	debugInfo: {
		marginTop: 20,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		padding: 10,
		borderRadius: 6,
	},
	debugText: {
		color: "#fff",
		fontSize: 10,
		fontFamily: "monospace",
	},
});
