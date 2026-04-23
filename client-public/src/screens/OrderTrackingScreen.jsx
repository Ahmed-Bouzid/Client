/**
 * ═══════════════════════════════════════════════════════════════
 * OrderTrackingScreen.jsx — ÉTAPE 5 : SUIVI COMMANDE TEMPS RÉEL
 * ═══════════════════════════════════════════════════════════════
 *
 * Parcours client :
 *   1. Affiche le statut de la commande en 3 étapes (Reçue → Préparation → Prête)
 *   2. Polling périodique (6-15s) + écoute WebSocket pour mise à jour temps réel
 *   3. Bannière de statut dynamique avec icône et message
 *   4. Barre de progression animée entre les étapes
 *   5. Bouton retour au menu
 *
 * Dépendances :
 *   - useOrderTracking hook (polling + WebSocket combinés)
 *   - GET /orders/:orderId pour récupérer le statut
 */
import React, { useEffect, useMemo, useRef } from "react";
import {
	ActivityIndicator,
	Animated,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import useOrderTracking from "../hooks/useOrderTracking";

const STATUS_STEPS = ["pending", "preparing", "ready"];

const statusMeta = {
	pending: {
		label: "Commande recue",
		help: "La cuisine va commencer dans un instant.",
		color: "#B45309",
		bg: "#FFF7ED",
		icon: "receipt-long",
	},
	preparing: {
		label: "En preparation",
		help: "Les equipiers preparent votre commande.",
		color: "#0369A1",
		bg: "#EFF6FF",
		icon: "outdoor-grill",
	},
	ready: {
		label: "Pret a retirer",
		help: "Votre commande est prete. Rendez-vous au comptoir.",
		color: "#166534",
		bg: "#ECFDF5",
		icon: "notifications-active",
	},
};

const LiveDot = ({ isOnline, isSocketConnected }) => {
	const pulse = useRef(new Animated.Value(0.6)).current;

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, {
					toValue: 1,
					duration: 600,
					useNativeDriver: true,
				}),
				Animated.timing(pulse, {
					toValue: 0.6,
					duration: 600,
					useNativeDriver: true,
				}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [pulse]);

	const color = !isOnline ? "#DC2626" : isSocketConnected ? "#16A34A" : "#F59E0B";
	const label = !isOnline ? "Hors ligne" : isSocketConnected ? "Temps reel" : "Synchronisation secours";

	return (
		<View style={styles.liveRow}>
			<Animated.View style={[styles.liveDot, { backgroundColor: color, transform: [{ scale: pulse }] }]} />
			<Text style={styles.liveLabel}>{label}</Text>
		</View>
	);
};

