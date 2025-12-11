import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrderStore } from "../stores/useOrderStore.js";

export default function Payment({
	allOrders = [],
	orderId,
	reservationId,
	tableId,
	onSuccess,
	onBack,
}) {
	const [loading, setLoading] = useState(false);
	const [selectedItems, setSelectedItems] = useState(new Set());
	const [paidItems, setPaidItems] = useState(new Set());
	const [reservationStatus, setReservationStatus] = useState({
		canClose: false,
		reason: "",
		unpaidOrders: [],
		totalDue: 0,
		totalPaid: 0,
	});
	const { markAsPaid, isLoading } = useOrderStore();

	// 🔧 Fonction pour générer un ID unique pour chaque article
	const getItemId = (item) => {
		if (!item) return `unknown-${Date.now()}`;

		const id = item.productId || item._id || item.id;
		const name = item.name || "unnamed";
		const price = item.price || 0;
		const quantity = item.quantity || 1;

		return `${id}-${name}-${price}-${quantity}`;
	};

	// 🔧 Clé de stockage unique basée sur reservationId ou orderId
	const getStorageKey = () => {
		if (reservationId) return `paidItems_res_${reservationId}`;
		if (orderId) return `paidItems_order_${orderId}`;
		return null;
	};

	// 📂 Charger les articles payés depuis AsyncStorage
	useEffect(() => {
		const loadPaidItems = async () => {
			const storageKey = getStorageKey();
			if (!storageKey) return;

			try {
				const saved = await AsyncStorage.getItem(storageKey);
				if (saved) {
					const parsed = JSON.parse(saved);
					console.log(
						"📂 Chargement paidItems:",
						storageKey,
						parsed.length,
						"articles"
					);
					setPaidItems(new Set(parsed));
				}
			} catch (error) {
				console.error("❌ Erreur chargement paidItems:", error);
			}
		};

		loadPaidItems();
	}, [reservationId, orderId]);

	// 💾 Sauvegarder les articles payés dans AsyncStorage
	useEffect(() => {
		const savePaidItems = async () => {
			const storageKey = getStorageKey();
			if (!storageKey) return;

			try {
				const itemsArray = Array.from(paidItems);
				await AsyncStorage.setItem(storageKey, JSON.stringify(itemsArray));
			} catch (error) {
				console.error("❌ Erreur sauvegarde paidItems:", error);
			}
		};

		savePaidItems();
	}, [paidItems, reservationId, orderId]);

	// ✅ Initialiser la sélection avec les articles non payés
	useEffect(() => {
		if (allOrders && allOrders.length > 0) {
			const nonPaidItems = allOrders.filter(
				(item) => !paidItems.has(getItemId(item))
			);
			const nonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));
			setSelectedItems(nonPaidIds);
		}
	}, [allOrders, paidItems]);

	// 🔍 Vérifier si la réservation peut être fermée
	const checkReservationClosure = async () => {
		if (!allOrders || allOrders.length === 0) {
			setReservationStatus({
				canClose: false,
				reason: "❌ Aucune commande à analyser",
				unpaidOrders: [],
				totalDue: 0,
				totalPaid: 0,
			});
			return;
		}

		const unpaidOrders = allOrders.filter(
			(item) => !paidItems.has(getItemId(item))
		);

		const totalDue = unpaidOrders.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0
		);

		const paidOrdersList = allOrders.filter((item) =>
			paidItems.has(getItemId(item))
		);

		const totalPaid = paidOrdersList.reduce(
			(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
			0
		);

		const canClose = unpaidOrders.length === 0;
		const reason = canClose
			? "✅ Toutes les commandes sont payées"
			: `❌ ${unpaidOrders.length} article(s) à payer (${totalDue.toFixed(
					2
			  )}€ dû)`;

		setReservationStatus({
			canClose,
			reason,
			unpaidOrders,
			totalDue,
			totalPaid,
		});

		return { canClose, totalDue, totalPaid, unpaidOrders };
	};

	// 🔄 Mettre à jour le statut de la réservation
	useEffect(() => {
		if (allOrders?.length > 0) {
			checkReservationClosure();
		}
	}, [allOrders, paidItems]);

	// 🎯 Sélectionner/désélectionner un article
	const toggleItem = (item) => {
		const itemId = getItemId(item);
		const newSelected = new Set(selectedItems);
		if (newSelected.has(itemId)) {
			newSelected.delete(itemId);
		} else {
			newSelected.add(itemId);
		}
		setSelectedItems(newSelected);
	};

	// 🎯 Tout sélectionner/désélectionner
	const toggleAll = () => {
		const nonPaidItems =
			allOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
		if (nonPaidItems.length === 0) return;

		const allNonPaidIds = new Set(nonPaidItems.map((item) => getItemId(item)));

		if (selectedItems.size === allNonPaidIds.size) {
			setSelectedItems(new Set());
		} else {
			setSelectedItems(allNonPaidIds);
		}
	};

	// 🚀 Fermer la réservation sur le serveur
	const closeReservationOnServer = async () => {
		if (!reservationId) {
			return { success: false, message: "Aucun ID de réservation" };
		}

		try {
			// ⭐ ENLEVEZ LE TOKEN - la nouvelle route n'en a pas besoin
			console.log("🔍 Tentative fermeture réservation:", reservationId);

			// ⭐ CORRECTION : Body vide ou objet vide
			const response = await fetch(
				`http://192.168.1.185:3000/reservations/client/${reservationId}/close`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({}), // ⭐ Body VIDE
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Erreur fermeture réservation:", errorText);
				return {
					success: false,
					message: `Erreur serveur: ${response.status}`,
				};
			}

			const data = await response.json();
			console.log("✅ Réservation fermée:", data);

			// ⭐ LA TABLE SERA LIBÉRÉE AUTOMATIQUEMENT PAR LA ROUTE BACKEND
			// Pas besoin d'appeler releaseTable séparément

			return {
				success: true,
				message: "✅ Réservation fermée avec succès",
				data,
			};
		} catch (error) {
			console.error("🚨 Erreur réseau:", error);
			return { success: false, message: `Erreur réseau: ${error.message}` };
		}
	};

	// 💳 Traitement du paiement
	const handlePay = async () => {
		if (!orderId) {
			Alert.alert("Erreur", "Aucune commande à payer");
			return;
		}

		if (selectedItems.size === 0) {
			Alert.alert(
				"Erreur",
				"Veuillez sélectionner au moins un article à payer"
			);
			return;
		}

		setLoading(true);

		try {
			// 1. Filtrer les articles sélectionnés
			const selectedOrders = allOrders.filter((item) =>
				selectedItems.has(getItemId(item))
			);

			// 2. Calculer le montant payé
			const amountPaid = selectedOrders.reduce(
				(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
				0
			);

			// 3. Ajouter les articles aux paidItems
			const newPaidItems = new Set(paidItems);
			selectedOrders.forEach((item) => {
				newPaidItems.add(getItemId(item));
			});
			setPaidItems(newPaidItems);

			// 4. Vérifier si paiement complet
			const remainingItems = allOrders.filter(
				(item) => !newPaidItems.has(getItemId(item))
			);
			const isFullPayment = remainingItems.length === 0;

			// 5. Si paiement complet
			if (isFullPayment) {
				// Marquer la commande comme payée
				await markAsPaid(orderId);

				// Fermer la réservation sur le serveur
				if (reservationId) {
					const closureResult = await closeReservationOnServer();
					if (!closureResult.success) {
						console.log("⚠️ Réservation non fermée:", closureResult.message);
					}
				}

				// Nettoyer le stockage
				const storageKey = getStorageKey();
				if (storageKey) {
					await AsyncStorage.removeItem(storageKey);
				}
			}

			// 6. Mettre à jour les stats
			const updatedStatus = await checkReservationClosure();

			// 7. Calculer le reste à payer
			const remainingAmount = remainingItems.reduce(
				(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
				0
			);

			// 8. Afficher l'alerte de confirmation
			const message =
				`${selectedOrders.length} article(s) payé(s).\n\n` +
				`💳 Montant payé: ${amountPaid.toFixed(2)}€\n` +
				`💰 Total payé: ${updatedStatus?.totalPaid?.toFixed(2) || 0}€\n` +
				(remainingAmount > 0
					? `📋 Reste à payer: ${remainingAmount.toFixed(2)}€ (${
							remainingItems.length
					  } article${remainingItems.length > 1 ? "s" : ""})`
					: "✅ Tous les articles sont payés !");

			Alert.alert(
				isFullPayment ? "✅ Paiement complet" : "⚠️ Paiement partiel",
				message,
				[
					{
						text: "OK",
						onPress: () => {
							// Désélectionner tout
							setSelectedItems(new Set());

							// Si paiement complet, retour au menu
							if (isFullPayment) {
								onSuccess();
							}
						},
					},
				]
			);
		} catch (error) {
			console.error("❌ Erreur paiement:", error);
			Alert.alert("Erreur", "Échec du paiement. Veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	// 🚨 Si pas d'orderId
	if (!orderId) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Erreur</Text>
				<Text style={styles.errorText}>
					❌ Aucune commande à payer{"\n"}
					Retournez au menu et validez une commande d'abord.
				</Text>
				<TouchableOpacity style={styles.backButton} onPress={onBack}>
					<Text style={styles.buttonText}>Retour au Menu</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// 📊 Calculs pour l'affichage
	const isProcessing = loading || isLoading;
	const availableItems =
		allOrders?.filter((item) => !paidItems.has(getItemId(item))) || [];
	const allSelected =
		selectedItems.size === availableItems.length && availableItems.length > 0;
	const selectedOrders = availableItems.filter((item) =>
		selectedItems.has(getItemId(item))
	);
	const total = selectedOrders.reduce(
		(sum, item) => sum + (item?.price || 0) * (item?.quantity || 1),
		0
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Paiement</Text>

			{/* Informations de réservation */}
			<View style={styles.infoContainer}>
				<Text style={styles.orderId}>
					Commande: {orderId.substring(0, 12)}...
				</Text>
				{reservationId && (
					<>
						<Text style={styles.reservationId}>
							Réservation: {reservationId.substring(0, 12)}...
						</Text>
						<View
							style={[
								styles.statusBadge,
								reservationStatus.canClose
									? styles.statusSuccess
									: styles.statusWarning,
							]}
						>
							<Text style={styles.statusText}>
								{reservationStatus.reason || "Vérification en cours..."}
							</Text>
						</View>
						<View style={styles.statsRow}>
							<View style={styles.statItem}>
								<Text style={styles.statLabel}>À payer</Text>
								<Text style={[styles.statValue, styles.statDue]}>
									{reservationStatus.totalDue.toFixed(2)}€
								</Text>
							</View>
							<View style={styles.statItem}>
								<Text style={styles.statLabel}>Payé</Text>
								<Text style={styles.statValue}>
									{reservationStatus.totalPaid.toFixed(2)}€
								</Text>
							</View>
							<View style={styles.statItem}>
								<Text style={styles.statLabel}>Articles</Text>
								<Text style={styles.statValue}>
									{availableItems.length} / {allOrders?.length || 0}
								</Text>
							</View>
						</View>
					</>
				)}
			</View>

			<View style={styles.orderDetails}>
				<View style={styles.headerRow}>
					<Text style={styles.detailTitle}>
						Articles à payer ({availableItems.length}):
					</Text>
					{availableItems.length > 0 && (
						<TouchableOpacity
							onPress={toggleAll}
							style={styles.selectAllButton}
						>
							<Text style={styles.selectAllText}>
								{allSelected ? "Tout désélectionner" : "Tout sélectionner"}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				{availableItems.length === 0 ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>
							✅ Tous les articles sont payés !
						</Text>
						<Text style={styles.emptySubtext}>
							Vous pouvez retourner au menu.
						</Text>
						<TouchableOpacity
							style={styles.returnButton}
							onPress={() => {
								const storageKey = getStorageKey();
								if (storageKey) {
									AsyncStorage.removeItem(storageKey);
								}
								onSuccess();
							}}
						>
							<Text style={styles.returnButtonText}>Retour au menu</Text>
						</TouchableOpacity>
					</View>
				) : (
					<ScrollView style={styles.itemsList}>
						{availableItems.map((item) => {
							const itemId = getItemId(item);
							const isSelected = selectedItems.has(itemId);
							return (
								<TouchableOpacity
									key={itemId}
									style={[
										styles.orderItem,
										isSelected && styles.orderItemSelected,
									]}
									onPress={() => toggleItem(item)}
								>
									<View style={styles.checkboxContainer}>
										<View
											style={[
												styles.checkbox,
												isSelected && styles.checkboxChecked,
											]}
										>
											{isSelected && (
												<MaterialIcons name="check" size={18} color="#fff" />
											)}
										</View>
									</View>
									<View style={styles.itemInfo}>
										<Text style={styles.itemName}>
											{item.name} x {item.quantity || 1}
										</Text>
										<Text style={styles.itemPrice}>
											{(item.price * (item.quantity || 1)).toFixed(2)}€
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>
				)}
			</View>

			{availableItems.length > 0 && (
				<View style={styles.totalContainer}>
					<Text style={styles.totalLabel}>
						Total sélectionné ({selectedOrders.length} article
						{selectedOrders.length > 1 ? "s" : ""}):
					</Text>
					<Text style={styles.total}> {total.toFixed(2)}€</Text>
				</View>
			)}

			{reservationId && (
				<View style={styles.reservationNote}>
					<Text style={styles.reservationNoteText}>
						ℹ️ Les articles payés sont sauvegardés. Vous pouvez quitter et
						revenir.
					</Text>
					<Text style={styles.reservationNoteDetail}>
						{paidItems.size > 0
							? `✅ ${paidItems.size} article(s) déjà payé(s)`
							: "Aucun article payé"}
					</Text>
				</View>
			)}

			<View style={styles.buttonsContainer}>
				{availableItems.length > 0 ? (
					<TouchableOpacity
						style={[
							styles.payButton,
							(isProcessing || selectedItems.size === 0) &&
								styles.payButtonDisabled,
						]}
						onPress={handlePay}
						disabled={isProcessing || selectedItems.size === 0}
					>
						{isProcessing ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>
								Payer {selectedOrders.length} article
								{selectedOrders.length > 1 ? "s" : ""}
								{reservationStatus.canClose ? " et fermer" : ""}
							</Text>
						)}
					</TouchableOpacity>
				) : null}

				<TouchableOpacity
					style={styles.backButton}
					onPress={onBack}
					disabled={isProcessing}
				>
					<Text style={styles.buttonText}>Retour</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#f8f9fa",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	infoContainer: {
		marginBottom: 15,
		backgroundColor: "#f5f5f5",
		padding: 15,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	orderId: {
		fontSize: 14,
		color: "#666",
		fontFamily: "monospace",
		marginBottom: 5,
	},
	reservationId: {
		fontSize: 14,
		color: "#666",
		fontFamily: "monospace",
		marginBottom: 10,
	},
	statusBadge: {
		padding: 8,
		borderRadius: 6,
		marginBottom: 10,
	},
	statusSuccess: {
		backgroundColor: "#E8F5E9",
		borderLeftWidth: 4,
		borderLeftColor: "#4CAF50",
	},
	statusWarning: {
		backgroundColor: "#FFF3E0",
		borderLeftWidth: 4,
		borderLeftColor: "#FF9800",
	},
	statusText: {
		fontSize: 12,
		fontWeight: "500",
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 10,
	},
	statItem: {
		alignItems: "center",
	},
	statLabel: {
		fontSize: 11,
		color: "#666",
		marginBottom: 2,
	},
	statValue: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#333",
	},
	statDue: {
		color: "#F44336",
	},
	errorText: {
		color: "red",
		margin: 20,
		textAlign: "center",
		lineHeight: 22,
	},
	orderDetails: {
		width: "100%",
		marginBottom: 15,
		padding: 15,
		backgroundColor: "#fff",
		borderRadius: 12,
		maxHeight: 400,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	detailTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	selectAllButton: {
		padding: 5,
	},
	selectAllText: {
		fontSize: 14,
		color: "#2196F3",
		fontWeight: "600",
	},
	itemsList: {
		maxHeight: 300,
	},
	orderItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		borderRadius: 8,
		marginBottom: 5,
	},
	orderItemSelected: {
		backgroundColor: "#E8F5E9",
	},
	checkboxContainer: {
		marginRight: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: "#4CAF50",
		borderRadius: 4,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	checkboxChecked: {
		backgroundColor: "#4CAF50",
		borderColor: "#4CAF50",
	},
	itemInfo: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	itemName: {
		fontSize: 16,
		color: "#555",
		flex: 1,
	},
	itemPrice: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginLeft: 10,
	},
	emptyState: {
		alignItems: "center",
		padding: 30,
	},
	emptyText: {
		color: "#4CAF50",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	emptySubtext: {
		color: "#666",
		fontSize: 14,
		textAlign: "center",
		marginBottom: 20,
	},
	returnButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	returnButtonText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 16,
	},
	totalContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
		paddingVertical: 15,
		backgroundColor: "#fff",
		borderRadius: 12,
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
	},
	total: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#4CAF50",
		marginLeft: 10,
	},
	reservationNote: {
		backgroundColor: "#E3F2FD",
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		borderLeftWidth: 4,
		borderLeftColor: "#2196F3",
	},
	reservationNoteText: {
		fontSize: 12,
		color: "#1565C0",
		marginBottom: 4,
	},
	reservationNoteDetail: {
		fontSize: 11,
		color: "#0D47A1",
		fontWeight: "500",
	},
	buttonsContainer: {
		width: "100%",
		gap: 15,
	},
	payButton: {
		backgroundColor: "#4CAF50",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	payButtonDisabled: {
		backgroundColor: "#81C784",
		opacity: 0.6,
	},
	backButton: {
		backgroundColor: "#757575",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
});
