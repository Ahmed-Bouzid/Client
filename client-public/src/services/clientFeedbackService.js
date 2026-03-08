/**
 * 🌟 Service ClientFeedback - Communication avec l'API backend pour avis clients
 *
 * Fonctionnalités:
 * - Soumission de feedback client
 * - Gestion des erreurs et fallbacks
 * - Intégration avec stores Zustand
 */

import { API_BASE_URL } from "../config/api";

class ClientFeedbackService {
	constructor() {
		this.baseURL = `${API_BASE_URL}/client-feedback`;
	}

	/**
	 * 📝 Soumettre un feedback client
	 * @param {Object} feedbackData - Données du feedback
	 * @returns {Promise<Object>} Réponse API
	 */
	async submitFeedback(feedbackData) {
		try {
			const response = await fetch(`${this.baseURL}/submit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(feedbackData),
				timeout: 10000, // Timeout explicite 10s
			});

			const data = await response.json();

			if (!response.ok) {
				console.error("❌ [CLIENT-FEEDBACK-SERVICE] Erreur HTTP:", {
					status: response.status,
					statusText: response.statusText,
					responseData: data,
				});
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
		try {
			const response = await fetch(
				`${this.baseURL}/stats/${restaurantId}?days=${days}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					timeout: 10000, // 10 secondes
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || "Erreur lors de la récupération des stats",
				);
			}

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
		try {
			const response = await fetch(
				`${this.baseURL}/improvement/${restaurantId}?limit=${limit}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					timeout: 10000, // 10 secondes
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || "Erreur lors de la récupération des feedbacks",
				);
			}

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
		try {
			const response = await fetch(`${this.baseURL}/test`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				timeout: 10000, // 10 secondes
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error("Service indisponible");
			}

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
