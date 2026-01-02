// Utilisation d'une variable d'environnement pour l'URL de l'API
// Expo gère les variables via process.env.EXPO_PUBLIC_*

// ⚠️ Utilise une IP locale par défaut si la variable d'environnement n'est pas définie
export const API_BASE_URL =
	process.env.EXPO_PUBLIC_API_BASE_URL ||
	"https://orderit-backend-6y1m.onrender.com";
