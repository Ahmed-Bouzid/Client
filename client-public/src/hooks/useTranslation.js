/**
 * useTranslation — Hook i18n
 *
 * Retourne une fonction `t(key)` qui traduit une string FR dans la langue active.
 * Si la traduction est manquante → fallback sur la clé (FR intact).
 *
 * Usage :
 *   const { t, lang } = useTranslation();
 *   <Text>{t("Retour au menu")}</Text>
 *   <Text>{t("Paiement réussi ! 🎉")}</Text>
 */

import { useCallback } from "react";
import { useLanguageStore } from "../stores/useLanguageStore";
import { translate } from "../i18n";

export function useTranslation() {
  const lang = useLanguageStore((state) => state.lang);

  const t = useCallback(
    (key) => translate(key, lang),
    [lang]
  );

  return { t, lang };
}
