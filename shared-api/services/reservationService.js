import { API_CONFIG } from "../config/apiConfig.js";
import { getRestaurantId } from "../utils/getRestaurantId.js";

export const reservationService = {
	async fetchReservations(token) {
		if (!token) throw new Error("Token required");
		const restaurantId = await getRestaurantId();
		const url = `${API_CONFIG.BASE_URL}/reservations/restaurant/${restaurantId}`;
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!response.ok) throw new Error("Failed to fetch reservations");
		return response.json();
	},

	async fetchTableReservation(tableId) {
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/reservations/table/${tableId}/active`
		);
		return response.json();
	},
};
