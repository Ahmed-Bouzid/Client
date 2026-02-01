/**
 * 💬 MessagingBubble - Conversation bidirectionnelle client ↔ serveur
 *
 * Fonctionnalités V2.0:
 * - Bulle flottante avec animation fade-in (apparaît 2-3s après montage)
 * - Thread de conversation (messages client + réponses serveur)
 * - WebSocket temps réel pour réponses serveur
 * - Badge unread count
 * - Activation/désactivation par restaurant
 * - Feedback visuel + Vibration
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
	ScrollView,
	TextInput,
	Dimensions,
	ActivityIndicator,
	Vibration,
	Platform,
} from "react-native";
// import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { messageService } from "../../services/messageService";
import { useSocketClient } from "../../hooks/useSocketClient";
import { getRestaurantId } from "../../../../shared-api/utils/getRestaurantId";

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
	// 🔌 WebSocket
	const [restaurantId, setRestaurantId] = useState(null);
	const { isConnected, on, off } = useSocketClient(restaurantId);

	// États conversation
	const [isVisible, setIsVisible] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [conversation, setConversation] = useState([]); // ⭐ Messages + réponses
	const [predefinedMessages, setPredefinedMessages] = useState([]); // Messages disponibles
	const [unreadCount, setUnreadCount] = useState(0); // ⭐ Badge
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [selectedMessage, setSelectedMessage] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sentSuccess, setSentSuccess] = useState(false);
	const [showConversation, setShowConversation] = useState(false); // ⭐ Mode conversation
	const conversationScrollRef = useRef(null);

	// Animations
	const bubbleScale = useRef(new Animated.Value(0)).current;
	const bubbleOpacity = useRef(new Animated.Value(0)).current;
	const menuOpacity = useRef(new Animated.Value(0)).current;
	const menuScale = useRef(new Animated.Value(0.8)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// 🔧 Récupérer restaurantId au montage
	useEffect(() => {
		const initRestaurant = async () => {
			const id = await getRestaurantId();
			setRestaurantId(id);
		};
		initRestaurant();
	}, []);

	// 🔧 Vérifier si messagerie activée
	useEffect(() => {
		if (!restaurantId) return;

		const checkStatus = async () => {
			const isEnabled = await messageService.checkMessagingStatus(restaurantId);
			if (!isEnabled) {
				setIsVisible(false);
				console.log("💬 Messagerie désactivée pour ce restaurant");
			}
		};

		checkStatus();
	}, [restaurantId]);

	// 🔌 Listener Socket : Réponses serveur
	useEffect(() => {
		if (!isConnected || !reservationId) return;

		const handleServerResponse = (event) => {
			if (event.data?.reservationId !== reservationId) return;

			console.log("📨 Réponse serveur reçue:", event.data.responseText);

			// Ajouter réponse à la conversation
			setConversation((prev) => [
				...prev,
				{
					type: "server",
					text: event.data.responseText,
					serverName: event.data.serverName || "Serveur",
					createdAt: event.data.timestamp || new Date().toISOString(),
					_id: event.data.responseId,
				},
			]);

			// Incrémenter unread si conversation fermée
			if (!showConversation) {
				setUnreadCount((prev) => prev + 1);
			}

			// Vibration
			if (Platform.OS !== "web") {
				Vibration.vibrate([0, 100]);
			}

			// Auto-scroll si conversation ouverte
			if (showConversation && conversationScrollRef.current) {
				setTimeout(() => {
					conversationScrollRef.current?.scrollToEnd({ animated: true });
				}, 100);
			}
		};

		const handleMessagingStatusChanged = (event) => {
			console.log("🔧 Messagerie", event.isEnabled ? "activée" : "désactivée");
			if (!event.isEnabled) {
				setIsVisible(false);
				setIsMenuOpen(false);
			}
		};

		on("server-response", handleServerResponse);
		on("messaging-status-changed", handleMessagingStatusChanged);

		return () => {
			off("server-response", handleServerResponse);
			off("messaging-status-changed", handleMessagingStatusChanged);
		};
	}, [isConnected, reservationId, showConversation, on, off]);

	// 📥 Charger conversation au montage
	useEffect(() => {
		if (!reservationId) return;

		const loadConversation = async () => {
			const data = await messageService.fetchConversation(reservationId);
			setConversation(data);

			// Compter messages serveur non lus
			const serverUnread = data.filter(
				(m) => m.type === "server" && m.status !== "read",
			).length;
			setUnreadCount(serverUnread);
		};

		loadConversation();
	}, [reservationId]);

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
			]),
		).start();
	};

	// Charger les messages prédéfinis (pour sélecteur)
	const loadMessages = useCallback(async () => {
		if (predefinedMessages.length > 0) return; // Déjà chargés

		setLoading(true);
		try {
			const data = await messageService.fetchPredefinedMessages();
			setPredefinedMessages(data);
		} catch (error) {
			console.error("Erreur chargement messages:", error);
		} finally {
			setLoading(false);
		}
	}, [predefinedMessages.length]);

	// Ouvrir le menu (conversation ou sélecteur)
	const openMenu = useCallback(() => {
		setIsMenuOpen(true);
		// Afficher conversation si des messages existent
		if (conversation.length > 0) {
			setShowConversation(true);
			setUnreadCount(0); // Marquer comme lu
		} else {
			setShowConversation(false);
			loadMessages(); // Charger messages prédéfinis
		}

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

		// Auto-scroll conversation si ouverte
		if (conversation.length > 0) {
			setTimeout(() => {
				conversationScrollRef.current?.scrollToEnd({ animated: true });
			}, 300);
		}
	}, [loadMessages, conversation.length]);

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
			setShowConversation(false);
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
			const result = await messageService.sendMessage({
				predefinedMessageId: selectedMessage._id,
				reservationId,
				clientId,
				clientName,
			});

			// Ajouter message à conversation
			setConversation((prev) => [
				...prev,
				{
					type: "client",
					text: selectedMessage.text,
					createdAt: new Date().toISOString(),
					_id: result.data?._id || Date.now().toString(),
					status: "sent",
				},
			]);

			setSentSuccess(true);
			if (Platform.OS !== "web") {
				Vibration.vibrate([0, 50, 50, 50]);
			}

			// Afficher conversation après envoi
			setTimeout(() => {
				setSentSuccess(false);
				setShowConversation(true);
				setSelectedMessage(null);
				setTimeout(() => {
					conversationScrollRef.current?.scrollToEnd({ animated: true });
				}, 100);
			}, 1000);
		} catch (error) {
			console.error("Erreur envoi:", error);
			alert("Impossible d'envoyer le message. Réessayez.");
		} finally {
			setSending(false);
		}
	}, [selectedMessage, reservationId, clientId, clientName]);

	// Filtrer les messages prédéfinis
	const filteredMessages = useMemo(() => {
		if (!searchQuery.trim()) return predefinedMessages;
		const query = searchQuery.toLowerCase();
		return predefinedMessages.filter(
			(m) =>
				m.text.toLowerCase().includes(query) ||
				m.category?.toLowerCase().includes(query),
		);
	}, [predefinedMessages, searchQuery]);

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
			{/* 🔘 Bulle flottante avec badge */}
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
						{/* Badge unread count */}
						{unreadCount > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>
									{unreadCount > 9 ? "9+" : unreadCount}
								</Text>
							</View>
						)}
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>

			{/* 📋 Modal conversation bidirectionnelle */}
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
						<View style={styles.menuBlur}>
							{/* Header */}
							<View style={styles.menuHeader}>
								<View style={styles.menuHeaderLeft}>
									<Ionicons
										name={showConversation ? "chatbubbles" : "list"}
										size={24}
										color={COLORS.accent}
									/>
									<Text style={styles.menuTitle}>
										{showConversation ? "Conversation" : "Appeler le serveur"}
									</Text>
								</View>
								<TouchableOpacity
									onPress={closeMenu}
									style={styles.closeButton}
								>
									<Ionicons name="close" size={24} color={COLORS.textMuted} />
								</TouchableOpacity>
							</View>

							{/* 💬 MODE CONVERSATION */}
							{showConversation ? (
								<>
									{/* Thread de messages */}
									<ScrollView
										ref={conversationScrollRef}
										style={styles.conversationScroll}
										contentContainerStyle={styles.conversationContent}
										showsVerticalScrollIndicator={false}
									>
										{conversation.map((msg, idx) => {
											const isClient = msg.type === "client";
											return (
												<View
													key={msg._id || idx}
													style={[
														styles.messageBubble,
														isClient
															? styles.clientBubble
															: styles.serverBubble,
													]}
												>
													{!isClient && (
														<Text style={styles.serverName}>
															{msg.serverName || "Serveur"}
														</Text>
													)}
													<Text
														style={[
															styles.bubbleText,
															isClient
																? styles.clientBubbleText
																: styles.serverBubbleText,
														]}
													>
														{msg.text}
													</Text>
													<Text style={styles.bubbleTime}>
														{new Date(msg.createdAt).toLocaleTimeString(
															"fr-FR",
															{
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</Text>
												</View>
											);
										})}
									</ScrollView>

									{/* Bouton "Écrire un message" */}
									<View style={styles.conversationFooter}>
										<TouchableOpacity
											style={styles.writeMessageButton}
											onPress={() => {
												setShowConversation(false);
												loadMessages();
											}}
										>
											<Ionicons
												name="create-outline"
												size={20}
												color={COLORS.accent}
											/>
											<Text style={styles.writeMessageText}>
												Écrire un message
											</Text>
										</TouchableOpacity>
									</View>
								</>
							) : (
								/* 📝 MODE SÉLECTEUR DE MESSAGES PRÉDÉFINIS */
								<>
									{/* Barre de recherche */}
									<View style={styles.searchContainer}>
										<Ionicons
											name="search"
											size={18}
											color={COLORS.textMuted}
										/>
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
															{category.charAt(0).toUpperCase() +
																category.slice(1)}
														</Text>
													</View>

													{/* Messages de la catégorie */}
													{msgs.map((message) => {
														const isSelected =
															selectedMessage?._id === message._id;
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
									{!sentSuccess && !loading && !showConversation && (
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
								</>
							)}
						</View>
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
		position: "relative",
	},
	// ⭐ Badge unread count
	badge: {
		position: "absolute",
		top: -4,
		right: -4,
		backgroundColor: "#ef4444",
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 5,
		borderWidth: 2,
		borderColor: "#fff",
	},
	badgeText: {
		color: "#fff",
		fontSize: 11,
		fontWeight: "700",
	},

	// Overlay
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "center",
		alignItems: "center",
	},
	overlayTouchable: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},

	// Menu
	menuContainer: {
		maxHeight: SCREEN_HEIGHT * 0.75,
		width: SCREEN_WIDTH - 32,
		borderRadius: 16,
		backgroundColor: "#fff",
		alignSelf: "center",
		paddingVertical: 18,
		paddingHorizontal: 0,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 18,
		elevation: 8,
	},
	menuBlur: {
		flex: 1,
		backgroundColor: "transparent",
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
		color: "#222",
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
		color: "#444",
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
		color: "#222",
		lineHeight: 22,
	},
	messageTextSelected: {
		color: "#222",
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
		color: "#444",
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
		color: "#444",
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
		color: "#444",
		fontSize: 12,
	},

	// ⭐ Conversation Thread
	conversationScroll: {
		maxHeight: SCREEN_HEIGHT * 0.5,
		paddingHorizontal: 16,
		marginVertical: 12,
	},
	conversationContent: {
		paddingBottom: 12,
	},
	messageBubble: {
		maxWidth: "75%",
		marginBottom: 12,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 16,
	},
	clientBubble: {
		alignSelf: "flex-end",
		backgroundColor: COLORS.accent,
		borderBottomRightRadius: 4,
	},
	serverBubble: {
		alignSelf: "flex-start",
		backgroundColor: "rgba(0, 0, 0, 0.06)",
		borderBottomLeftRadius: 4,
	},
	serverName: {
		fontSize: 11,
		fontWeight: "600",
		color: "#666",
		marginBottom: 4,
	},
	bubbleText: {
		fontSize: 15,
		lineHeight: 20,
	},
	clientBubbleText: {
		color: "#fff",
	},
	serverBubbleText: {
		color: "#222",
	},
	bubbleTime: {
		fontSize: 10,
		color: "rgba(0, 0, 0, 0.4)",
		marginTop: 4,
		alignSelf: "flex-end",
	},

	// ⭐ Footer conversation
	conversationFooter: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.1)",
	},
	writeMessageButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "rgba(102, 126, 234, 0.1)",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
	},
	writeMessageText: {
		color: COLORS.accent,
		fontSize: 15,
		fontWeight: "600",
	},
});

export default MessagingBubble;
