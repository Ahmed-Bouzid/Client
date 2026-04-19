import { API_BASE_URL } from "../config/api";
import { clientAuthService } from "shared-api/services/clientAuthService";

/**
 * ═══════════════════════════════════════════════════════════════
 * stripeService.js — SERVICE PAIEMENT STRIPE (CLIENT PUBLIC)
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client (étape paiement) :
 *   - createPaymentIntent() → crée un PaymentIntent côté serveur
 *   - Le clientSecret retourné alimente le Payment Sheet natif Stripe
 *   - Authentification via token client (JWT)
 *
 * Endpoints :
 *   - POST /payments/create-intent → crée PaymentIntent
 *   - POST /payments/fake → paiement test (dev uniquement)
 */
class StripeService {
	constructor() {
		this.baseURL = `${API_BASE_URL}/payments`;
		this.lastIntentRequestAt = 0;
		this.intentCooldownMs = 1500;
	}

	/**
	 * Helper pour effectuer les requêtes fetch AVEC token client
	 */
	async fetchWithAuth(url, options = {}) {
		const headers = await clientAuthService.getAuthHeaders({
			"Content-Type": "application/json",
			...options.headers,
		});

		if (!headers) {
			throw new Error("Token manquant.");
		}

		const response = await fetch(url, {
			...options,
			headers,
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
			const now = Date.now();
			if (now - this.lastIntentRequestAt < this.intentCooldownMs) {
				throw new Error("Paiement déjà en cours. Veuillez patienter.");
			}
			this.lastIntentRequestAt = now;

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
			const data = await this.fetchWithAuth(`${this.baseURL}/fake`, {
				method: "POST",
				body: JSON.stringify({
					orderId,
					amount,
					tipAmount,
				}),
			});

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
