// Configuration API
// Utilise la variable d'environnement EXPO_PUBLIC_API_BASE_URL depuis .env

import { Resto_id_key } from "../../client-public/src/config/restaurantConfig.js";

export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "https://orderit-backend-6y1m.onrender.com",
	RESTAURANT_ID: Resto_id_key, // null en production, écrasé dynamiquement par le QR code
	// En production, le tableId DOIT venir du QR code scanné (jamais de fallback hardcodé)
	DEFAULT_TABLE_ID: null,
};

// IDs connus (référence dev uniquement) :
// tableid: 6960d0037aca682cfc81925a  →  grillz
