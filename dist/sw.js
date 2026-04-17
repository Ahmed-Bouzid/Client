// SunnyGo Service Worker
// Cache-first pour les assets, Network-first pour les appels API
// Offline: sert les assets depuis le cache + affiche les données en cache

const CACHE_NAME = "sunnygo-v1";
const API_ORIGIN = "https://orderit-backend-6y1m.onrender.com";

// Assets à pré-cacher lors de l'installation (app shell)
const SHELL_ASSETS = [
  "/",
  "/index.html",
];

// ── Installation ─────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Si certains assets ne sont pas encore disponibles, on ignore
      });
    })
  );
});

// ── Activation — purge des vieux caches ──────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes non-GET ou non-HTTP (ex: chrome-extension://)
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // Appels API backend → Network-first (jamais cacher les réponses API sensibles)
  if (url.origin === API_ORIGIN) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques → Cache-first
  event.respondWith(cacheFirst(request));
});

// ── Stratégie Cache-first ─────────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // En offline, pour la navigation → servir index.html pour SPA routing
    if (request.mode === "navigate") {
      const fallback = await caches.match("/index.html");
      if (fallback) return fallback;
    }
    return new Response("Offline — ressource non disponible", { status: 503 });
  }
}

// ── Stratégie Network-first ───────────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // En offline, les stores Zustand/AsyncStorage afficheront les données en cache
    return new Response(
      JSON.stringify({ offline: true, error: "Réseau indisponible" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
