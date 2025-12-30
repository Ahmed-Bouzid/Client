import { API_CONFIG } from "../config/apiConfig.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const clientAuthService = {
	/**
	 * Génère ou récupère le token client.
	 * @param {string} [pseudoParam] - Pseudo à utiliser (prioritaire sur AsyncStorage)
	 */
	async getClientToken(pseudoParam) {
		try {
			// 1. Vérifier si on a déjà un token
			let token = await AsyncStorage.getItem("clientToken");

			// 2. Si pas de token, en demander un nouveau
			if (!token) {
				console.log("🔹 Génération nouveau token client...");

				// Utiliser le pseudo passé en paramètre si dispo, sinon AsyncStorage
				let pseudo = pseudoParam;
				if (pseudoParam) {
					await AsyncStorage.setItem("pseudo", pseudoParam);
					console.log("[DEBUG] Pseudo fourni et stocké:", pseudoParam);
				} else {
					pseudo = await AsyncStorage.getItem("pseudo");
					console.log("[DEBUG] Pseudo récupéré AsyncStorage:", pseudo);
				}
				const tableId = await AsyncStorage.getItem("tableId");
				const restaurantId = API_CONFIG.RESTAURANT_ID;

				if (!pseudo || !tableId || !restaurantId) {
					console.log(
						"[DEBUG getClientToken] pseudo:",
						pseudo,
						", tableId:",
						tableId,
						", restaurantId:",
						restaurantId
					);
					throw new Error(
						"pseudo, tableId ou restaurantId manquant pour la génération du token client"
					);
				}

				const response = await fetch(`${API_CONFIG.BASE_URL}/client/token`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						pseudo,
						tableId,
						restaurantId,
					}),
				});

				if (!response.ok) {
					throw new Error("Erreur génération token client");
				}

				const data = await response.json();
				token = data.token;

				// 3. Stocker le token
				await AsyncStorage.setItem("clientToken", token);
				console.log("✅ Token client généré et stocké");
			}

			return token;
		} catch (error) {
			console.error("❌ Erreur getClientToken:", error);
			throw error;
		}
	},

	async clearClientToken() {
		await AsyncStorage.removeItem("clientToken");
	},
};
