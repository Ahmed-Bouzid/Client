# SunnyGo CLIENT-end — Documentation de Production

> Application PWA de commande à table pour restaurants.  
> Stack : Expo SDK 54 · React Native Web · Zustand · Stripe React Native · Socket.io

---

## 1. Diagramme de flux

```
Client scanne le QR code
        │
        ▼
URL : https://domain.com/r/[restaurantId]/[tableId]
        │
        ▼  getUrlParams() lit l'URL
App.jsx init()
  ├─ restaurantId + tableId stockés dans AsyncStorage
  └─ affiche écran JoinOrCreateTable
        │
        ▼
JoinOrCreateTable.jsx
  ├─ getOrCreateClientId() → UUID persistant (AsyncStorage "clientId")
  ├─ checkExistingSession() → si session active → proposer Reprendre / Nouvelle session
  ├─ POST /client-token   (backend valide restaurantId + tableId en DB)
  │   └─ JWT client retourné
  └─ handleJoinTable → step = "menu"
        │
        ▼
Menu.jsx
  ├─ Chargement produits via productService (GET /products/:restaurantId)
  ├─ Ajout au panier → useCartStore (Zustand)
  └─ Envoi commande → orderService → step = "payment"
        │
        ▼
Payment.jsx
  ├─ fetchOrdersByReservation → allOrders (aplati par items)
  │   └─ [Offline] → cache AsyncStorage "cachedOrders_${reservationId}"
  ├─ Filtre par clientId (mes articles) ou toggle "Toute la table"
  ├─ POST /payments/create-intent
  │   ├─ Backend valide : orderId existe, montant ≥ totalAmount DB, ownership JWT
  │   └─ Si restaurant onboardé Stripe Connect :
  │       └─ transfer_data.destination = restaurant.stripeAccountId
  │           application_fee_amount = 100 (1€) ou 0 (plan annuel)
  ├─ Stripe PaymentSheet (côté client)
  └─ Stripe webhook → backend → marque order.paid = true → Socket.io → frontend serveur
        │
        ▼
OrderSummary.jsx — récapitulatif + partage / impression ticket
```

---

## 2. Carte des fichiers clés

### Entrée & Configuration

| Fichier | Rôle | Fonctions principales |
|---|---|---|
| `client-public/index.js` | Point d'entrée Expo + enregistrement Service Worker | `registerRootComponent`, `navigator.serviceWorker.register` |
| `client-public/App.jsx` | Orchestrateur — state global, routing par step | `initTable()`, `handleJoinTable()`, `handlePaymentSuccess()` |
| `app.json` | Config Expo + métadonnées PWA | Génère `manifest.json` automatiquement à l'export |
| `vercel.json` | Déploiement Vercel + rewrites SPA | `buildCommand`, rewrites `/r/:restaurantId/:tableId` |
| `.env` | Variables d'environnement | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_BASE_URL` |

### Screens

| Fichier | Rôle |
|---|---|
| `src/screens/JoinOrCreateTable.jsx` | QR scan, identification client, création/reprise session |
| `src/screens/Menu.jsx` | Catalogue produits, panier, envoi commande |
| `src/screens/Payment.jsx` | Sélection items à payer, Stripe PaymentSheet |
| `src/screens/OrderSummary.jsx` | Récapitulatif, ticket, partage |
| `src/screens/AllergyManagement.jsx` | Gestion allergènes |
| `src/screens/DietaryPreferences.jsx` | Préférences alimentaires |

### Stores Zustand

| Fichier | State géré |
|---|---|
| `src/stores/useOrderStore.js` | `allOrders`, `activeOrderId`, fetch + offline cache |
| `src/stores/useCartStore.js` | `cartItems`, ajout/retrait/envoi commande |
| `src/stores/useClientTableStore.js` | `tableId`, `restaurantId`, `reservationId`, JWT client |
| `src/stores/useRestaurantStore.js` | Config restaurant (nom, logo, thème, features) |
| `src/stores/useProductStore.js` | Catalogue produits + catégories |
| `src/stores/useAllergyStore.js` | Allergènes sélectionnés |

