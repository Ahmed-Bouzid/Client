import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import socketService from "../services/socketService";
import { API_CONFIG } from "shared-api/config/apiConfig.js";

const ACTIVE_POLL_INTERVAL_MS = 6000;
const BACKGROUND_POLL_INTERVAL_MS = 15000;
const SOCKET_HEALTH_CHECK_INTERVAL_MS = 2000;

const normalizeTrackingStatus = (order, explicitTrackingStatus = null) => {
	if (explicitTrackingStatus && ["pending", "preparing", "ready"].includes(explicitTrackingStatus)) {
		return explicitTrackingStatus;
	}

	if (!order) return "pending";

	const orderStatus = order.orderStatus || order.status;
	if (["ready", "completed"].includes(orderStatus)) return "ready";

	const items = Array.isArray(order.items) ? order.items : [];
	if (items.length > 0) {
		const statuses = items.map((item) => item.itemStatus);
		const allFinal = statuses.every((status) =>
			["ready", "served", "cancelled"].includes(status),
		);
		if (allFinal) return "ready";
		if (statuses.some((status) => status === "preparing")) return "preparing";
	}

	if (["confirmed", "in_progress"].includes(orderStatus)) return "preparing";
	return "pending";
};

const estimateMinutesLeft = (status) => {
	switch (status) {
		case "pending":
			return 12;
		case "preparing":
			return 5;
		case "ready":
			return 0;
		default:
			return 10;
	}
};

