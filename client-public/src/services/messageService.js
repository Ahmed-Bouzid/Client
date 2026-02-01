/**
 * Service de messagerie client → serveur
 * Gère les messages prédéfinis et l'envoi de messages
 */

import { API_CONFIG } from "../../../shared-api/config/apiConfig.js";
import { getRestaurantId } from "../../../shared-api/utils/getRestaurantId.js";

export const messageService = {
	/**
	 * Récupère tous les messages prédéfinis disponibles
	 * @returns {Promise<Array>} Liste des messages prédéfinis
	 */
	async fetchPredefinedMessages() {
		try {
			const restaurantId = await getRestaurantId();
			const url = `${API_CONFIG.BASE_URL}/client-messages/predefined/${restaurantId}`;

			console.log("📨 Récupération messages prédéfinis...");

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Erreur ${response.status}: ${await response.text()}`);
			}

			const data = await response.json();
			console.log(
				`✅ ${data.messages?.length || 0} messages prédéfinis récupérés`,
			);
			return data.messages || [];
		} catch (error) {
			console.error("❌ Erreur récupération messages:", error.message);
			throw error;
		}
	},

	/**
	 * Envoie un message au serveur
	 * @param {Object} params - Paramètres du message
	 * @param {string} params.predefinedMessageId - ID du message prédéfini
	 * @param {string} params.reservationId - ID de la réservation
	 * @param {string} params.clientId - ID du client
	 * @param {string} params.clientName - Nom du client
	 * @returns {Promise<Object>} Résultat de l'envoi
	 */
	async sendMessage({
		predefinedMessageId,
		reservationId,
		clientId,
		clientName,
	}) {
		try {
			const url = `${API_CONFIG.BASE_URL}/client-messages/send`;

			console.log(`📤 Envoi message: ${predefinedMessageId}`);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					predefinedMessageId,
					reservationId,
					clientId,
					clientName,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Erreur ${response.status}`);
			}

			const data = await response.json();
			console.log("✅ Message envoyé avec succès:", data.data?.messageText);
			return data;
		} catch (error) {
			console.error("❌ Erreur envoi message:", error.message);
			throw error;
		}
	},

	/**
	 * Récupère l'historique des messages d'une réservation
	 * @param {string} reservationId - ID de la réservation
	 * @returns {Promise<Array>} Historique des messages
	 */
	async getMessageHistory(reservationId) {
		try {
			const url = `${API_CONFIG.BASE_URL}/client-messages/history/${reservationId}`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Erreur ${response.status}`);
			}

			const data = await response.json();
			return data.messages || [];
		} catch (error) {
			console.error("❌ Erreur récupération historique:", error.message);
			return [];
		}
	},

	/**
	 * 💬 Récupère la conversation complète (messages client + réponses serveur)
	 * @param {string} reservationId - ID de la réservation
	 * @returns {Promise<Array>} Conversation fusionnée (client + server) triée chronologiquement
	 */
	async fetchConversation(reservationId) {
		try {
			const url = `${API_CONFIG.BASE_URL}/client-messages/conversation/${reservationId}`;

			console.log(`💬 Récupération conversation: ${reservationId}`);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Erreur ${response.status}`);
			}

			const data = await response.json();
			console.log(
				`✅ Conversation récupérée: ${data.conversation?.length || 0} messages`,
			);
			return data.conversation || [];
		} catch (error) {
			console.error("❌ Erreur récupération conversation:", error.message);
			return [];
		}
	},

	/**
	 * 🔧 Vérifie si la messagerie est activée pour ce restaurant
	 * @param {string} restaurantId - ID du restaurant
	 * @returns {Promise<boolean>} true si messagerie activée
	 */
	async checkMessagingStatus(restaurantId) {
		try {
			const url = `${API_CONFIG.BASE_URL}/client-messages/messaging-status/${restaurantId}`;

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.warn(
					`⚠️ Erreur vérification messagerie (${response.status}), activation par défaut`,
				);
				return true; // Par défaut on active
			}

			const data = await response.json();
			console.log(
				`🔧 Messagerie ${data.isMessagingEnabled ? "activée" : "désactivée"}`,
			);
			return data.isMessagingEnabled;
		} catch (error) {
			console.error("❌ Erreur vérification messagerie:", error.message);
			return true; // Par défaut on active en cas d'erreur
		}
	},
};
