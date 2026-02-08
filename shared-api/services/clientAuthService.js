import { API_CONFIG } from "../config/apiConfig.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Service d'authentification client PUBLIC
 * Génère des tokens simples base64 (pas de JWT backend)
 * Les clients publics n'ont pas besoin d'authentification serveur
 */
export const clientAuthService = {
	/**
	 * Génère ou récupère un token client simple
	 * Format: base64({ clientId: uuid, restaurantId, timestamp })
	 */
	async getClientToken() {
		try {
			// 1. Vérifier si on a déjà un token
			let token = await AsyncStorage.getItem("clientToken");

			// 2. Si pas de token, en générer un localement
			if (!token) {
				console.log("🔹 Génération nouveau token client local...");

				// Générer un clientId unique
				const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

				const payload = {
					clientId,
					restaurantId: API_CONFIG.RESTAURANT_ID,
					timestamp: Date.now(),
					type: "client_public",
				};

				// Encoder en base64
				token = btoa(JSON.stringify(payload));

				// 3. Stocker le token
				await AsyncStorage.setItem("clientToken", token);
				console.log("✅ Token client généré et stocké:", clientId);
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
