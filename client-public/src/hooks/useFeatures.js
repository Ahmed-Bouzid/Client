/**
 * 🛠️ Hook useFeatures - Vérification des fonctionnalités premium
 *
 * Permet de vérifier si un restaurant a accès aux fonctionnalités payantes
 */

import { useState, useEffect, useCallback } from "react";
import { useRestaurantStore } from "../stores/useRestaurantStore";

// Configuration des fonctionnalités
const FEATURES_LIST = [
	"accounting",
	"feedback",
	"messaging",
	"tableAssistant",
	"analytics",
	"advancedNotifications",
	"customization",
];

export const useFeatures = () => {
	const [features, setFeatures] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const { restaurant } = useRestaurantStore();

	// Charger les fonctionnalités du restaurant
	const loadFeatures = useCallback(async () => {
		if (!restaurant?._id) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`https://sunnygo-backend-6y1m.onrender.com/api/developer/features/${restaurant._id}`,
			);

			if (response.ok) {
				const data = await response.json();
				setFeatures(data.data.features || {});
			} else {
				// Si pas de fonctionnalités configurées, toutes désactivées par défaut
				const defaultFeatures = {};
				FEATURES_LIST.forEach((feature) => {
					defaultFeatures[feature] = { enabled: false, activatedAt: null };
				});
				setFeatures(defaultFeatures);
			}
		} catch (err) {
			console.error("Erreur chargement fonctionnalités:", err);
			setError(err.message);

			// Fallback : toutes les fonctionnalités désactivées
			const fallbackFeatures = {};
			FEATURES_LIST.forEach((feature) => {
				fallbackFeatures[feature] = { enabled: false, activatedAt: null };
			});
			setFeatures(fallbackFeatures);
		} finally {
			setLoading(false);
		}
	}, [restaurant?._id]);

	// Charger au montage et quand le restaurant change
	useEffect(() => {
		loadFeatures();
	}, [loadFeatures]);

	// Vérifier si une fonctionnalité est activée
	const hasFeature = useCallback(
		(featureName) => {
			if (!features) return false;
			return features[featureName]?.enabled || false;
		},
		[features],
	);

	// Vérifier si plusieurs fonctionnalités sont activées
	const hasFeatures = useCallback(
		(featureNames) => {
			return featureNames.every((name) => hasFeature(name));
		},
		[hasFeature],
	);

	// Obtenir la date d'activation d'une fonctionnalité
	const getFeatureActivationDate = useCallback(
		(featureName) => {
			if (!features || !features[featureName]) return null;
			return features[featureName].activatedAt;
		},
		[features],
	);

	// Obtenir toutes les fonctionnalités activées
	const getEnabledFeatures = useCallback(() => {
		if (!features) return [];
		return FEATURES_LIST.filter((feature) => features[feature]?.enabled);
	}, [features]);

	// Obtenir le nombre de fonctionnalités activées
	const getEnabledFeaturesCount = useCallback(() => {
		return getEnabledFeatures().length;
	}, [getEnabledFeatures]);

	// Vérifier si le restaurant a des fonctionnalités premium
	const hasPremiumFeatures = useCallback(() => {
		return getEnabledFeaturesCount() > 0;
	}, [getEnabledFeaturesCount]);

	return {
		// État
		features,
		loading,
		error,

		// Méthodes de vérification
		hasFeature,
		hasFeatures,
		getFeatureActivationDate,
		getEnabledFeatures,
		getEnabledFeaturesCount,
		hasPremiumFeatures,

		// Méthodes utilitaires
		reload: loadFeatures,

		// Shortcuts pour les fonctionnalités courantes
		hasAccounting: hasFeature("accounting"),
		hasFeedback: hasFeature("feedback"),
		hasMessaging: hasFeature("messaging"),
		hasTableAssistant: hasFeature("tableAssistant"),
		hasAnalytics: hasFeature("analytics"),
		hasAdvancedNotifications: hasFeature("advancedNotifications"),
		hasCustomization: hasFeature("customization"),
	};
};
