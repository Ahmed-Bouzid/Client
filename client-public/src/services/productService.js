import { API_CONFIG } from "../../../shared-api/config/apiConfig.js";
import { getRestaurantId } from "../../../shared-api/utils/getRestaurantId.js";

export const productService = {
	async fetchProducts(token = null) {
		// console.log("=== DEBUG fetchProducts ===");
		// console.log(
		// 	"🔐 Token reçu:",
		// 	token ? token.substring(0, 30) + "..." : "NULL"
		// );

		const headers = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const restaurantId = await getRestaurantId();
		const url = `${API_CONFIG.BASE_URL}/products/restaurant/${restaurantId}`;
		// console.log("🌐 URL complète:", url);
		// console.log("🍽️ Restaurant ID:", API_CONFIG.RESTAURANT_ID);

		try {
			// console.log("📤 Envoi de la requête...");
			const response = await fetch(url, { headers });

			// console.log("📥 Réponse reçue - Status:", response.status);
			// console.log("📥 Réponse reçue - OK?", response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Contenu de l'erreur:", errorText);
				throw new Error(
					`Failed to fetch products: ${response.status} - ${errorText}`
				);
			}

			const data = await response.json();
			console.log("✅ Produits récupérés:", data.length, "produits");
			return data;
		} catch (error) {
			console.error("💥 Erreur complète dans fetchProducts:", error.message);
			throw error;
		}
	},
};
