# 🎨 Design System - OrderIt Client

Design system moderne et premium pour l'application OrderIt.

## 📦 Structure

```
src/
├── theme/                      # Thème et design tokens
│   ├── tokens/                 # Design tokens atomiques
│   │   ├── colors.js          # Palette de couleurs
│   │   ├── typography.js      # Fonts, sizes, weights
│   │   ├── spacing.js         # Scale de spacing
│   │   ├── shadows.js         # Ombres et élévation
│   │   └── radius.js          # Border radius
│   ├── theme.js               # Thème par défaut
│   ├── ThemeProvider.jsx      # Context Provider
│   └── index.js               # Export central
│
├── components/
│   ├── ui/                    # Composants UI atomiques
│   │   ├── Button/           # Boutons (primary, secondary, tertiary, ghost)
│   │   ├── Input/            # Champs de saisie
│   │   ├── Card/             # Cards/conteneurs
│   │   ├── Badge/            # Pills et badges
│   │   ├── Background/       # Backgrounds
│   │   └── BottomSheet/      # Bottom sheet modal
│   │
│   ├── food/                  # Composants métier food
│   │   ├── FoodCard/         # Card produit menu
│   │   └── CategoryPill/     # Pills navigation catégories
│   │
│   ├── cart/                  # Composants panier
│   │   └── CartItem/         # Item dans le panier
│   │
│   └── navigation/            # Navigation
│       └── BottomNav/        # Navigation bottom
│
└── styles/
    └── animations.js          # Animations réutilisables
```

## 🚀 Utilisation

### 1. Wrapper l'app avec ThemeProvider

```jsx
import { ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Utiliser le hook useTheme

```jsx
import { useTheme } from './theme';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background.default }}>
      <Text style={{ ...theme.typography.styles.h1 }}>
        Hello World
      </Text>
    </View>
  );
}
```

### 3. Utiliser les composants

```jsx
import { Button, Card, FoodCard, CategoryPill } from './components';

function MenuScreen() {
  return (
    <View>
      <CategoryPill active>Burgers</CategoryPill>
      
      <FoodCard
        title="Shawarma Burger"
        price={40.50}
        calories={370}
        image={{ uri: 'https://...' }}
        onPress={() => {}}
        onQuickAdd={() => {}}
      />
      
      <Button variant="primary" onPress={() => {}}>
        Commander
      </Button>
    </View>
  );
}
```

## 🎨 Design Tokens

### Colors

```js
theme.colors.primary.main       // #E63946 (rouge/corail)
theme.colors.secondary.main     // #2D3142 (navy)
theme.colors.background.default // #F5EEE6 (beige/crème)
theme.colors.surface.default    // #FFFFFF (blanc pur)
theme.colors.text.primary       // #1E2235 (texte principal)
```

### Typography

```js
theme.typography.styles.h1      // Heading 1 (serif, 32px, bold)
theme.typography.styles.body    // Body text (sans-serif, 16px)
theme.typography.styles.button  // Button text (sans-serif, 16px, semibold)
```

### Spacing

```js
theme.spacing.xs    // 4
theme.spacing.sm    // 8
theme.spacing.base  // 16
theme.spacing.lg    // 24
theme.spacing.xl    // 32
```

### Shadows

```js
theme.shadows.soft      // Ombre légère
theme.shadows.medium    // Ombre moyenne (cards)
theme.shadows.strong    // Ombre prononcée (modals)
```

### Border Radius

```js
theme.radius.sm         // 8
theme.radius.base       // 16
theme.radius.pill       // 9999 (complètement arrondi)
```

## 🧩 Composants

### Button

```jsx
<Button variant="primary" size="medium" onPress={() => {}}>
  Ajouter au panier
</Button>

// Variants: primary, secondary, tertiary, ghost
// Sizes: small, medium, large
// Props: fullWidth, disabled, loading, icon, iconPosition
```

### Input

```jsx
<Input
  label="Nom"
  value={name}
  onChangeText={setName}
  placeholder="Entrez votre nom"
  error={error}
/>

// Props: label, error, disabled, multiline, icon, iconPosition
```

### Card

```jsx
<Card variant="elevated" padding="md">
  <Text>Contenu de la card</Text>
</Card>

// Variants: default, elevated, outlined
// Padding: none, sm, md, lg
// Props: onPress (rend la card pressable)
```

### FoodCard

```jsx
<FoodCard
  image={{ uri: 'https://...' }}
  title="Shawarma Burger"
  description="Delicious beef, grilled meat, onions..."
  price={40.50}
  calories={370}
  allergens={['gluten', 'dairy']}
  onPress={() => {}}
  onQuickAdd={() => {}}
/>
```

### CategoryPill

```jsx
<CategoryPill active onPress={() => {}}>
  Burgers
</CategoryPill>
```

### CartItem

```jsx
<CartItem
  image={{ uri: 'https://...' }}
  title="Shawarma Burger"
  price={40.50}
  quantity={2}
  onIncrement={() => {}}
  onDecrement={() => {}}
  onRemove={() => {}}
/>
```

### BottomSheet

```jsx
<BottomSheet visible={isVisible} onClose={() => setIsVisible(false)}>
  <Text>Contenu du bottom sheet</Text>
</BottomSheet>
```

### BottomNav

```jsx
<BottomNav
  items={[
    { icon: <Icon />, label: 'Menu' },
    { icon: <Icon />, label: 'Commandes' },
    { icon: <Icon />, label: 'Profil' },
  ]}
  activeIndex={0}
  onItemPress={(index) => {}}
/>
```

## 🎬 Animations

```jsx
import animations from './styles/animations';
import { Animated } from 'react-native';

const opacity = useRef(new Animated.Value(0)).current;

// Fade in
animations.fadeIn(opacity, 300);

// Slide
animations.slideIn(translateX, 'right', 300);

// Category slide (CRITICAL pour Menu)
animations.categorySlide.out(translateX, () => {
  // Change category
  animations.categorySlide.in(translateX);
});
```

## 📝 Notes

- **Thème général** : Ce design system est générique et s'applique à tous les restaurants par défaut
- **Déclinaisons futures** : Le ThemeProvider permettra de créer des thèmes spécifiques par restaurant
- **Animations** : Toutes les animations utilisent `useNativeDriver: true` pour des performances optimales
- **Accessibilité** : Tous les composants sont testés pour l'accessibilité

## 🔜 Prochaines étapes

1. ✅ Design tokens créés
2. ✅ Composants UI de base créés
3. ✅ Composants métier créés
4. ⏳ Intégration dans les screens existants
5. ⏳ Tests visuels et ajustements

---

**Version**: 1.0.0  
**Date**: Avril 2026  
**Status**: ✅ Foundation complète, prête pour intégration
