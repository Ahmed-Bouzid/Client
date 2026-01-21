import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Store Zustand pour gérer les restrictions alimentaires du client
 * (Halal, Casher, Vegan, Sans Gluten, etc.)
 */
export const useRestrictionStore = create((set, get) => ({
	// Liste des restrictions sélectionnées par l'utilisateur
	userRestrictions: [],

	// Cache des restrictions disponibles
	restrictionsCache: [],

	/**
	 * Charger les restrictions depuis AsyncStorage
	 */
	init: async () => {
		try {
			const saved = await AsyncStorage.getItem("userRestrictions");
			if (saved) {
				const restrictions = JSON.parse(saved);
				set({
					userRestrictions: Array.isArray(restrictions) ? restrictions : [],
				});
			}
		} catch (error) {
			console.error("❌ Erreur chargement restrictions:", error);
		}
	},

	/**
	 * Sauvegarder dans AsyncStorage
	 */
	persist: async (restrictions) => {
		try {
			await AsyncStorage.setItem(
				"userRestrictions",
				JSON.stringify(restrictions),
			);
		} catch (error) {
			console.error("❌ Erreur sauvegarde restrictions:", error);
		}
	},

	/**
	 * Définir les restrictions de l'utilisateur
	 */
	setUserRestrictions: (restrictions) => {
		set({ userRestrictions: restrictions });
		get().persist(restrictions);
	},

	/**
	 * Toggle une restriction (ajouter/retirer)
	 */
	toggleRestriction: (restriction) => {
		const { userRestrictions } = get();
		const newRestrictions = userRestrictions.includes(restriction)
			? userRestrictions.filter((r) => r !== restriction)
			: [...userRestrictions, restriction];

		set({ userRestrictions: newRestrictions });
		get().persist(newRestrictions);
	},

	/**
	 * Ajouter une restriction
	 */
	addRestriction: (restriction) => {
		const { userRestrictions } = get();
		if (!userRestrictions.includes(restriction)) {
			const newRestrictions = [...userRestrictions, restriction];
			set({ userRestrictions: newRestrictions });
			get().persist(newRestrictions);
		}
	},

	/**
	 * Retirer une restriction
	 */
	removeRestriction: (restriction) => {
		const { userRestrictions } = get();
		const newRestrictions = userRestrictions.filter((r) => r !== restriction);
		set({ userRestrictions: newRestrictions });
		get().persist(newRestrictions);
	},

	/**
	 * Vider toutes les restrictions
	 */
	clearRestrictions: () => {
		set({ userRestrictions: [] });
		get().persist([]);
	},

	/**
	 * Mettre à jour le cache des restrictions disponibles
	 */
	setRestrictionsCache: (restrictions) => {
		set({ restrictionsCache: restrictions });
	},
}));
