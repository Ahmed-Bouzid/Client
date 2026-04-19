import { API_CONFIG } from "../config/apiConfig.js";
import { clientAuthService } from "./clientAuthService.js";

export const orderService = {
	/**
	 * Crée une nouvelle commande
	 */
	async createOrder({
		tableId,
		items,
		total,
		restaurantId,
		serverId = null,
		reservationId, // ⭐ AJOUTER
		clientId, // ⭐ AJOUTER
		clientName, // ⭐ AJOUTER
		clientPhone = null, // 📱 AJOUTER
		status = "in_progress",
		origin = "client",
	}) {
		try {
			const headers = await clientAuthService.getAuthHeaders({
				"Content-Type": "application/json",
			});

			if (!headers) {
				throw new Error(
					"Session expirée. Veuillez vous reconnecter en scannant le QR code.",
				);
			}

			const response = await fetch(`${API_CONFIG.BASE_URL}/orders/`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					tableId,
					items,
					total,
					restaurantId,
					reservationId, // ⭐ UTILISER LE PARAMÈTRE
					clientId, // ⭐ UTILISER LE PARAMÈTRE
					clientName, // ⭐ UTILISER LE PARAMÈTRE
					clientPhone, // 📱 UTILISER LE PARAMÈTRE
					serverId: null,
					status: status,
					origin: origin,
				}),
			});

			if (!response.ok) {
				let errorMessage = "Erreur lors de la création de la commande";
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch (e) {
					// Si ce n'est pas du JSON, ignorer
				}
				throw new Error(errorMessage);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur création commande:", error);
			throw error;
		}
	},

	/**
	 * Récupère la commande active pour un token
	 */
	async getActiveOrder() {
		try {
			const headers = await clientAuthService.getAuthHeaders();
			if (!headers) {
				return null;
			}

			const response = await fetch(`${API_CONFIG.BASE_URL}/orders/active`, {
				headers,
			});

			if (!response.ok) {
				if (response.status === 401 || response.status === 403) {
					await clientAuthService.clearClientToken();
					return null;
				}
				return null;
			}

			const orders = await response.json();
			if (orders.length === 0) return null;

			// Trouver la commande non payée et non complétée
			const activeOrder = orders.find(
				(order) => !order.paid && order.status !== "completed",
			);
			return activeOrder || null;
		} catch (error) {
			console.error("❌ Erreur récupération commande active:", error);
			return null;
		}
	},

	/**
	 * Récupère toutes les commandes d'une réservation
	 * @param {string} reservationId - ID de la réservation
	 * @param {string} [clientId] - ID du client (pour foodtruck multi-user)
	 */
	async getOrdersByReservation(reservationId, clientId = null) {
		try {
			const headers = await clientAuthService.getAuthHeaders({
				"Content-Type": "application/json",
			});
			if (!headers) {
				throw new Error("Token manquant");
			}

			// ⭐ Ajouter clientId en query param si fourni (foodtruck)
			const url = clientId
				? `${API_CONFIG.BASE_URL}/client-orders/${reservationId}?clientId=${clientId}`
				: `${API_CONFIG.BASE_URL}/client-orders/${reservationId}`;

			const response = await fetch(url, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				let errorText = "Erreur lors de la récupération des commandes";
				try {
					const errorData = await response.json();
					errorText = errorData.message || errorText;
				} catch (e) {
					// Si ce n'est pas du JSON, utiliser le message par défaut
				}

				if (response.status === 401 || response.status === 403) {
					await clientAuthService.clearClientToken();
					throw new Error("Session expirée. Veuillez vous reconnecter.");
				}
				throw new Error(errorText);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur getOrdersByReservation:", error);
			throw error;
		}
	},

	/**
	 * Déclare un paiement au comptoir (fast-food)
	 */
	async declareCounterPayment(orderId) {
		try {
			const headers = await clientAuthService.getAuthHeaders({
				"Content-Type": "application/json",
			});
			if (!headers) {
				throw new Error("Token manquant");
			}

			const response = await fetch(
				`${API_CONFIG.BASE_URL}/client-orders/${orderId}/counter-payment`,
				{
					method: "PUT",
					headers,
				},
			);

			if (!response.ok) {
				let errorText = "Erreur lors de la déclaration";
				try {
					const errorData = await response.json();
					errorText = errorData.message || errorText;
				} catch (e) {
					// pas du JSON
				}
				throw new Error(errorText);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur déclaration paiement comptoir:", error);
			throw error;
		}
	},

	/**
	 * Annule une commande
	 */
	async cancelOrder(orderId) {
		try {
			const headers = await clientAuthService.getAuthHeaders({
				"Content-Type": "application/json",
			});
			if (!headers) {
				throw new Error("Token manquant");
			}

			const response = await fetch(
				`${API_CONFIG.BASE_URL}/client-orders/${orderId}/cancel`,
				{
					method: "PUT",
					headers,
				},
			);

			if (!response.ok) {
				let errorText = "Erreur lors de l'annulation";
				try {
					const errorData = await response.json();
					errorText = errorData.message || errorText;
				} catch (e) {
					// pas du JSON
				}
				throw new Error(errorText);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur annulation commande:", error);
			throw error;
		}
	},

	/**
	 * Marque une commande comme payée
	 */
	async markAsPaid(orderId) {
		try {
			const headers = await clientAuthService.getAuthHeaders({
				"Content-Type": "application/json",
			});
			if (!headers) {
				throw new Error("Token manquant");
			}

			const response = await fetch(
				`${API_CONFIG.BASE_URL}/orders/${orderId}/mark-as-paid`,
				{
					method: "POST",
					headers,
				},
			);

			if (!response.ok) {
				let errorText = "Le paiement a échoué";
				try {
					const errorData = await response.json();
					errorText = errorData.message || errorText;
				} catch (e) {
					// Si ce n'est pas du JSON, utiliser le message par défaut
				}

				if (response.status === 401 || response.status === 403) {
					await clientAuthService.clearClientToken();
					throw new Error("Session expirée. Veuillez vous reconnecter.");
				}
				throw new Error(errorText);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			throw error;
		}
	},
};
