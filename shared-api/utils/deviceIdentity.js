import uuid from "react-native-uuid";
import { secureSessionStore } from "./secureSessionStore";

const { DEVICE_ID } = secureSessionStore.keys;

export const deviceIdentity = {
	async getOrCreateDeviceId() {
		const existing = await secureSessionStore.getString(DEVICE_ID);
		if (existing) {
			return existing;
		}

		const generated = String(uuid.v4());
		await secureSessionStore.setString(DEVICE_ID, generated);
		return generated;
	},

	async getAuthHeaders(extraHeaders = {}) {
		const deviceId = await this.getOrCreateDeviceId();
		return {
			"x-device-id": deviceId,
			...extraHeaders,
		};
	},
};
