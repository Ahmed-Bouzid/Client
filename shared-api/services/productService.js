import { API_CONFIG } from "../config/apiConfig.js";

export const productService = {
	async fetchProducts(token = null) {
		try {
			const headers = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const url = `${API_CONFIG.BASE_URL}/products/restaurant/${API_CONFIG.RESTAURANT_ID}`;

			const response = await fetch(url, { headers });

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			throw error;
		}
	},
};
