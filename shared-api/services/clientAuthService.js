import { API_CONFIG } from "../config/apiConfig.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const clientAuthService = {
	async getClientToken() {
		try {
			// 1. Vérifier si on a déjà un token
			let token = await AsyncStorage.getItem("clientToken");

			// 2. Si pas de token, en demander un nouveau
			if (!token) {
				console.log("🔹 Génération nouveau token client...");

				const response = await fetch(
					`${API_CONFIG.BASE_URL}/auth/client-token`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							restaurantId: API_CONFIG.RESTAURANT_ID,
						}),
					}
				);

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