### Configuration & Utilitaires

| Fichier | Rôle |
|---|---|
| `src/config/restaurantConfig.js` | `Resto_id_key` depuis `EXPO_PUBLIC_DEFAULT_RESTAURANT_ID` (null en prod) |
| `src/config/api.js` | `API_BASE_URL` depuis `EXPO_PUBLIC_API_BASE_URL` |
| `src/utils/getUrlParams.js` | Lit `restaurantId` + `tableId` depuis `window.location.pathname` |
| `src/utils/index.js` | Exports centralisés |
| `shared-api/config/apiConfig.js` | Config partagée (URL backend, DEFAULT_TABLE_ID) |
| `public/sw.js` | Service Worker — cache assets, fallback offline |

---

## 3. Guide opérationnel

### Ajouter un nouveau restaurant

1. **Créer le restaurant dans le backend** (via dashboard frontend ou Mongo directement) → récupérer son `_id` MongoDB (ex: `664abc123def456789012345`)
2. **Générer les QR codes** pour chaque table avec l'URL :
   ```
   https://votre-domaine.com/r/664abc123def456789012345/TABLE_ID
   ```
   Où `TABLE_ID` est l'`_id` MongoDB de la table.
3. **Imprimer et coller** les QR codes sur les tables.
4. **Aucun redéploiement nécessaire** — le routing est dynamique côté Vercel.

### Générer les QR codes (URL format)

```
https://[domaine]/r/[restaurantId]/[tableId]

Exemple :
https://app.sunnygo.fr/r/664abc123def456789012345/664abc999def456789099999
```

### Configurer Stripe Connect pour un restaurant

1. Accéder au dashboard frontend (ou API admin)
2. Déclencher le flow d'onboarding Stripe Connect pour le restaurant
3. Une fois complété, mettre à jour le restaurant dans MongoDB :
   ```js
   db.restaurants.updateOne(
     { _id: ObjectId("664abc...") },
     { $set: {
       stripeAccountId: "acct_xxx",
       stripeOnboarded: true,
       stripeCommissionPlan: "pay_per_use"  // ou "annual"
     }}
   )
   ```
4. Dès le prochain paiement, l'argent va directement sur le compte du restaurant.

---

## 4. Sécurité & anti-fraude

### QR code → token client

- Le client scanne le QR → URL `/r/[restaurantId]/[tableId]`
- Le CLIENT-end appelle `POST /client-token` avec `restaurantId` + `tableId`
- **Le backend valide** : `Table.findOne({ _id: tableId, restaurantId })` — si la table n'appartient pas au restaurant, erreur 400 ❌
- Aucune confiance côté client — même si l'URL est forgée, le backend rejette

### PaymentIntent

- `POST /payments/create-intent` requiert un JWT valide
- Backend vérifie :
  1. L'`orderId` existe en DB et appartient au bon restaurant (`order.restaurantId === req.user.restaurantId`)
  2. Le montant déclaré ≥ `order.totalAmount` en DB (anti-manipulation de prix)
- Sans ces deux validations → 400/403

### Idempotence des commandes

- Chaque commande a un `_id` MongoDB unique
- Le statut de paiement (`pending → succeeded → refunded`) est géré par le backend uniquement
- Le webhook Stripe est la source de vérité pour `order.paid = true`

### Données sensibles & RGPD

⚠️ **Risque identifié (hors scope de cette session)** :
- `clientPhone` est stocké dans le modèle `Order` sans route de suppression
- Prévoir une route `DELETE /client/data` et une bannière de consentement

---

## 5. Multi-clients (Solution Option C)

### Problème résolu
Plusieurs clients à la même table peuvent avoir le même prénom. Sans identification robuste :
- Confusion des commandes entre clients
- Un client pourrait payer pour un autre

### Solution implémentée

**Identification par UUID persistant :**
- `getOrCreateClientId()` génère un UUID v4 la première fois et le stocke dans `AsyncStorage("clientId")`
- Re-scan du QR sur le même appareil → même UUID → même client ✅
- Deux appareils différents → deux UUID différents → deux clients distincts ✅

