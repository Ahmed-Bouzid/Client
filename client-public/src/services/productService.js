import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { getRestaurantId } from "../utils/getRestaurantId.js";

export const productService = {
	async fetchProducts(token = null) {
		const headers = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		// Récupérer dynamiquement le restaurantId
		const restaurantId = await getRestaurantId();

		const url = `${API_CONFIG.BASE_URL}/products/restaurant/${restaurantId}`;

		try {
			const response = await fetch(url, { headers });

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Contenu de l'erreur:", errorText);
				throw new Error(
					`Failed to fetch products: ${response.status} - ${errorText}`,
				);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("💥 Erreur complète dans fetchProducts:", error.message);
			throw error;
		}
	},
};
