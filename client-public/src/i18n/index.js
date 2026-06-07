/**
 * i18n engine — OrderIt CLIENT-end
 *
 * Architecture :
 *  - Les clés = les strings françaises originales
 *  - Si une traduction est manquante → fallback sur la clé (= FR intact)
 *  - Zéro risque de régression : le français fonctionne sans aucune modification
 */

import fr from "./fr";
import en from "./en";
import it from "./it";
import es from "./es";
import de from "./de";
import zh from "./zh";
import ja from "./ja";
import nl from "./nl";

export const LANGUAGES = {
  fr: { label: "Français", flag: "🇫🇷", rtl: false },
  en: { label: "English", flag: "🇬🇧", rtl: false },
  it: { label: "Italiano", flag: "🇮🇹", rtl: false },
  es: { label: "Español", flag: "🇪🇸", rtl: false },
  de: { label: "Deutsch", flag: "🇩🇪", rtl: false },
  zh: { label: "中文", flag: "🇨🇳", rtl: false },
  ja: { label: "日本語", flag: "🇯🇵", rtl: false },
  nl: { label: "Nederlands", flag: "🇳🇱", rtl: false },
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES);

const translations = { fr, en, it, es, de, zh, ja, nl };

/**
 * Retourne la traduction d'une string française dans la langue cible.
 * Si la traduction est manquante → retourne la clé (string FR originale).
 */
export function translate(key, lang = "fr") {
  if (!key) return key;
  const dict = translations[lang] || translations.fr;
  return dict[key] ?? key;
}

export default translations;
