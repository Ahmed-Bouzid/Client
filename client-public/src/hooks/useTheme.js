/**
 * 🎨 useTheme — Hook centralisé et robuste pour la gestion des thèmes
 *
 * Remplace l'accès direct à `config?.style` dans les composants.
 * Garantit :
 *  - Un thème toujours complet (jamais undefined/null sur les propriétés)
 *  - Un fallback intelligent selon le type de restaurant
 *  - Aucun crash possible, même si la config BDD est absente ou partielle
 *  - Un helper `getGradient(key)` pour récupérer n'importe quel gradient en sécurité
 *
 * @example
 *   const { theme, getGradient, loading, isReady } = useTheme(restaurantId, category);
 *   const bg = getGradient("background");  // Toujours un array valide
 *   <LinearGradient colors={bg} ... />
 */

import { useMemo } from "react";
import useRestaurantConfig from "./useRestaurantConfig";
import { buildSafeTheme, DEFAULT_THEME } from "../theme/defaultTheme";
import { useRestaurantStore } from "../stores/useRestaurantStore";

/**
 * Retourne un gradient valide pour LinearGradient (toujours un array de 2+ couleurs).
 * @param {object} theme - L'objet thème courant
 * @param {string} key - La clé du gradient (ex: "primary", "background")
 * @param {string[]} fallback - Valeur par défaut si la clé est absente
 * @returns {string[]} Array de couleurs
 */
export const safeGradient = (theme, key, fallback = DEFAULT_THEME.primary) => {
	const value = theme?.[key];
	if (Array.isArray(value) && value.length >= 2) return value;
	// Si c'est une couleur unique, dupliquer pour satisfaire LinearGradient
	if (typeof value === "string" && value.length > 0) return [value, value];
	// Fallback sur DEFAULT_THEME
	const defaultValue = DEFAULT_THEME[key];
	if (Array.isArray(defaultValue) && defaultValue.length >= 2)
		return defaultValue;
	return fallback;
};

/**
 * Retourne une couleur unitaire sûre (string).
 * @param {object} theme - L'objet thème courant
 * @param {string} key - La clé de couleur (ex: "text", "card")
 * @param {string} fallback - Valeur par défaut
 * @returns {string} Couleur hex ou rgba
 */
export const safeColor = (theme, key, fallback = DEFAULT_THEME.text) => {
	const value = theme?.[key];
	if (typeof value === "string" && value.length > 0) return value;
	const defaultValue = DEFAULT_THEME[key];
	if (typeof defaultValue === "string") return defaultValue;
	return fallback;
};

/**
 * Hook principal.
 * @param {string|null} restaurantId - ID du restaurant (optionnel si déjà dans useRestaurantStore)
 * @returns {{ theme, getGradient, getColor, loading, isReady, config, styleKey }}
 */
export default function useTheme(restaurantId = null) {
	// 📱 Récupérer la catégorie depuis le store restaurant
	const category = useRestaurantStore((state) => state.category);

	// 🔌 Charger la config depuis la BDD
	const { config, loading, error } = useRestaurantConfig(restaurantId);

	// 🎨 Construire un thème complet et sûr
	const theme = useMemo(() => {
		// Clé préférée : styleKey ou category (ex: "grillz", "italia", "foodtruck")
		const typeOrKey = config?.styleKey || category || "default";
		// Fusionner BDD + base : BDD a priorité
		return buildSafeTheme(config?.style, typeOrKey);
	}, [config, category]);

	/**
	 * Retourne un gradient valide pour LinearGradient
	 * @param {string} key - Clé du gradient
	 * @param {string[]} fallback - Fallback explicite si souhaité
	 */
	const getGradient = (key, fallback) => safeGradient(theme, key, fallback);

	/**
	 * Retourne une couleur unitaire sûre
	 * @param {string} key - Clé de couleur
	 * @param {string} fallback - Fallback explicite si souhaité
	 */
	const getColor = (key, fallback) => safeColor(theme, key, fallback);

	return {
		theme,
		getGradient,
		getColor,
		loading,
		error,
		isReady: !loading && theme !== null,
		config,
		styleKey: config?.styleKey || null,
	};
}
