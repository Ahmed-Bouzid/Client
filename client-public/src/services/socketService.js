/**
 * 🔌 Service WebSocket Client-end
 * Gère la connexion Socket.io pour l'application client public
 *
 * Fonctionnalités :
 * - Connexion/déconnexion automatique
 * - Rooms isolées par restaurant
 * - Acknowledgements (ACK) pour fiabilité
 * - Reconnexion automatique avec backoff exponentiel
 * - Heartbeat pour maintenir la connexion active
 * - Queue de retry pour événements manqués
 * - Notifications temps réel (commandes, menus, styles, etc.)
 */

import { io } from "socket.io-client";

// ============ CONFIGURATION ============
const SOCKET_URL =
	process.env.EXPO_PUBLIC_SOCKET_URL ||
	process.env.EXPO_PUBLIC_API_BASE_URL ||
	"http://localhost:3000";

const SOCKET_CONFIG = {
	transports: ["polling", "websocket"], // Polling en premier pour compatibilité HTTPS
	reconnection: true,
	reconnectionAttempts: 10, // ⭐ Limité à 10 tentatives (évite boucle infinie)
	reconnectionDelay: 1000,
	reconnectionDelayMax: 30000,
	timeout: 20000,
	autoConnect: false, // Connexion manuelle pour contrôler le cycle de vie
	path: "/socket.io/",
	pingTimeout: 60000,
	pingInterval: 25000,
	upgrade: true, // Permet l'upgrade de polling vers websocket
	forceNew: false, // Réutilise les connexions existantes
	withCredentials: false, // Pas de cookies cross-origin
};

// ============ CONSTANTES ============
const HEARTBEAT_INTERVAL = 25000; // 25s
const ACK_TIMEOUT = 5000; // 5s pour recevoir un ACK
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2s entre chaque retry

// ============ ÉTAT GLOBAL ============
let socketInstance = null;
let currentRestaurantId = null;
let currentTableId = null;
let isConnected = false;
let heartbeatTimer = null;
let eventListeners = new Map(); // Track des listeners custom
let eventQueue = []; // Queue pour événements en attente d'ACK
let retryQueue = []; // Queue pour événements à retenter

// ============ UTILITAIRES ============

/**
 * Génère un ID unique pour chaque événement émis
 */
const generateEventId = () => {
	return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Démarre le heartbeat client → serveur
 */
const startHeartbeat = (socket) => {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
	}

	heartbeatTimer = setInterval(() => {
		if (socket && socket.connected) {
			socket.emit("client-ping", {
				timestamp: Date.now(),
				restaurantId: currentRestaurantId,
				tableId: currentTableId,
			});
		}
	}, HEARTBEAT_INTERVAL);
};

/**
 * Arrête le heartbeat
 */
const stopHeartbeat = () => {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
		heartbeatTimer = null;
	}
};

/**
 * Ajoute un événement à la queue de retry
 */
const addToRetryQueue = (event, data, attempts = 0) => {
	if (attempts >= MAX_RETRY_ATTEMPTS) {
		console.error(`❌ Max retry atteint pour ${event}`, data);
		return;
	}

	retryQueue.push({
		event,
		data,
		attempts,
		timestamp: Date.now(),
	});

	// Planifier le retry
	setTimeout(
		() => {
			const item = retryQueue.shift();
			if (item && socketInstance?.connected) {
				console.log(
					`🔄 Retry ${item.attempts + 1}/${MAX_RETRY_ATTEMPTS} pour ${item.event}`,
				);
				emitWithAck(item.event, item.data, item.attempts + 1);
			}
		},
		RETRY_DELAY * (attempts + 1),
	); // Backoff exponentiel
};

/**
 * Émet un événement avec acknowledgement (ACK)
 */
