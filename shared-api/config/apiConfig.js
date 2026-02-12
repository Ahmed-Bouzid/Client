// Configuration API
// Utilise la variable d'environnement EXPO_PUBLIC_API_BASE_URL depuis .env
// Si non définie, fallback sur l'IP locale pour développement

import { Resto_id_key } from "../../client-public/src/config/restaurantConfig.js";

export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.185:3000",
	RESTAURANT_ID: Resto_id_key,
	// TableId par défaut pour le développement (peut être surchargé)
	// En production, le tableId devrait venir d'un QR code scanné
	DEFAULT_TABLE_ID: "69833a4ee8aa1df146b5931f", // "686af692bb4cba684ff3b757" pour le développement
};
