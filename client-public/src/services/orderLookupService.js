/**
 * orderLookupService.js — Service de recherche de commande par numéro
 *
 * Recherche une commande via son numéro unique (#XXX-XXX).
 * Actuellement en mode mock. Prêt pour intégration backend future.
 *
 * Intégration backend future :
 *   GET /orders/lookup/:orderNumber
 *   → Retourne les détails de la commande ou 404
 *   → Le backend doit valider le format et chercher par orderNumber (pas par _id)
 */

import { API_CONFIG } from "shared-api/config/apiConfig.js";

// ── MOCK DATA (à retirer quand le backend est prêt) ──
const MOCK_ORDERS = {
  "#123-456": {
    orderNumber: "#123-456",
    date: "2026-04-18T14:30:00.000Z",
    status: "delivered",
    paymentMethod: "Carte bancaire",
    items: [
      { name: "Chicken Burger", quantity: 2, price: 12.90 },
      { name: "Frites maison", quantity: 1, price: 4.50 },
      { name: "Coca-Cola", quantity: 2, price: 3.00 },
    ],
    total: 36.30,
  },
  "#001-789": {
    orderNumber: "#001-789",
    date: "2026-04-15T19:15:00.000Z",
    status: "in_progress",
    paymentMethod: "Apple Pay",
    items: [
      { name: "Wings BBQ x12", quantity: 1, price: 14.90 },
      { name: "Onion Rings", quantity: 1, price: 5.50 },
    ],
    total: 20.40,
  },
};

/**
 * Recherche une commande par son numéro (#XXX-XXX)
 * @param {string} orderNumber - Format #XXX-XXX
 * @returns {Promise<object|null>} Détails de la commande ou null
 */
export async function lookupOrderByNumber(orderNumber) {
  // ── MODE MOCK ──
  // Simuler un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 800));

  const order = MOCK_ORDERS[orderNumber] || null;
  return order;

  // ── MODE API (décommenter quand le backend est prêt) ──
  // const encoded = encodeURIComponent(orderNumber);
  // const response = await fetch(
  //   `${API_CONFIG.BASE_URL}/orders/lookup/${encoded}`,
  //   {
  //     method: "GET",
  //     headers: { "Content-Type": "application/json" },
  //   }
  // );
  //
  // if (response.status === 404) return null;
  // if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
  //
  // const data = await response.json();
  // return data.order || null;
}