export const useOrderTracking = (orderId) => {
	const [order, setOrder] = useState(null);
	const [trackingStatus, setTrackingStatus] = useState("pending");
	const [isLoading, setIsLoading] = useState(true);
	const [isSocketConnected, setIsSocketConnected] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [syncSource, setSyncSource] = useState("polling");
	const [error, setError] = useState(null);
	const [lastSyncedAt, setLastSyncedAt] = useState(null);
	const [audioUnlocked, setAudioUnlocked] = useState(false);
	const [readySignal, setReadySignal] = useState(0);
	const [isPageVisible, setIsPageVisible] = useState(true);

	const prevStatusRef = useRef("pending");
	const pollTimerRef = useRef(null);
	const socketHealthTimerRef = useRef(null);
	const wsListenerRef = useRef(null);
	const wakeLockRef = useRef(null);
	const audioContextRef = useRef(null);

	const isWeb = Platform.OS === "web";
	const isVisible = useRef(true);

	const updateOrderState = useCallback((nextOrder, source = "polling", explicitStatus = null) => {
		const nextStatus = normalizeTrackingStatus(nextOrder, explicitStatus);
		const previousStatus = prevStatusRef.current;

		setOrder(nextOrder);
		setTrackingStatus(nextStatus);
		setSyncSource(source);
		setLastSyncedAt(Date.now());
		setError(null);
		setIsLoading(false);

		if (previousStatus !== nextStatus && nextStatus === "ready") {
			setReadySignal((prev) => prev + 1);
		}

		prevStatusRef.current = nextStatus;
	}, []);

	const fetchTracking = useCallback(async (source = "polling") => {
		if (!orderId) return;

		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}/client-orders/order/${orderId}`);
			if (!response.ok) {
				throw new Error(`Tracking HTTP ${response.status}`);
			}

			const data = await response.json();
			updateOrderState(data.order, source, data.trackingStatus);
		} catch (err) {
			setError(err.message || "Erreur de synchronisation");
			setIsLoading(false);
		}
	}, [orderId, updateOrderState]);

	const playReadySound = useCallback(() => {
		if (!isWeb || !audioUnlocked) return;

		try {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return;

			if (!audioContextRef.current) {
				audioContextRef.current = new AudioCtx();
			}

			const ctx = audioContextRef.current;
			if (ctx.state === "suspended") {
				ctx.resume();
			}

			const now = ctx.currentTime;
			const osc1 = ctx.createOscillator();
			const gain1 = ctx.createGain();
			osc1.type = "sine";
			osc1.frequency.value = 880;
			gain1.gain.value = 0.0001;
			gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
			gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
			osc1.connect(gain1);
			gain1.connect(ctx.destination);
			osc1.start(now);
			osc1.stop(now + 0.25);

			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.type = "triangle";
			osc2.frequency.value = 1175;
			gain2.gain.value = 0.0001;
			gain2.gain.exponentialRampToValueAtTime(0.16, now + 0.28);
			gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
			osc2.connect(gain2);
			gain2.connect(ctx.destination);
			osc2.start(now + 0.26);
			osc2.stop(now + 0.52);
		} catch (err) {
			console.warn("⚠️ Son non disponible:", err?.message || err);
		}
	}, [audioUnlocked, isWeb]);

	const triggerReadyFeedback = useCallback(() => {
		if (isWeb && navigator?.vibrate) {
			navigator.vibrate([180, 80, 250]);
		}
		playReadySound();
	}, [isWeb, playReadySound]);

	const unlockAudio = useCallback(async () => {
		if (!isWeb) return false;

		try {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) {
				setAudioUnlocked(false);
				return false;
			}

			if (!audioContextRef.current) {
				audioContextRef.current = new AudioCtx();
			}

			await audioContextRef.current.resume();
			setAudioUnlocked(true);
			return true;
		} catch (err) {
			setAudioUnlocked(false);
			return false;
		}
	}, [isWeb]);

	const requestWakeLock = useCallback(async () => {
		if (!isWeb || !navigator?.wakeLock?.request) return;
		if (wakeLockRef.current) return;

		try {
			wakeLockRef.current = await navigator.wakeLock.request("screen");
			wakeLockRef.current.addEventListener("release", () => {
				wakeLockRef.current = null;
			});
		} catch (err) {
			console.warn("⚠️ Wake lock indisponible:", err?.message || err);
		}
	}, [isWeb]);

	const releaseWakeLock = useCallback(async () => {
		try {
			await wakeLockRef.current?.release();
		} catch {
			// ignore
		}
		wakeLockRef.current = null;
	}, []);

	useEffect(() => {
		if (!orderId) return undefined;

		fetchTracking("initial");

		return undefined;
	}, [orderId, fetchTracking]);

	useEffect(() => {
		if (!orderId) return undefined;

		const connectSocket = async () => {
			if (!order?.restaurantId) return;
			socketService.connect(order.restaurantId);

			const onOrderEvent = (payload) => {
				const incomingOrder = payload?.data || payload;
				const incomingId = incomingOrder?._id || incomingOrder?.id;
				if (!incomingId || String(incomingId) !== String(orderId)) return;
				updateOrderState(incomingOrder, "websocket");
			};

			wsListenerRef.current = onOrderEvent;
			socketService.on("order", onOrderEvent);
		};

		connectSocket();

		return () => {
			if (wsListenerRef.current) {
				socketService.off("order", wsListenerRef.current);
				wsListenerRef.current = null;
			}
		};
	}, [order?.restaurantId, orderId, updateOrderState]);

	useEffect(() => {
		socketHealthTimerRef.current = setInterval(() => {
			setIsSocketConnected(socketService.isConnected());
		}, SOCKET_HEALTH_CHECK_INTERVAL_MS);

		return () => {
			if (socketHealthTimerRef.current) {
				clearInterval(socketHealthTimerRef.current);
				socketHealthTimerRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!orderId) return undefined;

		const clearPollTimer = () => {
			if (pollTimerRef.current) {
				clearInterval(pollTimerRef.current);
				pollTimerRef.current = null;
			}
		};

		const configurePolling = () => {
			clearPollTimer();
			if (isSocketConnected) return;

			const interval = isPageVisible
				? ACTIVE_POLL_INTERVAL_MS
				: BACKGROUND_POLL_INTERVAL_MS;

			pollTimerRef.current = setInterval(() => {
				fetchTracking("polling");
			}, interval);
		};

		configurePolling();
		return clearPollTimer;
	}, [fetchTracking, isSocketConnected, isPageVisible, orderId]);

	useEffect(() => {
		if (!isWeb) return undefined;

		const handleVisibility = () => {
			isVisible.current = !document.hidden;
			setIsPageVisible(!document.hidden);
			if (!document.hidden) {
				fetchTracking("visibility");
				requestWakeLock();
			} else {
				releaseWakeLock();
			}
		};

		const handleOnline = () => {
			setIsOnline(true);
			fetchTracking("online");
		};

		const handleOffline = () => {
			setIsOnline(false);
		};

		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("focus", handleOnline);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		setIsOnline(navigator.onLine);
		handleVisibility();

		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("focus", handleOnline);
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [fetchTracking, isWeb, releaseWakeLock, requestWakeLock]);

	useEffect(() => {
		if (readySignal <= 0) return;
		triggerReadyFeedback();
	}, [readySignal, triggerReadyFeedback]);

	useEffect(() => {
		return () => {
			releaseWakeLock();
			if (audioContextRef.current?.state && audioContextRef.current.state !== "closed") {
				audioContextRef.current.close();
			}
		};
	}, [releaseWakeLock]);

	const etaMinutes = useMemo(() => estimateMinutesLeft(trackingStatus), [trackingStatus]);

	return {
		order,
		trackingStatus,
		etaMinutes,
		isLoading,
		isSocketConnected,
		isOnline,
		syncSource,
		error,
		lastSyncedAt,
		readySignal,
		audioUnlocked,
		unlockAudio,
		refreshNow: fetchTracking,
	};
};

export default useOrderTracking;
