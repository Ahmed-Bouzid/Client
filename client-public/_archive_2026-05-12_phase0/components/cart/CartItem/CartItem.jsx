/**
 * CartItem Component
 * 
 * Item dans le panier avec controls +/- et remove
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { Card } from '../../ui/Card';

export const CartItem = ({
  image,
  title,
  price,
  quantity = 1,
  onIncrement,
  onDecrement,
  onRemove,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  return (
    <Card variant="outlined" padding="sm" style={[styles.card, style]} {...rest}>
      <View style={styles.container}>
        {image && <Image source={typeof image === 'string' ? { uri: image } : image} style={styles.image} resizeMode="cover" />}
        
        <View style={styles.content}>
          <Text style={{ ...theme.typography.styles.body, color: theme.colors.text.primary, fontWeight: '600' }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ ...theme.typography.styles.priceSmall, color: theme.colors.primary.main, marginTop: 4 }}>
            ${typeof price === 'number' ? price.toFixed(2) : price}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={onDecrement}
            style={[styles.controlButton, { borderColor: theme.colors.border.medium }]}
          >
            <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontWeight: '600' }}>−</Text>
          </TouchableOpacity>

          <Text style={{ ...theme.typography.styles.body, fontWeight: '600', color: theme.colors.text.primary, minWidth: 24, textAlign: 'center' }}>
            {quantity}
          </Text>

          <TouchableOpacity
            onPress={onIncrement}
            style={[styles.controlButton, { backgroundColor: theme.colors.primary.main }]}
          >
            <Text style={{ color: theme.colors.primary.contrast, fontSize: 18, fontWeight: '600' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  container: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#f0f0f0' },
  content: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
});

export default CartItem;
