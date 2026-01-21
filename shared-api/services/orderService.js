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
		status = "in_progress",
		origin = "client",
	}) {
		try {
			// Obtenir le token client
			const token = await clientAuthService.getClientToken();

			// Utiliser la route /orders/ avec le token
			const response = await fetch(`${API_CONFIG.BASE_URL}/orders/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					tableId,
					items,
					total,
					restaurantId,
					reservationId, // ⭐ UTILISER LE PARAMÈTRE
					clientId, // ⭐ UTILISER LE PARAMÈTRE
					clientName, // ⭐ UTILISER LE PARAMÈTRE
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
			const response = await fetch(`${API_CONFIG.BASE_URL}/orders/active`);

			if (!response.ok) {
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
	 * Marque une commande comme payée
	 */
	async markAsPaid(orderId) {
		try {
			const response = await fetch(
				`${API_CONFIG.BASE_URL}/orders/${orderId}/mark-as-paid`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
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
				throw new Error(errorText);
			}

			return await response.json();
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			throw error;
		}
	},

	/**
	 * Récupère toutes les commandes d'une réservation
	 */
	async getOrdersByReservation(reservationId) {
		try {
			const response = await fetch(
				`${API_CONFIG.BASE_URL}/client-orders/${reservationId}`,
			);

			if (!response.ok) {
				console.warn(`⚠️ Pas de commandes pour reservation ${reservationId}`);
				return { orders: [] };
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("❌ Erreur récupération commandes:", error);
			return { orders: [] };
		}
	},
};
