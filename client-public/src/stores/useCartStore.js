import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useCartStore = create((set, get) => ({
	cart: {},
	userName: null,

	/**
	 * Initialise le panier depuis AsyncStorage
	 * Pour une nouvelle session, le panier devrait être vide
	 * Le panier n'est restauré que si l'utilisateur revient dans la même session
	 */
	initCart: async (userName, clearPrevious = false) => {
		try {
			if (clearPrevious) {
				// Nettoyer le panier précédent pour une nouvelle connexion
				await AsyncStorage.removeItem(`cart_${userName}`);
				set({ cart: {}, userName });
			} else {
				// Restaurer le panier seulement si on continue la même session
				const saved = await AsyncStorage.getItem(`cart_${userName}`);
				if (saved) {
					set({ cart: JSON.parse(saved), userName });
				} else {
					set({ cart: {}, userName });
				}
			}
		} catch (error) {
			console.error("❌ Erreur chargement panier:", error);
			set({ cart: {}, userName });
		}
	},

	/**
	 * Ajoute un article au panier
	 */
	addItem: async (itemId, quantity = 1) => {
		const state = get();
		const newCart = {
			...state.cart,
			[itemId]: (state.cart[itemId] || 0) + quantity,
		};
		set({ cart: newCart });
		await state.saveCart();
	},

	/**
	 * Retire un article du panier
	 */
	removeItem: async (itemId, quantity = 1) => {
		const state = get();
		const newCart = { ...state.cart };
		if (newCart[itemId]) {
			newCart[itemId] = Math.max(0, newCart[itemId] - quantity);
			if (newCart[itemId] === 0) {
				delete newCart[itemId];
			}
		}
		set({ cart: newCart });
		await state.saveCart();
	},

	/**
	 * Met à jour la quantité d'un article
	 */
	updateQuantity: async (itemId, quantity) => {
		const state = get();
		const newCart = { ...state.cart };
		if (quantity <= 0) {
			delete newCart[itemId];
		} else {
			newCart[itemId] = quantity;
		}
		set({ cart: newCart });
		await state.saveCart();
	},

	/**
	 * Vide le panier
	 */
	clearCart: async () => {
		set({ cart: {} });
		const state = get();
		await state.saveCart();
	},

	/**
	 * Sauvegarde le panier dans AsyncStorage
	 */
	saveCart: async () => {
		const state = get();
		if (!state.userName) return;
		try {
			await AsyncStorage.setItem(`cart_${state.userName}`, JSON.stringify(state.cart));
		} catch (error) {
			console.error("❌ Erreur sauvegarde panier:", error);
		}
	},

	/**
	 * Obtient le nombre total d'articles dans le panier
	 */
	getTotalItems: () => {
		const state = get();
		return Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
	},

	/**
	 * Obtient le total du panier basé sur les produits
	 */
	getTotalPrice: (products) => {
		const state = get();
		return products.reduce((sum, product) => {
			const qty = state.cart[product._id] || 0;
			return sum + product.price * qty;
		}, 0);
	},
}));

