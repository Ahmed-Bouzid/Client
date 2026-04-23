// shared-api/stores/useProductStore.js
import { create } from "zustand";
import { productService } from "../services/productService.js";

/**
 * 🎨 Configuration UI des catégories (emoji, gradient, etc.)
 * Mapping entre les catégories backend et leur représentation visuelle
 */
const CATEGORY_UI_CONFIG = {
	boisson: {
		id: "boisson",
		title: "Boissons",
		emoji: "🥤",
		gradient: ["#a955ff", "#ea51ff"],
		icon: "glass-cocktail",
	},
	dessert: {
		id: "dessert",
		title: "Desserts",
		emoji: "🍰",
		gradient: ["#ffa9c6", "#f434e2"],
		icon: "cake",
	},
	plat: {
		id: "plat",
		title: "Plats",
		emoji: "🍽️",
		gradient: ["#FF6B6B", "#FF8E53"],
		icon: "restaurant",
	},
	entree: {
		id: "entree",
		title: "Entrées",
		emoji: "🥗",
		gradient: ["#48BB78", "#38A169"],
		icon: "leaf",
	},
	burger: {
		id: "burger",
		title: "Burgers",
		emoji: "🍔",
		gradient: ["#F59E0B", "#D97706"],
		icon: "fast-food",
	},
	pizza: {
		id: "pizza",
		title: "Pizzas",
		emoji: "🍕",
		gradient: ["#EF4444", "#DC2626"],
		icon: "pizza",
	},
	sandwich: {
		id: "sandwich",
		title: "Sandwiches",
		emoji: "🥪",
		gradient: ["#FFD700", "#FF8C00"],
		icon: "sandwich",
	},
	salade: {
		id: "salade",
		title: "Salades",
		emoji: "🥗",
		gradient: ["#10B981", "#059669"],
		icon: "nutrition",
	},
	// Ajout pour gérer les catégories avec espaces ou caractères spéciaux
	"offres du moment": {
		id: "offres du moment",
		title: "Offres du moment",
		emoji: "🔥",
		gradient: ["#F59E0B", "#DC2626"],
		icon: "flame",
	},
	formules: {
		id: "formules",
		title: "Formules",
		emoji: "🎯",
		gradient: ["#8B5CF6", "#7C3AED"],
		icon: "pricetags",
	},
	// Fallback pour les catégories inconnues
	autre: {
		id: "autre",
		title: "Autres",
		emoji: "🍴",
		gradient: ["#667eea", "#764ba2"],
		icon: "fast-food-outline",
	},
};

