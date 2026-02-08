/**
 * 🎯 Store de Niveaux Fonctionnels - SELF (Client-end)
 *
 * Gère le niveau fonctionnel de l'application client selon la catégorie du restaurant.
 * Permet de vérifier facilement si une fonctionnalité est disponible.
 */

import { create } from "zustand";
import {
	LEVELS,
	SELF_FEATURES,
	getLevelFromCategory,
	isSelfFeatureEnabled,
	getTableMode,
	getSelfConfig,
} from "shared-api/config/featureLevels.js";

export const useFeatureLevelStore = create((set, get) => ({
	// État
	level: LEVELS.COMPLET, // Niveau actif
	category: "restaurant", // Catégorie du restaurant
	tableMode: "dynamic", // Mode de gestion des tables
	features: [], // Liste des fonctionnalités actives
	isInitialized: false,

	// ============ ACTIONS ============

	/**
	 * Initialise le store avec la catégorie du restaurant
	 * @param {string} category - Catégorie du restaurant (restaurant/snack/foodtruck)
	 */
	init: (category) => {
		const config = getSelfConfig(category || "restaurant");
		console.log(`🎯 [SELF] Feature Level initialisé:`, {
			category,
			level: config.level,
			tableMode: config.tableMode,
			features: config.features.length,
		});

		set({
			level: config.level,
			category: category || "restaurant",
			tableMode: config.tableMode,
			features: config.features,
			isInitialized: true,
		});
	},

	/**
	 * Met à jour le niveau (si changement de catégorie)
	 * @param {string} category - Nouvelle catégorie
	 */
	setCategory: (category) => {
		const config = getSelfConfig(category);
		set({
			level: config.level,
			category,
			tableMode: config.tableMode,
			features: config.features,
		});
	},

	/**
	 * Vérifie si une fonctionnalité est active
	 * @param {string} feature - Clé de la fonctionnalité (voir SELF_FEATURES)
	 * @returns {boolean}
	 */
	hasFeature: (feature) => {
		const { features } = get();
		return features.includes(feature);
	},

	/**
	 * Reset le store
	 */
	reset: () => {
		set({
			level: LEVELS.COMPLET,
			category: "restaurant",
			tableMode: "dynamic",
			features: [],
			isInitialized: false,
		});
	},

	// ============ GETTERS PRATIQUES ============

	/**
	 * Vérifie si les allergies sont disponibles
	 */
	hasAllergies: () => get().hasFeature(SELF_FEATURES.ALLERGIES),

	/**
	 * Vérifie si les restrictions sont disponibles
	 */
	hasRestrictions: () => get().hasFeature(SELF_FEATURES.RESTRICTIONS),

	/**
	 * Vérifie si le menu complet est disponible (vs simplifié)
	 */
	hasFullMenu: () => get().hasFeature(SELF_FEATURES.MENU_COMPLET),

	/**
	 * Vérifie si les suggestions complètes sont disponibles
	 */
	hasFullSuggestions: () => get().hasFeature(SELF_FEATURES.SUGGESTIONS),

	/**
	 * Vérifie si on est en mode table unique (foodtruck)
	 */
	isTableUniqueMode: () => get().tableMode === "unique",

	/**
	 * Vérifie si on est en mode table temporaire (snack)
	 */
	isTableTemporaryMode: () => get().tableMode === "temporary",

	/**
	 * Vérifie si on est en mode table dynamique (restaurant)
	 */
	isTableDynamicMode: () => get().tableMode === "dynamic",

	/**
	 * Vérifie si on est en niveau minimum (foodtruck)
	 */
	isMinimum: () => get().level === LEVELS.MINIMUM,

	/**
	 * Vérifie si on est en niveau intermédiaire (snack)
	 */
	isIntermediate: () => get().level === LEVELS.INTERMEDIAIRE,

	/**
	 * Vérifie si on est en niveau complet (restaurant)
	 */
	isComplete: () => get().level === LEVELS.COMPLET,
}));

// ============ HOOK PRATIQUE ============

/**
 * Hook pour accéder facilement aux fonctionnalités
 * @returns {object} Objet avec les vérifications de fonctionnalités
 */
export const useFeatureLevel = () => {
	const store = useFeatureLevelStore();

	return {
		level: store.level,
		category: store.category,
		tableMode: store.tableMode,
		isInitialized: store.isInitialized,

		// Fonctionnalités
		hasAllergies: store.hasAllergies(),
		hasRestrictions: store.hasRestrictions(),
		hasFullMenu: store.hasFullMenu(),
		hasFullSuggestions: store.hasFullSuggestions(),

		// Modes de table
		isTableUniqueMode: store.isTableUniqueMode(),
		isTableTemporaryMode: store.isTableTemporaryMode(),
		isTableDynamicMode: store.isTableDynamicMode(),

		// Niveaux
		isMinimum: store.isMinimum(),
		isIntermediate: store.isIntermediate(),
		isComplete: store.isComplete(),

		// Vérification générique
		hasFeature: store.hasFeature,
	};
};

export default useFeatureLevelStore;
