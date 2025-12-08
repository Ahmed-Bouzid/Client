# Configuration CLIENT-end

## Configuration TableId et RestaurantId

### RestaurantId
Le `restaurantId` est automatiquement défini depuis `API_CONFIG.RESTAURANT_ID` dans `shared-api/config/apiConfig.js`. Il n'est plus nécessaire de le coder en dur.

### TableId
Le `tableId` peut être obtenu de plusieurs façons :
1. **QR Code** (recommandé en production) : L'utilisateur scanne le QR code de la table
2. **AsyncStorage** : Si déjà sauvegardé lors d'une session précédente
3. **DEFAULT_TABLE_ID** : Pour le développement, vous pouvez définir `DEFAULT_TABLE_ID` dans `apiConfig.js`
4. **Initialisation manuelle** : Passer le `tableId` lors de l'appel à `initTable()` dans `app.js`

**Pour le développement**, décommentez et modifiez dans `shared-api/config/apiConfig.js` :
```javascript
DEFAULT_TABLE_ID: "686af692bb4cba684ff3b757", // Votre tableId de dev
```

## Variables d'environnement

Pour configurer l'URL de l'API et l'ID du restaurant, vous avez deux options :

### Option 1 : Modifier directement `shared-api/config/apiConfig.js`

```javascript
export const API_CONFIG = {
	BASE_URL: "http://votre-ip:3000",
	RESTAURANT_ID: "votre-restaurant-id",
};
```

### Option 2 : Utiliser Expo Constants (recommandé pour la production)

1. Installez `expo-constants` :
```bash
npm install expo-constants
```

2. Modifiez `app.json` pour ajouter les variables :
```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://votre-ip:3000",
      "RESTAURANT_ID": "votre-restaurant-id"
    }
  }
}
```

3. Le fichier `shared-api/config/apiConfig.js` utilisera automatiquement ces valeurs.

## Structure des stores

- **useProductStore** : Gère les produits du menu
- **useCartStore** : Gère le panier (persisté dans AsyncStorage)
- **useOrderStore** : Gère les commandes (création, paiement, état)
- **useTableStore** : Gère la table active et l'authentification client

## Services

- **orderService** : Opérations sur les commandes (création, récupération, paiement)
- **productService** : Récupération des produits
- **clientAuthService** : Gestion du token client
- **errorHandler** : Gestion centralisée des erreurs

## Notes

- Toutes les URLs sont maintenant centralisées dans `API_CONFIG`
- Les IDs codés en dur ont été remplacés par des valeurs depuis les stores
- La logique métier a été extraite dans les services
- Les stores gèrent automatiquement la persistance avec AsyncStorage

