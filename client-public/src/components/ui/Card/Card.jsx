/**
 * Card Component
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const Card = ({ children, variant = 'default', padding = 'md', onPress, style, ...rest }) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return { backgroundColor: theme.colors.surface.elevated, ...theme.shadows.medium, borderWidth: 0 };
      case 'outlined':
        return { backgroundColor: theme.colors.background.paper, borderWidth: 1.5, borderColor: theme.colors.border.light };
      case 'default':
      default:
        return { backgroundColor: theme.colors.surface.default, ...theme.shadows.soft, borderWidth: 0 };
    }
  };

  const getPaddingValue = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return theme.spacing.md;
      case 'lg': return theme.spacing.xl;
      case 'md':
      default: return theme.spacing.card.padding;
    }
  };

  const cardStyles = [
    styles.card,
    { borderRadius: theme.radius.component.card, padding: getPaddingValue(), ...getVariantStyles() },
    style,
  ];

  if (onPress) {
    return <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.8} {...rest}>{children}</TouchableOpacity>;
  }

  return <View style={cardStyles} {...rest}>{children}</View>;
};

const styles = StyleSheet.create({ card: { overflow: 'hidden' } });

export default Card;
