/**
 * orderLookupService.js — Service de recherche de commande par numéro
 *
 * Recherche une commande via son code CMD (ex: #FA24).
 */

import { API_CONFIG } from "shared-api/config/apiConfig.js";

function normalizeCmdCode(value) {
	const cleaned = String(value || "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 4);

	if (!cleaned) return "";
	return `#${cleaned}`;
}

/**
 * Recherche une commande par code CMD (#FA24)
 * @param {string} orderNumber - Format #XXXX
 * @param {{restaurantId?: string}} options
 * @returns {Promise<object|null>} Détails de la commande ou null
 */
export async function lookupOrderByNumber(orderNumber, options = {}) {
	const cmdCode = normalizeCmdCode(orderNumber);
	const restaurantId = options.restaurantId || null;

	if (!cmdCode || !restaurantId) {
		return null;
	}

	const encodedCode = encodeURIComponent(cmdCode);
	const url = `${API_CONFIG.BASE_URL}/client-orders/lookup/${encodedCode}?restaurantId=${encodeURIComponent(
		restaurantId,
	)}`;

	const response = await fetch(url, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Erreur serveur: ${response.status}`);
	}

	const data = await response.json();
	if (!data?.order) return null;

	return {
		orderId: data.order.id,
		orderNumber: data.order.cmdCode,
		restaurantId: data.order.restaurantId || null,
		date: data.order.createdAt,
		status: data.order.status,
		trackingStatus: data.order.trackingStatus,
		paymentStatus: data.order.paymentStatus,
		paymentMethod: data.order.paymentMethod,
		items: data.order.items || [],
		total: Number(data.order.totalAmount) || 0,
		paidAmount: Number(data.order.paidAmount) || 0,
		paid: !!data.order.paid,
		tableNumber: data.order.tableNumber || null,
		tableId: data.order.tableId || null,
		clientId: data.order.clientId || null,
		clientName: data.order.clientName || null,
		reservationId: data.order.reservationId || null,
		payment: data.payment || null,
		timeline: Array.isArray(data.timeline) ? data.timeline : [],
		serverTime: data.serverTime,
	};
}
