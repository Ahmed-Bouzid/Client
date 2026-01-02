// Utilitaire pour récupérer le restaurantId dynamiquement
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/apiConfig.js";

export async function getRestaurantId() {
	let rid = await AsyncStorage.getItem("restaurantId");
	if (!rid) {
		rid = API_CONFIG.RESTAURANT_ID;
	}
	return rid;
}
