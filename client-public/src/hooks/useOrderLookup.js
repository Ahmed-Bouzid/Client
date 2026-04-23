/**
 * useOrderLookup.js — Hook de validation et recherche de commande
 *
 * Gère :
 *   - Validation stricte du format #XXX-XXX (temps réel)
 *   - Auto-formatage de l'input (ajout #, insertion -)
 *   - Appel au service de lookup
 *   - États loading / error / result
 */

import { useState, useCallback, useMemo } from "react";
import { lookupOrderByNumber } from "../services/orderLookupService";

// Regex stricte : #XXX-XXX (X = chiffre)
const ORDER_NUMBER_REGEX = /^#\d{3}-\d{3}$/;

/**
 * Valide si un numéro de commande respecte le format #XXX-XXX
 * @param {string} value
 * @returns {boolean}
 */
export function isValidOrderNumber(value) {
  return ORDER_NUMBER_REGEX.test(value);
}

/**
 * Auto-formate l'input vers #XXX-XXX
 * - Ajoute # au début si manquant
 * - Insère - après les 3 premiers chiffres
 * - Limite à #XXX-XXX (8 caractères max)
 * @param {string} raw
 * @returns {string}
 */
export function formatOrderNumber(raw) {
  // Extraire uniquement les chiffres
  const digits = raw.replace(/[^0-9]/g, "");

  // Limiter à 6 chiffres max
  const limited = digits.slice(0, 6);

  if (limited.length === 0) return "#";
  if (limited.length <= 3) return `#${limited}`;
  return `#${limited.slice(0, 3)}-${limited.slice(3)}`;
}

/**
 * Hook principal pour la recherche de commande
 * @returns {{ orderNumber, setOrderNumber, isValid, error, loading, result, lookup, reset }}
 */
export default function useOrderLookup() {
  const [orderNumber, setOrderNumberRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const isValid = useMemo(() => isValidOrderNumber(orderNumber), [orderNumber]);

  // Gestion de l'input avec auto-format
  const setOrderNumber = useCallback((raw) => {
    setError("");
    setResult(null);

    // Si l'utilisateur efface tout
    if (!raw || raw === "#") {
      setOrderNumberRaw("");
      return;
    }

    const formatted = formatOrderNumber(raw);
    setOrderNumberRaw(formatted);
  }, []);

  // Lancer la recherche
  const lookup = useCallback(async () => {
    if (!isValid) {
      setError("Format invalide. Utilisez #XXX-XXX (ex: #123-456)");
      return null;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const order = await lookupOrderByNumber(orderNumber);

      if (!order) {
        setError("Aucune commande trouvée avec ce numéro.");
        setLoading(false);
        return null;
      }

      setResult(order);
      setLoading(false);
      return order;
    } catch (err) {
      console.error("❌ [OrderLookup] Erreur:", err);
      setError("Erreur de connexion. Veuillez réessayer.");
      setLoading(false);
      return null;
    }
  }, [orderNumber, isValid]);

  // Reset complet
  const reset = useCallback(() => {
    setOrderNumberRaw("");
    setError("");
    setResult(null);
    setLoading(false);
  }, []);

  return {
    orderNumber,
    setOrderNumber,
    isValid,
    error,
    loading,
    result,
    lookup,
    reset,
  };
}