**Reprise de session au re-scan :**
- Si un `reservationId` actif est trouvé dans AsyncStorage, un écran de choix apparaît :
  - **"Reprendre"** → retour au menu avec la même session
  - **"Nouvelle session"** → nouvelle identification

**Filtrage paiement par client :**
- Payment.jsx affiche par défaut **"Mes articles"** (filtré par `item.clientId === mon UUID`)
- Bouton toggle **"Toute la table"** → confirmation Alert avant d'afficher les articles d'autres clients
- Contre-indication : un client ne peut pas payer pour un autre sans le toggle explicite

---

## 6. Mise en production — Checklist complète

### Vercel

- [ ] `vercel.json` présent à la racine du projet ✅ (déjà créé)
- [ ] Variable d'env Vercel : `EXPO_PUBLIC_API_BASE_URL=https://votre-backend.onrender.com`
- [ ] Variable d'env Vercel : `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (clé LIVE)
- [ ] Variable d'env Vercel : `EXPO_PUBLIC_SOCKET_URL=https://votre-backend.onrender.com`
- [ ] Domaine personnalisé configuré dans Vercel
- [ ] HTTPS activé (automatique avec Vercel)

### Stripe — Passage en mode LIVE

**Backend (Render / serveur) :**
- [ ] `STRIPE_SECRET_KEY=sk_live_...` → remplace la clé test
- [ ] `STRIPE_WEBHOOK_SECRET` → créer un nouveau webhook Stripe en mode live (différent du test)
- [ ] Vérifier le webhook endpoint dans le dashboard Stripe : `https://votre-backend/payments/webhook`

**CLIENT-end (Vercel) :**
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` dans les vars Vercel
- [ ] Rebuild & redéployer sur Vercel

> ℹ️ **Un seul changement suffit** pour basculer test → live : changer les 2 clés ci-dessus.  
> Le `isTestMode` dans `stripeService.js` est détecté automatiquement (`sk_test_` vs `sk_live_`).

### Backend (Render)

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` → base de données de production (pas de dev)
- [ ] `JWT_SECRET` → valeur longue et aléatoire, jamais partagée
- [ ] CORS configuré pour autoriser uniquement le domaine Vercel
- [ ] Rate limiting activé sur `/client-token` ✅ (déjà implémenté)

### PWA

- [ ] `app.json` présent ✅ (déjà créé)
- [ ] `public/sw.js` présent ✅ (déjà créé)
- [ ] Tester l'installation sur iOS Safari (Partager → Ajouter à l'écran d'accueil)
- [ ] Tester l'installation sur Android Chrome (menu → Installer l'application)
- [ ] Tester le mode offline : commandes visibles même sans réseau

### Tests avant go-live

- [ ] Scanner un QR avec un faux `restaurantId` → 400 attendu
- [ ] Scanner un QR avec un `tableId` qui n'appartient pas au restaurant → 400 attendu
- [ ] Tenter un paiement avec un montant trafiqué → 400 attendu
- [ ] Paiement complet avec Stripe live (montant réel de test, remboursement immédiat)
- [ ] Vérifier que l'argent arrive sur le compte Connect du restaurant dans le dashboard Stripe
- [ ] Tester le remboursement via `POST /payments/refund`
- [ ] Tester deux clients différents sur la même table (deux appareils)

---

## 7. Variables d'environnement — Référence complète

### CLIENT-end (Vercel env vars)

| Variable | Description | Valeur prod |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | URL du backend | `https://votre-backend.onrender.com` |
| `EXPO_PUBLIC_SOCKET_URL` | URL WebSocket | `https://votre-backend.onrender.com` |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé Stripe publique | `pk_live_...` |
| `EXPO_PUBLIC_DEFAULT_RESTAURANT_ID` | ID restauro par défaut (dev uniquement) | Ne pas définir en prod |

### Backend (Render env vars)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_...` en prod) |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (`whsec_...`) |
| `MONGODB_URI` | URI MongoDB Atlas |
| `JWT_SECRET` | Secret JWT (min 32 chars, aléatoire) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Domaine Vercel autorisé |
