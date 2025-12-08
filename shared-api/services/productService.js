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
				let errorText = `HTTP ${response.status}`;
				try {
					const errorData = await response.json();
					errorText = errorData.message || errorText;
				} catch (e) {
					// Si ce n'est pas du JSON, utiliser le status
				}
				throw new Error(errorText);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			throw error;
		}
	},
};
