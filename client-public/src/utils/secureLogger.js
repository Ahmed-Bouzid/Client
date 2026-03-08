/**
 * 🔒 Logger sécurisé pour React Native / Expo
 *
 * Évite l'exposition d'informations sensibles dans les logs du navigateur :
 * - Tokens, mots de passe, clés API
 * - IDs utilisateur complets
 * - Erreurs avec stack traces complètes
 * - Données sensibles utilisateur
 *
 * Usage:
 * import logger from './utils/secureLogger';
 *
 * logger.info("Message sécurisé", { data: someData });
 * logger.error("Erreur safe", error);
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";

// ✅ Mots-clés à censurer (insensible à la casse)
const SENSITIVE_KEYWORDS = [
	"password",
	"token",
	"secret",
	"key",
	"auth",
	"jwt",
	"stripe",
	"api_key",
	"private",
	"credential",
	"session",
];

/**
 * 🔒 Censure les données sensibles
 */
const sanitizeData = (data) => {
	if (!data) return data;

	// Si c'est une string, censurer les mots-clés
	if (typeof data === "string") {
		let sanitized = data;
		SENSITIVE_KEYWORDS.forEach((keyword) => {
			const regex = new RegExp(`(${keyword}[^\\s]*[=:])([^\\s&,}]+)`, "gi");
			sanitized = sanitized.replace(regex, "$1***CENSURED***");
		});
		return sanitized;
	}

	// Si c'est un objet, nettoyer récursivement
	if (typeof data === "object" && data !== null) {
		const sanitized = {};
		for (const [key, value] of Object.entries(data)) {
			// Censurer les clés sensibles
			if (
				SENSITIVE_KEYWORDS.some((keyword) =>
					key.toLowerCase().includes(keyword.toLowerCase()),
				)
			) {
				sanitized[key] = "***CENSURED***";
			} else {
				sanitized[key] = sanitizeData(value);
			}
		}
		return sanitized;
	}

	return data;
};

/**
 * 🔒 Logger sécurisé React Native
 */
const secureLogger = {
	info: (message, data = null) => {
		if (isDevelopment) {
		}
		// En prod : pas de logs (pour performance et sécurité)
	},

	error: (message, error = null) => {
		if (isDevelopment) {
			// ✅ En dev : Erreur complète pour debug
			console.error(`[ERROR] ${message}`, error);
		} else {
			// ✅ En prod : Message générique uniquement
			console.error(`[ERROR] ${message}`);
		}
	},

	warn: (message, data = null) => {
		if (isDevelopment) {
			console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : "");
		}
		// En prod : warnings silencieux
	},

	debug: (message, data = null) => {
		if (isDevelopment) {
			// ✅ Debug uniquement en développement
		}
	},

	// ✅ Logger spécial pour les événements de sécurité
	security: (event, details = {}) => {
		// ✅ Events de sécurité toujours loggés (mais données sanitized)
		const secureDetails = sanitizeData(details);
		console.warn(`[🚨 SECURITY] ${event}`, secureDetails);
	},
};

export default secureLogger;
