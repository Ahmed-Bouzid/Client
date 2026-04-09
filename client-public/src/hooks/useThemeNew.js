/**
 * 🎨 useTheme — Hook for theme access
 *
 * Fournit:
 *  - Access to current theme
 *  - Safe gradients and colors
 *  - Multi-level caching
 *  - Support customizations
 *  - AB-testing support
 */

import { useMemo, useEffect } from "react";
import useThemeStore from "../stores/useThemeStore";

export const safeGradient = (theme, key, fallback = ["#2563EB", "#1E40AF"]) => {
	const value = theme?.[key];
	if (Array.isArray(value) && value.length >= 2) return value;
	if (typeof value === "string" && value.length > 0) return [value, value];
	return fallback;
};

export const safeColor = (theme, key, fallback = "#000000") => {
	const value = theme?.[key];
	if (typeof value === "string" && value.length > 0) return value;
	return fallback;
};

export default function useTheme(restaurantId = null) {
	const theme = useThemeStore(state => state.theme);
	const customizations = useThemeStore(state => state.customizations);
	const loading = useThemeStore(state => state.loading);
	const error = useThemeStore(state => state.error);
	const themeName = useThemeStore(state => state.themeName);
	const customThemeEnabled = useThemeStore(state => state.customThemeEnabled);
	const abVariant = useThemeStore(state => state.abVariant);
	const hasSpecialFeature = useThemeStore(state => state.hasSpecialFeature);
	const fetchThemeForRestaurant = useThemeStore(state => state.fetchThemeForRestaurant);
	
	useEffect(() => {
		if (restaurantId && !theme) {
			fetchThemeForRestaurant(restaurantId);
		}
	}, [restaurantId, theme, fetchThemeForRestaurant]);
	
	const mergedTheme = useMemo(() => {
		if (!theme) return null;
		return {
			...theme,
			colors: {
				...(theme.tokenConfig?.colors || {}),
				...(customizations.colors || {}),
			},
			gradients: theme.tokenConfig?.gradients || {},
			typography: theme.tokenConfig?.typography || {},
			spacing: theme.tokenConfig?.spacing || {},
			shadows: theme.tokenConfig?.shadows || {},
			radius: theme.tokenConfig?.radius || {},
		};
	}, [theme, customizations]);
	
	const getGradient = (key, fallback) => {
		if (!mergedTheme) return fallback || ["#2563EB", "#1E40AF"];
		return safeGradient(mergedTheme.gradients, key, fallback);
	};
	
	const getColor = (key, fallback) => {
		if (!mergedTheme) return fallback || "#000000";
		return safeColor(mergedTheme.colors, key, fallback);
	};
	
	const getColors = () => {
		return mergedTheme?.colors || {};
	};

	return {
		theme: mergedTheme,
		colors: mergedTheme?.colors || {},
		gradients: mergedTheme?.gradients || {},
		typography: mergedTheme?.typography || {},
		spacing: mergedTheme?.spacing || {},
		shadows: mergedTheme?.shadows || {},
		radius: mergedTheme?.radius || {},
		themeName,
		customThemeEnabled,
		abVariant,
		hasSandwichPattern: hasSpecialFeature("hasSandwichPattern"),
		bannerType: mergedTheme?.bannerType || "generic",
		getGradient,
		getColor,
		getColors,
		getSpecialFeature: (featureName) => hasSpecialFeature(featureName),
		loading,
		error,
		isReady: !loading && mergedTheme !== null,
	};
}
