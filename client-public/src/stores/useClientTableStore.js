import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "shared-api/config/apiConfig.js";
import { errorHandler } from "shared-api/utils/errorHandler.js";

export const useClientTableStore = create((set, get) => ({
	tableId: null,
	restaurantId: API_CONFIG.RESTAURANT_ID, // Par défaut depuis la config
	userName: null,

	/**
	 * Initialise la table depuis AsyncStorage ou params
	 */
	init: async (tableId = null, restaurantId = null) => {
		try {
			// Essayer de récupérer depuis AsyncStorage
			const savedTableId = await AsyncStorage.getItem("tableId");
			const savedRestaurantId = await AsyncStorage.getItem("restaurantId");

			// Utiliser l'ordre de priorité : param > AsyncStorage > DEFAULT_TABLE_ID > null
			const finalTableId =
				tableId || savedTableId || API_CONFIG.DEFAULT_TABLE_ID;
			const finalRestaurantId =
				restaurantId || savedRestaurantId || API_CONFIG.RESTAURANT_ID;

			set({
				tableId: finalTableId,
				restaurantId: finalRestaurantId,
			});
		} catch (error) {
			console.error("❌ Erreur chargement table:", error);
		}
	},

	/**
	 * Définit la table active
	 */
	setTable: async (tableId, restaurantId = null) => {
		try {
			await AsyncStorage.setItem("tableId", tableId);
			if (restaurantId) {
				await AsyncStorage.setItem("restaurantId", restaurantId);
			}
			set({
				tableId,
				restaurantId: restaurantId || get().restaurantId,
			});
		} catch (error) {
			console.error("❌ Erreur sauvegarde table:", error);
		}
	},

	/**
	 * Définit le nom d'utilisateur
	 */
	setUserName: (userName) => {
		set({ userName });
	},

	/**
	 * Rejoint une table (génère le token client)
	 */
	joinTable: async (userName, tableId = null, restaurantId = null) => {
		try {
			const state = get();
			const finalTableId = tableId || state.tableId;
			// Toujours utiliser restaurantId depuis le store ou API_CONFIG
			const finalRestaurantId =
				restaurantId || state.restaurantId || API_CONFIG.RESTAURANT_ID;

			if (!finalTableId) {
				throw new Error(
					"TableId manquant. Veuillez scanner le QR code de la table.",
				);
			}

			if (!finalRestaurantId) {
				throw new Error("RestaurantId manquant. Vérifiez la configuration.");
			}

			const response = await fetch(`${API_CONFIG.BASE_URL}/client/token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pseudo: userName,
					tableId: finalTableId,
					restaurantId: finalRestaurantId,
				}),
			});

			if (!response.ok) {
				let errorMessage = "Erreur serveur";
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch (e) {
					// Si ce n'est pas du JSON, utiliser le message par défaut
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();

			// Stocker le token
			await AsyncStorage.setItem("clientToken", data.token);

			// Mettre à jour le store
			await get().setTable(finalTableId, finalRestaurantId);
			set({ userName });

			return data.token;
		} catch (error) {
			errorHandler.handleError(error);
			throw error;
		}
	},

	/**
	 * Réinitialise la table
	 */
	reset: async () => {
		try {
			await AsyncStorage.removeItem("tableId");
			await AsyncStorage.removeItem("restaurantId");
			set({
				tableId: null,
				userName: null,
			});
		} catch (error) {
			console.error("❌ Erreur reset table:", error);
		}
	},
}));
