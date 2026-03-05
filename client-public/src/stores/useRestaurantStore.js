import { create } from "zustand";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { useFeatureLevelStore } from "./useFeatureLevelStore.js";

export const useRestaurantStore = create((set, get) => ({
	category: null, // 'restaurant', 'foodtruck', 'snack', etc.
	id: null,
	name: null,
	googlePlaceId: null,
	googleUrl: null,
	lastFetchedId: null, // 🎯 Cache : dernier restaurant fetch
	isFetching: false, // 🚦 Flag pour éviter les doubles appels

	/**
	 * Récupère les infos du restaurant (category, name)
	 * Et initialise automatiquement le Feature Level Store
	 * 🎯 Avec cache : ne refetch pas si déjà chargé
	 */
	fetchRestaurantInfo: async (restaurantId) => {
		const state = get();

		// ✅ Cache : si déjà chargé pour cet ID, on ne refetch pas
		if (state.lastFetchedId === restaurantId && state.category) {
			console.log("♻️ [RESTAURANT] Info déjà en cache pour:", restaurantId);
			return true;
		}

		// 🚦 Éviter les appels concurrents
		if (state.isFetching) {
			console.log("⏳ [RESTAURANT] Fetch déjà en cours...");
			return true;
		}

		set({ isFetching: true });
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

			const category = data.category || "restaurant";

			set({
				category,
				name: data.name,
				googlePlaceId: data.googlePlaceId || null,
				googleUrl: data.googleUrl || null,
				lastFetchedId: restaurantId, // 🎯 Marquer comme fetch
				isFetching: false,
			});

			return true;
		} catch (error) {
			set({ isFetching: false });
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