const emitWithAck = (event, data, retryAttempt = 0) => {
	if (!socketInstance || !socketInstance.connected) {
		console.warn(`⚠️ Socket non connecté, ajout à la queue: ${event}`);
		addToRetryQueue(event, data, retryAttempt);
		return Promise.reject(new Error("Socket non connecté"));
	}

	return new Promise((resolve, reject) => {
		const eventId = generateEventId();
		const payload = {
			...data,
			eventId,
			timestamp: Date.now(),
			restaurantId: currentRestaurantId,
			tableId: currentTableId,
		};

		// Timeout pour ACK
		const ackTimeout = setTimeout(() => {
			console.warn(`⏱️ Timeout ACK pour ${event} (ID: ${eventId})`);
			addToRetryQueue(event, data, retryAttempt);
			reject(new Error("ACK timeout"));
		}, ACK_TIMEOUT);

		// Émettre avec callback ACK
		socketInstance.emit(event, payload, (response) => {
			clearTimeout(ackTimeout);

			if (response?.success) {
				console.log(`✅ ACK reçu pour ${event} (ID: ${eventId})`);
				resolve(response.data);
			} else {
				console.error(`❌ ACK négatif pour ${event}:`, response?.error);
				addToRetryQueue(event, data, retryAttempt);
				reject(new Error(response?.error || "ACK négatif"));
			}
		});
	});
};

/**
 * Rejoindre les rooms appropriées (restaurant + table)
 */
const joinRooms = (socket, restaurantId, tableId) => {
	if (!socket || !socket.connected) {
		console.warn("⚠️ Impossible de joindre les rooms: socket non connecté");
		return;
	}

	currentRestaurantId = restaurantId;
	currentTableId = tableId;

	// Rejoindre la room du restaurant
	socket.emit("join-restaurant", { restaurantId }, (ack) => {
		if (!ack?.success) {
			console.error(`❌ Échec join restaurant-${restaurantId}:`, ack?.error);
		}
	});

	// Rejoindre la room de la table si spécifiée
	if (tableId) {
		socket.emit("join-table", { restaurantId, tableId }, (ack) => {
			if (!ack?.success) {
				console.error(`❌ Échec join table-${tableId}:`, ack?.error);
			}
		});
	}
};

/**
 * Rejoindre une room de réservation (pour recevoir les mises à jour de messages)
 */
export const joinReservation = (reservationId) => {
	if (!socketInstance || !socketInstance.connected) {
		console.warn(
			"⚠️ Impossible de joindre la room reservation: socket non connecté",
		);
		return;
	}

	console.log(`🔌 Rejoindre room: reservation-${reservationId}`);

	socketInstance.emit("join-reservation", { reservationId }, (ack) => {
		if (!ack?.success) {
			console.error(`❌ Échec join reservation-${reservationId}:`, ack?.error);
		}
	});
};

/**
 * Quitter une room de réservation
 */
export const leaveReservation = (reservationId) => {
	if (!socketInstance) return;

	console.log(`🔌 Quitter room: reservation-${reservationId}`);

	socketInstance.emit("leave-reservation", { reservationId });
};

/**
 * Quitter les rooms actuelles
 */
const leaveRooms = (socket) => {
	if (!socket || !currentRestaurantId) return;

	socket.emit("leave-restaurant", { restaurantId: currentRestaurantId });
	if (currentTableId) {
		socket.emit("leave-table", {
			restaurantId: currentRestaurantId,
			tableId: currentTableId,
		});
	}

	currentRestaurantId = null;
	currentTableId = null;
};

// ============ API PUBLIQUE ============

/**
 * Connecte le client au serveur WebSocket
 * @param {string} restaurantId - ID du restaurant
 * @param {string} tableId - ID de la table (optionnel)
 * @param {string} guestToken - Token d'authentification du guest (optionnel)
 */
