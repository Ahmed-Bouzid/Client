/**
 * 🪝 Hook pour écouter le statut de la réservation en temps réel
 * Redirige automatiquement le client vers JoinOrCreateTable si la réservation est fermée
 */

import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useSocketClient } from "./useSocketClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * @param {string} restaurantId - ID du restaurant
 * @param {string} reservationId - ID de la réservation actuelle
 * @param {function} onReservationClosed - Callback appelé quand la réservation est fermée
 * @param {string} [tableId] - ID de la table (pour détecter fermeture via comptoir)
 */
export const useReservationStatus = (
	restaurantId,
	reservationId,
	onReservationClosed,
	tableId = null,
) => {
	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(shouldConnect ? restaurantId : null);
	const hasRedirectedRef = useRef(false);

	const triggerClose = (asyncStorageKeys = ["reservationId", "tableId", "guestToken"]) => {
		if (hasRedirectedRef.current) return;
		hasRedirectedRef.current = true;

		AsyncStorage.multiRemove(asyncStorageKeys)
			.catch((error) => {
				console.error("❌ [RESA STATUS] Erreur nettoyage AsyncStorage:", error);
			})
			.finally(() => {
				Alert.alert(
					"Réservation terminée",
					"Votre table a été fermée. Merci de votre visite !",
					[
						{
							text: "OK",
							onPress: () => {
								if (onReservationClosed) onReservationClosed();
							},
						},
					],
					{ cancelable: false },
				);
			});
	};

	useEffect(() => {
		if (!shouldConnect || !reservationId) {
			return;
		}

		const handleReservationUpdate = (event) => {
			const { type, data } = event;

			if (data._id !== reservationId && data.id !== reservationId) {
				return;
			}

			if (type === "statusUpdated" && data.status === "completed") {
				triggerClose();
			}
		};

		on("reservation", handleReservationUpdate);

		return () => {
			off("reservation", handleReservationUpdate);
		};
	}, [shouldConnect, reservationId, on, off, onReservationClosed]);

	// ⭐ Écouter la fermeture de session comptoir (paiement via frontend)
	useEffect(() => {
		if (!shouldConnect || !tableId) return;

		const handleTableSession = (event) => {
			const { type, data } = event;
			if (type !== "closed") return;

			const eventTableId = data?.tableId?._id?.toString() || data?.tableId?.toString();
			if (eventTableId !== tableId.toString()) return;

			triggerClose();
		};

		on("table-session", handleTableSession);

		return () => {
			off("table-session", handleTableSession);
			hasRedirectedRef.current = false;
		};
	}, [shouldConnect, tableId, on, off, onReservationClosed]);
};

export default useReservationStatus;

export default useReservationStatus;
