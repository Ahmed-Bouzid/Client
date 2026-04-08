/**
 * FoodCard Component
 * 
 * Card produit pour afficher un item du menu
 * Basé sur les templates avec image, titre, prix, quick add
 */

import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export const FoodCard = ({
  image,
  title,
  description,
  price,
  calories,
  allergens = [],
  onPress,
  onQuickAdd,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={[styles.card, style]} {...rest}>
      <Image source={typeof image === 'string' ? { uri: image } : image} style={styles.image} resizeMode="cover" />
      
      <View style={{ padding: theme.spacing.base }}>
        <View style={styles.header}>
          <Text style={{ ...theme.typography.styles.h4, color: theme.colors.text.primary }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ ...theme.typography.styles.price, color: theme.colors.primary.main }}>
            ${typeof price === 'number' ? price.toFixed(2) : price}
          </Text>
        </View>

        {description && (
          <Text style={{ ...theme.typography.styles.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing.xs }} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View style={[styles.footer, { marginTop: theme.spacing.md }]}>
          <View style={styles.badges}>
            {calories && <Badge variant="calories" size="small">{calories} cal</Badge>}
            {allergens.length > 0 && <Badge variant="allergen" size="small">{allergens.length} allergènes</Badge>}
          </View>

          <TouchableOpacity
            onPress={onQuickAdd}
            style={[styles.quickAdd, { backgroundColor: theme.colors.primary.main, ...theme.shadows.soft }]}
          >
            <Text style={{ color: theme.colors.primary.contrast, fontSize: 20, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  image: { width: '100%', height: 160, backgroundColor: '#f0f0f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 8, flex: 1 },
  quickAdd: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

export default FoodCard;
