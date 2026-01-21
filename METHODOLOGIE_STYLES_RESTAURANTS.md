# Méthodologie de gestion des styles par catégorie de restaurant

## 📋 Principe général

Chaque **catégorie de restaurant** possède son propre système de styles visuels pour offrir une expérience utilisateur cohérente et adaptée au type d'établissement.

## 🎨 Catégories de styles prédéfinies

### 1. **Restaurant Standard** (style "Premium")

- **Palette de couleurs** :
  - Primary: Dégradés violet/mauve (#667eea → #764ba2)
  - Accent: Bleu cyan (#4facfe → #00f2fe)
  - Background: Dégradé sombre (#0f0c29 → #302b63 → #24243e)
- **Ambiance** : Élégante, raffinée, haut de gamme
- **Typographie** : Textes blancs avec ombres subtiles
- **Composants** : Cartes produits avec glassmorphism, animations fluides

### 2. **Food Truck** (style "Grillz")

- **Palette de couleurs** :
  - Primary: Orange/rouge (#ff512f → #ff9800)
  - Accent: Orange vif (#ff9800)
  - Background: Noir profond (#181818)
- **Ambiance** : Street food, énergique, urbain
- **Typographie** : Textes blancs/orange contrastés
- **Composants** : Design plus direct, accent sur la rapidité

### 3. **Styles spécifiques par restaurant** (optionnel)

Possibilité d'ajouter des styles personnalisés pour des restaurants individuels :

- Restaurant italien : Couleurs du drapeau italien (vert/blanc/rouge)
- Restaurant japonais : Minimaliste, couleurs sobres
- Restaurant mexicain : Couleurs vives (jaune/rouge/vert)

## 🏗️ Architecture technique

### 1. **Source de vérité** : `useRestaurantStore`

```javascript
const restaurantCategory = useRestaurantStore((state) => state.category);
// Valeurs possibles: "restaurant", "foodtruck", "italian", "japanese", etc.
```

### 2. **Sélection du thème**

```javascript
// Approche simple avec flag booléen
const usePremiumStyles = restaurantCategory !== "foodtruck";

// Ou sélection de thème complet
const theme = restaurantCategory === "foodtruck" ? GRILLZ_THEME : PREMIUM_THEME;
```

### 3. **Application des styles**

```javascript
// Dans le JSX
<LinearGradient
  colors={usePremiumStyles ? PREMIUM_COLORS.dark : GRILLZ_THEME.dark}
  style={styles.container}
>
  {/* Contenu */}
</LinearGradient>

// Pour les couleurs spécifiques
<Text style={{
  color: usePremiumStyles ? PREMIUM_COLORS.text : GRILLZ_THEME.text
}}>
  {content}
</Text>
```

## 📁 Organisation des fichiers

### Structure recommandée :

```
client-public/src/
├── theme/
│   ├── colors.js              # Définition de toutes les palettes
│   │   ├── PREMIUM_COLORS
│   │   ├── GRILLZ_THEME
│   │   └── CUSTOM_THEMES
│   ├── styles/
│   │   ├── premiumStyles.js   # Styles restaurants standard
│   │   ├── grillzStyles.js    # Styles food trucks
│   │   └── customStyles.js    # Styles personnalisés
│   └── themeSelector.js       # Logique de sélection du thème
├── screens/
│   └── Menu.jsx               # Utilise le thème sélectionné
└── stores/
    └── useRestaurantStore.js  # Stocke la catégorie
```

## ⚠️ Règles critiques

### 1. **Séparation stricte**

- ❌ Ne JAMAIS mélanger les styles de deux catégories dans le même composant
- ✅ Toujours utiliser une condition claire pour sélectionner le bon thème
- ✅ Chaque thème doit être complet (toutes les propriétés définies)

### 2. **Propriétés obligatoires d'un thème**

Chaque thème DOIT contenir au minimum :

```javascript
{
  primary: ["#color1", "#color2"],    // Gradient principal
  accent: ["#color1", "#color2"],     // Gradient d'accent
  background: ["#color1", "#color2"], // Gradient de fond
  text: "#color",                     // Couleur texte principal
  textMuted: "#color",                // Couleur texte secondaire
  button: ["#color1", "#color2"],     // Gradient boutons (optionnel, peut = primary)
  glass: "rgba(...)",                 // Effet glassmorphism
  glassBorder: "rgba(...)",           // Bordures glassmorphism
}
```

### 3. **Tests de non-régression**

Avant de déployer un nouveau style :

1. ✅ Tester sur restaurant standard → vérifier que le style Premium s'applique
2. ✅ Tester sur food truck → vérifier que le style Grillz s'applique
3. ✅ Vérifier qu'aucun style ne "pollue" l'autre catégorie
4. ✅ Tester les transitions entre catégories (navigation)

## 🔄 Workflow d'ajout d'un nouveau style

### Étape 1 : Définir la palette

```javascript
// theme/colors.js
export const ITALIAN_THEME = {
	primary: ["#009246", "#FFFFFF"], // Vert/Blanc italien
	accent: ["#CE2B37", "#009246"], // Rouge/Vert
	background: ["#1a1a1a", "#2d2d2d"],
	text: "#ffffff",
	textMuted: "rgba(255, 255, 255, 0.7)",
	glass: "rgba(255, 255, 255, 0.1)",
	glassBorder: "rgba(255, 255, 255, 0.2)",
};
```

### Étape 2 : Créer les styles spécifiques (optionnel)

```javascript
// theme/styles/italianStyles.js
export const italianStyles = StyleSheet.create({
	container: {
		// Styles spécifiques au thème italien
	},
	// ...
});
```

### Étape 3 : Ajouter la logique de sélection

```javascript
// theme/themeSelector.js
export const getThemeForCategory = (category) => {
	switch (category) {
		case "restaurant":
			return PREMIUM_COLORS;
		case "foodtruck":
			return GRILLZ_THEME;
		case "italian":
			return ITALIAN_THEME;
		default:
			return PREMIUM_COLORS;
	}
};
```

### Étape 4 : Utiliser dans les composants

```javascript
// screens/Menu.jsx
const restaurantCategory = useRestaurantStore((state) => state.category);
const theme = getThemeForCategory(restaurantCategory);
```

## 📊 État actuel (20 janvier 2026)

### Commit de référence : **701121ec**

- ✅ Styles Premium complets et fonctionnels
- ✅ Pas de système de catégories (tous les restaurants utilisent Premium)
- ✅ Design system mature avec PREMIUM_COLORS
- ✅ Composants optimisés (PremiumProductCard, PremiumSearchBar, etc.)

### Prochaines étapes :

1. Implémenter `GRILLZ_THEME` pour les food trucks
2. Ajouter la logique de sélection basée sur `restaurantCategory`
3. Tester la non-contamination entre styles
4. Documenter les styles spécifiques si nécessaire

## 🎯 Objectif final

Avoir un système de styles **flexible**, **maintenable** et **robuste** où :

- Chaque catégorie a son identité visuelle propre
- Aucune contamination entre styles
- Ajout facile de nouvelles catégories
- Performance optimale (pas de re-renders inutiles)
- Code propre et documenté