export default function OrderTrackingScreen({ orderId, onBackToMenu }) {
	const {
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
		refreshNow,
	} = useOrderTracking(orderId);

	const readyPop = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (!readySignal) return;
		Animated.sequence([
			Animated.timing(readyPop, {
				toValue: 1.04,
				duration: 240,
				useNativeDriver: true,
			}),
			Animated.timing(readyPop, {
				toValue: 1,
				duration: 260,
				useNativeDriver: true,
			}),
		]).start();
	}, [readyPop, readySignal]);

	const currentMeta = statusMeta[trackingStatus] || statusMeta.pending;
	const currentStepIndex = STATUS_STEPS.indexOf(trackingStatus);
	const safeStepIndex = currentStepIndex < 0 ? 0 : currentStepIndex;

	const progressRatio = useMemo(() => {
		if (safeStepIndex <= 0) return 0.15;
		if (safeStepIndex === 1) return 0.62;
		return 1;
	}, [safeStepIndex]);

	const orderNumber = order?._id ? String(order._id).slice(-6).toUpperCase() : "------";

	const formatLastSync = () => {
		if (!lastSyncedAt) return "--";
		return new Date(lastSyncedAt).toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<View style={styles.loaderWrap}>
				<ActivityIndicator size="large" color="#0F766E" />
				<Text style={styles.loaderText}>Connexion au suivi de commande...</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, trackingStatus === "ready" ? styles.readyContainer : null]}>
			<View style={styles.header}>
				<Text style={styles.title}>Suivi de commande</Text>
				<Text style={styles.orderCode}>No {orderNumber}</Text>
				<LiveDot isOnline={isOnline} isSocketConnected={isSocketConnected} />
			</View>

			<Animated.View style={[styles.statusCard, { backgroundColor: currentMeta.bg, transform: [{ scale: readyPop }] }]}>
				<View style={styles.statusHeadRow}>
					<MaterialIcons name={currentMeta.icon} size={24} color={currentMeta.color} />
					<Text style={[styles.statusLabel, { color: currentMeta.color }]}>{currentMeta.label}</Text>
				</View>
				<Text style={styles.statusHelp}>{currentMeta.help}</Text>
				<Text style={styles.etaText}>
					Temps estime: {etaMinutes === 0 ? "Maintenant" : `~ ${etaMinutes} min`}
				</Text>
			</Animated.View>

			<View style={styles.timelineWrap}>
				<View style={styles.progressTrack}>
					<View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
				</View>
				<View style={styles.stepsRow}>
					{STATUS_STEPS.map((step, idx) => {
						const isActive = idx <= safeStepIndex;
						const label = step === "pending" ? "Recue" : step === "preparing" ? "Preparation" : "Pret";
						return (
							<View key={step} style={styles.stepItem}>
								<View style={[styles.stepDot, isActive ? styles.stepDotActive : null]} />
								<Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : null]}>{label}</Text>
							</View>
						);
					})}
				</View>
			</View>

			<View style={styles.infoCard}>
				<Text style={styles.infoTitle}>Conseil</Text>
				<Text style={styles.infoText}>Gardez cette page ouverte pour recevoir instantanement les changements.</Text>
				<Text style={styles.syncText}>Derniere synchro: {formatLastSync()} via {syncSource}</Text>
				{!!error && <Text style={styles.errorText}>Connexion instable: {error}</Text>}
			</View>

			{Platform.OS === "web" && !audioUnlocked && (
				<Pressable style={styles.unlockButton} onPress={unlockAudio}>
					<MaterialIcons name="volume-up" size={18} color="#FFFFFF" />
					<Text style={styles.unlockButtonText}>Activer le son d'alerte</Text>
				</Pressable>
			)}

			<View style={styles.actionsRow}>
				<Pressable style={styles.secondaryBtn} onPress={() => refreshNow("manual")}> 
					<Text style={styles.secondaryBtnText}>Rafraichir</Text>
				</Pressable>
				<Pressable style={styles.primaryBtn} onPress={onBackToMenu}>
					<Text style={styles.primaryBtnText}>Retour menu</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F5",
		paddingHorizontal: 18,
		paddingTop: 24,
		paddingBottom: 20,
	},
	readyContainer: {
		backgroundColor: "#EEFDF4",
	},
	loaderWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F7F7F5",
	},
	loaderText: {
		marginTop: 12,
		fontSize: 15,
		color: "#334155",
	},
	header: {
		marginBottom: 18,
	},
	title: {
		fontSize: 27,
		fontWeight: "800",
		color: "#1F2937",
	},
	orderCode: {
		fontSize: 17,
		fontWeight: "700",
		color: "#0F766E",
		marginTop: 4,
	},
	liveRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
	},
	liveDot: {
		width: 10,
		height: 10,
		borderRadius: 10,
		marginRight: 8,
	},
	liveLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#334155",
	},
	statusCard: {
		borderRadius: 20,
		padding: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	statusHeadRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	statusLabel: {
		fontSize: 22,
		fontWeight: "800",
		marginLeft: 10,
	},
	statusHelp: {
		fontSize: 15,
		lineHeight: 21,
		color: "#334155",
	},
	etaText: {
		marginTop: 10,
		fontSize: 14,
		fontWeight: "700",
		color: "#0F172A",
	},
	timelineWrap: {
		marginBottom: 18,
	},
	progressTrack: {
		height: 8,
		borderRadius: 999,
		backgroundColor: "#E2E8F0",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: "#0F766E",
		borderRadius: 999,
	},
	stepsRow: {
		marginTop: 10,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	stepItem: {
		alignItems: "center",
		minWidth: 82,
	},
	stepDot: {
		width: 10,
		height: 10,
		borderRadius: 10,
		backgroundColor: "#CBD5E1",
	},
	stepDotActive: {
		backgroundColor: "#0F766E",
	},
	stepLabel: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: "600",
		color: "#64748B",
	},
	stepLabelActive: {
		color: "#0F172A",
	},
	infoCard: {
		borderRadius: 14,
		backgroundColor: "#FFFFFF",
		padding: 14,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#0F172A",
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		lineHeight: 18,
		color: "#475569",
	},
	syncText: {
		marginTop: 10,
		fontSize: 12,
		color: "#64748B",
	},
	errorText: {
		marginTop: 8,
		fontSize: 12,
		color: "#B91C1C",
		fontWeight: "600",
	},
	unlockButton: {
		marginTop: 12,
		backgroundColor: "#0F766E",
		borderRadius: 12,
		paddingVertical: 11,
		paddingHorizontal: 14,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	unlockButtonText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
		marginLeft: 6,
	},
	actionsRow: {
		marginTop: 16,
		flexDirection: "row",
		gap: 10,
	},
	secondaryBtn: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#E2E8F0",
	},
	secondaryBtnText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#334155",
	},
	primaryBtn: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#111827",
	},
	primaryBtnText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
