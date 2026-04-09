/**
 * 🎨 useThemeStore - Zustand Store
 * 
 * State management pour les thèmes du restaurant
 * Features:
 * - Multi-level caching (AsyncStorage + in-memory)
 * - Auto-fetch au démarrage
 * - WebSocket updates en temps réel
 * - Per-restaurant theme management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useThemeStore = create((set, get) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // Current theme data
    theme: null,
    customizations: {},
    themeId: null,
    themeName: "Default",
    
    // Loading states
    loading: false,
    error: null,
    
    // Metadata
    abVariant: "control",
    customThemeEnabled: false,
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 FETCH METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * 🔥 CRITICAL: Fetch thème pour un restaurant
     * - Essaie cache d'abord
     * - Ensuite API
     * - Stocke en AsyncStorage + memory
     */
    fetchThemeForRestaurant: async (restaurantId, options = {}) => {
      const { forceRefresh = false } = options;
      
      set({ loading: true, error: null });
      
      try {
        console.log(`📋 [useThemeStore] Fetching theme for restaurant ${restaurantId}`);
        
        // 1. Try cache (AsyncStorage)
        if (!forceRefresh) {
          const cached = await AsyncStorage.getItem(`theme_${restaurantId}`);
          if (cached) {
            const cachedTheme = JSON.parse(cached);
            console.log(`✅ [useThemeStore] Theme loaded from cache`);
            set({
              theme: cachedTheme.theme,
              customizations: cachedTheme.customizations,
              themeId: cachedTheme.theme.id,
              themeName: cachedTheme.theme.name,
              abVariant: cachedTheme.abVariant,
              customThemeEnabled: cachedTheme.customThemeEnabled,
              loading: false,
            });
            return cachedTheme;
          }
        }
        
        // 2. Fetch from API
        const response = await fetch(
          `/api/themes/restaurants/${restaurantId}/theme`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Unknown error");
        }
        
        const themeData = data.data;
        
        // 3. Cache in AsyncStorage
        await AsyncStorage.setItem(
          `theme_${restaurantId}`,
          JSON.stringify(themeData)
        );
        
        // 4. Update store
        set({
          theme: themeData.theme,
          customizations: themeData.customizations,
          themeId: themeData.theme.id,
          themeName: themeData.theme.name,
          abVariant: themeData.abVariant,
          customThemeEnabled: themeData.customThemeEnabled,
          loading: false,
        });
        
        console.log(`✅ [useThemeStore] Theme fetched and cached`);
        return themeData;
        
      } catch (error) {
        console.error(`❌ [useThemeStore] Error fetching theme:`, error);
        set({
          error: error.message,
          loading: false,
        });
        return null;
      }
    },
    
    /**
     * Clear theme cache (on logout)
     */
    clearTheme: async (restaurantId) => {
      try {
        if (restaurantId) {
          await AsyncStorage.removeItem(`theme_${restaurantId}`);
        }
        set({
          theme: null,
          customizations: {},
          themeId: null,
          themeName: "Default",
          loading: false,
        });
      } catch (error) {
        console.error(`❌ [useThemeStore] Error clearing theme:`, error);
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 CUSTOMIZATION METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Appliquer customizations au thème
     */
    updateCustomizations: async (restaurantId, customizations) => {
      try {
        console.log(`🎨 [useThemeStore] Updating customizations`);
        
        const response = await fetch(
          `/api/themes/restaurants/${restaurantId}/theme/customize`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customizations }),
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to update customizations`);
        }
        
        const data = await response.json();
        
        // Update store
        set({
          customizations: {
            ...get().customizations,
            ...customizations,
          },
          customThemeEnabled: true,
        });
        
        // Update cache
        const cached = await AsyncStorage.getItem(`theme_${restaurantId}`);
        if (cached) {
          const themeData = JSON.parse(cached);
          themeData.customizations = get().customizations;
          await AsyncStorage.setItem(
            `theme_${restaurantId}`,
            JSON.stringify(themeData)
          );
        }
        
        console.log(`✅ [useThemeStore] Customizations updated`);
        
      } catch (error) {
        console.error(`❌ [useThemeStore] Error updating customizations:`, error);
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get color from theme
     */
    getColor: (colorKey) => {
      const theme = get().theme;
      if (!theme || !theme.tokenConfig || !theme.tokenConfig.colors) {
        return "#000000";
      }
      
      return theme.tokenConfig.colors[colorKey] || "#000000";
    },
    
    /**
     * Get gradient from theme
     */
    getGradient: (gradientKey) => {
      const theme = get().theme;
      if (!theme || !theme.tokenConfig || !theme.tokenConfig.gradients) {
        return ["#2563EB", "#1E40AF"];
      }
      
      return (
        theme.tokenConfig.gradients[gradientKey] ||
        ["#2563EB", "#1E40AF"]
      );
    },
    
    /**
     * Check if restaurant has special features (sandwich pattern, etc)
     */
    hasSpecialFeature: (featureName) => {
      const theme = get().theme;
      if (!theme || !theme.tokenConfig) return false;
      
      return theme.tokenConfig[featureName] || false;
    },
    
    /**
     * Get all theme colors
     */
    getColors: () => {
      const theme = get().theme;
      return theme?.tokenConfig?.colors || {};
    },
    
    /**
     * Get theme name
     */
    getThemeName: () => {
      return get().themeName;
    },
    
    /**
     * Check if custom theme is enabled
     */
    isCustomThemeEnabled: () => {
      return get().customThemeEnabled;
    },
    
    /**
     * Get AB testing variant
     */
    getABVariant: () => {
      return get().abVariant;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Record theme analytics (render time, load time, etc)
     */
    recordAnalytics: async (restaurantId, metrics) => {
      try {
        const themeId = get().themeId;
        if (!themeId) return;
        
        // Don't await - fire and forget
        fetch('/api/themes/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            themeId,
            metrics,
          }),
        }).catch(err => console.warn('Analytics error:', err));
        
      } catch (error) {
        console.warn(`⚠️ [useThemeStore] Analytics error:`, error);
      }
    },
  };
});

/**
 * Initialize theme store with WebSocket listener
 * Call this once in App.tsx or main component
 */
export function initializeThemeStore(socket) {
  if (!socket) return;
  
  // Listen for theme updates from server
  socket.on('theme:updated', ({ restaurantId }) => {
    console.log(`🔔 [useThemeStore] Theme updated for restaurant ${restaurantId}`);
    
    // Force refresh
    useThemeStore.getState().fetchThemeForRestaurant(restaurantId, {
      forceRefresh: true,
    });
  });
}

export default useThemeStore;
