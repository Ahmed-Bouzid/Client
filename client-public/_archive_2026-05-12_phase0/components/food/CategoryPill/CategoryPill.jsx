/**
 * CategoryPill Component
 * 
 * Pill pour navigation des catégories (horizontale)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const CategoryPill = ({
  children,
  active = false,
  onPress,
  style,
  textStyle,
  ...rest
}) => {
  const { theme } = useTheme();

  const pillStyles = [
    styles.pill,
    {
      backgroundColor: active ? theme.colors.primary.main : theme.colors.background.paper,
      borderRadius: theme.radius.pill,
      paddingVertical: 10,
      paddingHorizontal: 20,
      ...theme.shadows.soft,
    },
    style,
  ];

  const pillTextStyles = [
    {
      ...theme.typography.styles.bodySmall,
      fontWeight: '600',
      color: active ? theme.colors.primary.contrast : theme.colors.text.secondary,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity style={pillStyles} onPress={onPress} activeOpacity={0.7} {...rest}>
      <Text style={pillTextStyles}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: { marginRight: 12 },
});

export default CategoryPill;
