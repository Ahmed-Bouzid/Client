# CLIENT-end - Structure Professionnelle

Application client publique pour les utilisateurs finaux du restaurant.

## 📁 Structure Organisée

```
CLIENT-end/
├── client-public/
│   ├── src/
│   │   ├── screens/          ⭐ Écrans principaux
│   │   │   ├── Menu.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── OrderSummary.jsx
│   │   │   ├── JoinOrCreateTable.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── components/       ⭐ Composants réutilisables
│   │   │   ├── AddOn.jsx
│   │   │   ├── OrderList.jsx
│   │   │   ├── MenuItems.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── stores/           ⭐ State management (Zustand)
│   │   │   ├── useCartStore.js
│   │   │   ├── useOrderStore.js
│   │   │   ├── useProductStore.js
│   │   │   ├── useClientTableStore.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/         ⭐ Services API
│   │   │   ├── productService.js
│   │   │   └── index.js
│   │   │
│   │   └── utils/            ⭐ Utilitaires
│   │       ├── token.js
│   │       ├── customAlert.js
│   │       ├── RootNavigation.js
│   │       └── index.js
│   │
│   ├── App.jsx               ⭐ Point d'entrée (ex: app.js)
│   └── index.js              ⭐ Index principal (ex: index-client.js)
│
├── shared-api/               # API partagée avec backend
│   ├── services/
│   ├── utils/
│   └── config/
│
├── assets/                   # Ressources (images, etc.)
├── package.json
└── README.md                 ⭐ Cette documentation
```

## 🎯 Changements Appliqués

### Fichiers Renommés (PascalCase)

| Avant                             | Après                               | Type           |
| --------------------------------- | ----------------------------------- | -------------- |
| `app.js`                          | `App.jsx`                           | 🟢 Application |
| `index-client.js`                 | `index.js`                          | 🟢 Index       |
| `components/Menu.js`              | `src/screens/Menu.jsx`              | 🟢 Écran       |
| `components/Payment.js`           | `src/screens/Payment.jsx`           | 🟢 Écran       |
| `components/OrderSummary.js`      | `src/screens/OrderSummary.jsx`      | 🟢 Écran       |
| `components/JoinOrCreateTable.js` | `src/screens/JoinOrCreateTable.jsx` | 🟢 Écran       |
| `components/AddOn.js`             | `src/components/AddOn.jsx`          | 🔵 Composant   |
| `components/OrderList.js`         | `src/components/OrderList.jsx`      | 🔵 Composant   |
| `components/menuItems.js`         | `src/components/MenuItems.jsx`      | 🔵 Composant   |

### Structure Réorganisée

**AVANT** :

```
client-public/
├── app.js
├── index-client.js
├── components/        (tout mélangé)
├── stores/
├── services/
└── utils/
```

**APRÈS** :

```
client-public/
├── App.jsx
├── index.js
└── src/
    ├── screens/       (écrans principaux)
    ├── components/    (composants réutilisables)
    ├── stores/        (state management)
    ├── services/      (API calls)
    └── utils/         (utilitaires)
```

## 🎨 Conventions

### Nommage

```
✅ Composants/Écrans : PascalCase.jsx  (Menu.jsx, Payment.jsx)
✅ Stores            : useCamelCase.js (useCartStore.js)
✅ Services          : camelCase.js    (productService.js)
✅ Utilitaires       : camelCase.js    (token.js)
✅ Dossiers          : kebab-case/     (client-public/)
```

### Imports Optimisés

```javascript
// ✅ Depuis App.jsx
import { Menu, Payment, OrderSummary } from "./src/screens";
import { AddOn, OrderList } from "./src/components";
import { useCartStore, useOrderStore } from "./src/stores";
import { useCustomAlert } from "./src/utils";

// ✅ Depuis screens/Menu.jsx
import { useCartStore } from "../stores/useCartStore";
import { AddOn } from "../components";

// ✅ Depuis components/AddOn.jsx
import { useCartStore } from "../stores";
```

## 📦 Modules Principaux

### Écrans (screens/)

- **Menu** : Affichage du menu et sélection des produits
- **Payment** : Gestion du paiement
- **OrderSummary** : Résumé des commandes
- **JoinOrCreateTable** : Connexion/création de table

### Composants (components/)

- **AddOn** : Gestion des suppléments
- **OrderList** : Liste des commandes
- **MenuItems** : Affichage des items du menu

### Stores (stores/)

- **useCartStore** : Gestion du panier
- **useOrderStore** : Gestion des commandes
- **useProductStore** : Gestion des produits
- **useClientTableStore** : Gestion de la table client

### Services (services/)

- **productService** : Appels API produits

### Utils (utils/)

- **token** : Gestion du token JWT
- **customAlert** : Alertes personnalisées
- **RootNavigation** : Navigation

## 🚀 Avantages

1. **Clarté** : Structure intuitive et professionnelle
2. **Séparation** : Écrans vs composants réutilisables
3. **Scalabilité** : Facile d'ajouter de nouvelles features
4. **Maintenabilité** : Code organisé et documenté
5. **Performance** : Imports optimisés avec index.js

## 📝 Notes Techniques

### Compatibilité

- ✅ React Native compatible
- ✅ Expo compatible
- ✅ Stripe intégré
- ✅ Zustand pour state management

### Intégration Backend

- Partage `shared-api/` avec le backend
- Services API centralisés
- Configuration dans `shared-api/config/`

## 🎉 Résultat

Structure **professionnelle** et **scalable** :

- ✅ Nommage cohérent (PascalCase pour composants)
- ✅ Organisation claire par type
- ✅ Imports optimisés
- ✅ Documentation complète
- ✅ Prêt pour production ! 🚀
