import { create } from "zustand";
import { productService } from "shared-api/services/productService.js";

const useProductStore = create((set, get) => ({
	products: [],

	fetchProducts: async () => {
		try {
			// Client n'a pas besoin de token
			const products = await productService.fetchProducts();
			set({ products: Array.isArray(products) ? products : [] });
		} catch (err) {
			console.error("❌ Error fetching products:", err);
		}
	},
}));

export default useProductStore;
