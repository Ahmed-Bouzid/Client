/**
 * useOrderLookup.js — Hook de validation et recherche de commande
 *
 * Gère :
 *   - Validation stricte du format #XXXX (temps réel)
 *   - Auto-formatage de l'input (ajout #, insertion -)
 *   - Appel au service de lookup
 *   - États loading / error / result
 */

import { useState, useCallback, useMemo } from "react";
import { lookupOrderByNumber } from "../services/orderLookupService";

// Regex stricte : #XXXX (X = alphanumérique)
const ORDER_NUMBER_REGEX = /^#[A-Z0-9]{4}$/;

/**
 * Valide si un numéro de commande respecte le format #XXXX
 * @param {string} value
 * @returns {boolean}
 */
export function isValidOrderNumber(value) {
  return ORDER_NUMBER_REGEX.test(value);
}

/**
 * Auto-formate l'input vers #XXXX
 * - Ajoute # au début si manquant
 * - Garde uniquement A-Z0-9
 * - Limite à 4 caractères utiles
 * @param {string} raw
 * @returns {string}
 */
export function formatOrderNumber(raw) {
  const sanitized = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

  if (sanitized.length === 0) return "#";
  return `#${sanitized}`;
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
  const lookup = useCallback(async (options = {}) => {
    const { orderNumber: overrideOrderNumber, ...lookupOptions } = options || {};
    const effectiveOrderNumber = overrideOrderNumber
      ? formatOrderNumber(overrideOrderNumber)
      : orderNumber;

    if (!isValidOrderNumber(effectiveOrderNumber)) {
      setError("Format invalide. Utilisez #XXXX (ex: #FA24)");
      return null;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const order = await lookupOrderByNumber(effectiveOrderNumber, lookupOptions);

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
  }, [orderNumber]);

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
