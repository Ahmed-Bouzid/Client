/**
 * 🔑 useThemeKey — Single source of truth for tenant theming identity
 *
 * Phase 0.2.5 (refactor theming multi-tenant).
 *
 * Lit UNIQUEMENT useThemeStore (pas de subscriptions multi-stores) :
 * la consolidation des inputs (useClientTableStore.restaurantId,
 * useRestaurantStore.category, useRestaurantConfig.styleKey,
 * useThemeStore.themeId) est faite UNE FOIS au boot via
 * `useThemeStore.getState().setSession({...})` et stockée dans
 * le slice `themeKey`.
 *
 * Stabilité de référence garantie via `useShallow` (zustand v5) :
 * le hook ne re-render QUE si l'un des 4 champs change réellement.
 *
 * Usage :
 *   const { themeId, restaurantId, category, styleKey } = useThemeKey();
 *
 * ⚠️ NULL-HANDLING — IMPORTANT POUR LES CONSOMMATEURS
 * Returns null fields until setSession() has been called or partially
 * populated by the 3 tees (useRestaurantStore.fetchRestaurantInfo,
 * useThemeStore.fetchThemeForRestaurant, useRestaurantConfig hook).
 *
 * Le remplissage est PROGRESSIF (Phase 0.3 strangler) : pendant la séquence
 * de boot, certains champs peuvent être null pendant que les fetchs lazy
 * résolvent un par un (typiquement: restaurantId+themeId arrivent en premier
 * via WS/store, category arrive quand un écran déclenche fetchRestaurantInfo,
 * styleKey arrive quand un écran monte useRestaurantConfig).
 *
 * Consumers MUST handle null gracefully — typically via:
 *   - fallback to default theme tokens (defaultTheme)
 *   - early return / skeleton UI tant que les champs critiques sont null
 *   - operator de chaînage optionnel partout: themeKey?.styleKey
 * Ne JAMAIS supposer que les 4 champs sont peuplés au premier render.
 *
 * @returns {{themeId: string|null, restaurantId: string|null, category: string|null, styleKey: string|null}}
 */

import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "../stores/useThemeStore";

export const useThemeKey = () =>
	useThemeStore(useShallow((state) => state.themeKey));

export default useThemeKey;
