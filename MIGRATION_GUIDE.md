# 🔄 Guide de Migration - Nouveau Design System

Guide pour migrer progressivement vers le nouveau design system.

## ✅ Étape 1: Setup (DONE)

Le nouveau design system est prêt et disponible dans:
- `src/theme/` - Tokens et ThemeProvider
- `src/components/ui/` - Composants UI de base
- `src/components/food/` - Composants métier food
- `src/components/cart/` - Composants panier
- `src/components/navigation/` - Navigation
- `src/styles/animations.js` - Animations

## 📋 Étape 2: Wrapper l'App

Dans votre fichier d'entrée principal (App.jsx ou index.js):

```jsx
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <ThemeProvider>
      {/* Votre app existante */}
    </ThemeProvider>
  );
}
```

## 🔄 Étape 3: Migration Progressive

### Option A: Migration écran par écran

Migrez un écran à la fois pour minimiser les risques:

1. **Menu.jsx** (priorité haute)
   - Remplacer styles inline par composants
   - Utiliser FoodCard, CategoryPill
   - Implémenter category slide animation

2. **OrderSummary.jsx / Cart**
   - Utiliser CartItem
   - Remplacer boutons par nouveau Button

3. **Payment.jsx**
   - Utiliser nouveau Button
   - Utiliser Input si nécessaire

### Option B: Migration complète

Si vous voulez tout migrer d'un coup:

1. Créer une branche `design-system-migration`
2. Migrer tous les écrans
3. Tester visuellement
4. Merger

## 📝 Patterns de Migration

### Ancien → Nouveau

#### Boutons

**Avant:**
```jsx
<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>Ajouter</Text>
</TouchableOpacity>
```

**Après:**
```jsx
import { Button } from './components';

<Button variant="primary" onPress={handlePress}>
  Ajouter
</Button>
```

#### Colors

**Avant:**
```jsx
backgroundColor: '#E63946'
```

**Après:**
```jsx
import { useTheme } from './theme';

const { theme } = useTheme();
backgroundColor: theme.colors.primary.main
```

#### Spacing

**Avant:**
```jsx
marginTop: 16,
paddingHorizontal: 20,
```

**Après:**
```jsx
marginTop: theme.spacing.base,
paddingHorizontal: theme.spacing.screen.horizontal,
```

#### Typography

**Avant:**
```jsx
<Text style={{
  fontSize: 24,
  fontWeight: '700',
  fontFamily: 'serif',
}}>
  Titre
</Text>
```

**Après:**
```jsx
<Text style={theme.typography.styles.h2}>
  Titre
</Text>
```

## 🎯 Screens à Migrer

### Menu.jsx
```jsx
import { Background, CategoryPill, FoodCard, BottomSheet } from './components';
import { useTheme } from './theme';

// Voir MenuScreenExample.jsx pour référence complète
```

### OrderSummary.jsx
```jsx
import { Background, CartItem, Button } from './components';
import { useTheme } from './theme';

function OrderSummary() {
  const { theme } = useTheme();
  
  return (
    <Background>
      {items.map(item => (
        <CartItem
          key={item.id}
          {...item}
          onIncrement={() => {}}
          onDecrement={() => {}}
        />
      ))}
      
      <Button variant="primary" fullWidth onPress={checkout}>
        Proceed to payment
      </Button>
    </Background>
  );
}
```

### Payment.jsx
```jsx
import { Background, Input, Button } from './components';

function Payment() {
  const { theme } = useTheme();
  
  return (
    <Background>
      <Input
        label="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
      />
      
      <Button variant="primary" fullWidth onPress={pay}>
        Pay now
      </Button>
    </Background>
  );
}
```

## 🚨 Points d'Attention

### 1. Imports
Toujours importer depuis les index:
```jsx
// ✅ Bon
import { Button, Card } from './components';
import { useTheme } from './theme';

// ❌ Éviter
import Button from './components/ui/Button/Button';
```

### 2. Animations
Utiliser les animations prédéfinies:
```jsx
import animations from './styles/animations';

// Category slide (CRITICAL)
animations.categorySlide.out(translateX, () => {
  setCategory(newCategory);
  animations.categorySlide.in(translateX);
});
```

### 3. Theme
Toujours utiliser useTheme au lieu de valeurs hardcodées:
```jsx
// ✅ Bon
const { theme } = useTheme();
backgroundColor: theme.colors.primary.main

// ❌ Éviter
backgroundColor: '#E63946'
```

## 📊 Checklist de Migration

- [ ] ThemeProvider ajouté dans App
- [ ] Menu.jsx migré
  - [ ] CategoryPill implémenté
  - [ ] FoodCard implémenté
  - [ ] Category slide animation
  - [ ] BottomSheet pour product detail
- [ ] OrderSummary/Cart migré
  - [ ] CartItem implémenté
  - [ ] Nouveau Button
- [ ] Payment migré
  - [ ] Input fields
  - [ ] Nouveau Button
- [ ] Tests visuels
  - [ ] iOS
  - [ ] Android
  - [ ] Différentes tailles d'écran
- [ ] Performance check
  - [ ] Animations fluides (60fps)
  - [ ] Pas de lag au scroll

## 🆘 Support

Voir `DESIGN_SYSTEM.md` pour la documentation complète des composants.

Voir `src/screens/MenuScreenExample.jsx` pour un exemple d'intégration complet.

---

**Status**: ⏳ Prêt pour migration  
**Next**: Commencer par Menu.jsx
