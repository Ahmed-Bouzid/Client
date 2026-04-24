/**
 * ═══════════════════════════════════════════════════════════════
 * useOrderStore.js — STORE CENTRAL : PANIER + COMMANDES
 * ═══════════════════════════════════════════════════════════════
 *
 * Gère tout le cycle de vie de la commande :
 *   - Panier local (currentOrder) persisté dans AsyncStorage
 *   - Ajout/suppression/modification d'articles
 *   - Soumission de commande au serveur (POST /orders)
 *   - Récupération des commandes par réservation (GET /orders/reservation/:id)
 *   - Marquage comme payé (PUT /orders/:id/mark-paid)
 *   - Annulation des commandes (PUT /orders/:id/cancel)
 *   - Cache offline (AsyncStorage fallback si réseau indisponible)
 *
 * Architecture :
 *   - currentOrder[] = panier en construction (pas encore en BDD)
 *   - allOrders[] = items aplatis de toutes les commandes serveur
 *   - activeOrderId = dernière commande créée (pour tracking)
 */
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
	_persistUserName: null, // Nom utilisateur pour persistence AsyncStorage

	/**
	 * Initialise le store depuis AsyncStorage
	 * Ne fait PAS d'appel API pour éviter trop de requêtes
	 */
	init: async () => {
		try {
			const savedId = await AsyncStorage.getItem("activeOrderId");
			if (savedId) {
				set({ activeOrderId: savedId, hasActiveOrder: true });
			} else {
				set({ activeOrderId: null, hasActiveOrder: false });
			}
		} catch (error) {
			console.error("❌ Erreur chargement orderId:", error);
			set({ activeOrderId: null, hasActiveOrder: false });
		}
	},

	// ═══════════════════════════════════════════════════════════════════
	// CART : Persistence & utilitaires (remplace useCartStore)
	// ═══════════════════════════════════════════════════════════════════

	/**
	 * Initialise le panier depuis AsyncStorage
	 */
	initCart: async (userName, clearPrevious = false) => {
		set({ _persistUserName: userName });
		if (clearPrevious) {
			await AsyncStorage.removeItem(`cart_${userName}`);
			set({ currentOrder: [] });
		} else {
			try {
				const saved = await AsyncStorage.getItem(`cart_${userName}`);
				if (saved) {
					set({ currentOrder: JSON.parse(saved) });
				}
			} catch (error) {
				console.error("❌ Erreur chargement panier:", error);
			}
		}
	},

	/**
	 * Sauvegarde le panier (currentOrder) dans AsyncStorage
	 */
	_persistCart: async () => {
		const state = get();
		if (!state._persistUserName) return;
		try {
			await AsyncStorage.setItem(
				`cart_${state._persistUserName}`,
				JSON.stringify(state.currentOrder),
			);
		} catch (error) {
			console.error("❌ Erreur sauvegarde panier:", error);
		}
	},

	/**
	 * Vide le panier (currentOrder) + AsyncStorage
	 */
	clearCart: async () => {
		const userName = get()._persistUserName;
		set({ currentOrder: [] });
		if (userName) {
			try {
				await AsyncStorage.removeItem(`cart_${userName}`);
			} catch (error) {
				console.error("❌ Erreur suppression panier:", error);
			}
		}
	},

	/**
	 * Nombre total d'articles dans le panier
	 */
	getTotalItems: () => {
		return get().currentOrder.reduce((sum, item) => sum + (item.quantity || 0), 0);
	},

	/**
	 * Total du panier en euros
	 */
	getTotalPrice: () => {
		return get().currentOrder.reduce(
			(sum, item) => sum + (item.price || 0) * (item.quantity || 0),
			0,
		);
	},

	// ═══════════════════════════════════════════════════════════════════
	// COMMANDE : Gestion des articles
	// ═══════════════════════════════════════════════════════════════════

	/**
	 * Ajoute un article à la commande en cours (+ persistence)
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
		get()._persistCart();
	},

	/**
	 * Met à jour la quantité d'un article dans la commande (+ persistence)
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
		get()._persistCart();
	},

	/**
	 * Soumet la commande au serveur
	 */
	submitOrder: async (orderData) => {
		// ⭐ CHANGE : accepter orderData complet
		const {
			tableId,
			restaurantId,
			reservationId,
			clientId,
			clientName,
			clientPhone,
		} = orderData;

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
				clientPhone, // 📱 ENVOYÉ
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

			// Nettoyer le panier persisté (currentOrder est maintenant vide)
			const userName = get()._persistUserName;
			if (userName) {
				await AsyncStorage.removeItem(`cart_${userName}`);
			}

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
	 * @param {string} reservationId - ID de la réservation
	 * @param {string} [clientId] - ID du client (pour foodtruck multi-user)
	 */
	fetchOrdersByReservation: async (reservationId, clientId = null) => {
		if (!reservationId) {
			console.warn("⚠️ fetchOrdersByReservation: reservationId manquant");
			return [];
		}

		set({ isLoading: true });
		try {
			const data = await orderService.getOrdersByReservation(
				reservationId,
				clientId,
			);

			const orders = data.orders || [];

			// Analyser chaque commande
			orders.forEach((order, idx) => {});

			// ⭐ APLATIR les items de toutes les commandes en un seul tableau
			// Payment.jsx s'attend à un tableau d'items, pas un tableau d'orders
			const allItems = [];
			orders.forEach((order, orderIndex) => {
				if (order.items && Array.isArray(order.items)) {
					order.items.forEach((item, itemIndex) => {
						const enrichedItem = {
							...item,
							orderId: order._id, // Garder l'ID de la commande parente
							clientId: order.clientId || null,
							clientName: order.clientName || null,
							orderStatus: order.orderStatus || order.status,
							orderPaid: order.paid,
							totalAmount: order.totalAmount,
						};
						allItems.push(enrichedItem);
					});
				} else {
					console.warn(`  ⚠️ AUCUN ITEM dans cette commande`);
				}
			});

			allItems.forEach((item, idx) => {});

			const totalGlobal = allItems.reduce(
				(sum, i) => sum + i.price * i.quantity,
				0,
			);

			// Mettre à jour allOrders avec les items aplatis + persister pour offline
			await AsyncStorage.setItem(
				`cachedOrders_${reservationId}`,
				JSON.stringify(allItems),
			);
			set({
				allOrders: allItems,
				isLoading: false,
			});

			return allItems;
		} catch (error) {
			// ── Offline fallback : servir les commandes depuis le cache ──────────
			const isNetworkError =
				error?.message?.includes("Network") ||
				error?.message?.includes("fetch") ||
				error?.message?.includes("network") ||
				error?.response === undefined;

			if (isNetworkError) {
				try {
					const cached = await AsyncStorage.getItem(`cachedOrders_${reservationId}`);
					if (cached) {
						const cachedItems = JSON.parse(cached);
						console.warn("[Offline] Affichage des commandes en cache");
						set({ allOrders: cachedItems, isLoading: false });
						return cachedItems;
					}
				} catch {
					// si le JSON est corrompu, ignorer
				}
			}

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

	/**
	 * Annule toutes les commandes en BDD pour cette session,
	 * puis reset le state local
	 */
	cancelAllOrders: async () => {
		const state = get();
		set({ isLoading: true });

		try {
			// Récupérer les orderIds uniques depuis allOrders (items aplatis)
			const orderIds = [
				...new Set(state.allOrders.map((item) => item.orderId).filter(Boolean)),
			];

			// Annuler chaque commande côté serveur
			await Promise.all(
				orderIds.map((id) =>
					orderService.cancelOrder(id).catch((err) => {
						console.warn(`⚠️ Erreur annulation commande ${id}:`, err.message);
					}),
				),
			);

			// Nettoyer le state local
			await AsyncStorage.removeItem("activeOrderId");
			const userName = state._persistUserName;
			if (userName) {
				await AsyncStorage.removeItem(`cart_${userName}`);
			}

			set({
				currentOrder: [],
				allOrders: [],
				activeOrderId: null,
				hasActiveOrder: false,
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			console.error("❌ Erreur cancelAllOrders:", error);
			throw error;
		}
	},
}));
