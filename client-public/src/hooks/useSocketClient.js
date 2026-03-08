/**
 * 🪝 Hook React pour utiliser WebSocket Client-end
 * Simplifie l'intégration du socketService dans les composants React
 *
 * Usage:
 * ```jsx
 * const { isConnected, on, off, emit, emitWithAck } = useSocketClient(restaurantId, tableId);
 *
 * useEffect(() => {
 *   const handleOrderUpdate = (payload) => {
 *     console.log("Commande mise à jour:", payload);
 *   };
 *
 *   on("order", handleOrderUpdate);
 *   return () => off("order", handleOrderUpdate);
 * }, [on, off]);
 * ```
 */

import { useEffect, useState, useCallback, useRef } from "react";
import socketService from "../services/socketService";
import { clientAuthService } from "shared-api/services/clientAuthService";

export const useSocketClient = (
	restaurantId,
	tableId = null,
	guestToken = null,
) => {
	const [isConnected, setIsConnected] = useState(false);
	const [lastEvent, setLastEvent] = useState(null);
	const restaurantIdRef = useRef(restaurantId);
	const tableIdRef = useRef(tableId);
	const listenersRef = useRef(new Map());

	// Mettre à jour les refs quand les props changent
	useEffect(() => {
		restaurantIdRef.current = restaurantId;
		tableIdRef.current = tableId;
	}, [restaurantId, tableId]);

	// Connexion au montage, déconnexion au démontage
	useEffect(() => {
		if (!restaurantId) {
			console.warn("⚠️ useSocketClient: restaurantId manquant");
			return;
		}

		// ✅ Récupérer le token client avant de connecter
		const connectWithToken = async () => {
			try {
				const token = guestToken || (await clientAuthService.getClientToken());
				socketService.connect(restaurantId, tableId, token);
			} catch (error) {
				console.error("❌ Erreur récupération token pour Socket.io:", error);
			}
		};

		connectWithToken();

		// Surveiller l'état de connexion
		const checkConnection = setInterval(() => {
			setIsConnected(socketService.isConnected());
		}, 1000);

		// Cleanup au démontage
		return () => {
			clearInterval(checkConnection);

			// Nettoyer tous les listeners enregistrés par ce hook
			listenersRef.current.forEach((callback, event) => {
				socketService.off(event, callback);
			});
			listenersRef.current.clear();

			// Déconnecter le socket
			socketService.disconnect();
		};
	}, [restaurantId, tableId, guestToken]);

	/**
	 * Écoute un événement WebSocket
	 */
	const on = useCallback((event, callback) => {
		// Wrapper pour stocker le dernier événement dans le state
		const wrappedCallback = (payload) => {
			setLastEvent({ event, payload, timestamp: Date.now() });
			callback(payload);
		};

		// Stocker le callback pour le cleanup
		listenersRef.current.set(event, wrappedCallback);

		socketService.on(event, wrappedCallback);
	}, []);

	/**
	 * Arrête l'écoute d'un événement
	 */
	const off = useCallback((event, callback) => {
		const wrappedCallback = listenersRef.current.get(event);
		if (wrappedCallback) {
			socketService.off(event, wrappedCallback);
			listenersRef.current.delete(event);
		}
	}, []);

	/**
	 * Émet un événement simple (sans ACK)
	 */
	const emit = useCallback((event, data) => {
		return socketService.emit(event, data);
	}, []);

	/**
	 * Émet un événement avec ACK (garantie de réception)
	 */
	const emitWithAck = useCallback(async (event, data) => {
		try {
			const response = await socketService.emitWithAck(event, data);
			return { success: true, data: response };
		} catch (error) {
			console.error(`❌ Erreur émission ${event}:`, error);
			return { success: false, error: error.message };
		}
	}, []);

	/**
	 * Rejoint une room spécifique
	 */
	const joinRoom = useCallback(
		(roomName) => {
			return emitWithAck("join-room", { roomName });
		},
		[emitWithAck],
	);

	/**
	 * Quitte une room spécifique
	 */
	const leaveRoom = useCallback(
		(roomName) => {
			return emit("leave-room", { roomName });
		},
		[emit],
	);

	return {
		isConnected,
		lastEvent,
		on,
		off,
		emit,
		emitWithAck,
		joinRoom,
		leaveRoom,
		restaurantId: socketService.getRestaurantId(),
		tableId: socketService.getTableId(),
	};
};

/**
 * Hook pour écouter un événement spécifique
 * Simplifie l'usage pour un seul événement
 *
 * Usage:
 * ```jsx
 * const orderData = useSocketEvent("order", restaurantId);
 *
 * useEffect(() => {
 *   if (orderData) {
 *     console.log("Nouvelle commande:", orderData);
 *   }
 * }, [orderData]);
 * ```
 */
export const useSocketEvent = (eventName, restaurantId, tableId = null) => {
	const [eventData, setEventData] = useState(null);

	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(
		shouldConnect ? restaurantId : null,
		tableId,
	);

	useEffect(() => {
		if (!shouldConnect) return;

		const handleEvent = (payload) => {
			setEventData(payload);
		};

		on(eventName, handleEvent);
		return () => off(eventName, handleEvent);
	}, [eventName, on, off, shouldConnect]);

	return eventData;
};

/**
 * Hook pour surveiller les mises à jour de menu en temps réel
 */
export const useMenuUpdates = (restaurantId) => {
	const [menuData, setMenuData] = useState(null);

	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(shouldConnect ? restaurantId : null);

	useEffect(() => {
		if (!shouldConnect) return;

		const handleMenuUpdate = (payload) => {
			setMenuData(payload);
		};

		on("menu_updated", handleMenuUpdate);
		return () => off("menu_updated", handleMenuUpdate);
	}, [on, off, shouldConnect]);

	return menuData;
};

/**
 * Hook pour surveiller les changements de style en temps réel
 */
export const useStyleUpdates = (restaurantId) => {
	const [styleData, setStyleData] = useState(null);

	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off, isConnected } = useSocketClient(
		shouldConnect ? restaurantId : null,
	);

	useEffect(() => {
		if (!shouldConnect) return;

		const handleStyleUpdate = (payload) => {
			setStyleData(payload);
		};

		on("style_applied", handleStyleUpdate);
		return () => off("style_applied", handleStyleUpdate);
	}, [on, off, shouldConnect]);

	return { style: styleData, isConnected: shouldConnect ? isConnected : false };
};

/**
 * Hook pour surveiller les commandes en temps réel
 */
export const useOrderUpdates = (restaurantId, tableId = null) => {
	const [orders, setOrders] = useState([]);

	// ✅ Ne pas connecter si restaurantId est invalide
	const shouldConnect = restaurantId && typeof restaurantId === "string";
	const { on, off } = useSocketClient(
		shouldConnect ? restaurantId : null,
		tableId,
	);

	useEffect(() => {
		if (!shouldConnect) return;

		const handleOrderEvent = (payload) => {
			if (payload.type === "order_created") {
				setOrders((prev) => [...prev, payload.data]);
			} else if (payload.type === "order_updated") {
				setOrders((prev) =>
					prev.map((order) =>
						order._id === payload.data._id ? payload.data : order,
					),
				);
			} else if (payload.type === "order_deleted") {
				setOrders((prev) =>
					prev.filter((order) => order._id !== payload.data._id),
				);
			}
		};

		on("order", handleOrderEvent);
		return () => off("order", handleOrderEvent);
	}, [on, off, shouldConnect]);

	return orders;
};

export default useSocketClient;
