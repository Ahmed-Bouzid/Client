/**
 * 💬 MessagingBubble - Bulle de messagerie client → serveur
 *
 * Fonctionnalités:
 * - Bulle flottante avec animation fade-in (apparaît 2-3s après montage)
 * - Menu de messages prédéfinis en overlay
 * - Confirmation/Annulation avant envoi
 * - Feedback visuel à l'envoi
 * - Recherche optionnelle
 */

import React, {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
} from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Animated,
	Modal,
	FlatList,
	TextInput,
	Dimensions,
	ActivityIndicator,
	Vibration,
	Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { messageService } from "../services/messageService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 🎨 Design System cohérent avec l'app
const COLORS = {
	primary: ["#667eea", "#764ba2"],
	secondary: ["#f093fb", "#f5576c"],
	accent: "#667eea",
	success: "#22c55e",
	warning: "#f59e0b",
	glass: "rgba(255, 255, 255, 0.15)",
	glassBorder: "rgba(255, 255, 255, 0.25)",
	dark: "#1a1a2e",
	darkCard: "rgba(30, 30, 50, 0.95)",
	text: "#ffffff",
	textMuted: "rgba(255, 255, 255, 0.6)",
	textSecondary: "rgba(255, 255, 255, 0.8)",
};

// Catégories avec couleurs
const CATEGORY_COLORS = {
	service: { color: "#667eea", icon: "restaurant-outline" },
	commande: { color: "#f59e0b", icon: "receipt-outline" },
	paiement: { color: "#22c55e", icon: "card-outline" },
	autre: { color: "#8b5cf6", icon: "ellipsis-horizontal-outline" },
};

