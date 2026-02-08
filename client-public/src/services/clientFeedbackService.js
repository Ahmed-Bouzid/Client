/**
 * 🌟 Service ClientFeedback - Communication avec l'API backend pour avis clients
 *
 * Fonctionnalités:
 * - Soumission de feedback client
 * - Gestion des erreurs et fallbacks
 * - Intégration avec stores Zustand
 */

import { API_CONFIG } from "../config/apiConfig";

class ClientFeedbackService {
	constructor() {
		this.baseURL = `${API_CONFIG.BASE_URL}/client-feedback`;
	}

	/**
	 * 📝 Soumettre un feedback client
	 * @param {Object} feedbackData - Données du feedback
	 * @returns {Promise<Object>} Réponse API
	 */
	async submitFeedback(feedbackData) {
		console.log(
			"📝 [CLIENT-FEEDBACK-SERVICE] Soumission feedback:",
			feedbackData,
		);

		try {
			const response = await fetch(`${this.baseURL}/submit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(feedbackData),
			});

			const data = await response.json();

			console.log("✅ [CLIENT-FEEDBACK-SERVICE] Réponse API:", data);

			if (!response.ok) {
				throw new Error(data.message || "Erreur lors de la soumission");
			}

			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error("❌ [CLIENT-FEEDBACK-SERVICE] Erreur soumission:", error);

			// Retourner un objet cohérent même en cas d'erreur
			return {
				success: false,
				error: error.message,
				// Action par défaut : toujours permettre l'accès à Google
				action: "redirect_to_google",
				message:
					"Erreur technique, mais vous pouvez toujours laisser un avis sur Google",
			};
		}
	}

	/**
	 * 📊 Récupérer les statistiques d'un restaurant (pour usage interne)
	 * @param {string} restaurantId - ID du restaurant
	 * @param {number} days - Nombre de jours (défaut: 30)
	 * @returns {Promise<Object>} Statistiques
	 */
	async getRestaurantStats(restaurantId, days = 30) {
		console.log(
			`📊 [CLIENT-FEEDBACK-SERVICE] Stats restaurant ${restaurantId} (${days} jours)`,
		);

		try {
			const response = await fetch(
				`${this.baseURL}/stats/${restaurantId}?days=${days}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || "Erreur lors de la récupération des stats",
				);
			}

			console.log("✅ [CLIENT-FEEDBACK-SERVICE] Stats récupérées:", data.data);
			return {
				success: true,
				data: data.data,
			};
		} catch (error) {
			console.error("❌ [CLIENT-FEEDBACK-SERVICE] Erreur stats:", error);
			return {
				success: false,
				error: error.message,
				data: null,
			};
		}
	}

	/**
	 * 💡 Récupérer les feedbacks d'amélioration d'un restaurant (pour usage interne)
	 * @param {string} restaurantId - ID du restaurant
	 * @param {number} limit - Limite de résultats (défaut: 50)
	 * @returns {Promise<Object>} Feedbacks d'amélioration
	 */
	async getImprovementFeedback(restaurantId, limit = 50) {
		console.log(
			`💡 [CLIENT-FEEDBACK-SERVICE] Feedbacks amélioration restaurant ${restaurantId}`,
		);

		try {
			const response = await fetch(
				`${this.baseURL}/improvement/${restaurantId}?limit=${limit}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || "Erreur lors de la récupération des feedbacks",
				);
			}

			console.log(
				`✅ [CLIENT-FEEDBACK-SERVICE] ${data.count} feedbacks récupérés`,
			);
			return {
				success: true,
				data: data.data,
				count: data.count,
			};
		} catch (error) {
			console.error("❌ [CLIENT-FEEDBACK-SERVICE] Erreur feedbacks:", error);
			return {
				success: false,
				error: error.message,
				data: [],
				count: 0,
			};
		}
	}

	/**
	 * 🧪 Tester la connexion API
	 * @returns {Promise<Object>} Statut du service
	 */
	async testConnection() {
		console.log("🧪 [CLIENT-FEEDBACK-SERVICE] Test connexion API");

		try {
			const response = await fetch(`${this.baseURL}/test`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},

			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error("Service indisponible");
			}

			console.log(
				"✅ [CLIENT-FEEDBACK-SERVICE] Service opérationnel:",
				data.message,
			);
			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error(
				"❌ [CLIENT-FEEDBACK-SERVICE] Service indisponible:",
				error,
			);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 🔄 Marquer une redirection vers Google (optionnel)
	 * @param {string} feedbackId - ID du feedback
	 * @returns {Promise<Object>} Résultat
	 */
	async markGoogleRedirect(feedbackId) {
		console.log(
			"🔄 [CLIENT-FEEDBACK-SERVICE] Marquage redirection Google:",
			feedbackId,
		);

		try {
			// Note: Cette fonctionnalité peut être ajoutée plus tard si besoin
			// Pour l'instant, on se contente de logger
			return {
				success: true,
				message: "Redirection marquée (local)",
			};
		} catch (error) {
			console.error("❌ [CLIENT-FEEDBACK-SERVICE] Erreur marquage:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}
}

// Export de l'instance singleton
const clientFeedbackService = new ClientFeedbackService();
export default clientFeedbackService;
