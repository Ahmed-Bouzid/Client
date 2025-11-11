import { API_CONFIG } from "../config/apiConfig.js";

export const productService = {
	async fetchProducts(token = null) {
		try {
			console.log("🐛 [DEBUG] fetchProducts START");
			console.log("🐛 [DEBUG] Token exists:", !!token);
			console.log("🐛 [DEBUG] BASE_URL:", API_CONFIG.BASE_URL);
			console.log("🐛 [DEBUG] RESTAURANT_ID:", API_CONFIG.RESTAURANT_ID);

			const headers = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const url = `${API_CONFIG.BASE_URL}/products/restaurant/${API_CONFIG.RESTAURANT_ID}`;
			console.log("🐛 [DEBUG] Fetch URL:", url);

			const response = await fetch(url, { headers });

			console.log("🐛 [DEBUG] Response status:", response.status);
			console.log("🐛 [DEBUG] Response ok:", response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.log("🐛 [DEBUG] Error response body:", errorText);
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}

			const data = await response.json();
			console.log("🐛 [DEBUG] Success! Products count:", data.length);
			return data;
		} catch (error) {
			console.log("🐛 [DEBUG] Catch block error:", error.message);
			throw error;
		}
	},
};
