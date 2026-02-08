import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderService } from "shared-api/services/orderService.js";
import { errorHandler } from "shared-api/utils/errorHandler.js";

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
					o._id === item._id ? { ...o, quantity: o.quantity + 1 } : o,
				);
			} else {
				newOrder = [
					...state.currentOrder,
					{ ...item, quantity: 1, user: userName },
				];
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
					o._id === item._id ? { ...o, quantity } : o,
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
	 * Récupère toutes les commandes d'une réservation depuis l'API
	 */
	fetchOrdersByReservation: async (reservationId) => {
		if (!reservationId) {
			console.warn("⚠️ fetchOrdersByReservation: reservationId manquant");
			return [];
		}

		set({ isLoading: true });
		try {
			console.log(`🔍 Appel API /client-orders/${reservationId}...`);
			const data = await orderService.getOrdersByReservation(reservationId);
			const orders = data.orders || [];

			console.log(
				`✅ Commandes chargées pour reservation ${reservationId}:`,
				orders.length,
				"commandes",
			);
			console.log("📊 Détail des commandes:", JSON.stringify(orders, null, 2));

			// ⭐ APLATIR les items de toutes les commandes en un seul tableau
			// Payment.jsx s'attend à un tableau d'items, pas un tableau d'orders
			const allItems = [];
			orders.forEach((order, orderIndex) => {
				console.log(`📦 Commande ${orderIndex + 1}:`, {
					_id: order._id,
					items: order.items?.length || 0,
					paid: order.paid,
					totalAmount: order.totalAmount,
				});

				if (order.items && Array.isArray(order.items)) {
					order.items.forEach((item, itemIndex) => {
						const enrichedItem = {
							...item,
							orderId: order._id, // Garder l'ID de la commande parente
							orderStatus: order.orderStatus || order.status,
							orderPaid: order.paid,
							totalAmount: order.totalAmount,
						};
						console.log(`   Item ${itemIndex + 1}:`, {
							name: item.name,
							quantity: item.quantity,
							price: item.price,
							productId: item.productId,
						});
						allItems.push(enrichedItem);
					});
				} else {
					console.warn(`⚠️ Commande ${orderIndex + 1} n'a pas d'items`);
				}
			});

			console.log(`✅ Items extraits:`, allItems.length, "items au total");
			console.log(
				"📋 Liste des items:",
				allItems.map((i) => ({
					name: i.name,
					quantity: i.quantity,
					price: i.price,
					_id: i._id || i.productId,
				})),
			);

			// Mettre à jour allOrders avec les items aplatis
			set({
				allOrders: allItems,
				isLoading: false,
			});

			return allItems;
		} catch (error) {
			console.error("❌ Erreur fetchOrdersByReservation:", error);
			set({ allOrders: [], isLoading: false });
			errorHandler.handleError(error);
			return [];
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
