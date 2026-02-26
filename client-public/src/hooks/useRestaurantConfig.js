import { useState, useEffect, useRef } from "react";
import { API_CONFIG } from "shared-api/config/apiConfig.js";

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
			console.log("♻️ [useRestaurantConfig] Config déjà en cache");
			return;
		}
		
		// 🚦 Éviter les appels concurrents
		if (isFetchingRef.current) {
			console.log("⏳ [useRestaurantConfig] Fetch déjà en cours...");
			return;
		}

		let isCancelled = false;
		isFetchingRef.current = true;

		const fetchConfig = async () => {
			try {
				setLoading(true);
				setError(null);

				const url = `${API_CONFIG.BASE_URL}/restaurants/${restaurantId}/config`;
				console.log(
					`🎨 [useRestaurantConfig] Chargement config depuis: ${url}`,
				);

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

				console.log("✅ [useRestaurantConfig] Config chargée:", {
					styleKey: style.key,
					styleName: style.name,
					categoriesCount: categories?.length || 0,
					menuLayout,
					headerIcon: style.config?.headerIcon,
					useCustomHeader: style.config?.useCustomHeader,
					useCustomBackground: style.config?.useCustomBackground,
					backgroundImageUrl: style.config?.backgroundImageUrl,
				});

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
