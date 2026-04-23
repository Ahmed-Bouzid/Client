import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SENSITIVE_KEYS = {
	CLIENT_TOKEN: "clientToken",
	CLIENT_ID: "clientId",
	ALLERGENS: "userAllergenIds",
	RESTRICTIONS: "userRestrictions",
	SESSION_STARTED_AT: "sessionStartedAt",
	APP_BACKGROUND_AT: "appBackgroundAt",
	DEVICE_ID: "deviceId",
};

async function canUseSecureStore() {
	if (Platform.OS === "web") {
		return false;
	}

	try {
		return await SecureStore.isAvailableAsync();
	} catch {
		return false;
	}
}

async function getSecureItem(key) {
	if (await canUseSecureStore()) {
		return SecureStore.getItemAsync(key, {
			keychainService: "orderit-secure-session",
		});
	}
	return AsyncStorage.getItem(key);
}

async function setSecureItem(key, value) {
	if (await canUseSecureStore()) {
		await SecureStore.setItemAsync(key, value, {
			keychainService: "orderit-secure-session",
		});
		return;
	}
	await AsyncStorage.setItem(key, value);
}

async function removeSecureItem(key) {
	if (await canUseSecureStore()) {
		await SecureStore.deleteItemAsync(key, {
			keychainService: "orderit-secure-session",
		});
	}
	await AsyncStorage.removeItem(key);
}

export const secureSessionStore = {
	keys: SENSITIVE_KEYS,

	async getString(key) {
		const value = await getSecureItem(key);
		if (value !== null && value !== undefined) {
			return value;
		}

		const legacy = await AsyncStorage.getItem(key);
		if (legacy !== null && legacy !== undefined) {
			await setSecureItem(key, legacy);
			await AsyncStorage.removeItem(key);
		}
		return legacy;
	},

	async setString(key, value) {
		await setSecureItem(key, value);
	},

	async getJson(key, fallback = null) {
		const raw = await this.getString(key);
		if (!raw) {
			return fallback;
		}
		try {
			return JSON.parse(raw);
		} catch {
			return fallback;
		}
	},

	async setJson(key, value) {
		await this.setString(key, JSON.stringify(value));
	},

	async remove(key) {
		await removeSecureItem(key);
	},

	async clearSensitiveSession() {
		await Promise.all([
			this.remove(SENSITIVE_KEYS.CLIENT_TOKEN),
			this.remove(SENSITIVE_KEYS.ALLERGENS),
			this.remove(SENSITIVE_KEYS.RESTRICTIONS),
			this.remove(SENSITIVE_KEYS.SESSION_STARTED_AT),
			this.remove(SENSITIVE_KEYS.APP_BACKGROUND_AT),
		]);
	},
};
