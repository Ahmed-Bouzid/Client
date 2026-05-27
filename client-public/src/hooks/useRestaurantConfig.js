import { useState, useEffect, useRef } from "react";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { useThemeStore } from "../stores/useThemeStore.js";

// 🎨 Phase 3.2 — Mapping ciblé restaurantId → styleKey 'baghera' (démo 13 mai 2026)
// Le compte BDD réel a styleKey='premium' / category='fast-food'. On force le
// theme à 'baghera' UNIQUEMENT pour ce restaurantId, sans toucher la BDD ni
// impacter les autres tenants. Post-démo : supprimer cette constante + la
// branche `nextStyleKey` ci-dessous.
const BAGHERA_RESTAURANT_IDS = new Set([
	"6a0381c865b4fbf2f219e0f0", // Baghera — Marseille
]);

/**
 * Hook pour charger la configuration dynamique d'un restaurant (style + menu)
 * 🎯 AVEC CACHE : ne refetch pas si déjà chargé pour cet ID
 *
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} - { config, loading, error, refetch }
 */
export default function useRestaurantConfig(restaurantId) {
	const [config, setConfig] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// 🎯 Cache : mémoriser le dernier ID fetch pour éviter les appels répétés
	const lastFetchedId = useRef(null);
	const isFetchingRef = useRef(false);

	useEffect(() => {
		// Si pas de restaurantId, ne rien faire
		if (!restaurantId) {
			setLoading(false);
			setError(null);
			setConfig(null);
			return;
		}

		// ✅ Cache : si déjà chargé pour cet ID, ne pas refetch
		if (lastFetchedId.current === restaurantId && config) {
			return;
		}

		// 🚦 Éviter les appels concurrents
		if (isFetchingRef.current) {
			return;
		}

		let isCancelled = false;
		isFetchingRef.current = true;

		const fetchConfig = async () => {
			try {
				setLoading(true);
				setError(null);

				const url = `${API_CONFIG.BASE_URL}/restaurants/${restaurantId}/config`;

				const response = await fetch(url, {
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(`Erreur HTTP ${response.status}`);
				}

				const data = await response.json();

				if (isCancelled) return;

				const { style, categories, menuLayout } = data;

				// Validation basique
				if (!style || !style.config) {
					throw new Error("Style invalide");
				}

				// Structure unifiée
				const normalizedConfig = {
					restaurant_id: restaurantId,
					style: style.config, // ⚠️ Les couleurs BBQ sont dans style.config
					styleKey: style.key, // Ajout pour debug
					styleName: style.name, // Ajout pour debug
					categories: categories || [],
					menuLayout: menuLayout || "grid",
				};

				setConfig(normalizedConfig);
				setLoading(false);
				lastFetchedId.current = restaurantId; // 🎯 Marquer comme fetch
				isFetchingRef.current = false;
			} catch (err) {
				if (isCancelled) return;
				console.error("[useRestaurantConfig] Erreur:", err);
				setError(err.message || "Erreur de chargement");
				setLoading(false);
				isFetchingRef.current = false;
			}
		};

		fetchConfig();

		return () => {
			isCancelled = true;
			isFetchingRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [restaurantId]); // ⚠️ Seulement restaurantId, pas config

	// ────────────────────────────────────────────────────────────────
	// 🔑 Phase 0.3 — TEE vers themeKey (Option A strangler)
	// Pousse styleKey vers useThemeStore.themeKey dès qu'il est résolu.
	// PATTERN OBLIGATOIRE: spread de l'état actuel + override partiel,
	// jamais setSession({ styleKey }) seul — sinon on écraserait
	// category/themeId déjà alimentés par les autres tees.
	// Le garde-fou idempotent dans setSession() évite les re-renders
	// inutiles si la valeur est identique (ex: re-mount d'un écran).
	// ────────────────────────────────────────────────────────────────
	useEffect(() => {
		if (!restaurantId || !config?.styleKey) return;
		const themeStore = useThemeStore.getState();
		// 🎨 Phase 3.2 — Activation BAGHERA (démo 13 mai 2026)
		// Ordre de priorité du styleKey :
		//   1. Si themeStore déjà sur 'baghera' (DEMO_TENANT_OVERRIDE App.jsx) → garde
		//   2. Sinon si restaurantId ∈ BAGHERA_RESTAURANT_IDS → force 'baghera'
		//   3. Sinon → respecte le styleKey API (cucina/grillz/default)
		const currentStyleKey = themeStore.themeKey?.styleKey;
		let nextStyleKey;
		if (currentStyleKey === "baghera") {
			nextStyleKey = "baghera";
		} else if (BAGHERA_RESTAURANT_IDS.has(restaurantId)) {
			nextStyleKey = "baghera";
		} else {
			nextStyleKey = config.styleKey;
		}
		themeStore.setSession({
			...themeStore.themeKey,
			restaurantId,
			styleKey: nextStyleKey,
		});
	}, [restaurantId, config?.styleKey]);

	return {
		config,
		loading,
		error,
		refetch: () => {
			// 🔄 Force un re-fetch en réinitialisant le cache
			lastFetchedId.current = null;
			setConfig(null);
			setLoading(true);
		},
	};
}