const MessagingBubble = ({ reservationId, clientId, clientName, style }) => {
	// États
	const [isVisible, setIsVisible] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [selectedMessage, setSelectedMessage] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sentSuccess, setSentSuccess] = useState(false);

	// Animations
	const bubbleScale = useRef(new Animated.Value(0)).current;
	const bubbleOpacity = useRef(new Animated.Value(0)).current;
	const menuOpacity = useRef(new Animated.Value(0)).current;
	const menuScale = useRef(new Animated.Value(0.8)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// Animation d'apparition de la bulle (2-3s après montage)
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(true);
			Animated.parallel([
				Animated.spring(bubbleScale, {
					toValue: 1,
					friction: 6,
					tension: 100,
					useNativeDriver: true,
				}),
				Animated.timing(bubbleOpacity, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
			]).start();

			// Animation de pulsation subtile
			startPulseAnimation();
		}, 2500);

		return () => clearTimeout(timer);
	}, []);

	// Animation de pulsation
	const startPulseAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.05,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			])
		).start();
	};

	// Charger les messages prédéfinis
	const loadMessages = useCallback(async () => {
		if (messages.length > 0) return; // Déjà chargés

		setLoading(true);
		try {
			const data = await messageService.fetchPredefinedMessages();
			setMessages(data);
		} catch (error) {
			console.error("Erreur chargement messages:", error);
		} finally {
			setLoading(false);
		}
	}, [messages.length]);

	// Ouvrir le menu
	const openMenu = useCallback(() => {
		setIsMenuOpen(true);
		loadMessages();

		Animated.parallel([
			Animated.timing(menuOpacity, {
				toValue: 1,
				duration: 250,
				useNativeDriver: true,
			}),
			Animated.spring(menuScale, {
				toValue: 1,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, [loadMessages]);

	// Fermer le menu
	const closeMenu = useCallback(() => {
		Animated.parallel([
			Animated.timing(menuOpacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.timing(menuScale, {
				toValue: 0.8,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start(() => {
			setIsMenuOpen(false);
			setSelectedMessage(null);
			setSearchQuery("");
		});
	}, []);

	// Sélectionner un message
	const selectMessage = useCallback((message) => {
		setSelectedMessage(message);
		if (Platform.OS !== "web") {
			Vibration.vibrate(10);
		}
	}, []);

	// Annuler la sélection
	const cancelSelection = useCallback(() => {
		setSelectedMessage(null);
	}, []);

	// Envoyer le message
	const sendMessage = useCallback(async () => {
		if (!selectedMessage || !reservationId || !clientId) return;

		setSending(true);
		try {
			await messageService.sendMessage({
				predefinedMessageId: selectedMessage._id,
				reservationId,
				clientId,
				clientName,
			});

			setSentSuccess(true);
			if (Platform.OS !== "web") {
				Vibration.vibrate([0, 50, 50, 50]);
			}

			// Fermer après succès
			setTimeout(() => {
				setSentSuccess(false);
				closeMenu();
			}, 1500);
		} catch (error) {
			console.error("Erreur envoi:", error);
			alert("Impossible d'envoyer le message. Réessayez.");
		} finally {
			setSending(false);
		}
	}, [selectedMessage, reservationId, clientId, clientName, closeMenu]);

	// Filtrer les messages
	const filteredMessages = useMemo(() => {
		if (!searchQuery.trim()) return messages;
		const query = searchQuery.toLowerCase();
		return messages.filter(
			(m) =>
				m.text.toLowerCase().includes(query) ||
				m.category?.toLowerCase().includes(query)
		);
	}, [messages, searchQuery]);

	// Grouper par catégorie
	const groupedMessages = useMemo(() => {
		const groups = {};
		filteredMessages.forEach((msg) => {
			const cat = msg.category || "autre";
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(msg);
		});
		return Object.entries(groups);
	}, [filteredMessages]);

	if (!isVisible) return null;

	return (
		<>
			{/* 🔘 Bulle flottante */}
			<Animated.View
				style={[
					styles.bubbleContainer,
					style,
					{
						opacity: bubbleOpacity,
						transform: [{ scale: Animated.multiply(bubbleScale, pulseAnim) }],
					},
				]}
			>
				<TouchableOpacity
					onPress={openMenu}
					activeOpacity={0.8}
					style={styles.bubble}
				>
					<LinearGradient
						colors={COLORS.primary}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.bubbleGradient}
					>
						<Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>

			{/* 📋 Menu des messages */}
			<Modal
				visible={isMenuOpen}
				transparent
				animationType="none"
				onRequestClose={closeMenu}
			>
				<Animated.View style={[styles.overlay, { opacity: menuOpacity }]}>
					<TouchableOpacity
						style={styles.overlayTouchable}
						activeOpacity={1}
						onPress={closeMenu}
					/>

					<Animated.View
						style={[
							styles.menuContainer,
							{
								transform: [{ scale: menuScale }],
							},
						]}
					>
						<BlurView intensity={80} tint="dark" style={styles.menuBlur}>
							{/* Header */}
							<View style={styles.menuHeader}>
								<View style={styles.menuHeaderLeft}>
									<Ionicons
										name="chatbubbles"
										size={24}
										color={COLORS.accent}
									/>
									<Text style={styles.menuTitle}>Appeler le serveur</Text>
								</View>
								<TouchableOpacity
									onPress={closeMenu}
									style={styles.closeButton}
								>
									<Ionicons name="close" size={24} color={COLORS.textMuted} />
								</TouchableOpacity>
							</View>

							{/* Barre de recherche */}
							<View style={styles.searchContainer}>
								<Ionicons name="search" size={18} color={COLORS.textMuted} />
								<TextInput
									style={styles.searchInput}
									placeholder="Rechercher un message..."
									placeholderTextColor={COLORS.textMuted}
									value={searchQuery}
									onChangeText={setSearchQuery}
								/>
								{searchQuery ? (
									<TouchableOpacity onPress={() => setSearchQuery("")}>
										<Ionicons
											name="close-circle"
											size={18}
											color={COLORS.textMuted}
										/>
									</TouchableOpacity>
								) : null}
							</View>

							{/* État de succès */}
							{sentSuccess ? (
								<View style={styles.successContainer}>
									<Ionicons
										name="checkmark-circle"
										size={60}
										color={COLORS.success}
									/>
									<Text style={styles.successText}>Message envoyé !</Text>
								</View>
							) : loading ? (
								<View style={styles.loadingContainer}>
									<ActivityIndicator size="large" color={COLORS.accent} />
									<Text style={styles.loadingText}>Chargement...</Text>
								</View>
							) : (
								/* Liste des messages groupés */
								<FlatList
									data={groupedMessages}
									keyExtractor={([category]) => category}
									showsVerticalScrollIndicator={false}
									contentContainerStyle={styles.listContent}
									renderItem={({ item: [category, msgs] }) => (
										<View style={styles.categorySection}>
											{/* Header catégorie */}
											<View style={styles.categoryHeader}>
												<View
													style={[
														styles.categoryDot,
														{
															backgroundColor:
																CATEGORY_COLORS[category]?.color ||
																COLORS.accent,
														},
													]}
												/>
												<Text style={styles.categoryTitle}>
													{category.charAt(0).toUpperCase() + category.slice(1)}
												</Text>
											</View>

											{/* Messages de la catégorie */}
											{msgs.map((message) => {
												const isSelected = selectedMessage?._id === message._id;
												return (
													<TouchableOpacity
														key={message._id}
														style={[
															styles.messageItem,
															isSelected && styles.messageItemSelected,
														]}
														onPress={() => selectMessage(message)}
														activeOpacity={0.7}
													>
														<View style={styles.messageContent}>
															<Ionicons
																name={message.icon || "chatbubble-outline"}
																size={20}
																color={
																	isSelected
																		? COLORS.accent
																		: COLORS.textSecondary
																}
															/>
															<Text
																style={[
																	styles.messageText,
																	isSelected && styles.messageTextSelected,
																]}
															>
																{message.text}
															</Text>
														</View>

														{isSelected && (
															<View style={styles.actionButtons}>
																<TouchableOpacity
																	style={styles.cancelButton}
																	onPress={cancelSelection}
																>
																	<Ionicons
																		name="close"
																		size={20}
																		color="#ef4444"
																	/>
																</TouchableOpacity>
																<TouchableOpacity
																	style={styles.sendButton}
																	onPress={sendMessage}
																	disabled={sending}
																>
																	{sending ? (
																		<ActivityIndicator
																			size="small"
																			color="#fff"
																		/>
																	) : (
																		<Ionicons
																			name="send"
																			size={18}
																			color="#fff"
																		/>
																	)}
																</TouchableOpacity>
															</View>
														)}
													</TouchableOpacity>
												);
											})}
										</View>
									)}
									ListEmptyComponent={
										<View style={styles.emptyContainer}>
											<Ionicons
												name="chatbubbles-outline"
												size={48}
												color={COLORS.textMuted}
											/>
											<Text style={styles.emptyText}>
												{searchQuery
													? "Aucun message trouvé"
													: "Aucun message disponible"}
											</Text>
										</View>
									}
								/>
							)}

							{/* Footer info */}
							{!sentSuccess && !loading && (
								<View style={styles.menuFooter}>
									<Ionicons
										name="information-circle-outline"
										size={16}
										color={COLORS.textMuted}
									/>
									<Text style={styles.footerText}>
										Sélectionnez un message puis confirmez l'envoi
									</Text>
								</View>
							)}
						</BlurView>
					</Animated.View>
				</Animated.View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	// Bulle flottante
	bubbleContainer: {
		position: "absolute",
		bottom: 100,
		right: 20,
		zIndex: 1000,
	},
	bubble: {
		width: 60,
		height: 60,
		borderRadius: 30,
		shadowColor: COLORS.accent,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 8,
	},
	bubbleGradient: {
		width: "100%",
		height: "100%",
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},

	// Overlay
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "flex-end",
	},
	overlayTouchable: {
		flex: 1,
	},

	// Menu
	menuContainer: {
		maxHeight: SCREEN_HEIGHT * 0.75,
		marginHorizontal: 12,
		marginBottom: 12,
		borderRadius: 24,
		overflow: "hidden",
	},
	menuBlur: {
		flex: 1,
		backgroundColor: COLORS.darkCard,
	},
	menuHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	menuHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	menuTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: COLORS.text,
	},
	closeButton: {
		padding: 8,
	},

	// Recherche
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		marginHorizontal: 16,
		marginVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 12,
		gap: 10,
	},
	searchInput: {
		flex: 1,
		height: 44,
		color: COLORS.text,
		fontSize: 15,
	},

	// Liste
	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	categorySection: {
		marginBottom: 16,
	},
	categoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 10,
		paddingLeft: 4,
	},
	categoryDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	categoryTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: COLORS.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},

	// Message item
	messageItem: {
		backgroundColor: "rgba(255, 255, 255, 0.06)",
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "transparent",
	},
	messageItemSelected: {
		backgroundColor: "rgba(102, 126, 234, 0.15)",
		borderColor: COLORS.accent,
	},
	messageContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	messageText: {
		flex: 1,
		fontSize: 15,
		color: COLORS.textSecondary,
		lineHeight: 22,
	},
	messageTextSelected: {
		color: COLORS.text,
		fontWeight: "500",
	},

	// Actions
	actionButtons: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 10,
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.1)",
	},
	cancelButton: {
		backgroundColor: "rgba(239, 68, 68, 0.15)",
		padding: 10,
		borderRadius: 10,
	},
	sendButton: {
		backgroundColor: COLORS.accent,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},

	// États
	loadingContainer: {
		padding: 40,
		alignItems: "center",
		gap: 12,
	},
	loadingText: {
		color: COLORS.textMuted,
		fontSize: 14,
	},
	successContainer: {
		padding: 60,
		alignItems: "center",
		gap: 16,
	},
	successText: {
		color: COLORS.success,
		fontSize: 18,
		fontWeight: "600",
	},
	emptyContainer: {
		padding: 40,
		alignItems: "center",
		gap: 12,
	},
	emptyText: {
		color: COLORS.textMuted,
		fontSize: 15,
	},

	// Footer
	menuFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.1)",
	},
	footerText: {
		color: COLORS.textMuted,
		fontSize: 12,
	},
});

export default MessagingBubble;
