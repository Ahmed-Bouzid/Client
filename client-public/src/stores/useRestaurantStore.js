import { create } from "zustand";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { useFeatureLevelStore } from "./useFeatureLevelStore.js";

export const useRestaurantStore = create((set, get) => ({
	category: null, // 'restaurant', 'foodtruck', 'snack', etc.
	id: null,
	name: null,
	googlePlaceId: null,
	googleUrl: null,

	/**
	 * Récupère les infos du restaurant (category, name)
	 * Et initialise automatiquement le Feature Level Store
	 */
	fetchRestaurantInfo: async (restaurantId) => {
		try {
			const url = `${API_CONFIG.BASE_URL}/restaurants/${restaurantId}/info`;
			console.log(
				"🏪 [RESTAURANT] Fetching info pour:",
				restaurantId,
				"->",
				url,
			);
			const response = await fetch(url);

			if (!response.ok) {
				console.error("❌ Restaurant non trouvé", { status: response.status });
				const text = await response.text().catch(() => null);
				console.error("Response body:", text);
				return false;
			}

			const data = await response.json();
			console.log("✅ [RESTAURANT] Info récupérée:", data);

			const category = data.category || "restaurant";

			set({
				category,
				name: data.name,
				googlePlaceId: data.googlePlaceId || null,
				googleUrl: data.googleUrl || null,
			});
			return true;
		} catch (error) {
			console.error("❌ [RESTAURANT] Erreur fetchRestaurantInfo:", error);
			set({ category: "restaurant", name: null });
			// Fallback : niveau complet
			useFeatureLevelStore.getState().init("restaurant");
			return false;
		}
	},

	/**
	 * Définit l'id du restaurant et récupère ses infos
	 */
	setRestaurantId: async (restaurantId) => {
		if (!restaurantId) {
			set({ id: null, category: null, name: null });
			return false;
		}
		set({ id: restaurantId });
		const ok = await get().fetchRestaurantInfo(restaurantId);
		return ok;
	},

	/**
	 * Reset le store
	 */
	reset: () => {
		set({ category: null, name: null, googlePlaceId: null, googleUrl: null });
	},
}));
