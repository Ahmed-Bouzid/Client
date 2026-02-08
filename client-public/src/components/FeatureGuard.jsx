/**
 * 🛡️ FeatureGuard - Protection des fonctionnalités premium
 *
 * Composant pour protéger l'accès aux fonctionnalités payantes
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFeatures } from "../hooks/useFeatures";

/**
 * Guard générique pour protéger une fonctionnalité
 */
export const FeatureGuard = ({
	featureName,
	children,
	fallback = null,
	showUpgradeMessage = true,
}) => {
	const { hasFeature, loading } = useFeatures();

	// Pendant le chargement
	if (loading) {
		return fallback || <FeatureLoadingSkeleton />;
	}

	// Si la fonctionnalité est activée, afficher le contenu
	if (hasFeature(featureName)) {
		return children;
	}

	// Si pas d'accès, afficher le message d'upgrade ou le fallback
	if (showUpgradeMessage) {
		return <UpgradeMessage featureName={featureName} />;
	}

	return fallback;
};

/**
 * Guard spécifique pour la comptabilité
 */
export const AccountingGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="accounting" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour le feedback
 */
export const FeedbackGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="feedback" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour la messagerie
 */
export const MessagingGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="messaging" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour l'assistant de tables
 */
export const TableAssistantGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="tableAssistant" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour les analytics
 */
export const AnalyticsGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="analytics" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour les notifications avancées
 */
export const NotificationsGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="advancedNotifications" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard spécifique pour la personnalisation
 */
export const CustomizationGuard = ({ children, fallback = null }) => {
	return (
		<FeatureGuard featureName="customization" fallback={fallback}>
			{children}
		</FeatureGuard>
	);
};

/**
 * Guard pour plusieurs fonctionnalités (toutes requises)
 */
export const MultiFeaturesGuard = ({
	features,
	children,
	fallback = null,
	showUpgradeMessage = true,
}) => {
	const { hasFeatures, loading } = useFeatures();

	if (loading) {
		return fallback || <FeatureLoadingSkeleton />;
	}

	if (hasFeatures(features)) {
		return children;
	}

	if (showUpgradeMessage) {
		return <UpgradeMessage featureName={features.join(", ")} />;
	}

	return fallback;
};

/**
 * Message d'upgrade pour fonctionnalité premium
 */
const UpgradeMessage = ({ featureName }) => {
	const getFeatureDisplayName = (name) => {
		const names = {
			accounting: "Comptabilité avancée",
			feedback: "Système de feedback",
			messaging: "Messagerie client-serveur",
			tableAssistant: "Assistant de tables",
			analytics: "Analytics avancées",
			advancedNotifications: "Notifications+",
			customization: "Personnalisation",
		};
		return names[name] || name;
	};

	return (
		<LinearGradient
			colors={["#FFF3E0", "#FFE0B2"]}
			style={styles.upgradeContainer}
		>
			<View style={styles.upgradeContent}>
				<Ionicons name="diamond" size={48} color="#FF9800" />
				<Text style={styles.upgradeTitle}>Fonctionnalité Premium</Text>
				<Text style={styles.upgradeDescription}>
					{getFeatureDisplayName(featureName)} est une fonctionnalité payante.
				</Text>
				<Text style={styles.upgradeSubtext}>
					Contactez votre administrateur pour l'activer.
				</Text>
			</View>
			<TouchableOpacity style={styles.upgradeButton}>
				<LinearGradient
					colors={["#FF9800", "#F57C00"]}
					style={styles.upgradeButtonGradient}
				>
					<Ionicons name="star" size={18} color="white" />
					<Text style={styles.upgradeButtonText}>En savoir plus</Text>
				</LinearGradient>
			</TouchableOpacity>
		</LinearGradient>
	);
};

/**
 * Squelette de chargement pour les fonctionnalités
 */
const FeatureLoadingSkeleton = () => {
	return (
		<View style={styles.skeletonContainer}>
			<View style={styles.skeletonBox} />
			<View style={styles.skeletonText} />
			<View style={styles.skeletonText} />
		</View>
	);
};

const styles = StyleSheet.create({
	upgradeContainer: {
		margin: 15,
		borderRadius: 12,
		padding: 20,
		alignItems: "center",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	upgradeContent: {
		alignItems: "center",
		marginBottom: 15,
	},
	upgradeTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#E65100",
		marginTop: 10,
		marginBottom: 8,
		textAlign: "center",
	},
	upgradeDescription: {
		fontSize: 14,
		color: "#BF360C",
		textAlign: "center",
		marginBottom: 8,
		lineHeight: 20,
	},
	upgradeSubtext: {
		fontSize: 12,
		color: "#8D4E00",
		textAlign: "center",
		fontStyle: "italic",
	},
	upgradeButton: {
		borderRadius: 25,
		overflow: "hidden",
	},
	upgradeButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 10,
		gap: 8,
	},
	upgradeButtonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
	},
	skeletonContainer: {
		margin: 15,
		padding: 20,
		backgroundColor: "#F5F5F5",
		borderRadius: 12,
	},
	skeletonBox: {
		width: "100%",
		height: 120,
		backgroundColor: "#E0E0E0",
		borderRadius: 8,
		marginBottom: 10,
	},
	skeletonText: {
		width: "80%",
		height: 16,
		backgroundColor: "#E0E0E0",
		borderRadius: 4,
		marginBottom: 8,
	},
});

export default FeatureGuard;
