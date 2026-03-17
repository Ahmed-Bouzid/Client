import React, { useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Modal,
	Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

/**
 * AddOnFlow.jsx
 * Flux complet pour la sélection d'add-ons :
 * 1. Menu (affichage du produit sélectionné)
 * 2. Add-ons (belle interface de sélection)
 * 3. Récapitulatif (si add-ons sélectionnés)
 * 4. Popup de confirmation
 * 5. Retour au menu
 */

export default function AddOnFlow({
	dish = null, // Produit sélectionné
	allowedAddOns = [], // Add-ons autorisés pour ce produit
	onComplete = () => {}, // Callback avec produit + add-ons finalisés
	onCancel = () => {}, // Callback pour retour au menu
}) {
	const [step, setStep] = useState("addons"); // "addons" | "summary" | "confirmation"
	const [selectedAddOns, setSelectedAddOns] = useState([]);
	const [showConfirmation, setShowConfirmation] = useState(false);

	if (!dish) return null;

	// Basculer la sélection d'un add-on
	const toggleAddOn = (addOn) => {
		const exists = selectedAddOns.find(
			(a) => a._id === addOn._id || a.id === addOn.id,
		);
		if (exists) {
			setSelectedAddOns(
				selectedAddOns.filter((a) => a._id !== addOn._id && a.id !== addOn.id),
			);
		} else {
			setSelectedAddOns([...selectedAddOns, addOn]);
		}
	};

	// Calculer le total des add-ons
	const calculateAddOnsTotal = () => {
		return selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
	};

	// Calculer le prix total
	const totalPrice = (dish.price || 0) + calculateAddOnsTotal();

	// Continuer après sélection d'add-ons
	const handleContinueFromAddOns = () => {
		if (selectedAddOns.length > 0) {
			setStep("summary");
		} else {
			// Pas d'add-ons sélectionnés → confirmation directe
			setShowConfirmation(true);
		}
	};

	// Retour aux add-ons depuis le récap
	const handleBackToAddOns = () => {
		setStep("addons");
	};

	// Confirmation finale
	const handleFinalConfirmation = () => {
		const finalItem = {
			...dish,
			selectedAddOns,
			addOnsTotal: calculateAddOnsTotal(),
			finalPrice: totalPrice,
		};
		onComplete?.(finalItem);
		setShowConfirmation(false);
	};

	return (
		<View style={styles.container}>
			{/* Contenu principal */}
			{step === "addons" && (
				<AddOnsStep
					dish={dish}
					allowedAddOns={allowedAddOns}
					selectedAddOns={selectedAddOns}
					toggleAddOn={toggleAddOn}
					onContinue={handleContinueFromAddOns}
					onCancel={onCancel}
				/>
			)}

			{step === "summary" && (
				<SummaryStep
					dish={dish}
					selectedAddOns={selectedAddOns}
					totalPrice={totalPrice}
					onConfirm={() => setShowConfirmation(true)}
					onBack={handleBackToAddOns}
				/>
			)}

			{/* Modal de confirmation */}
			<ConfirmationModal
				visible={showConfirmation}
				dish={dish}
				selectedAddOns={selectedAddOns}
				totalPrice={totalPrice}
				onConfirm={handleFinalConfirmation}
				onCancel={() => {
					setShowConfirmation(false);
					// Revenir au menu après confirmation
					setTimeout(() => onCancel?.(), 500);
				}}
			/>
		</View>
	);
}

/**
 * Étape 1 : Sélection des Add-ons
 */
function AddOnsStep({
	dish,
	allowedAddOns,
	selectedAddOns,
	toggleAddOn,
	onContinue,
	onCancel,
}) {
	const addOnsTotal = selectedAddOns.reduce(
		(sum, a) => sum + (a.price || 0),
		0,
	);
	const totalPrice = (dish.price || 0) + addOnsTotal;

	return (
		<>
			{/* Header avec produit sélectionné */}
			<View style={styles.header}>
				<TouchableOpacity onPress={onCancel} style={styles.backButton}>
					<MaterialIcons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>
				<View style={styles.headerContent}>
					<Text style={styles.selectedDishTitle}>{dish.name}</Text>
					<Text style={styles.selectedDishPrice}>
						{dish.price?.toFixed(2) || "0.00"}€
					</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Titre et description */}
			<View style={styles.titleSection}>
				<Text style={styles.mainTitle}>
					Ajouter un peu plus {allowedAddOns.length > 0 ? "?" : ""}
				</Text>
				<Text style={styles.subtitle}>
					{allowedAddOns.length === 0
						? "Aucun add-on disponible pour ce produit"
						: "Choisissez des suppléments pour améliorer votre commande"}
				</Text>
			</View>

			{/* Liste des add-ons */}
			<ScrollView style={styles.addOnsListContainer}>
				{allowedAddOns.length === 0 ? (
					<View style={styles.emptyState}>
						<Ionicons name="checkmark-circle" size={48} color="#ccc" />
						<Text style={styles.emptyStateText}>Pas d'add-ons disponibles</Text>
					</View>
				) : (
					<FlatList
						data={allowedAddOns}
						keyExtractor={(item) =>
							(item._id || item.id)?.toString() || Math.random().toString()
						}
						renderItem={({ item }) => {
							const isSelected = selectedAddOns.find(
								(a) => a._id === item._id || a.id === item.id,
							);
							return (
								<TouchableOpacity
									style={[
										styles.addOnCard,
										isSelected && styles.addOnCardSelected,
									]}
									onPress={() => toggleAddOn(item)}
									activeOpacity={0.7}
								>
									<View style={styles.addOnCardContent}>
										<View style={styles.addOnLeft}>
											<Text style={styles.addOnName}>{item.name}</Text>
											{item.description && (
												<Text style={styles.addOnDesc}>{item.description}</Text>
											)}
										</View>
										<View style={styles.addOnRight}>
											<Text style={styles.addOnPrice}>
												+{item.price?.toFixed(2) || "0.00"}€
											</Text>
											<View
												style={[
													styles.checkbox,
													isSelected && styles.checkboxSelected,
												]}
											>
												{isSelected && (
													<MaterialIcons name="check" size={14} color="#fff" />
												)}
											</View>
										</View>
									</View>
								</TouchableOpacity>
							);
						}}
						scrollEnabled={false}
						contentContainerStyle={styles.addOnsListContent}
					/>
				)}
			</ScrollView>

			{/* Résumé en bas */}
			{selectedAddOns.length > 0 && (
				<View style={styles.quickSummary}>
					<View>
						<Text style={styles.quickSummaryLabel}>
							{selectedAddOns.length} add-on
							{selectedAddOns.length > 1 ? "s" : ""} sélectionné
							{selectedAddOns.length > 1 ? "s" : ""}
						</Text>
						<Text style={styles.quickSummaryTotal}>
							+{addOnsTotal.toFixed(2)}€
						</Text>
					</View>
					<Text style={styles.totalWithAddOns}>
						Total : {totalPrice.toFixed(2)}€
					</Text>
				</View>
			)}

			{/* Boutons d'action */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
					<MaterialIcons name="arrow-back" size={18} color="#666" />
					<Text style={styles.secondaryButtonText}>Menu</Text>
				</TouchableOpacity>

				<LinearGradient
					colors={["#F59E0B", "#D97706"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.primaryButtonGradient}
				>
					<TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
						<Text style={styles.primaryButtonText}>
							{selectedAddOns.length === 0 ? "Passer" : "Continuer"}
						</Text>
						<MaterialIcons name="arrow-forward" size={18} color="#fff" />
					</TouchableOpacity>
				</LinearGradient>
			</View>
		</>
	);
}

/**
 * Étape 3 : Récapitulatif
 */
function SummaryStep({ dish, selectedAddOns, totalPrice, onConfirm, onBack }) {
	const addOnsTotal = selectedAddOns.reduce(
		(sum, a) => sum + (a.price || 0),
		0,
	);

	return (
		<>
			<View style={styles.header}>
				<TouchableOpacity onPress={onBack} style={styles.backButton}>
					<MaterialIcons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Récapitulatif</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView style={styles.summaryContainer}>
				{/* Produit principal */}
				<View style={styles.summarySection}>
					<Text style={styles.sectionTitle}>Votre commande</Text>
					<View style={styles.summaryItem}>
						<View>
							<Text style={styles.itemName}>{dish.name}</Text>
							{dish.description && (
								<Text style={styles.itemDesc}>{dish.description}</Text>
							)}
						</View>
						<Text style={styles.itemPrice}>
							{dish.price?.toFixed(2) || "0.00"}€
						</Text>
					</View>
				</View>

				{/* Add-ons sélectionnés */}
				{selectedAddOns.length > 0 && (
					<View style={styles.summarySection}>
						<Text style={styles.sectionTitle}>Add-ons sélectionnés</Text>
						{selectedAddOns.map((addOn) => (
							<View key={addOn._id || addOn.id} style={styles.summaryItem}>
								<View>
									<Text style={styles.itemName}>{addOn.name}</Text>
									{addOn.description && (
										<Text style={styles.itemDesc}>{addOn.description}</Text>
									)}
								</View>
								<Text style={styles.itemPrice}>
									+{addOn.price?.toFixed(2) || "0.00"}€
								</Text>
							</View>
						))}
					</View>
				)}

				{/* Total */}
				<View style={styles.totalSection}>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Sous-total</Text>
						<Text style={styles.totalValue}>
							{dish.price?.toFixed(2) || "0.00"}€
						</Text>
					</View>
					{addOnsTotal > 0 && (
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Add-ons</Text>
							<Text style={styles.totalValue}>+{addOnsTotal.toFixed(2)}€</Text>
						</View>
					)}
					<View style={[styles.totalRow, styles.totalRowFinal]}>
						<Text style={styles.totalLabelFinal}>Total</Text>
						<Text style={styles.totalValueFinal}>{totalPrice.toFixed(2)}€</Text>
					</View>
				</View>
			</ScrollView>

			{/* Boutons */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
					<MaterialIcons name="edit" size={18} color="#666" />
					<Text style={styles.secondaryButtonText}>Modifier</Text>
				</TouchableOpacity>

				<LinearGradient
					colors={["#10B981", "#059669"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.primaryButtonGradient}
				>
					<TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
						<Text style={styles.primaryButtonText}>Confirmer</Text>
						<MaterialIcons name="check" size={18} color="#fff" />
					</TouchableOpacity>
				</LinearGradient>
			</View>
		</>
	);
}

/**
 * Étape 4 : Modal de Confirmation
 */
function ConfirmationModal({
	visible,
	dish,
	selectedAddOns,
	totalPrice,
	onConfirm,
	onCancel,
}) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.confirmationModal}>
					{/* Icône de succès */}
					<View style={styles.successIconContainer}>
						<Ionicons name="checkmark-circle" size={64} color="#10B981" />
					</View>

					{/* Texte de confirmation */}
					<Text style={styles.confirmationTitle}>Parfait !</Text>

					<Text style={styles.confirmationSubtitle}>
						{selectedAddOns.length > 0
							? `${dish.name} + ${selectedAddOns.length} add-on${selectedAddOns.length > 1 ? "s" : ""} ajouté${selectedAddOns.length > 1 ? "s" : ""} au panier`
							: `${dish.name} ajouté au panier`}
					</Text>

					{/* Prix final */}
					<View style={styles.priceConfirmation}>
						<Text style={styles.priceLabel}>Total de cette commande :</Text>
						<Text style={styles.priceFinal}>{totalPrice.toFixed(2)}€</Text>
					</View>

					{/* Détails */}
					{selectedAddOns.length > 0 && (
						<View style={styles.confirmationDetails}>
							<Text style={styles.detailsTitle}>Votre sélection :</Text>
							<Text style={styles.detailsItem}>
								• {dish.name} ({dish.price?.toFixed(2)}€)
							</Text>
							{selectedAddOns.map((a) => (
								<Text key={a._id || a.id} style={styles.detailsItem}>
									• {a.name} (+{a.price?.toFixed(2)}€)
								</Text>
							))}
						</View>
					)}

					{/* Bouton continuer */}
					<LinearGradient
						colors={["#10B981", "#059669"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.confirmationButtonGradient}
					>
						<TouchableOpacity
							style={styles.confirmationButton}
							onPress={onConfirm}
						>
							<Text style={styles.confirmationButtonText}>Retour au menu</Text>
						</TouchableOpacity>
					</LinearGradient>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f9fafb",
	},
	// Header
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 16,
		backgroundColor: "#F59E0B",
	},
	headerContent: {
		flex: 1,
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
		textAlign: "center",
	},
	selectedDishTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fff",
	},
	selectedDishPrice: {
		fontSize: 12,
		color: "rgba(255,255,255,0.9)",
		marginTop: 2,
	},
	backButton: {
		padding: 8,
	},

	// Title Section
	titleSection: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	mainTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1f2937",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#6b7280",
		lineHeight: 20,
	},

	// Add-ons List
	addOnsListContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	addOnsListContent: {
		paddingBottom: 16,
	},
	addOnCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1.5,
		borderColor: "#e5e7eb",
		overflow: "hidden",
	},
	addOnCardSelected: {
		borderColor: "#10B981",
		backgroundColor: "#f0fdf4",
	},
	addOnCardContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 12,
	},
	addOnLeft: {
		flex: 1,
		marginRight: 12,
	},
	addOnRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	addOnName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#1f2937",
		marginBottom: 4,
	},
	addOnDesc: {
		fontSize: 12,
		color: "#9ca3af",
	},
	addOnPrice: {
		fontSize: 14,
		fontWeight: "700",
		color: "#F59E0B",
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: "#d1d5db",
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		backgroundColor: "#10B981",
		borderColor: "#10B981",
	},

	// Empty State
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyStateText: {
		fontSize: 14,
		color: "#9ca3af",
		marginTop: 12,
	},

	// Quick Summary
	quickSummary: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginHorizontal: 16,
		marginBottom: 12,
		backgroundColor: "#f3f4f6",
		borderRadius: 12,
	},
	quickSummaryLabel: {
		fontSize: 12,
		color: "#6b7280",
	},
	quickSummaryTotal: {
		fontSize: 16,
		fontWeight: "700",
		color: "#10B981",
		marginTop: 2,
	},
	totalWithAddOns: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1f2937",
	},

	// Actions Container
	actionsContainer: {
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#e5e7eb",
	},
	secondaryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 12,
		borderRadius: 10,
		backgroundColor: "#f3f4f6",
		borderWidth: 1,
		borderColor: "#d1d5db",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#374151",
	},
	primaryButtonGradient: {
		flex: 1.2,
		borderRadius: 10,
	},
	primaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 12,
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#fff",
	},

	// Summary
	summaryContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	summarySection: {
		marginBottom: 20,
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 12,
	},
	summaryItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f3f4f6",
	},
	summaryItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f3f4f6",
	},
	itemName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#1f2937",
	},
	itemDesc: {
		fontSize: 12,
		color: "#9ca3af",
		marginTop: 2,
	},
	itemPrice: {
		fontSize: 14,
		fontWeight: "700",
		color: "#F59E0B",
	},

	// Total Section
	totalSection: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		marginBottom: 20,
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f3f4f6",
	},
	totalRowFinal: {
		borderBottomWidth: 0,
		paddingTop: 12,
		paddingBottom: 0,
	},
	totalLabel: {
		fontSize: 14,
		color: "#6b7280",
	},
	totalLabelFinal: {
		fontSize: 16,
		fontWeight: "700",
		color: "#1f2937",
	},
	totalValue: {
		fontSize: 14,
		fontWeight: "600",
		color: "#1f2937",
	},
	totalValueFinal: {
		fontSize: 18,
		fontWeight: "700",
		color: "#10B981",
	},

	// Confirmation Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	confirmationModal: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingVertical: 24,
		paddingBottom: 32,
	},
	successIconContainer: {
		alignItems: "center",
		marginBottom: 16,
	},
	confirmationTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1f2937",
		textAlign: "center",
		marginBottom: 8,
	},
	confirmationSubtitle: {
		fontSize: 15,
		color: "#6b7280",
		textAlign: "center",
		marginBottom: 18,
		lineHeight: 22,
	},

	// Price Confirmation
	priceConfirmation: {
		alignItems: "center",
		paddingVertical: 16,
		marginVertical: 12,
		backgroundColor: "#f9fafb",
		borderRadius: 12,
	},
	priceLabel: {
		fontSize: 12,
		color: "#9ca3af",
		marginBottom: 4,
	},
	priceFinal: {
		fontSize: 28,
		fontWeight: "800",
		color: "#10B981",
	},

	// Confirmation Details
	confirmationDetails: {
		backgroundColor: "#f3f4f6",
		borderRadius: 12,
		padding: 12,
		marginVertical: 12,
		marginBottom: 18,
	},
	detailsTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 8,
	},
	detailsItem: {
		fontSize: 13,
		color: "#6b7280",
		marginBottom: 4,
		paddingLeft: 4,
	},

	// Confirmation Button
	confirmationButtonGradient: {
		borderRadius: 10,
	},
	confirmationButton: {
		paddingVertical: 14,
		alignItems: "center",
	},
	confirmationButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
	},
});
