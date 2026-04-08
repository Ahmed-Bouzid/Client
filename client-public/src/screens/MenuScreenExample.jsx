/**
 * Example: Menu Screen avec nouveau design system
 * 
 * Cet exemple montre comment utiliser les nouveaux composants
 * pour créer l'écran Menu avec le design premium.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useTheme } from '../theme';
import {
  Background,
  CategoryPill,
  FoodCard,
  BottomSheet,
  Button,
  BottomNav,
} from '../components';
import animations from '../styles/animations';

export default function MenuScreenExample() {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const categories = ['Burgers', 'Sides', 'Speciality Burgers', 'Drinks'];
  
  const products = [
    {
      id: 1,
      title: 'Shawarma Burger',
      description: 'Delicious beef, grilled meat, onions, tomatoes and special sauce',
      price: 40.50,
      calories: 370,
      allergens: ['gluten', 'dairy'],
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 2,
      title: 'Classic Burger',
      description: 'Traditional beef burger with lettuce, tomato, and cheese',
      price: 35.00,
      calories: 520,
      allergens: ['gluten', 'dairy'],
      image: 'https://via.placeholder.com/300x200',
    },
  ];

  const handleCategoryChange = (index) => {
    if (index === activeCategory) return;

    // Animation slide out → change → slide in
    animations.categorySlide.out(translateX, () => {
      setActiveCategory(index);
      translateX.setValue(300); // Reset to right
      animations.categorySlide.in(translateX);
    });
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setBottomSheetVisible(true);
  };

  const handleQuickAdd = (product) => {
    console.log('Quick add:', product.title);
    // Add to cart logic
  };

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.spacing.screen.horizontal }]}>
          <Text style={{ ...theme.typography.styles.h2, color: theme.colors.text.primary }}>
            Basque Kitchen
          </Text>
          <Text style={{ ...theme.typography.styles.bodySmall, color: theme.colors.text.secondary, marginTop: 4 }}>
            Table 5 • 2 guests
          </Text>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.screen.horizontal }}
        >
          {categories.map((category, index) => (
            <CategoryPill
              key={index}
              active={activeCategory === index}
              onPress={() => handleCategoryChange(index)}
            >
              {category}
            </CategoryPill>
          ))}
        </ScrollView>

        {/* Products List */}
        <Animated.View style={{ transform: [{ translateX }], flex: 1 }}>
          <ScrollView
            style={styles.products}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.screen.horizontal,
              paddingBottom: 100, // Space for bottom nav
            }}
            showsVerticalScrollIndicator={false}
          >
            {products.map((product) => (
              <FoodCard
                key={product.id}
                {...product}
                onPress={() => handleProductPress(product)}
                onQuickAdd={() => handleQuickAdd(product)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Bottom Navigation */}
        <BottomNav
          items={[
            { label: 'Menu' },
            { label: 'Orders' },
            { label: 'Cart' },
            { label: 'Profile' },
          ]}
          activeIndex={0}
          onItemPress={(index) => console.log('Nav:', index)}
        />

        {/* Product Detail Bottom Sheet */}
        <BottomSheet
          visible={bottomSheetVisible}
          onClose={() => setBottomSheetVisible(false)}
        >
          {selectedProduct && (
            <View style={{ paddingBottom: theme.spacing.xl }}>
              <Text style={{ ...theme.typography.styles.h2, color: theme.colors.text.primary }}>
                {selectedProduct.title}
              </Text>
              
              <Text style={{
                ...theme.typography.styles.body,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.md,
              }}>
                {selectedProduct.description}
              </Text>

              <Text style={{
                ...theme.typography.styles.price,
                color: theme.colors.primary.main,
                marginTop: theme.spacing.lg,
              }}>
                ${selectedProduct.price.toFixed(2)}
              </Text>

              <Button
                variant="primary"
                fullWidth
                onPress={() => {
                  handleQuickAdd(selectedProduct);
                  setBottomSheetVisible(false);
                }}
                style={{ marginTop: theme.spacing.xl }}
              >
                Add to cart
              </Button>
            </View>
          )}
        </BottomSheet>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  categories: {
    maxHeight: 60,
    marginBottom: 16,
  },
  products: {
    flex: 1,
  },
});
