# 📂 Structure CLIENT-END - Documentation

## 🏗️ Architecture Professionnelle

Cette structure suit les **best practices React Native** avec une séparation claire des responsabilités.

```
client-public/
├── App.jsx                 # Point d'entrée principal de l'app
├── index.js                # Initialisation Expo
└── src/                    # Code source organisé
    ├── components/         # Composants UI réutilisables
    │   ├── common/         # Composants génériques (badges, buttons...)
    │   ├── menu/           # Composants liés au menu (items, addons...)
    │   ├── order/          # Composants de gestion commandes
    │   ├── messaging/      # Composants de messagerie client-serveur
    │   ├── receipt/        # Composants de ticket de caisse
    │   └── index.js        # Export centralisé des composants
    │
    ├── screens/            # Écrans de navigation
    │   ├── Menu.jsx
    │   ├── Payment.jsx
    │   ├── OrderSummary.jsx
    │   ├── JoinOrCreateTable.jsx
    │   ├── AllergyManagement.jsx
    │   ├── DietaryPreferences.jsx
    │   └── index.js
    │
    ├── hooks/              # Custom hooks React
    │   ├── useRestaurantConfig.js
    │   ├── useSocketClient.js
    │   ├── useReceiptExport.js
    │   └── index.js
    │
    ├── stores/             # State management (Zustand)
    │   ├── useCartStore.js
    │   ├── useOrderStore.js
    │   ├── useProductStore.js
    │   ├── useAllergyStore.js
    │   ├── useRestrictionStore.js
    │   ├── useRestaurantStore.js
    │   ├── useClientTableStore.js
    │   └── index.js
    │
    ├── services/           # Services API & logique métier
    │   ├── socketService.js
    │   ├── messageService.js
    │   └── productService.js
    │
    ├── utils/              # Fonctions utilitaires
    │   ├── token.js
    │   ├── customAlert.js
    │   ├── RootNavigation.js
    │   └── index.js
    │
    ├── config/             # Configuration app
    │   ├── api.js
    │   └── restaurantConfig.js
    │
    ├── theme/              # Design system
    │   └── colors.js
    │
    └── styles/             # Styles globaux/thèmes
        ├── appStyles-classic.js
        ├── appStyles-standard.js
        ├── appStyles-grillz.js
        └── buttonStyles.js
```

## 📋 Conventions de nommage

### Fichiers

- **Composants** : PascalCase (`MenuItems.jsx`, `OrderList.jsx`)
- **Hooks** : camelCase avec préfixe `use` (`useCartStore.js`, `useSocketClient.js`)
- **Services** : camelCase avec suffixe `Service` (`socketService.js`)
- **Utils** : camelCase (`token.js`, `customAlert.js`)
- **Config** : camelCase (`api.js`, `restaurantConfig.js`)

### Dossiers

- Toujours en **lowercase** ou **kebab-case**
- Noms au **pluriel** si contenu multiple (`components/`, `hooks/`, `stores/`)
- Noms au **singulier** si unique (`theme/`, `config/`)

## 🎯 Rôle de chaque dossier

### `/components`

**Composants UI réutilisables** organisés par thématique :

