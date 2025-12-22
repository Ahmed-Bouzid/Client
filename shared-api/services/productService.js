import { useFetchWithAuth } from "../hooks/useFetchWithAuth.js"; // ton hook

export const productService = {
	async fetchProducts(token = null) {
		const fetchWithAuth = useFetchWithAuth();

		try {
			const url = `${API_CONFIG.BASE_URL}/products/restaurant/${API_CONFIG.RESTAURANT_ID}`;
			const data = await fetchWithAuth(url, { method: "GET" });
			return data;
		} catch (error) {
			throw error; // ici tu peux aussi lancer une erreur spécifique pour déclencher la popup
		}
	},
};
