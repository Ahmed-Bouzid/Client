import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig.js";

/**
 * Service d'authentification client PUBLIC
 * Génère un JWT client via le backend (POST /client/token) et le stocke localement.
 */
export const clientAuthService = {
	/**
	 * Retourne le JWT client stocké, ou en génère un nouveau si des paramètres sont fournis.
	 *
	 * Cas 1 - Au moment du join (avec params) :
	 *   appelle POST /client/token → reçoit un JWT → le stocke → le retourne
	 *
	 * Cas 2 - Au moment de la commande (sans params) :
	 *   lit le JWT dans AsyncStorage et le retourne
	 *
	 * @param {string} [clientName] - Pseudo du client (requis au join)
	 * @param {string} [tableId]    - ID de la table (requis au join)
	 * @param {string} [restaurantId] - ID du restaurant (requis au join)
	 * @returns {Promise<string|null>} JWT ou null si aucun token disponible
	 */
	async getClientToken(clientName, tableId, restaurantId) {
		try {
			// Cas 1 : paramètres fournis → obtenir un nouveau JWT depuis le backend
			if (clientName && restaurantId) {
				const response = await fetch(`${API_CONFIG.BASE_URL}/client/token`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						pseudo: clientName,
						tableId: tableId || null,
						restaurantId,
					}),
				});

				if (!response.ok) {
					console.warn(
						"⚠️ Échec génération token client (backend):",
						response.status,
					);
					// Fallback : retourner le token stocké si disponible
					return await AsyncStorage.getItem("clientToken");
				}

				const data = await response.json();
				const token = data.token;

				if (token) {
					await AsyncStorage.setItem("clientToken", token);
					return token;
				}

				return null;
			}

			// Cas 2 : pas de params → retourner le token stocké
			const stored = await AsyncStorage.getItem("clientToken");
			if (stored) {
				return stored;
			}

			console.warn("⚠️ Aucun token client disponible");
			return null;
		} catch (error) {
			console.error("❌ Erreur getClientToken:", error);
			// Fallback : essayer le token stocké
			try {
				return await AsyncStorage.getItem("clientToken");
			} catch {
				return null;
			}
		}
	},

	async clearClientToken() {
		await AsyncStorage.removeItem("clientToken");
	},
};
