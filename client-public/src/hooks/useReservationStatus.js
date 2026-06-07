/**
 * 🪝 Hook pour écouter le statut de la réservation en temps réel
 * - Ferme la session si réservation terminée (reservation:statusUpdated completed)
 * - Ferme la session si table fermée depuis le comptoir (table-session:closed)
 * - Notifie si addition demandée (table-session:bill_requested)
 * - Ferme la session si paiement complété depuis le frontend (payment-completed)
 */

import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useSocketClient } from "./useSocketClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * @param {string} restaurantId
 * @param {string} reservationId
 * @param {function} onReservationClosed
 * @param {string} [tableId]
 * @param {function} [onBillRequested] - Callback optionnel quand l'addition est demandée
 */
export const useReservationStatus = (
	restaurantId,
	reservationId,
	onReservationClosed,
	tableId = null,
	onBillRequested = null,
) => {
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(shouldConnect ? restaurantId : null);
	const hasRedirectedRef = useRef(false);

	const triggerClose = () => {
		if (hasRedirectedRef.current) return;
		hasRedirectedRef.current = true;

		AsyncStorage.multiRemove(["reservationId", "tableId", "guestToken"])
			.catch((err) => console.error("❌ [RESA STATUS] AsyncStorage:", err))
			.finally(() => {
				Alert.alert(
					"Réservation terminée",
					"Votre table a été fermée. Merci de votre visite !",
					[{ text: "OK", onPress: () => onReservationClosed?.() }],
					{ cancelable: false },
				);
			});
	};

	// ── 1. reservation:statusUpdated → completed (Stripe webhook ou fermeture backend)
	useEffect(() => {
		if (!shouldConnect || !reservationId) return;

		const handle = (event) => {
			const { type, data } = event;
			const id = data?._id || data?.id;
			if (id !== reservationId) return;
			if (type === "statusUpdated" && data.status === "completed") triggerClose();
		};

		on("reservation", handle);
		return () => off("reservation", handle);
	}, [shouldConnect, reservationId, on, off, onReservationClosed]);

	// ── 2. table-session → closed (fermeture comptoir) | bill_requested (addition)
	useEffect(() => {
		if (!shouldConnect || !tableId) return;

		const matchesTable = (data) => {
			const id = data?.tableId?._id?.toString() || data?.tableId?.toString();
			return id === tableId.toString();
		};

		const handle = (event) => {
			const { type, data } = event;
			if (!matchesTable(data)) return;

			if (type === "closed") {
				triggerClose();
			} else if (type === "bill_requested") {
				// Notifier le client que l'addition a été demandée
				if (onBillRequested) {
					onBillRequested();
				} else {
					Alert.alert(
						"Addition demandée",
						"Le serveur a demandé l'addition. Vous pouvez maintenant payer.",
						[{ text: "OK" }],
					);
				}
			}
		};

		on("table-session", handle);
		return () => {
			off("table-session", handle);
			hasRedirectedRef.current = false;
		};
	}, [shouldConnect, tableId, on, off, onReservationClosed, onBillRequested]);

	// ── 3. payment-completed → fermeture si concerne cette table
	useEffect(() => {
		if (!shouldConnect || !tableId) return;

		const handle = (payload) => {
			const data = payload?.data || payload;
			const eventTableId = data?.tableId?._id?.toString() || data?.tableId?.toString();
			if (eventTableId !== tableId.toString()) return;
			triggerClose();
		};

		on("payment-completed", handle);
		return () => off("payment-completed", handle);
	}, [shouldConnect, tableId, on, off, onReservationClosed]);
};

export default useReservationStatus;