const useProductStore = create((set, get) => ({
	products: [],

	fetchProducts: async (token, restaurantId) => {
		// ✅ Accepte token et restaurantId en paramètre
		try {
			const products = await productService.fetchProducts(token, restaurantId);
			set({ products });
			return products;
		} catch (err) {
			console.error("❌ [ProductStore] Error fetching products:", err);
			throw err;
		}
	},

	setProducts: (products) => set({ products }),

	/**
	 * 🎯 Extraire les catégories uniques depuis les produits
	 * Retourne un tableau d'objets avec configuration UI
	 */
	getCategories: () => {
		const { products } = get();

		if (!products || products.length === 0) {
			console.warn(
				"⚠️ [ProductStore] Aucun produit disponible pour extraire les catégories",
			);
			return [];
		}

		// Afficher un échantillon des produits avec leurs catégories
		const sample = products.slice(0, 3).map((p) => ({
			name: p.name,
			category: p.category,
			categoryType: typeof p.category,
		}));

		// Extraire les catégories uniques (valeurs brutes du backend)
		const rawCategories = products.map((p) => p.category).filter((cat) => cat); // Filtrer les undefined/null

		const uniqueCategories = [
			...new Set(
				rawCategories.map((cat) => cat.toLowerCase().trim()), // Normaliser
			),
		];

		// Mapper chaque catégorie backend vers sa config UI
		const categoriesWithUI = uniqueCategories
			.map((categoryKey) => {
				const uiConfig = CATEGORY_UI_CONFIG[categoryKey];

				if (uiConfig) {
					return {
						...uiConfig,
						id: categoryKey,
					};
				}

				// ✨ Fallback intelligent : créer une config dynamique

				// Capitaliser proprement le titre
				const dynamicTitle = categoryKey
					.split(/[\s–-]+/) // Split sur espaces, tirets, etc.
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");

				// Choisir un emoji et gradient en fonction du type de catégorie
				let emoji = "🍽️";
				let gradient = ["#667eea", "#764ba2"];
				let icon = "restaurant";

				// Détection intelligente par mots-clés (avec plus de variété)
				const lowerKey = categoryKey.toLowerCase();
				if (lowerKey.includes("salé")) {
					emoji = "🥪";
					gradient = ["#F59E0B", "#D97706"];
					icon = "fast-food";
				} else if (lowerKey.includes("sandwich")) {
					emoji = "🌯";
					gradient = ["#F97316", "#EA580C"];
					icon: "fast-food";
				} else if (lowerKey.includes("burger")) {
					emoji = "🍔";
					gradient = ["#EF4444", "#DC2626"];
					icon = "fast-food";
				} else if (lowerKey.includes("sucré")) {
					emoji = "🧁";
					gradient: ["#EC4899", "#DB2777"];
					icon = "cake";
				} else if (lowerKey.includes("dessert")) {
					emoji = "🍰";
					gradient = ["#ffa9c6", "#f434e2"];
					icon = "cake";
				} else if (lowerKey.includes("tiramisu")) {
					emoji = "🍮";
					gradient = ["#F59E0B", "#D97706"];
					icon = "cafe";
				} else if (lowerKey.includes("café") || lowerKey.includes("cafe")) {
					emoji = "☕";
					gradient = ["#92400E", "#78350F"];
					icon = "cafe";
				} else if (lowerKey.includes("thé") || lowerKey.includes("the")) {
					emoji = "🍵";
					gradient = ["#059669", "#047857"];
					icon = "leaf";
				} else if (lowerKey.includes("boisson")) {
					emoji = "🥤";
					gradient = ["#a955ff", "#ea51ff"];
					icon = "cafe";
				} else if (lowerKey.includes("jus")) {
					emoji = "🧃";
					gradient = ["#F59E0B", "#D97706"];
					icon = "nutrition";
				} else if (lowerKey.includes("eau") || lowerKey.includes("soft")) {
					emoji = "💧";
					gradient = ["#0EA5E9", "#0284C7"];
					icon = "water";
				} else if (
					lowerKey.includes("cocktail") ||
					lowerKey.includes("mocktail")
				) {
					emoji = "🍹";
					gradient = ["#10B981", "#059669"];
					icon = "wine";
				} else if (
					lowerKey.includes("milkshake") ||
					lowerKey.includes("shake")
				) {
					emoji = "🥤";
					gradient = ["#EC4899", "#DB2777"];
					icon: "ice-cream";
				} else if (lowerKey.includes("smoothie")) {
					emoji = "🍓";
					gradient = ["#F43F5E", "#E11D48"];
					icon: "nutrition";
				}

				return {
					id: categoryKey,
					title: dynamicTitle,
					emoji: emoji,
					gradient: gradient,
					icon: icon,
				};
			})
			.sort((a, b) => a.title.localeCompare(b.title)); // Tri alphabétique

		return categoriesWithUI;
	},

	/**
	 * 🔍 Obtenir la configuration UI d'une catégorie
	 */
	getCategoryConfig: (categoryKey) => {
		const normalizedKey = categoryKey?.toLowerCase().trim();
		return CATEGORY_UI_CONFIG[normalizedKey] || CATEGORY_UI_CONFIG.autre;
	},
}));

export default useProductStore;