- **common/** : Composants génériques utilisables partout
  - `AllergenBadge.jsx` : Badge d'affichage allergènes

- **menu/** : Composants liés à l'affichage menu
  - `MenuItems.jsx` : Liste des produits menu
  - `AddOn.jsx` : Composant pour les addons/options

- **order/** : Composants de gestion commandes
  - `OrderList.jsx` : Liste des articles commandés

- **messaging/** : Composants messagerie
  - `MessagingBubble.jsx` : Bulle de message client-serveur

- **receipt/** : Composants ticket de caisse
  - `ReceiptTicket.jsx` : Ticket avec TVA et PDF
  - `ReceiptModal.jsx` : Modal d'affichage ticket

**Règle d'or** : Un composant dans `components/` ne doit **JAMAIS** gérer de navigation ou de logique métier complexe.

### `/screens`

**Écrans complets** de l'application :

- Gèrent la navigation
- Orchestrent les composants
- Connectent les stores et services
- Peuvent être volumineux (c'est normal)

**Exemples** :

- `Menu.jsx` : Écran d'affichage du menu restaurant
- `Payment.jsx` : Écran de paiement avec Stripe
- `OrderSummary.jsx` : Récapitulatif commande
- `JoinOrCreateTable.jsx` : Rejoindre/créer une table

### `/hooks`

**Custom hooks React** réutilisables :

- Préfixe obligatoire : `use`
- Encapsulent la logique réutilisable
- Retournent des valeurs/fonctions

**Exemples** :

- `useRestaurantConfig.js` : Hook pour config restaurant
- `useSocketClient.js` : Hook pour WebSocket
- `useReceiptExport.js` : Hook pour export PDF ticket

**❌ Ne PAS mettre ici** : Zustand stores (→ `/stores`)

### `/stores`

**State management global** avec Zustand :

- Un store = un domaine métier
- Toujours suffixe `Store` : `useCartStore`, `useOrderStore`
- Contiennent state + actions

**Exemples** :

- `useCartStore.js` : Panier client
- `useOrderStore.js` : Commandes
- `useProductStore.js` : Produits menu
- `useAllergyStore.js` : Allergies client

**Convention** : Exported avec `export const useXxxStore = create(...)`

### `/services`

**Logique métier et API** :

- Communication avec le backend
- WebSocket management
- Business logic complexe

**Exemples** :

- `socketService.js` : Gestion WebSocket temps réel
- `messageService.js` : Messagerie client-serveur
- `productService.js` : API produits

**Pattern** : Export d'un objet avec méthodes

```js
export const productService = {
  fetchProducts: async () => {...},
  updateProduct: async (id, data) => {...}
};
```

### `/utils`

**Fonctions utilitaires pures** :

- Helpers génériques
- Pas de state
- Pas d'effets de bord (idéalement)

**Exemples** :

- `token.js` : Gestion tokens JWT
- `customAlert.js` : Alert personnalisées
- `RootNavigation.js` : Navigation helper

### `/config`

**Configuration statique** :

- URLs API
- Constantes app
- Config restaurant

**Exemples** :

- `api.js` : `API_BASE_URL`, endpoints
- `restaurantConfig.js` : Config par restaurant

### `/theme`

**Design system** :

- Couleurs
- Typographie
- Spacings (si ajouté)

**Exemple** :

- `colors.js` : `PREMIUM_COLORS`, palettes

### `/styles`

**Styles globaux et thèmes** :

- Styles partagés entre écrans
- Thèmes dynamiques (classic, grillz, standard)

**Exemples** :

- `appStyles-classic.js` : Thème classique
- `buttonStyles.js` : Styles boutons globaux

## 🚀 Import patterns PRO

### ✅ Imports recommandés

```js
// Import depuis index.js (clean)
import { MenuItems, AddOn } from "../components";
import { OrderList } from "../components";

// Import hooks
import { useCartStore, useOrderStore } from "../stores";
import { useSocketClient, useReceiptExport } from "../hooks";

// Import services
import { socketService } from "../services/socketService";
import { productService } from "../services/productService";
```

### ❌ Imports à éviter

```js
// Trop verbeux
import MenuItems from "../components/menu/MenuItems";
import AddOn from "../components/menu/AddOn";

// Chemin direct au lieu d'index
import { useCartStore } from "../stores/useCartStore";
```

## 📊 Statistiques de la structure

```
Dossiers       : 14
Fichiers code  : ~45
Écrans         : 7
Composants     : ~10
Hooks custom   : 3
Stores Zustand : 7
Services       : 3
Utils          : 4
```

## 🔄 Workflow de développement

### Ajouter un nouveau composant

1. Créer le fichier dans le bon sous-dossier :

   ```bash
   # Composant menu
   touch src/components/menu/ProductCard.jsx
   ```

2. Ajouter l'export dans l'index.js :

   ```js
   // src/components/menu/index.js
   export { default as ProductCard } from "./ProductCard";
   ```

3. Mettre à jour l'index principal (si nécessaire) :
   ```js
   // src/components/index.js
   export { MenuItems, AddOn, ProductCard } from "./menu";
   ```

### Ajouter un nouveau hook

1. Créer dans `/hooks` :

   ```bash
   touch src/hooks/usePayment.js
   ```

2. Exporter dans l'index :
   ```js
   // src/hooks/index.js
   export { default as usePayment } from "./usePayment";
   ```

### Ajouter un nouveau store

1. Créer le store :

   ```bash
   touch src/stores/useNotificationStore.js
   ```

2. Pattern Zustand :

   ```js
   import { create } from "zustand";

   export const useNotificationStore = create((set) => ({
   	notifications: [],
   	addNotification: (notif) =>
   		set((state) => ({
   			notifications: [...state.notifications, notif],
   		})),
   }));
   ```

3. Exporter dans index.js :
   ```js
   export { useNotificationStore } from "./useNotificationStore";
   ```

## 🐛 Résolution de problèmes

### Import non trouvé

- Vérifier que l'export existe dans l'index.js
- Vérifier le chemin relatif (`../` vs `./`)
- Rebuild cache : `npx expo start -c`

### Circular dependency

- Éviter les imports croisés entre stores
- Utiliser des fichiers utils/ pour partager la logique

### Performance issues

- Utiliser `React.memo` sur composants lourds
- Optimiser re-renders avec `useMemo`, `useCallback`
- Vérifier les logs de re-renders excessifs

## ✅ Checklist qualité code

Avant chaque commit :

- [ ] Tous les fichiers dans le bon dossier
- [ ] Index.js à jour avec les exports
- [ ] Pas de fichiers orphelins (non importés)
- [ ] Pas de console.log oubliés (sauf debug intentionnels)
- [ ] Imports groupés et triés (externe → interne → relatif)
- [ ] Nommage cohérent (camelCase, PascalCase selon règles)
- [ ] Pas de code dupliqué (DRY principle)

## 📚 Ressources

- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Expo Documentation](https://docs.expo.dev/)

---

**🎯 Cette structure est maintenant PRO, cohérente et évolutive !**
