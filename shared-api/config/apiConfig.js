// Configuration API
// TODO: Pour utiliser des variables d'environnement, installez expo-constants
// et configurez app.json avec "extra": { "API_BASE_URL": "..." }

// Pour l'instant, utilisez les valeurs par défaut ou modifiez directement ici
export const API_CONFIG = {
	BASE_URL: "https://orderit-backend-6y1m.onrender.com",
	RESTAURANT_ID: "686af511bb4cba684ff3b72e",
	// TableId par défaut pour le développement (peut être surchargé)
	// En production, le tableId devrait venir d'un QR code scanné
	DEFAULT_TABLE_ID: null, // "686af692bb4cba684ff3b757" pour le développement
};
