import { useState, useEffect } from "react";
import { API_CONFIG } from "shared-api/config/apiConfig.js";

/**
 * Hook pour charger la configuration dynamique d'un restaurant (style + menu)
 * VERSION SIMPLIFIÉE : pas de cache, appel direct à l'API
 *
 * @param {string} restaurantId - ID du restaurant
 * @returns {object} - { config, loading, error, refetch }
 */
export default function useRestaurantConfig(restaurantId) {
	const [config, setConfig] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		// Si pas de restaurantId, ne rien faire
		if (!restaurantId) {
			setLoading(false);
			setError(null);
			setConfig(null);
			return;
		}

		let isCancelled = false;

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
				});

				// 🔍 DEBUG : Afficher les premières couleurs
				console.log("🎨 [useRestaurantConfig] Couleurs reçues:", {
					primary: style.config?.primary,
					background: style.config?.background,
					text: style.config?.text,
					orange: style.config?.orange,
				});

				setConfig(normalizedConfig);
				setLoading(false);
			} catch (err) {
				if (isCancelled) return;
				console.error("[useRestaurantConfig] Erreur:", err);
				setError(err.message || "Erreur de chargement");
				setLoading(false);
			}
		};

		fetchConfig();

		return () => {
			isCancelled = true;
		};
	}, [restaurantId]);

	return {
		config,
		loading,
		error,
		refetch: () => {
			// Force un re-fetch en réinitialisant les states
			setConfig(null);
			setLoading(true);
		},
	};
}
