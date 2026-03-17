import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	Animated,
	Modal,
	Alert,
	Linking,
	StyleSheet,
	Dimensions,
	Platform,
	Keyboard,
	ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import GRILLZ_COLORS, { GRILLZ_PREMIUM } from "../theme/grillzColors"; // 🔥 Design Grillz personnalisé
import clientFeedbackService from "../services/clientFeedbackService"; // 🌟 API Service

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * 🌟 FeedbackScreen - Collecte d'avis clients et redirection Google
 *
 * Fonctionnalités:
 * - Questionnaire 3 questions Oui/Non
 * - Commentaire libre
 * - Messages dynamiques selon satisfaction
 * - Redirection Google Avis (avec copie du commentaire pour clients satisfaits)
 * - Sauvegarde feedback interne pour clients non satisfaits
 * - Design cohérent avec OrderIt (sombre, orange, animations)
 *
 * Props:
 * - visible: boolean - Affichage modal
 * - onClose: function - Callback fermeture
 * - restaurantData: object - Données restaurant (nom, Google URL)
 * - customerData: object - Données client (nom, tableId, reservationId)
 */
export default function FeedbackScreen({
	visible = false,
	onClose = () => {},
	restaurantData = {},
	customerData = {},
}) {
	// 📱 États du questionnaire
	const [answers, setAnswers] = useState({
		serviceRating: null, // "Le service à table vous a-t-il satisfait ?"
		foodQuality: null, // "Vos plats étaient-ils à votre goût ?"
		venueExperience: null, // "Le lieu vous a-t-il plu ?"
	});

	// 💭 Commentaire libre
	const [comment, setComment] = useState("");

	// 🎯 États interface
	const [currentStep, setCurrentStep] = useState("questions"); // questions | feedback | success
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showCopiedAlert, setShowCopiedAlert] = useState(false);

	// 🎨 Animations
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;

	// ✨ Animation d'entrée
	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: false,
				}),
				Animated.spring(slideAnim, {
					toValue: 0,
					tension: 50,
					friction: 8,
					useNativeDriver: false,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					tension: 50,
					friction: 8,
					useNativeDriver: false,
				}),
			]).start();
		} else {
			// Reset animations
			fadeAnim.setValue(0);
			slideAnim.setValue(SCREEN_HEIGHT);
			scaleAnim.setValue(0.9);
		}
	}, [visible]);

	// 🧮 Calculer la satisfaction globale
	const isFullySatisfied = () => {
		return (
			answers.serviceRating === true &&
			answers.foodQuality === true &&
			answers.venueExperience === true
		);
	};

	// 🎯 Répondre à une question
	const handleAnswer = (questionKey, value) => {
		setAnswers((prev) => ({
			...prev,
			[questionKey]: value,
		}));
	};

	// ▶️ Passer à l'étape suivante
	const handleNext = async () => {
		// Vérifier que toutes les questions sont répondues
		const allAnswered = Object.values(answers).every(
			(answer) => answer !== null,
		);
		if (!allAnswered) {
			Alert.alert(
				"Questions incomplètes",
				"Veuillez répondre à toutes les questions pour continuer.",
			);
			return;
		}

		setCurrentStep("feedback");
	};

	// 📤 Soumettre le feedback
	const handleSubmitFeedback = async () => {
		setIsSubmitting(true);

		try {
			// 🛠️ Helper pour valider un ObjectId MongoDB (24 caractères hexadécimaux)
			const isValidObjectId = (id) => {
				if (!id || typeof id !== "string") return false;
				return /^[a-f\d]{24}$/i.test(id);
			};

			// 🛠️ Construction du payload avec filtrage des champs optionnels invalides
			const restaurantId = restaurantData.id || restaurantData._id;
			const tableId = customerData.tableId;
			const reservationId = customerData.reservationId;
			const clientId = customerData.clientId;

			const feedbackData = {
				restaurantId,
				serviceRating: answers.serviceRating,
				foodQuality: answers.foodQuality,
				venueExperience: answers.venueExperience,
				comment: comment.trim(),
				redirectedToGoogle: false,
			};

			// ✅ Ajouter tableId UNIQUEMENT s'il est un ObjectId valide
			if (isValidObjectId(tableId)) {
				feedbackData.tableId = tableId;
			}

			// ✅ Ajouter reservationId UNIQUEMENT s'il est un ObjectId valide
			if (isValidObjectId(reservationId)) {
				feedbackData.reservationId = reservationId;
			}

			// ✅ Ajouter clientId (String, pas ObjectId) s'il existe
			if (clientId && typeof clientId === "string" && clientId.length > 0) {
				feedbackData.clientId = clientId;
			}

			// ✅ Ajouter clientName s'il existe
			if (
				customerData.clientName &&
				typeof customerData.clientName === "string" &&
				customerData.clientName.trim().length > 0
			) {
				feedbackData.clientName = customerData.clientName.trim();
			}

			// 🚨 Validation côté client pour éviter les erreurs de validation serveur
			const validationErrors = [];
			if (!isValidObjectId(restaurantId)) {
				validationErrors.push("restaurantId manquant ou invalide");
			}
			if (typeof feedbackData.serviceRating !== "boolean") {
				validationErrors.push("serviceRating doit être un booléen");
			}
			if (typeof feedbackData.foodQuality !== "boolean") {
				validationErrors.push("foodQuality doit être un booléen");
			}
			if (typeof feedbackData.venueExperience !== "boolean") {
				validationErrors.push("venueExperience doit être un booléen");
			}

			if (validationErrors.length > 0) {
				console.error(
					"❌ [FEEDBACK-SCREEN] Erreurs de validation côté client:",
					validationErrors,
				);
				Alert.alert(
					"Erreur",
					"Données invalides détectées côté client: " +
						validationErrors.join(", "),
					[{ text: "OK", onPress: () => setCurrentStep("success") }], // Continuer vers Google quand même
				);
				setIsSubmitting(false);
				return;
			}

			// 🌐 Appel API pour sauvegarder le feedback
			const response = await clientFeedbackService.submitFeedback(feedbackData);

			// ✅ Passer au succès peu importe la réponse (fallback garanti)
			setCurrentStep("success");
		} catch (error) {
			console.error("❌ [FEEDBACK-SCREEN] Erreur soumission:", error);

			// Même en cas d'erreur complète, on continue vers Google
			Alert.alert(
				"Information",
				"Une erreur technique s'est produite, mais vous pouvez toujours laisser votre avis sur Google.",
				[{ text: "Continuer", onPress: () => setCurrentStep("success") }],
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// 📋 Copier le commentaire
	const handleCopyComment = async () => {
		if (comment.trim()) {
			await Clipboard.setStringAsync(comment.trim());
			setShowCopiedAlert(true);
			setTimeout(() => setShowCopiedAlert(false), 2000);
		}
	};

	// 🔗 Rediriger vers Google (SÉCURISÉ)
	const handleRedirectToGoogle = async () => {
		try {
			// ✅ SÉCURITÉ: Validation stricte des données de redirection
			const placeId = restaurantData?.googlePlaceId;
			const googleUrl = restaurantData?.googleUrl;

			// ✅ SÉCURITÉ: Vérifier que nous avons des données valides
			if (!placeId && !googleUrl) {
				console.error("❌ Données Google manquantes");
				Alert.alert("Erreur", "Informations Google manquantes");
				return;
			}

			let finalUrl;

			if (googleUrl) {
				// ✅ SÉCURITÉ: Valider que l'URL est bien une URL Google
				if (
					!googleUrl.startsWith("https://google.com") &&
					!googleUrl.startsWith("https://www.google.com") &&
					!googleUrl.startsWith("https://search.google.com")
				) {
					console.error("❌ URL Google invalide:", googleUrl);
					Alert.alert("Erreur", "URL de redirection invalide");
					return;
				}
				finalUrl = googleUrl;
			} else if (placeId) {
				// ✅ SÉCURITÉ: Valider le format du place_id
				if (placeId === "YOUR_PLACE_ID" || placeId.length < 10) {
					console.error("❌ Place ID invalide:", placeId);
					Alert.alert("Erreur", "ID Google Places invalide");
					return;
				}
				// ✅ SÉCURITÉ: Encoder l'ID pour éviter l'injection
				finalUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
			}

			// ✅ SÉCURITÉ: Vérifier que l'URL peut être ouverte
			const canOpen = await Linking.canOpenURL(finalUrl);
			if (!canOpen) {
				Alert.alert("Erreur", "Impossible d'ouvrir le lien Google");
				return;
			}

			// Mettre à jour le statut de redirection
			// TODO: API call pour marquer redirectedToGoogle = true

			await Linking.openURL(finalUrl);

			// Fermer après redirection
			setTimeout(() => {
				handleClose();
			}, 500);
		} catch (error) {
			console.error("❌ Erreur redirection Google:", error);
			Alert.alert(
				"Erreur",
				"Impossible d'ouvrir le lien Google. Veuillez rechercher notre restaurant manuellement.",
			);
		}
	};

	// 🚪 Fermer le modal
	const handleClose = () => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: false,
			}),
			Animated.timing(slideAnim, {
				toValue: SCREEN_HEIGHT,
				duration: 200,
				useNativeDriver: false,
			}),
		]).start(() => {
			// Reset états
			setAnswers({
				serviceRating: null,
				foodQuality: null,
				venueExperience: null,
			});
			setComment("");
			setCurrentStep("questions");
			setIsSubmitting(false);
			setShowCopiedAlert(false);

			onClose();
		});
	};

	// 🎨 Rendu bouton Oui/Non
	const renderYesNoButton = (questionKey, value, label) => {
		const isSelected = answers[questionKey] === value;
		const isYes = value === true;

		return (
			<TouchableOpacity
				style={[
					styles.answerButton,
					isSelected &&
						(isYes ? styles.answerButtonYes : styles.answerButtonNo),
				]}
				onPress={() => handleAnswer(questionKey, value)}
				activeOpacity={0.7}
			>
				<Text
					style={[
						styles.answerButtonText,
						isSelected && styles.answerButtonTextSelected,
					]}
				>
					{label}
				</Text>
			</TouchableOpacity>
		);
	};

	// 📋 Rendu questionnaire
	const renderQuestions = () => {
		const questions = [
			{
				key: "serviceRating",
				text: "Le service à table vous a-t-il satisfait ?",
			},
			{ key: "foodQuality", text: "Vos plats étaient-ils à votre goût ?" },
			{ key: "venueExperience", text: "Le lieu vous a-t-il plu ?" },
		];

		return (
			<View style={styles.questionsContainer}>
				<Text style={styles.title}>Votre avis nous intéresse ! 🌟</Text>
				<Text style={styles.subtitle}>
					Aidez-nous à améliorer votre expérience
				</Text>

				{questions.map((question, index) => (
					<View key={question.key} style={styles.questionBlock}>
						<Text style={styles.questionText}>{question.text}</Text>
						<View style={styles.answersRow}>
							{renderYesNoButton(question.key, true, "Oui")}
							{renderYesNoButton(question.key, false, "Non")}
						</View>
					</View>
				))}

				<TouchableOpacity
					style={[
						styles.nextButton,
						Object.values(answers).every((a) => a !== null) &&
							styles.nextButtonActive,
					]}
					onPress={handleNext}
					disabled={!Object.values(answers).every((a) => a !== null)}
				>
					<LinearGradient
						colors={
							Object.values(answers).every((a) => a !== null)
								? GRILLZ_PREMIUM.primary
								: ["#666", "#555"]
						}
						style={styles.nextButtonGradient}
					>
						<Text style={styles.nextButtonText}>Suivant</Text>
						<Ionicons
							name="arrow-forward"
							size={20}
							color="#fff"
							style={{ marginLeft: 8 }}
						/>
					</LinearGradient>
				</TouchableOpacity>
			</View>
		);
	};

	// 💭 Rendu feedback libre
	const renderFeedback = () => {
		const fulllySatisfied = isFullySatisfied();

		return (
			<View style={styles.feedbackContainer}>
				<Text style={styles.title}>
					{fulllySatisfied ? "Fantastique ! 🎉" : "Merci pour vos réponses !"}
				</Text>

				<Text style={styles.feedbackMessage}>
					{fulllySatisfied
						? "Votre retour positif nous fait très plaisir ! Votre commentaire peut être directement utilisé pour partager votre expérience sur Google."
						: "Votre feedback nous aide à nous améliorer. Vous pouvez partager vos suggestions ici, et laisser un avis public sur Google si vous le souhaitez."}
				</Text>

				<Text style={styles.inputLabel}>
					{fulllySatisfied
						? "Partagez votre expérience (optionnel) :"
						: "Suggestions ou remarques (optionnel) :"}
				</Text>

				<TextInput
					style={styles.commentInput}
					multiline
					numberOfLines={4}
					placeholder={
						fulllySatisfied
							? "Décrivez ce qui vous a plu..."
							: "Qu'est-ce qui pourrait être amélioré ?"
					}
					placeholderTextColor="#999"
					value={comment}
					onChangeText={setComment}
					maxLength={500}
				/>

				<Text style={styles.characterCount}>
					{comment.length}/500 caractères
				</Text>

				<View style={styles.finalButtons}>
					<TouchableOpacity
						style={styles.submitButton}
						onPress={handleSubmitFeedback}
						disabled={isSubmitting}
					>
						<LinearGradient
							colors={GRILLZ_PREMIUM.primary}
							style={styles.submitButtonGradient}
						>
							{isSubmitting ? (
								<ActivityIndicator color="#fff" />
							) : (
								<>
									<Text style={styles.submitButtonText}>
										{fulllySatisfied
											? "Continuer vers Google"
											: "Envoyer & Google"}
									</Text>
									<Ionicons name="arrow-forward" size={20} color="#fff" />
								</>
							)}
						</LinearGradient>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.skipButton}
						onPress={handleSubmitFeedback}
					>
						<Text style={styles.skipButtonText}>Quitter</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	// ✅ Rendu succès avec copie de texte
	const renderSuccess = () => {
		const fulllySatisfied = isFullySatisfied();

		return (
			<View style={styles.successContainer}>
				<LinearGradient
					colors={
						fulllySatisfied ? GRILLZ_PREMIUM.success : GRILLZ_PREMIUM.primary
					}
					style={styles.successIcon}
				>
					<Ionicons
						name={fulllySatisfied ? "heart" : "thumbs-up"}
						size={40}
						color="#fff"
					/>
				</LinearGradient>

				<Text style={styles.successTitle}>
					{fulllySatisfied
						? "Merci infiniment ! 💖"
						: "Merci pour vos retours ! 🙏"}
				</Text>

				<Text style={styles.successMessage}>
					{fulllySatisfied
						? "Votre satisfaction est notre plus belle récompense. Partagez votre expérience sur Google !"
						: "Vos suggestions nous aideront à nous améliorer. N'hésitez pas à laisser un avis sur Google."}
				</Text>

				{fulllySatisfied && comment.trim() && (
					<View style={styles.copySection}>
						<Text style={styles.copyLabel}>Votre commentaire :</Text>
						<View style={styles.commentPreview}>
							<Text style={styles.commentPreviewText}>"{comment.trim()}"</Text>
						</View>

						<TouchableOpacity
							style={styles.copyButton}
							onPress={handleCopyComment}
						>
							<Ionicons name="copy-outline" size={20} color="#667eea" />
							<Text style={styles.copyButtonText}>Copier le texte</Text>
						</TouchableOpacity>

						{showCopiedAlert && (
							<Animated.View style={styles.copiedAlert}>
								<Text style={styles.copiedAlertText}>✅ Copié !</Text>
							</Animated.View>
						)}
					</View>
				)}

				<View style={styles.finalButtons}>
					<TouchableOpacity
						style={styles.googleButton}
						onPress={handleRedirectToGoogle}
					>
						<LinearGradient
							colors={["#4285f4", "#34a853"]}
							style={styles.googleButtonGradient}
						>
							<Ionicons name="logo-google" size={20} color="#fff" />
							<Text style={styles.googleButtonText}>Avis Google</Text>
						</LinearGradient>
					</TouchableOpacity>

					<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
						<Text style={styles.closeButtonText}>Fermer</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	if (!visible) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={handleClose}
		>
			<Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
				<BlurView intensity={20} tint="dark" style={styles.blurOverlay} />

				<Animated.View
					style={[
						styles.container,
						{
							transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
						},
					]}
				>
					<LinearGradient
						colors={GRILLZ_PREMIUM.dark}
						style={styles.modalContent}
					>
						{/* Header avec bouton fermer */}
						<View style={styles.header}>
							<View style={styles.headerIndicator} />
							<TouchableOpacity
								style={styles.closeIconButton}
								onPress={handleClose}
							>
								<Ionicons name="close" size={24} color="#fff" />
							</TouchableOpacity>
						</View>

						{/* Contenu selon l'étape */}
						<View style={styles.content}>
							{currentStep === "questions" && renderQuestions()}
							{currentStep === "feedback" && renderFeedback()}
							{currentStep === "success" && renderSuccess()}
						</View>
					</LinearGradient>
				</Animated.View>
			</Animated.View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
	},
	blurOverlay: {
		...StyleSheet.absoluteFillObject,
	},
	container: {
		maxHeight: SCREEN_HEIGHT * 0.85,
		margin: 16,
		marginBottom: Platform.OS === "ios" ? 40 : 20,
	},
	modalContent: {
		borderRadius: 24,
		overflow: "hidden",
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 10,
	},
	headerIndicator: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		borderRadius: 2,
	},
	closeIconButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		padding: 24,
	},

	// 📋 Questions
	questionsContainer: {
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#ccc",
		textAlign: "center",
		marginBottom: 32,
	},
	questionBlock: {
		width: "100%",
		marginBottom: 24,
	},
	questionText: {
		fontSize: 18,
		color: "#fff",
		textAlign: "center",
		marginBottom: 12,
		fontWeight: "500",
	},
	answersRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
	},
	answerButton: {
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 25,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderWidth: 1.5,
		borderColor: "rgba(255, 255, 255, 0.2)",
		minWidth: 80,
	},
	answerButtonYes: {
		backgroundColor: "rgba(34, 197, 94, 0.2)",
		borderColor: "#22c55e",
	},
	answerButtonNo: {
		backgroundColor: "rgba(239, 68, 68, 0.2)",
		borderColor: "#ef4444",
	},
	answerButtonText: {
		fontSize: 16,
		color: "#ccc",
		textAlign: "center",
		fontWeight: "500",
	},
	answerButtonTextSelected: {
		color: "#fff",
	},
	nextButton: {
		marginTop: 32,
		borderRadius: 25,
		overflow: "hidden",
		opacity: 0.5,
	},
	nextButtonActive: {
		opacity: 1,
	},
	nextButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingVertical: 16,
	},
	nextButtonText: {
		fontSize: 18,
		color: "#fff",
		fontWeight: "600",
	},

	// 💭 Feedback
	feedbackContainer: {
		alignItems: "center",
	},
	feedbackMessage: {
		fontSize: 16,
		color: "#ccc",
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 24,
	},
	inputLabel: {
		fontSize: 16,
		color: "#fff",
		alignSelf: "stretch",
		marginBottom: 12,
		fontWeight: "500",
	},
	commentInput: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 16,
		padding: 16,
		color: "#fff",
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		minHeight: 100,
		textAlignVertical: "top",
		alignSelf: "stretch",
	},
	characterCount: {
		fontSize: 12,
		color: "#888",
		alignSelf: "flex-end",
		marginTop: 4,
		marginBottom: 24,
	},

	// 🎯 Boutons finaux
	finalButtons: {
		width: "100%",
		gap: 12,
	},
	submitButton: {
		borderRadius: 25,
		overflow: "hidden",
	},
	submitButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingVertical: 16,
		gap: 8,
	},
	submitButtonText: {
		fontSize: 18,
		color: "#fff",
		fontWeight: "600",
	},
	skipButton: {
		padding: 16,
		alignItems: "center",
	},
	skipButtonText: {
		fontSize: 16,
		color: "#ccc",
	},

	// ✅ Succès
	successContainer: {
		alignItems: "center",
	},
	successIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	successTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		textAlign: "center",
		marginBottom: 16,
	},
	successMessage: {
		fontSize: 16,
		color: "#ccc",
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 24,
	},

	// 📋 Section copie
	copySection: {
		width: "100%",
		marginBottom: 24,
	},
	copyLabel: {
		fontSize: 14,
		color: "#fff",
		marginBottom: 8,
		fontWeight: "500",
	},
	commentPreview: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	commentPreviewText: {
		fontSize: 14,
		color: "#ccc",
		fontStyle: "italic",
		lineHeight: 20,
	},
	copyButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		backgroundColor: "rgba(102, 126, 234, 0.2)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(102, 126, 234, 0.3)",
		gap: 8,
	},
	copyButtonText: {
		fontSize: 14,
		color: "#667eea",
		fontWeight: "500",
	},
	copiedAlert: {
		position: "absolute",
		right: 0,
		top: -30,
		backgroundColor: "#22c55e",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	copiedAlertText: {
		fontSize: 12,
		color: "#fff",
		fontWeight: "500",
	},

	// 🔗 Boutons Google/Fermer
	googleButton: {
		borderRadius: 25,
		overflow: "hidden",
	},
	googleButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingVertical: 16,
		gap: 8,
	},
	googleButtonText: {
		fontSize: 18,
		color: "#fff",
		fontWeight: "600",
	},
	closeButton: {
		padding: 16,
		alignItems: "center",
	},
	closeButtonText: {
		fontSize: 16,
		color: "#ccc",
	},
});
