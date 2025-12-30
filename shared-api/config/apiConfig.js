// Configuration API
// Utilise la variable d'environnement Expo directement
export const API_CONFIG = {
	BASE_URL:
		process.env.EXPO_PUBLIC_API_BASE_URL ||
		"https://orderit-backend-6y1m.onrender.com",
	RESTAURANT_ID: "686af511bb4cba684ff3b72e",
	DEFAULT_TABLE_ID: null,
};
