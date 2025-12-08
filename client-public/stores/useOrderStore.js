import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderService } from "../../shared-api/services/orderService.js";
import { errorHandler } from "../../shared-api/utils/errorHandler.js";

export const useOrderStore = create((set, get) => ({
	currentOrder: [], // Commande en cours de construction
	allOrders: [], // Toutes les commandes (y compris envoyées)
	activeOrderId: null, // ID de la commande active côté serveur
	hasActiveOrder: false,
	isLoading: false,

	/**
	 * Initialise le store depuis AsyncStorage
	 * Ne fait PAS d'appel API pour éviter trop de requêtes
	 */
	init: async () => {
		try {
			const savedId = await AsyncStorage.getItem("activeOrderId");
			if (savedId) {
				// Restaurer l'ID sans vérifier avec le serveur (évite trop de requêtes)
				set({ activeOrderId: savedId, hasActiveOrder: true });
				console.log("📦 OrderId restauré:", savedId);
			} else {
				// Pas de commande sauvegardée
				set({ activeOrderId: null, hasActiveOrder: false });
			}
		} catch (error) {
			console.error("❌ Erreur chargement orderId:", error);
			set({ activeOrderId: null, hasActiveOrder: false });
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
				newOrder = [...state.currentOrder, { ...item, quantity: 1, user: userName }];
			}
			return { currentOrder: newOrder };
		});
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
	submitOrder: async ({ tableId, restaurantId }) => {
		const state = get();
		if (state.currentOrder.length === 0) {
			throw new Error("Panier vide");
		}

		set({ isLoading: true });

		try {
			const items = state.currentOrder.map((i) => ({
				productId: i._id,
				name: i.name,
				quantity: i.quantity,
				price: i.price,
			}));

			const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

			const data = await orderService.createOrder({
				tableId,
				items,
				total,
				restaurantId,
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

			set({
				activeOrderId: newOrderId,
				hasActiveOrder: true,
				allOrders: [...state.allOrders, ...sentItems],
				currentOrder: [],
				isLoading: false,
			});

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

			// Nettoyer le state
			await AsyncStorage.removeItem("activeOrderId");
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
	},
}));

