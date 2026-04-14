/**
 * getUrlParams.js
 * Lit restaurantId et tableId depuis l'URL de la page (web uniquement).
 *
 * Formats supportés :
 *   /r/[restaurantId]                 → restaurantId seul (foodtruck)
 *   /r/[restaurantId]/[tableId]       → restaurantId + tableId (restaurant classique)
 *
 * En React Native (iOS/Android), retourne { restaurantId: null, tableId: null }.
 * Les valeurs viennent alors du QR code scanné ou d'AsyncStorage.
 */

import { Platform } from "react-native";

/**
 * Extrait restaurantId, tableId et orderId depuis window.location.pathname (web).
 * @returns {{ restaurantId: string|null, tableId: string|null, orderId: string|null, isTrackingRoute: boolean }}
 */
export const getUrlParams = () => {
	if (Platform.OS !== "web" || typeof window === "undefined") {
		return {
			restaurantId: null,
			tableId: null,
			orderId: null,
			isTrackingRoute: false,
		};
	}

	try {
		const pathname = window.location.pathname; // ex: /r/[restaurantId]/[tableId]
		const trackingMatch = pathname.match(/^\/suivi\/([^/]+)/);
		if (trackingMatch) {
			return {
				restaurantId: null,
				tableId: null,
				orderId: trackingMatch[1] || null,
				isTrackingRoute: true,
			};
		}

		const match = pathname.match(/^\/r\/([^/]+)(?:\/([^/]+))?/);

		if (!match) {
			return {
				restaurantId: null,
				tableId: null,
				orderId: null,
				isTrackingRoute: false,
			};
		}

		return {
			restaurantId: match[1] || null,
			tableId: match[2] || null,
			orderId: null,
			isTrackingRoute: false,
		};
	} catch {
		return {
			restaurantId: null,
			tableId: null,
			orderId: null,
			isTrackingRoute: false,
		};
	}
};

/**
 * Vérifie que l'URL courante contient un restaurantId valide.
 * Utilisé pour bloquer l'app si l'URL est incomplète (accès direct sans QR).
 * @returns {boolean}
 */
export const hasValidRestaurantInUrl = () => {
	const { restaurantId } = getUrlParams();
	// Un ObjectId MongoDB est une chaîne hexadécimale de 24 caractères
	return !!restaurantId && /^[a-f\d]{24}$/i.test(restaurantId);
};
