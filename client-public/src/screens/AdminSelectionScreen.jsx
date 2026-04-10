import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Platform,
	Modal,
	Share,
	Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

export default function AdminSelectionScreen({ onConnect, onTableSelected, adminToken }) {
	const [restaurants, setRestaurants] = useState([]);
	const [selectedRestaurant, setSelectedRestaurant] = useState(null);
	const [tables, setTables] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingTables, setLoadingTables] = useState(false);
	
	// 🔐 QR Code modal
	const [showQRModal, setShowQRModal] = useState(false);
	const [selectedTable, setSelectedTable] = useState(null);
	const [qrUrl, setQrUrl] = useState("");
	
	// 🔐 Table modal (pour React Native sans redirection)
	const [showTableModal, setShowTableModal] = useState(false);
	const [selectedTableForModal, setSelectedTableForModal] = useState(null);

	useEffect(() => {
		console.log("🏪 [AdminSelection] Montage du composant");
		fetchRestaurants();
	}, []);

	const fetchRestaurants = async () => {
		console.log("🏪 [AdminSelection] Chargement restaurants...");
		if (!adminToken) {
			setLoading(false);
			Alert.alert("Session expirée", "Veuillez ressaisir le mot de passe admin");
			return;
		}

		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/admin-auth/restaurants`, {
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				console.log("✅ [AdminSelection] Restaurants chargés:", data);
				setRestaurants(data);
			} else {
				if (response.status === 401 || response.status === 403) {
					Alert.alert("Session expirée", "Veuillez ressaisir le mot de passe admin");
					return;
				}

				console.warn("❌ [AdminSelection] Erreur chargement restaurants");
				Alert.alert("Erreur", "Impossible de charger les restaurants");
			}
		} catch (error) {
			console.error("❌ [AdminSelection] Erreur réseau restaurants:", error);
			Alert.alert("Erreur", "Erreur réseau");
		} finally {
			setLoading(false);
		}
	};

	const handleSelectRestaurant = async (restaurantId) => {
		console.log("🏪 [AdminSelection] Restaurant sélectionné:", restaurantId);
		setSelectedRestaurant(restaurantId);
		setTables([]);

		try {
				if (!adminToken) {
					Alert.alert("Session expirée", "Veuillez ressaisir le mot de passe admin");
					return;
				}

			setLoadingTables(true);
			const response = await fetch(
					`${API_BASE_URL}/admin-auth/restaurants/${restaurantId}/tables`,
					{
						headers: {
							Authorization: `Bearer ${adminToken}`,
						},
					},
			);
			if (response.ok) {
				const data = await response.json();
				console.log("✅ [AdminSelection] Tables chargées:", data);
				setTables(data);
			} else {
					if (response.status === 401 || response.status === 403) {
						Alert.alert("Session expirée", "Veuillez ressaisir le mot de passe admin");
						return;
					}

				console.warn("❌ [AdminSelection] Erreur chargement tables");
				Alert.alert("Erreur", "Impossible de charger les tables");
			}
		} catch (error) {
			console.error("❌ [AdminSelection] Erreur réseau tables:", error);
			Alert.alert("Erreur", "Erreur réseau");
		} finally {
			setLoadingTables(false);
		}
	};

	const handleSelectTable = (tableId) => {
		if (selectedRestaurant && tableId) {
			// Rediriger vers l'URL avec les IDs
			if (Platform.OS === "web") {
				window.location.href = `/r/${selectedRestaurant}/${tableId}`;
			} else {
				// Sur React Native, afficher une modal avec 2 boutons
				setSelectedTableForModal(tableId);
				setShowTableModal(true);
			}
		}
	};

	// 🔐 Générer QR code
	const handleGenerateQR = (tableId) => {
		if (selectedRestaurant && tableId) {
			const baseUrl = Platform.OS === "web" ? window.location.origin : "https://client-rho-two-46.vercel.app";
			const url = `${baseUrl}/r/${selectedRestaurant}/${tableId}`;
			setQrUrl(url);
			setSelectedTable(tableId);
			setShowQRModal(true);
		}
	};

	// 🔐 Télécharger QR code
	const handleDownloadQR = async () => {
		try {
			const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrUrl)}`;
			
			if (Platform.OS === "web") {
				const response = await fetch(qrImageUrl);
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `table-${selectedTable}-qr.png`;
				link.click();
				window.URL.revokeObjectURL(url);
				Alert.alert("Succès", "QR code téléchargé!");
			} else {
				// Sur mobile, utiliser Share
				await Share.share({
					url: qrImageUrl,
					title: `QR Code Table ${selectedTable}`,
					message: `QR code pour la table ${selectedTable}`,
				});
			}
		} catch (error) {
			console.error("Erreur téléchargement:", error);
			Alert.alert("Erreur", "Impossible de télécharger le QR code");
		}
	};

	// 🔐 Partager QR code
	const handleShareQR = async () => {
		try {
			const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrUrl)}`;
			
			if (Platform.OS === "web") {
				// Sur web, utiliser l'API Share si disponible
				if (navigator.share) {
					await navigator.share({
						title: `QR Code Table ${selectedTable}`,
						text: `Accédez à la table avec ce lien: ${qrUrl}`,
						url: qrUrl,
					});
				} else {
					// Fallback: copier le lien
					handleCopyLink();
				}
			} else {
				// Sur mobile
				await Share.share({
					url: qrImageUrl,
					title: `QR Code Table ${selectedTable}`,
					message: `Lien direct: ${qrUrl}`,
				});
			}
		} catch (error) {
			console.error("Erreur partage:", error);
		}
	};

	// 🔐 Copier lien
	const handleCopyLink = () => {
		if (Platform.OS === "web") {
			navigator.clipboard.writeText(qrUrl);
			Alert.alert("Succès", "Lien copié dans le presse-papiers!");
		} else {
			Share.share({
				message: qrUrl,
				title: "Lien Table",
			});
		}
	};

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size="large" color="#333" />
				<Text style={styles.loadingText}>Chargement...</Text>
			</View>
		);
	}

	return (
		<>
			<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<View style={styles.header}>
				<Ionicons name="restaurant" size={48} color="#333" />
				<Text style={styles.title}>Sélectionner le Restaurant</Text>
				<Text style={styles.subtitle}>et la Table</Text>
			</View>

			{/* Section Restaurants */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Restaurants</Text>
				<View style={styles.itemsContainer}>
					{restaurants.length === 0 ? (
						<Text style={styles.noDataText}>Aucun restaurant disponible</Text>
					) : (
						restaurants.map((restaurant) => (
							<TouchableOpacity
								key={restaurant._id}
								style={[
									styles.item,
									selectedRestaurant === restaurant._id && styles.itemSelected,
								]}
								onPress={() => handleSelectRestaurant(restaurant._id)}
							>
								<Ionicons
									name="storefront"
									size={20}
									color={selectedRestaurant === restaurant._id ? "white" : "#333"}
									style={styles.itemIcon}
								/>
								<Text
									style={[
										styles.itemText,
										selectedRestaurant === restaurant._id && styles.itemTextSelected,
									]}
								>
									{restaurant.name}
								</Text>
								{selectedRestaurant === restaurant._id && (
									<Ionicons name="checkmark-circle" size={20} color="white" />
								)}
							</TouchableOpacity>
						))
					)}
				</View>
			</View>

			{/* Section Tables (visible si restaurant sélectionné) */}
			{selectedRestaurant && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Tables</Text>
					{loadingTables ? (
						<View style={styles.centerContainer}>
							<ActivityIndicator size="small" color="#333" />
							<Text style={styles.loadingText}>Chargement des tables...</Text>
						</View>
					) : (
						<View style={styles.itemsContainer}>
							{tables.length === 0 ? (
								<Text style={styles.noDataText}>Aucune table disponible</Text>
							) : (
								tables.map((table) => (
									<View key={table._id} style={styles.tableItem}>
										<TouchableOpacity
											style={styles.tableItemLeft}
											onPress={() => handleSelectTable(table._id)}
										>
											<Ionicons name="layers" size={20} color="#333" style={styles.itemIcon} />
											<Text style={styles.itemText}>Table {table.number}</Text>
											<Ionicons name="arrow-forward" size={16} color="#999" />
										</TouchableOpacity>
										<TouchableOpacity
											style={styles.qrButton}
											onPress={() => handleGenerateQR(table._id)}
										>
											<Ionicons name="qr-code" size={18} color="#fff" />
										</TouchableOpacity>
									</View>
								))
							)}
						</View>
					)}
				</View>
			)}
		</ScrollView>

		{/* 🔐 QR Code Modal */}
		<Modal
			visible={showQRModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowQRModal(false)}
		>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>QR Code - Table {selectedTable}</Text>
						<TouchableOpacity onPress={() => setShowQRModal(false)}>
							<Ionicons name="close-circle" size={28} color="#333" />
						</TouchableOpacity>
					</View>

					{/* QR Code Display */}
					<View style={styles.qrContainer}>
						<Image
							source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}` }}
							style={{ width: 250, height: 250 }}
						/>
					</View>

					{/* Action Buttons */}
					<View style={styles.buttonGroup}>
						{Platform.OS === "web" && (
							<TouchableOpacity style={styles.button} onPress={handleDownloadQR}>
								<Ionicons name="download" size={18} color="#fff" style={styles.buttonIcon} />
								<Text style={styles.buttonText}>Télécharger</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity style={styles.button} onPress={handleShareQR}>
							<Ionicons name="share-social" size={18} color="#fff" style={styles.buttonIcon} />
							<Text style={styles.buttonText}>Partager</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleCopyLink}>
							<Ionicons name="copy" size={18} color="#333" style={styles.buttonIcon} />
							<Text style={[styles.buttonText, styles.secondaryButtonText]}>Copier lien</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>

		{/* 🔐 Table Selection Modal (pour React Native) */}
		<Modal
			visible={showTableModal}
			transparent={true}
			animationType="slide"
			onRequestClose={() => setShowTableModal(false)}
		>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Accès à la Table</Text>
						<TouchableOpacity onPress={() => setShowTableModal(false)}>
							<Ionicons name="close-circle" size={28} color="#333" />
						</TouchableOpacity>
					</View>

					<Text style={styles.modalText}>
						Voulez-vous accéder à cette table?
					</Text>
					<Text style={styles.modalSubText}>
						Restaurant: {selectedRestaurant}
						{"\n"}Table: {selectedTableForModal}
					</Text>

					<View style={styles.buttonGroup}>
						<TouchableOpacity 
							style={[styles.button, styles.secondaryButton]} 
							onPress={() => setShowTableModal(false)}
						>
							<Text style={[styles.buttonText, styles.secondaryButtonText]}>OK</Text>
						</TouchableOpacity>
						<TouchableOpacity 
							style={styles.button} 
							onPress={async () => {
								try {
									console.log("🚪 [AdminSelection] Clic 'Ouvrir'");
									console.log("   - Restaurant ID:", selectedRestaurant);
									console.log("   - Table ID:", selectedTableForModal);
									
									// Sauvegarder les IDs en AsyncStorage
									await AsyncStorage.setItem("restaurantId", selectedRestaurant);
									await AsyncStorage.setItem("tableId", selectedTableForModal);
									
									console.log("✅ [AdminSelection] IDs sauvegardés en AsyncStorage");
									
									// Notifier App.jsx pour sortir du mode admin
									setShowTableModal(false);
									if (onTableSelected) {
										console.log("🔄 [AdminSelection] Appel onTableSelected callback");
										onTableSelected(selectedRestaurant, selectedTableForModal);
									}
								} catch (error) {
									console.error("❌ [AdminSelection] Erreur Ouvrir:", error);
									Alert.alert("Erreur", "Impossible de charger la table");
								}
							}}
						>
							<Ionicons name="open-outline" size={18} color="#fff" style={styles.buttonIcon} />
							<Text style={styles.buttonText}>Ouvrir</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		paddingBottom: 30,
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 200,
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
		fontSize: 14,
	},
	header: {
		alignItems: "center",
		paddingVertical: 30,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginTop: 10,
		color: "#333",
	},
	subtitle: {
		fontSize: 14,
		color: "#999",
		marginTop: 5,
	},
	section: {
		marginTop: 20,
		paddingHorizontal: 15,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 12,
	},
	itemsContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#eee",
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	itemSelected: {
		backgroundColor: "#333",
	},
	itemIcon: {
		marginRight: 12,
	},
	itemText: {
		flex: 1,
		fontSize: 16,
		color: "#333",
	},
	itemTextSelected: {
		color: "white",
		fontWeight: "bold",
	},
	noDataText: {
		paddingHorizontal: 15,
		paddingVertical: 20,
		textAlign: "center",
		color: "#999",
		fontSize: 14,
	},
	// 🔐 QR Table Item Styles
	tableItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	tableItemLeft: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	qrButton: {
		backgroundColor: "#333",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
		marginLeft: 10,
	},
	// 🔐 Modal Styles
	modalContainer: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "white",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 30,
		maxHeight: "80%",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	qrContainer: {
		alignItems: "center",
		marginVertical: 30,
		paddingVertical: 20,
		backgroundColor: "#f9f9f9",
		borderRadius: 10,
	},
	qrPlaceholder: {
		fontSize: 14,
		color: "#666",
		marginBottom: 10,
	},
	urlText: {
		fontSize: 12,
		color: "#0066cc",
		textDecorationLine: "underline",
	},
	buttonGroup: {
		flexDirection: "row",
		gap: 10,
		marginTop: 20,
	},
	button: {
		flex: 1,
		backgroundColor: "#333",
		paddingVertical: 12,
		borderRadius: 8,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	secondaryButton: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#333",
	},
	buttonIcon: {
		marginRight: 8,
	},
	buttonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "bold",
	},
	secondaryButtonText: {
		color: "#333",
	},
	modalText: {
		fontSize: 16,
		color: "#333",
		marginBottom: 15,
		textAlign: "center",
	},
	modalSubText: {
		fontSize: 14,
		color: "#666",
		marginBottom: 20,
		textAlign: "center",
		fontFamily: "monospace",
	},
});
