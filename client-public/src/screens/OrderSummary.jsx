import React, { useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Animated,
	Dimensions,
	Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { PREMIUM_COLORS } from "../theme/colors";
import useRestaurantConfig from "../hooks/useRestaurantConfig";
import { useRestaurantStore } from "../stores/useRestaurantStore";

const { width } = Dimensions.get("window");

// 🎴 Premium Order Card Component
const PremiumOrderCard = ({ item, index, isSent, onUpdateQuantity, theme = PREMIUM_COLORS }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				delay: index * 80,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				delay: index * 80,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.98,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 3,
			useNativeDriver: true,
		}).start();
	};

	const itemTotal = (item?.price || 0) * (item?.quantity || 0);

	return (
		<Animated.View
			style={[
				styles.orderCard,
				{
					opacity: fadeAnim,
					transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
				},
			]}
		>
			<LinearGradient
				colors={
					isSent
						? ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
						: ["rgba(255,255,255,0.95)", "rgba(248,249,250,0.95)"]
				}
				style={styles.orderCardGradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<View style={styles.orderCardContent}>
					{/* Left: Product Info */}
					<View style={styles.productInfo}>
						<LinearGradient
							colors={
								isSent ? theme.secondary : theme.primary
							}
							style={styles.productIconBg}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						>
							<Ionicons
								name={isSent ? "checkmark-circle" : "restaurant"}
								size={20}
								color="#fff"
							/>
						</LinearGradient>
						<View style={styles.productDetails}>
							<Text
								style={[styles.productName, isSent && styles.productNameSent]}
							>
								{item?.name || "Produit"}
							</Text>
							<Text
								style={[styles.productPrice, isSent && styles.productPriceSent]}
							>
								{item?.price || 0}€ × {item?.quantity || 0}
							</Text>
						</View>
					</View>

					{/* Right: Quantity or Total */}
					{isSent ? (
						<View style={styles.sentBadge}>
							<LinearGradient
								colors={theme.success}
								style={styles.sentBadgeGradient}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<Text style={styles.sentBadgeText}>
									{itemTotal.toFixed(2)}€
								</Text>
							</LinearGradient>
						</View>
					) : (
						<View style={styles.quantityControls}>
							<TouchableOpacity
								style={styles.quantityBtn}
								onPress={() =>
									onUpdateQuantity?.(item, (item?.quantity || 0) - 1)
								}
								onPressIn={handlePressIn}
								onPressOut={handlePressOut}
							>
								<LinearGradient
									colors={theme.secondary}
									style={styles.quantityBtnGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<MaterialIcons name="remove" size={20} color="#fff" />
								</LinearGradient>
							</TouchableOpacity>

							<View style={styles.quantityDisplay}>
								<Text style={styles.quantityText}>{item?.quantity || 0}</Text>
							</View>

							<TouchableOpacity
								style={styles.quantityBtn}
								onPress={() =>
									onUpdateQuantity?.(item, (item?.quantity || 0) + 1)
								}
								onPressIn={handlePressIn}
								onPressOut={handlePressOut}
							>
								<LinearGradient
									colors={theme.success}
									style={styles.quantityBtnGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<MaterialIcons name="add" size={20} color="#fff" />
								</LinearGradient>
							</TouchableOpacity>

							<View style={styles.itemTotalBadge}>
								<Text style={styles.itemTotalText}>
									{itemTotal.toFixed(2)}€
								</Text>
							</View>
						</View>
					)}
				</View>
			</LinearGradient>
		</Animated.View>
	);
};

const OrderSummary = ({
	allOrders = [],
	currentOrder = [],
	onUpdateQuantity = () => {},
	onSubmitOrder = () => {},
	onBackToMenu = () => {},
}) => {
	// 🎨 Thème dynamique depuis la BDD, fallback PREMIUM_COLORS
	const restaurantId = useRestaurantStore((state) => state.id);
	const { config } = useRestaurantConfig(restaurantId);
	const theme = config?.style ? { ...PREMIUM_COLORS, ...config.style } : PREMIUM_COLORS;

	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const buttonScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	// Sécurité contre les données undefined
	const safeAllOrders = allOrders || [];
	const safeCurrentOrder = currentOrder || [];

	const sentOrders = safeAllOrders.filter((item) => item && item.sent);
	const totalSent = sentOrders.reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
		0
	);
	const totalCurrent = safeCurrentOrder.reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
		0
	);
	const totalAll = totalSent + totalCurrent;

	const handlePressIn = () => {
		Animated.spring(buttonScale, {
			toValue: 0.95,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(buttonScale, {
			toValue: 1,
			friction: 3,
			useNativeDriver: true,
		}).start();
	};

	return (
		<LinearGradient
			colors={theme.background || [theme.dark, theme.card]}
			style={styles.container}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
		>
			{/* Background decorations */}
			<View style={styles.bgDecor}>
				<LinearGradient
					colors={[...theme.primary, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle1]}
				/>
				<LinearGradient
					colors={[...theme.accent, "transparent"]}
					style={[styles.bgCircle, styles.bgCircle2]}
				/>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Animated.View
					style={[
						styles.header,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					{/* Header Icon */}
					<LinearGradient
						colors={theme.accent}
						style={styles.headerIcon}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
					>
						<Ionicons name="receipt" size={32} color="#fff" />
					</LinearGradient>

					<Text style={styles.title}>Récapitulatif</Text>
					<Text style={styles.subtitle}>Votre commande</Text>
				</Animated.View>

				{/* 📋 Sent Orders Section */}
				{sentOrders.length > 0 && (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<LinearGradient
								colors={theme.secondary}
								style={styles.sectionIconBg}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="history" size={18} color="#fff" />
							</LinearGradient>
							<Text style={styles.sectionTitle}>Commandes envoyées</Text>
							<View style={styles.sectionBadge}>
								<Text style={styles.sectionBadgeText}>{sentOrders.length}</Text>
							</View>
						</View>

						{sentOrders.map((item, index) => (
							<PremiumOrderCard
								key={`sent-${index}`}
								item={item}
								index={index}
								isSent={true}
								theme={theme}
							/>
						))}

						{/* Sent Total */}
						<View style={styles.sectionTotal}>
							<BlurView
								intensity={20}
								tint="light"
								style={styles.sectionTotalBlur}
							>
								<Text style={styles.sectionTotalLabel}>Sous-total envoyé</Text>
								<Text style={styles.sectionTotalValue}>
									{totalSent.toFixed(2)}€
								</Text>
							</BlurView>
						</View>
					</View>
				)}

				{/* 🛒 Current Order Section */}
				{safeCurrentOrder.length > 0 && (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<LinearGradient
								colors={theme.success}
								style={styles.sectionIconBg}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<MaterialIcons name="shopping-cart" size={18} color="#fff" />
							</LinearGradient>
							<Text style={styles.sectionTitle}>Commande en cours</Text>
							<View style={[styles.sectionBadge, styles.sectionBadgeActive]}>
								<Text style={styles.sectionBadgeText}>
									{safeCurrentOrder.length}
								</Text>
							</View>
						</View>

						{safeCurrentOrder.map((item, index) => (
							<PremiumOrderCard
								key={`current-${index}`}
								item={item}
								index={index}
								isSent={false}
								onUpdateQuantity={onUpdateQuantity}
								theme={theme}
							/>
						))}

						{/* Current Total */}
						<View style={styles.sectionTotal}>
							<BlurView
								intensity={20}
								tint="light"
								style={styles.sectionTotalBlur}
							>
								<Text style={styles.sectionTotalLabel}>
									Sous-total en cours
								</Text>
								<Text style={styles.sectionTotalValue}>
									{totalCurrent.toFixed(2)}€
								</Text>
							</BlurView>
						</View>
					</View>
				)}

				{/* 💰 Grand Total */}
				<View style={styles.grandTotalContainer}>
					<LinearGradient
						colors={theme.primary}
						style={styles.grandTotalGradient}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
					>
						<View style={styles.grandTotalContent}>
							<View style={styles.grandTotalLeft}>
								<MaterialIcons name="payments" size={28} color="#fff" />
								<Text style={styles.grandTotalLabel}>TOTAL À PAYER</Text>
							</View>
							<Text style={styles.grandTotalValue}>{totalAll.toFixed(2)}€</Text>
						</View>
					</LinearGradient>
				</View>

				{/* 🎬 Action Buttons */}
				<Animated.View
					style={[
						styles.actionsContainer,
						{ transform: [{ scale: buttonScale }] },
					]}
				>
					{safeCurrentOrder.length > 0 && (
						<TouchableOpacity
							onPress={() => onSubmitOrder?.()}
							onPressIn={handlePressIn}
							onPressOut={handlePressOut}
							activeOpacity={0.9}
						>
							<LinearGradient
								colors={theme.success}
								style={styles.actionButton}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<MaterialIcons name="send" size={22} color="#fff" />
								<Text style={styles.actionButtonText}>Envoyer la commande</Text>
							</LinearGradient>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						onPress={() => onBackToMenu?.()}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						activeOpacity={0.9}
					>
						<LinearGradient
							colors={theme.accent}
							style={styles.actionButton}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
						>
							<MaterialIcons name="restaurant-menu" size={22} color="#fff" />
							<Text style={styles.actionButtonText}>Retour au menu</Text>
						</LinearGradient>
					</TouchableOpacity>
				</Animated.View>
			</ScrollView>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	bgDecor: {
		...StyleSheet.absoluteFillObject,
		overflow: "hidden",
	},
	bgCircle: {
		position: "absolute",
		borderRadius: 999,
		opacity: 0.2,
	},
	bgCircle1: {
		width: width * 0.7,
		height: width * 0.7,
		top: -width * 0.2,
		right: -width * 0.2,
	},
	bgCircle2: {
		width: width * 0.5,
		height: width * 0.5,
		bottom: 100,
		left: -width * 0.2,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	header: {
		alignItems: "center",
		marginBottom: 30,
		paddingTop: 20,
	},
	headerIcon: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
		shadowColor: "#4facfe",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: PREMIUM_COLORS.text,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: PREMIUM_COLORS.textMuted,
		marginTop: 4,
	},
	section: {
		marginBottom: 24,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	sectionIconBg: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: PREMIUM_COLORS.text,
		flex: 1,
	},
	sectionBadge: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
	},
	sectionBadgeActive: {
		backgroundColor: "#38ef7d",
	},
	sectionBadgeText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#fff",
	},
	orderCard: {
		marginBottom: 12,
		borderRadius: 16,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
	},
	orderCardGradient: {
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
	},
	orderCardContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
	},
	productInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	productIconBg: {
		width: 44,
		height: 44,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 14,
	},
	productDetails: {
		flex: 1,
	},
	productName: {
		fontSize: 16,
		fontWeight: "700",
		color: "#333",
		marginBottom: 4,
	},
	productNameSent: {
		color: "rgba(255,255,255,0.9)",
	},
	productPrice: {
		fontSize: 14,
		color: "#666",
	},
	productPriceSent: {
		color: "rgba(255,255,255,0.6)",
	},
	sentBadge: {
		borderRadius: 12,
		overflow: "hidden",
	},
	sentBadgeGradient: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 12,
	},
	sentBadgeText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 15,
	},
	quantityControls: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	quantityBtn: {
		borderRadius: 10,
		overflow: "hidden",
	},
	quantityBtnGradient: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 10,
	},
	quantityDisplay: {
		minWidth: 32,
		alignItems: "center",
	},
	quantityText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	itemTotalBadge: {
		backgroundColor: "#667eea",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 10,
		marginLeft: 8,
	},
	itemTotalText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 14,
	},
	sectionTotal: {
		marginTop: 12,
		borderRadius: 12,
		overflow: "hidden",
	},
	sectionTotalBlur: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.2)",
	},
	sectionTotalLabel: {
		fontSize: 14,
		color: "rgba(255,255,255,0.7)",
		fontWeight: "600",
	},
	sectionTotalValue: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
	},
	grandTotalContainer: {
		marginVertical: 20,
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#667eea",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 12,
	},
	grandTotalGradient: {
		borderRadius: 20,
	},
	grandTotalContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 24,
	},
	grandTotalLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	grandTotalLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
		letterSpacing: 1,
	},
	grandTotalValue: {
		fontSize: 32,
		fontWeight: "800",
		color: "#fff",
	},
	actionsContainer: {
		gap: 14,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 17,
		letterSpacing: 0.5,
	},
});

export default OrderSummary;