export const connectSocket = (
	restaurantId,
	tableId = null,
	guestToken = null,
) => {
	if (socketInstance?.connected) {
		console.log("🔌 Socket déjà connecté");
		// Rejoindre les nouvelles rooms si changement
		if (restaurantId !== currentRestaurantId || tableId !== currentTableId) {
			leaveRooms(socketInstance);
			joinRooms(socketInstance, restaurantId, tableId);
		}
		return socketInstance;
	}

	console.log(`🔌 Connexion Socket.io au restaurant ${restaurantId}...`);

	// Créer l'instance Socket.io
	const authConfig = guestToken ? { auth: { token: guestToken } } : {};
	socketInstance = io(SOCKET_URL, {
		...SOCKET_CONFIG,
		...authConfig,
	});

	const socket = socketInstance;

	// ============ ÉVÉNEMENTS CONNEXION ============
	socket.on("connect", () => {
		console.log(`✅ Socket connecté: ${socket.id}`);
		isConnected = true;

		// Rejoindre les rooms
		joinRooms(socket, restaurantId, tableId);

		// Démarrer le heartbeat
		startHeartbeat(socket);

		// Réessayer les événements en queue
		if (retryQueue.length > 0) {
			console.log(`🔄 Replay de ${retryQueue.length} événements en queue`);
			const queue = [...retryQueue];
			retryQueue = [];
			queue.forEach((item) => {
				emitWithAck(item.event, item.data, item.attempts);
			});
		}
	});

	socket.on("disconnect", (reason) => {
		console.warn(`🔌 Socket déconnecté: ${reason}`);
		isConnected = false;
		stopHeartbeat();
	});

	socket.on("connect_error", (error) => {
		const errorMsg = error?.message || error?.toString() || "unknown";
		const errorMsgLower = errorMsg.toLowerCase();
		isConnected = false;

		// ⭐ Distinguer les erreurs temporaires (pas des erreurs critiques)
		const isTimout =
			errorMsgLower.includes("timeout") ||
			errorMsgLower.includes("econnrefused") ||
			errorMsgLower.includes("network") ||
			errorMsgLower.includes("enotfound");

		if (isTimout) {
			// Erreur temporaire → Log simple (Socket.io gère la reconnexion auto)
			console.warn(
				"⏱️ Erreur connexion temporaire (reconnexion auto):",
				errorMsg,
			);
			return;
		}

		// ⭐ Vérifier si c'est une erreur d'authentification
		// Dans ce cas, arrêter complètement la reconnexion
		const isAuthError =
			errorMsgLower.includes("token invalide") ||
			errorMsgLower.includes("unauthorized") ||
			errorMsgLower.includes("authentification") ||
			errorMsgLower.includes("invalid token");

		if (isAuthError) {
			// Erreur d'authentification normale (session expirée)
			console.warn("⚠️ Session Socket expirée ou invalide:", errorMsg);
			console.warn("🔐 Arrêt Socket → Reconnexion requise");
			// Déconnecter proprement pour éviter la boucle infinie
			stopHeartbeat();
			socket.disconnect();
			socketInstance = null;
			eventListeners.clear();
			eventQueue = [];
			retryQueue = [];
		} else {
			// Erreur inattendue (rare)
			console.error("❌ Erreur connexion Socket inattendue:", errorMsg);
		}
	});

	socket.on("reconnect_attempt", (attemptNumber) => {
		console.log(`🔄 Tentative de reconnexion #${attemptNumber}`);
	});

	// ⭐ Arrêter après échec définitif
	socket.on("reconnect_failed", () => {
		console.error("❌ Reconnexion échouée définitivement → Arrêt du socket");
		stopHeartbeat();
		isConnected = false;
	});

	// ============ ÉVÉNEMENTS MÉTIER ============

	// 📦 Commande créée/mise à jour
	socket.on("order", (payload) => {
		console.log("📦 Événement order reçu:", payload.type);
		notifyListeners("order", payload);
	});

	// 🍽️ Menu/Produit mis à jour
	socket.on("menu_updated", (payload) => {
		console.log("🍽️ Menu mis à jour");
		notifyListeners("menu_updated", payload);
	});

	// 🎨 Style appliqué (NOUVEAU)
	socket.on("style_applied", (payload) => {
		console.log("🎨 Nouveau style appliqué:", payload.style_id);
		notifyListeners("style_applied", payload);
	});

	// 📊 Stock mis à jour
	socket.on("stock_updated", (payload) => {
		console.log("📊 Stock mis à jour");
		notifyListeners("stock_updated", payload);
	});

	// 🪑 État de table mis à jour
	socket.on("table_status_updated", (payload) => {
		console.log("🪑 État de table mis à jour");
		notifyListeners("table_status_updated", payload);
	});

	// 💬 Message du serveur
	socket.on("server_message", (payload) => {
		console.log("💬 Message du serveur reçu");
		notifyListeners("server_message", payload);
	});

	// 📨 Réponse du serveur (messagerie client-serveur)
	socket.on("server-response", (payload) => {
		console.log("📨 Réponse serveur reçue:", payload.type);
		notifyListeners("server-response", payload);
	});

	// ✅ Statut de message (lu/non lu) pour messagerie client-serveur
	socket.on("message-status", (payload) => {
		console.log("✅ [socketService] Événement message-status reçu:", payload);
		notifyListeners("message-status", payload);
	});

	// 🔔 Notification générique
	socket.on("notification", (payload) => {
		console.log("🔔 Notification reçue:", payload.type);
		notifyListeners("notification", payload);
	});

	// Connecter immédiatement
	socket.connect();

	return socket;
};

