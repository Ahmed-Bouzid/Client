/**
 * Service de messagerie client → serveur
 * Gère les messages prédéfinis et l'envoi de messages
 */

import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { getRestaurantId } from "../utils/getRestaurantId.js";

export const messageService = {
	/**
	 * Récupère tous les messages prédéfinis disponibles
	 * @returns {Promise<Array>} Liste des messages prédéfinis
	 */
	async fetchPredefinedMessages() {
		try {
			const restaurantId = await getRestaurantId();
			const url = `${API_CONFIG.BASE_URL}/client-messages/predefined/${restaurantId}`;

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
			return data;
		} catch (error) {
			console.error("❌ Erreur envoi message:", error.message);
			throw error;
		}
	},

	/**
	 * Envoie un message personnalisé (texte libre)
	 * Créé un message prédéfini temporaire puis l'envoie
	 * @param {Object} params - Paramètres du message
	 * @param {string} params.messageText - Texte du message
	 * @param {string} params.reservationId - ID de la réservation
	 * @param {string} params.clientId - ID du client
	 * @param {string} params.clientName - Nom du client
	 * @returns {Promise<Object>} Résultat de l'envoi
	 */
	async sendCustomMessage({
		messageText,
		reservationId,
		clientId,
		clientName,
	}) {
		try {
			// 🎯 Créer d'abord un message prédéfini temporaire côté backend
			const restaurantId = await getRestaurantId();

			// Créer le message prédéfini temporaire
			const createResponse = await fetch(
				`${API_CONFIG.BASE_URL}/client-messages/predefined/create-temp`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						text: messageText,
						category: "autre",
						restaurantId,
					}),
				},
			);

			let predefinedMessageId;

			if (createResponse.ok) {
				const tempData = await createResponse.json();
				predefinedMessageId = tempData.data?.messageId;
			}

			// Si échec création, utiliser un ID factice et envoyer quand même
			if (!predefinedMessageId) {
				console.warn("⚠️ Impossible de créer message temporaire, envoi direct");
				// Fallback : envoyer directement sans predefinedMessageId
				// Le backend devrait accepter au moins le messageText
				predefinedMessageId = "temp-" + Date.now();
			}

			// Maintenant envoyer avec le predefinedMessageId
			const url = `${API_CONFIG.BASE_URL}/client-messages/send`;

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					predefinedMessageId,
					messageText, // Envoyer aussi le texte en secours
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
			return data;
		} catch (error) {
			console.error("❌ Erreur envoi message personnalisé:", error.message);
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
			return data.isMessagingEnabled;
		} catch (error) {
			console.error("❌ Erreur vérification messagerie:", error.message);
			return true; // Par défaut on active en cas d'erreur
		}
	},
};
