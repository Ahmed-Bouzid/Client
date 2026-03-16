import { registerRootComponent } from "expo";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import App from "./App"; // ton App.jsx client-public

function Root() {
	return (
		<SafeAreaProvider>
			<App />
		</SafeAreaProvider>
	);
}

// Enregistrer le service worker sur web uniquement (PWA offline support)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((reg) => {
				console.log("[SW] Enregistré :", reg.scope);
			})
			.catch((err) => {
				console.warn("[SW] Échec enregistrement :", err);
			});
	});
}

registerRootComponent(Root);
