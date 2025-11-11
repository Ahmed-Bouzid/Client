import { create } from "zustand";
import { productService } from "../../shared-api/services/productService.js";
import { clientAuthService } from "../../shared-api/services/clientAuthService.js";

const useProductStore = create((set, get) => ({
	products: [],

	fetchProducts: async () => {
		try {
			// 🔹 Récupérer le token client
			const clientToken = await clientAuthService.getClientToken();

			// 🔹 Appeler l'API avec le token client
			const products = await productService.fetchProducts(clientToken);
			set({ products });

			console.log("✅ Products chargés avec token client");
		} catch (err) {
			console.error("❌ Error fetching products:", err);

			// 🔹 En cas d'erreur, régénérer le token et réessayer
			if (err.message.includes("401") || err.message.includes("403")) {
				console.log("🔄 Token invalide, régénération...");
				await clientAuthService.clearClientToken();
				// Tu peux ajouter une réessaye automatique ici si tu veux
			}
		}
	},

	setProducts: (products) => set({ products }),
}));

export default useProductStore;
