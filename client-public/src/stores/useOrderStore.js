import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderService } from "../../../shared-api/services/orderService.js";
import { errorHandler } from "../../../shared-api/utils/errorHandler.js";

export const useOrderStore = create((set, get) => ({
	currentOrder: [], // Commande en cours de construction
	allOrders: [], // Toutes les commandes (y compris envoyées)
	activeOrderId: null, // ID de la commande active côté serveur
	hasActiveOrder: false,
	isLoading: false,

	/**
	 * Initialise le store depuis AsyncStorage (activeOrderId + allOrders)
	 */
	init: async () => {
		try {
			const savedId = await AsyncStorage.getItem("activeOrderId");
			const savedOrders = await AsyncStorage.getItem("allOrders");
			let orders = [];
			if (savedOrders) {
				try {
					orders = JSON.parse(savedOrders);
				} catch (e) {
					orders = [];
				}
			}
			if (savedId) {
				set({
					activeOrderId: savedId,
					hasActiveOrder: true,
					allOrders: orders,
				});
				console.log("📦 OrderId restauré:", savedId);
			} else {
				set({ activeOrderId: null, hasActiveOrder: false, allOrders: orders });
			}
		} catch (error) {
			console.error("❌ Erreur chargement orderId/allOrders:", error);
			set({ activeOrderId: null, hasActiveOrder: false, allOrders: [] });
		}
	},

	/**
	 * Ajoute un article à la commande en cours
	 */
	addToOrder: (item, userName) => {
		set((state) => {
			const existing = state.currentOrder.find((o) => o._id === item._id);
			let newOrder;
			if (existing) {
				newOrder = state.currentOrder.map((o) =>
					o._id === item._id ? { ...o, quantity: o.quantity + 1 } : o
				);
			} else {
				newOrder = [
					...state.currentOrder,
					{ ...item, quantity: 1, user: userName },
				];
			}
			return { currentOrder: newOrder };
		});
		// Pas besoin de persister ici, allOrders n'est pas modifié
	},

	/**
	 * Met à jour la quantité d'un article dans la commande
	 */
	updateOrderQuantity: (item, quantity) => {
		if (quantity <= 0) {
			set((state) => ({
				currentOrder: state.currentOrder.filter((o) => o._id !== item._id),
			}));
		} else {
			set((state) => ({
				currentOrder: state.currentOrder.map((o) =>
					o._id === item._id ? { ...o, quantity } : o
				),
			}));
		}
	},

	/**
	 * Soumet la commande au serveur
	 */
	submitOrder: async (orderData) => {
		// ⭐ CHANGE : accepter orderData complet
		const { tableId, restaurantId, reservationId, clientId, clientName } =
			orderData;

		const state = get();

		// Vérifier qu'on a les données nécessaires
		if (!reservationId) {
			throw new Error("reservationId est requis");
		}

		// Utiliser items de orderData si fournis, sinon currentOrder
		const itemsToSend =
			orderData.items ||
			state.currentOrder.map((i) => ({
				productId: i._id,
				name: i.name,
				quantity: i.quantity,
				price: i.price,
			}));

		if (itemsToSend.length === 0) {
			throw new Error("Panier vide");
		}

		set({ isLoading: true });

		try {
			// Calculer le total si non fourni
			const totalToSend =
				orderData.total ||
				itemsToSend.reduce((sum, i) => sum + i.price * i.quantity, 0);

			const data = await orderService.createOrder({
				tableId,
				items: itemsToSend,
				total: totalToSend,
				restaurantId,
				reservationId, // ⭐ ENVOYÉ
				clientId, // ⭐ ENVOYÉ
				clientName, // ⭐ ENVOYÉ
				status: "in_progress",
				origin: "client",
			});

			// Sauvegarder l'ID de la commande
			const newOrderId = data._id;
			await AsyncStorage.setItem("activeOrderId", newOrderId);

			// Mettre à jour le state
			const sentItems = state.currentOrder.map((item) => ({
				...item,
				sent: true,
				orderId: newOrderId,
			}));

			const updatedOrders = [...state.allOrders, ...sentItems];
			set({
				activeOrderId: newOrderId,
				hasActiveOrder: true,
				allOrders: updatedOrders,
				currentOrder: [],
				isLoading: false,
			});
			// Persister allOrders
			await AsyncStorage.setItem("allOrders", JSON.stringify(updatedOrders));

			return data;
		} catch (error) {
			set({ isLoading: false });
			errorHandler.handleError(error);
			throw error;
		}
	},
	/**
	 * Récupère la commande active depuis le serveur
	 */
	fetchActiveOrder: async () => {
		set({ isLoading: true });
		try {
			const activeOrder = await orderService.getActiveOrder();
			if (activeOrder) {
				await AsyncStorage.setItem("activeOrderId", activeOrder._id);
				set({
					activeOrderId: activeOrder._id,
					hasActiveOrder: true,
					isLoading: false,
				});
				return activeOrder;
			} else {
				set({
					activeOrderId: null,
					hasActiveOrder: false,
					isLoading: false,
				});
				return null;
			}
		} catch (error) {
			set({ isLoading: false });
			errorHandler.handleError(error);
			return null;
		}
	},

	/**
	 * Marque la commande comme payée
	 */
	markAsPaid: async (orderId = null) => {
		const state = get();
		const finalOrderId = orderId || state.activeOrderId;

		if (!finalOrderId) {
			throw new Error("Aucune commande active à payer");
		}

		set({ isLoading: true });
		try {
			await orderService.markAsPaid(finalOrderId);

			// Nettoyer le state et effacer l'historique local
			await AsyncStorage.removeItem("activeOrderId");
			await AsyncStorage.removeItem("allOrders");
			set({
				activeOrderId: null,
				hasActiveOrder: false,
				allOrders: [],
				currentOrder: [],
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			errorHandler.handleError(error);
			throw error;
		}
	},

	/**
	 * Réinitialise la commande
	 */
	resetOrder: () => {
		set({
			currentOrder: [],
			allOrders: [],
			activeOrderId: null,
			hasActiveOrder: false,
		});
		AsyncStorage.removeItem("allOrders");
	},
}));
