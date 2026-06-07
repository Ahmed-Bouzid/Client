/**
 * useLanguageStore — Zustand Store
 * 
 * Gestion de la langue active dans l'app CLIENT-end.
 * Persiste la langue choisie dans AsyncStorage.
 * 
 * Usage :
 *   const { lang, setLang } = useLanguageStore();
 *   const { t } = useTranslation();  // via le hook useTranslation
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPPORTED_LANGUAGES } from "../i18n";

const STORAGE_KEY = "orderit_language";
const DEFAULT_LANG = "fr";

export const useLanguageStore = create((set, get) => ({
  lang: DEFAULT_LANG,
  isLoaded: false,

  /**
   * Charge la langue depuis AsyncStorage au démarrage.
   * À appeler une fois dans le composant racine (App.jsx ou équivalent).
   */
  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        set({ lang: saved, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  /**
   * Change la langue et la persiste dans AsyncStorage.
   */
  setLang: async (newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    set({ lang: newLang });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Silently fail — the in-memory state is already updated
    }
  },
}));