/**
 * Déconnecte le socket
 */
export const disconnectSocket = () => {
	if (!socketInstance) return;

	console.log("🔌 Déconnexion Socket...");
	stopHeartbeat();
	leaveRooms(socketInstance);
	socketInstance.disconnect();
	socketInstance = null;
	isConnected = false;
	eventListeners.clear();
	eventQueue = [];
	retryQueue = [];
};

/**
 * Écoute un événement custom
 */
export const onSocketEvent = (event, callback) => {
	if (!eventListeners.has(event)) {
		eventListeners.set(event, []);
	}
	eventListeners.get(event).push(callback);
};

/**
 * Arrête l'écoute d'un événement
 */
export const offSocketEvent = (event, callback) => {
	if (!eventListeners.has(event)) return;

	const callbacks = eventListeners.get(event);
	const index = callbacks.indexOf(callback);
	if (index > -1) {
		callbacks.splice(index, 1);
	}
};

/**
 * Notifie tous les listeners d'un événement
 */
const notifyListeners = (event, payload) => {
	if (!eventListeners.has(event)) return;

	const callbacks = eventListeners.get(event);
	callbacks.forEach((callback) => {
		try {
			callback(payload);
		} catch (error) {
			console.error(`❌ Erreur dans listener ${event}:`, error);
		}
	});
};

/**
 * Émet un événement au serveur (sans ACK)
 */
export const emitSocketEvent = (event, data) => {
	if (!socketInstance || !socketInstance.connected) {
		console.warn(`⚠️ Socket non connecté, événement ignoré: ${event}`);
		return false;
	}

	socketInstance.emit(event, {
		...data,
		timestamp: Date.now(),
		restaurantId: currentRestaurantId,
		tableId: currentTableId,
	});

	return true;
};

/**
 * Émet un événement avec garantie de réception (ACK)
 */
export const emitSocketEventWithAck = (event, data) => {
	return emitWithAck(event, data);
};

/**
 * Vérifie si le socket est connecté
 */
export const isSocketConnected = () => {
	return isConnected && socketInstance?.connected;
};

/**
 * Obtient l'instance du socket (à utiliser avec précaution)
 */
export const getSocketInstance = () => {
	return socketInstance;
};

/**
 * Obtient l'ID du restaurant actuel
 */
export const getCurrentRestaurantId = () => {
	return currentRestaurantId;
};

/**
 * Obtient l'ID de la table actuelle
 */
export const getCurrentTableId = () => {
	return currentTableId;
};

export default {
	connect: connectSocket,
	disconnect: disconnectSocket,
	on: onSocketEvent,
	off: offSocketEvent,
	emit: emitSocketEvent,
	emitWithAck: emitSocketEventWithAck,
	isConnected: isSocketConnected,
	getRestaurantId: getCurrentRestaurantId,
	getTableId: getCurrentTableId,
	joinReservation,
	leaveReservation,
};
