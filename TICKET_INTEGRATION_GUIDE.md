# 🧾 Guide d'intégration du système de ticket de caisse

## ✅ Ce qui est déjà fait

1. **Composant ReceiptTicket.jsx** créé (`CLIENT-end/client-public/src/components/ReceiptTicket.jsx`)
   - Design ticket physique avec police monospace
   - Lignes pointillées, effet papier
   - Checkbox TVA (20%) avec calcul dynamique HT/TVA/TTC
   - Génération PDF via expo-print
   - Téléchargement et partage du PDF

2. **Packages installés**
   - `expo-print@~15.0.8`
   - `expo-sharing@~14.0.8`
   - `react-native-view-shot@4.0.3`

3. **Payment.jsx modifié** (import ajouté, états ajoutés, props enrichies)
   - ✅ Import ReceiptTicket
   - ✅ États showReceipt et receiptData
   - ✅ Props tableNumber, userName, clientId

## 🔧 Ce qu'il reste à faire

### Étape 1 : Ajouter les fonctions dans Payment.jsx

Ajouter **juste avant** la ligne `// 💳 Traitement du paiement` (vers ligne 483) :

```javascript
/**
 * 🧾 Affiche le ticket de caisse avec les détails du paiement
 */
const showReceiptTicket = (paymentDetails, selectedOrders) => {
	const receipt = {
		orderData: {
			_id: orderId || "N/A",
			orderNumber: `ORD-${(orderId || Date.now().toString()).slice(-8).toUpperCase()}`,
			tableNumber: tableNumber || "N/A",
			clientName: userName || "Client",
			items: selectedOrders.map((item) => ({
				name: item.name || item.productName || "Article",
				quantity: item.quantity || 1,
				price: item.price || 0,
			})),
		},
		paymentData: {
			method: paymentDetails.method || "card",
			date: new Date(),
			tipAmount: 0,
			transactionId: paymentDetails.paymentIntentId || `TXN-${Date.now()}`,
			paymentIntentId: paymentDetails.paymentIntentId,
		},
		restaurantData: {
			name: "Restaurant OrderIt",
			address: "123 Rue de la Gastronomie, Paris",
			phone: "+33 1 23 45 67 89",
		},
	};

	setReceiptData(receipt);
	setShowReceipt(true);
};

/**
 * 🏠 Gère la fermeture du ticket et redirection
 */
const handleReceiptClose = () => {
	setShowReceipt(false);
	setTimeout(() => {
		setSelectedItems(new Set());
		onSuccess?.();
	}, 500);
};
```

### Étape 2 : Remplacer l'Alert dans handlePay

**Trouver** (vers ligne 689-704) :

```javascript
Alert.alert(
	isFullPayment ? "✅ Paiement complet" : "⚠️ Paiement partiel",
	message,
	[
		{
			text: "OK",
			onPress: async () => {
				// Désélectionner tout
				setSelectedItems(new Set());
				onSuccess?.();
			},
		},
	],
);
```

**Remplacer par** :

```javascript
// 🧾 Afficher le ticket de caisse au lieu d'un simple Alert
showReceiptTicket(
	{
		method: paymentMethod,
		paymentIntentId: newPaymentIntentId,
	},
	selectedOrders,
);
```

### Étape 3 : Ajouter le composant ReceiptTicket dans le JSX

**Trouver** la fin du `return` principal (vers ligne 1650+, juste avant `</LinearGradient>` de fermeture) :

**Ajouter juste avant la fermeture** :

```jsx
{
	/* 🧾 Ticket de caisse */
}
{
	showReceipt && receiptData && (
		<ReceiptTicket
			visible={showReceipt}
			onClose={handleReceiptClose}
			orderData={receiptData.orderData}
			paymentData={receiptData.paymentData}
			restaurantData={receiptData.restaurantData}
		/>
	);
}
```

### Étape 4 : Test

1. Lancer l'app CLIENT-end : `cd CLIENT-end && npx expo start`
2. Se connecter à une table
3. Commander des articles
4. Aller au paiement
5. Sélectionner des articles et payer
6. **Vérifier** :
   - ✅ Alert "Paiement réussi"
   - ✅ Ticket de caisse s'affiche
   - ✅ Checkbox TVA fonctionne
   - ✅ Téléchargement PDF fonctionne
   - ✅ Fermeture ticket → Redirection auto

## 📝 Notes techniques

### Structure du receipt data

```javascript
{
	orderData: {
		_id: string,                    // ID commande
		orderNumber: string,            // Numéro affiché (ex: ORD-A1B2C3D4)
		tableNumber: string | number,   // Numéro de table
		clientName: string,             // Nom du client
		items: [{                       // Articles commandés
			name: string,
			quantity: number,
			price: number
		}]
	},
	paymentData: {
		method: string,                 // "card" | "apple_pay" | "fake"
		date: Date,                     // Date du paiement
		tipAmount: number,              // Pourboire en euros (0 pour l'instant)
		transactionId: string,          // ID transaction Stripe
		paymentIntentId: string         // ID PaymentIntent Stripe
	},
	restaurantData: {
		name: string,                   // Nom restaurant
		address: string,                // Adresse
		phone: string                   // Téléphone
	}
}
```

### Amélioration future : Récupération infos restaurant depuis API

Actuellement, les infos restaurant sont hardcodées. Pour les récupérer dynamiquement :

1. Créer un endpoint backend `GET /restaurants/:id/info`
2. Appeler dans `showReceiptTicket` :
   ```javascript
   const restaurantInfo = await fetch(
   	`${API_BASE_URL}/restaurants/${restaurantId}/info`,
   ).then((res) => res.json());
   ```
3. Utiliser `restaurantInfo` au lieu des valeurs par défaut

## 🎯 Flow complet

```
[Client paie]
    ↓
[Stripe PaymentSheet]
    ↓
[Paiement réussi]
    ↓
[Alert "Paiement réussi 🎉"]  ← 1s
    ↓
[showReceiptTicket()]
    ↓
[ReceiptTicket modal visible]
    ↓
[Client consulte ticket, coche TVA si besoin, télécharge PDF]
    ↓
[Client clique "Fermer"]
    ↓
[handleReceiptClose()]
    ↓
[Redirection auto menu]  ← 500ms
```

## 🐛 Troubleshooting

**Le ticket ne s'affiche pas :**

- Vérifier que `showReceipt` passe à `true` (console.log)
- Vérifier que `receiptData` est bien défini
- Vérifier les imports de ReceiptTicket

**Erreur PDF :**

- Vérifier que expo-print est installé : `npx expo install expo-print`
- Sur iOS, vérifier les permissions de partage

**Données manquantes dans le ticket :**

- Vérifier que `selectedOrders` contient bien les items avec `name`, `quantity`, `price`
- Vérifier que `userName`, `tableNumber` sont passés en props depuis App.jsx

## ✅ Checklist finale

- [ ] Fonctions `showReceiptTicket` et `handleReceiptClose` ajoutées
- [ ] Alert remplacé par `showReceiptTicket()`
- [ ] Composant `<ReceiptTicket />` ajouté dans le JSX
- [ ] Test : paiement affiche le ticket
- [ ] Test : checkbox TVA fonctionne
- [ ] Test : téléchargement PDF fonctionne
- [ ] Test : fermeture ticket redirige vers menu
