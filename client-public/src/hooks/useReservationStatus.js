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
 */
export const useReservationStatus = (
	restaurantId,
	reservationId,
	onReservationClosed,
) => {
	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(shouldConnect ? restaurantId : null);
	const hasRedirectedRef = useRef(false);

	useEffect(() => {
		if (!shouldConnect || !reservationId) {
			// ✅ Silent return - c'est normal que reservationId soit null au début
			return;
		}

		console.log(
			`🔔 [RESA STATUS] Écoute des changements de statut pour réservation ${reservationId}`,
		);

		const handleReservationUpdate = (event) => {
			console.log("📡 [RESA STATUS] WebSocket event reçu:", event);

			const { type, data } = event;

			// Vérifier si c'est notre réservation
			if (data._id !== reservationId && data.id !== reservationId) {
				console.log(
					"ℹ️ [RESA STATUS] Event pour une autre réservation, ignoré",
				);
				return;
			}

			// Si la réservation est terminée → rediriger
			if (
				type === "statusUpdated" &&
				data.status === "terminée" &&
				!hasRedirectedRef.current
			) {
				console.log("🚪 [RESA STATUS] Réservation terminée, redirection...");
				hasRedirectedRef.current = true;

				// Nettoyer AsyncStorage
				AsyncStorage.multiRemove(["reservationId", "tableId", "guestToken"])
					.then(() => {
						console.log("✅ [RESA STATUS] AsyncStorage nettoyé");

						// Alert pour informer l'utilisateur
						Alert.alert(
							"Réservation terminée",
							"Votre table a été fermée par le serveur. Merci de votre visite !",
							[
								{
									text: "OK",
									onPress: () => {
										console.log(
											"🔄 [RESA STATUS] Redirection vers JoinOrCreateTable",
										);
										// Appeler le callback de navigation
										if (onReservationClosed) {
											onReservationClosed();
										}
									},
								},
							],
							{ cancelable: false },
						);
					})
					.catch((error) => {
						console.error(
							"❌ [RESA STATUS] Erreur nettoyage AsyncStorage:",
							error,
						);
						// Rediriger quand même
						if (onReservationClosed) {
							onReservationClosed();
						}
					});
			}
		};

		// Attacher le listener
		on("reservation", handleReservationUpdate);

		// Cleanup
		return () => {
			console.log("🧹 [RESA STATUS] Nettoyage listener");
			off("reservation", handleReservationUpdate);
			hasRedirectedRef.current = false;
		};
	}, [shouldConnect, reservationId, on, off, onReservationClosed]);
};

export default useReservationStatus;
