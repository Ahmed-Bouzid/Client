const FALLBACK_API_URL = "https://orderit-backend-6y1m.onrender.com";

function sanitizeApiBaseUrl(rawUrl) {
	if (!rawUrl || typeof rawUrl !== "string") {
		return FALLBACK_API_URL;
	}

	try {
		const parsed = new URL(rawUrl);
		const isHttps = parsed.protocol === "https:";
		const allowedHosts = [
			"orderit-backend-6y1m.onrender.com",
			"localhost",
			"127.0.0.1",
		];

		if (!isHttps && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
			return FALLBACK_API_URL;
		}

		if (!allowedHosts.includes(parsed.hostname) && !parsed.hostname.endsWith(".onrender.com")) {
			return FALLBACK_API_URL;
		}

		return parsed.origin;
	} catch {
		return FALLBACK_API_URL;
	}
}

export const API_BASE_URL = sanitizeApiBaseUrl(
	process.env.EXPO_PUBLIC_API_BASE_URL,
);
