import { Alert } from "react-native";
import { clientAuthService } from "../services/clientAuthService.js";

/**
 * Gestion centralisée des erreurs
 */
export const errorHandler = {
	/**
	 * Affiche une erreur de manière cohérente
	 */
	handleError(error, customMessage = null) {
		console.error("❌ Erreur:", error);

		let message = customMessage || "Une erreur est survenue";

		if (error.message) {
			message = error.message;
		} else if (typeof error === "string") {
			message = error;
		}

		Alert.alert("Erreur", message, [{ text: "OK" }]);
	},

	/**
	 * Gère les erreurs d'authentification
	 */
	async handleAuthError(response) {
		if (response.status === 401 || response.status === 403) {
			await clientAuthService.clearClientToken();
			Alert.alert(
				"Session expirée",
				"Votre session a expiré. Veuillez vous reconnecter.",
				[{ text: "OK" }]
			);
			return true;
		}
		return false;
	},

	/**
	 * Gère les erreurs réseau
	 */
	handleNetworkError(error) {
		if (error.message?.includes("Network request failed")) {
			Alert.alert(
				"Erreur réseau",
				"Impossible de se connecter au serveur. Vérifiez votre connexion internet.",
				[{ text: "OK" }]
			);
			return true;
		}
		return false;
	},
};



