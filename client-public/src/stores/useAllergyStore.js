import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Store Zustand pour gérer les allergies de l'utilisateur client
 */
export const useAllergyStore = create((set, get) => ({
	// Liste des IDs d'allergènes cochés par l'utilisateur
	userAllergenIds: [],
	// Cache des allergènes complets (pour affichage)
	allergensCache: [],
	// État de chargement
	isLoading: false,

	/**
	 * Initialise le store depuis AsyncStorage
	 */
	init: async () => {
		try {
			const saved = await AsyncStorage.getItem("userAllergenIds");
			if (saved) {
				const ids = JSON.parse(saved);
				set({ userAllergenIds: Array.isArray(ids) ? ids : [] });
			}
		} catch (error) {
			console.error("❌ Erreur init allergies:", error);
		}
	},

	/**
	 * Sauvegarde les allergies dans AsyncStorage
	 */
	persist: async (ids) => {
		try {
			await AsyncStorage.setItem("userAllergenIds", JSON.stringify(ids));
		} catch (error) {
			console.error("❌ Erreur persist allergies:", error);
		}
	},

	/**
	 * Met à jour les allergies de l'utilisateur
	 */
	setUserAllergens: (allergenIds) => {
		set({ userAllergenIds: allergenIds });
		get().persist(allergenIds);
	},

	/**
	 * Ajoute un allergène
	 */
	addAllergen: (allergenId) => {
		const { userAllergenIds } = get();
		if (!userAllergenIds.includes(allergenId)) {
			const newIds = [...userAllergenIds, allergenId];
			set({ userAllergenIds: newIds });
			get().persist(newIds);
		}
	},

	/**
	 * Retire un allergène
	 */
	removeAllergen: (allergenId) => {
		const { userAllergenIds } = get();
		const newIds = userAllergenIds.filter((id) => id !== allergenId);
		set({ userAllergenIds: newIds });
		get().persist(newIds);
	},

	/**
	 * Toggle un allergène
	 */
	toggleAllergen: (allergenId) => {
		const { userAllergenIds } = get();
		if (userAllergenIds.includes(allergenId)) {
			get().removeAllergen(allergenId);
		} else {
			get().addAllergen(allergenId);
		}
	},

	/**
	 * Vérifie si un produit contient un allergène de l'utilisateur
	 */
	productContainsUserAllergen: (product) => {
		const { userAllergenIds } = get();
		if (!product?.allergens || userAllergenIds.length === 0) return false;

		const productAllergenIds = Array.isArray(product.allergens)
			? product.allergens.map((a) => (typeof a === "string" ? a : a._id))
			: [];

		return productAllergenIds.some((id) => userAllergenIds.includes(id));
	},

	/**
	 * Retourne les allergènes du produit qui sont dans la liste utilisateur
	 */
	getMatchingAllergens: (product) => {
		const { userAllergenIds } = get();
		if (!product?.allergens) return [];

		return product.allergens.filter((allergen) => {
			const id = typeof allergen === "string" ? allergen : allergen._id;
			return userAllergenIds.includes(id);
		});
	},

	/**
	 * Met en cache la liste complète des allergènes (pour affichage)
	 */
	setAllergensCache: (allergens) => {
		set({ allergensCache: allergens });
	},

	/**
	 * Nettoie le store
	 */
	clear: async () => {
		try {
			await AsyncStorage.removeItem("userAllergenIds");
			set({ userAllergenIds: [], allergensCache: [] });
		} catch (error) {
			console.error("❌ Erreur clear allergies:", error);
		}
	},
}));
