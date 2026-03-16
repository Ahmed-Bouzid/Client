import { registerRootComponent } from "expo";
import App from "./App"; // ton App.jsx client-public

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

registerRootComponent(App);
