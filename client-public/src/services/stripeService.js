import { API_BASE_URL } from "../config/api";
import { clientAuthService } from "shared-api/services/clientAuthService";

/**
 * Service Stripe CLIENT-END - Gestion des appels API paiement (clients publics)
 *
 * Version AVEC token client (pour clients publics)
 *
 * Fonctionnalités:
 * - Création de PaymentIntent
 * - Paiements fake (dev)
 * - Calculs montants + formatage
 */
class StripeService {
	constructor() {
		this.baseURL = `${API_BASE_URL}/payments`;
	}

	/**
	 * Helper pour effectuer les requêtes fetch AVEC token client
	 */
	async fetchWithAuth(url, options = {}) {
		// ⭐ Récupérer le token client
		const token = await clientAuthService.getClientToken();
		if (!token) {
			throw new Error("Token manquant.");
		}

		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || data.error || "Erreur réseau");
		}

		return data;
	}

	/**
	 * Crée un PaymentIntent
	 *
	 * @param {Object} params - Paramètres du paiement
	 * @param {string} params.orderId - ID de la commande
	 * @param {number} params.amount - Montant en centimes
	 * @param {string} params.currency - Devise (défaut: "eur")
	 * @param {Array<string>} params.paymentMethodTypes - ["card", "apple_pay"]
	 * @param {number} params.tipAmount - Pourboire en centimes
	 * @param {string} params.paymentMode - "client" ou "terminal"
	 * @returns {Promise<Object>} { clientSecret, paymentIntentId, paymentId, amount, currency }
	 */
	async createPaymentIntent({
		orderId,
		amount,
		currency = "eur",
		paymentMethodTypes = ["card"],
		tipAmount = 0,
		paymentMode = "client",
	}) {
		try {
			console.log(
				`💳 [CLIENT] Création PaymentIntent - Order: ${orderId}, Amount: ${amount / 100}€`,
			);

			const data = await this.fetchWithAuth(`${this.baseURL}/create-intent`, {
				method: "POST",
				body: JSON.stringify({
					orderId,
					amount,
					currency,
					paymentMethodTypes,
					tipAmount,
					paymentMode,
				}),
			});

			console.log("✅ [CLIENT] PaymentIntent créé:", data.paymentIntentId);

			return data;
		} catch (error) {
			console.error("❌ [CLIENT] Erreur création PaymentIntent:", error);
			throw new Error(
				error.message || "Erreur lors de la création du paiement",
			);
		}
	}

	/**
	 * Crée un paiement FAKE (dev only)
	 *
	 * @param {string} orderId - ID de la commande
	 * @param {number} amount - Montant en centimes
	 * @param {number} tipAmount - Pourboire en centimes
	 * @returns {Promise<Object>} Résultat
	 */
	async createFakePayment(orderId, amount, tipAmount = 0) {
		try {
			console.log(`🎭 [CLIENT] Création paiement FAKE - Order: ${orderId}`);

			const data = await this.fetchWithAuth(`${this.baseURL}/fake`, {
				method: "POST",
				body: JSON.stringify({
					orderId,
					amount,
					tipAmount,
				}),
			});

			console.log("✅ [CLIENT] Paiement fake créé");

			return data;
		} catch (error) {
			console.error("❌ [CLIENT] Erreur création paiement fake:", error);
			throw new Error(error.message || "Erreur paiement fake");
		}
	}

	/**
	 * Calcule le montant total (commande + pourboire)
	 *
	 * @param {number} orderAmount - Montant de la commande en euros
	 * @param {number} tipPercentage - Pourcentage de pourboire (ex: 10)
	 * @returns {Object} { totalCents, tipCents, orderCents }
	 */
	calculateTotal(orderAmount, tipPercentage = 0) {
		const orderCents = Math.round(orderAmount * 100);
		const tipCents = Math.round(((orderAmount * tipPercentage) / 100) * 100);
		const totalCents = orderCents + tipCents;

		return {
			totalCents,
			tipCents,
			orderCents,
		};
	}

	/**
	 * Formate un montant en centimes en string avec devise
	 *
	 * @param {number} cents - Montant en centimes
	 * @param {string} currency - Devise
	 * @returns {string} Montant formaté (ex: "25,50 €")
	 */
	formatAmount(cents, currency = "eur") {
		const amount = cents / 100;

		if (currency === "eur") {
			return new Intl.NumberFormat("fr-FR", {
				style: "currency",
				currency: "EUR",
			}).format(amount);
		}

		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(amount);
	}
}

export default new StripeService();
