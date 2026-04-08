/**
 * Badge Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const Badge = ({ children, variant = 'info', size = 'medium', icon, style, textStyle, ...rest }) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'calories': return { backgroundColor: theme.colors.badge.calories, color: theme.colors.badge.caloriesText };
      case 'allergen': return { backgroundColor: theme.colors.badge.allergen, color: theme.colors.badge.allergenText };
      case 'success': return { backgroundColor: `${theme.colors.status.success}15`, color: theme.colors.status.success };
      case 'warning': return { backgroundColor: `${theme.colors.status.warning}15`, color: theme.colors.status.warning };
      case 'error': return { backgroundColor: `${theme.colors.status.error}15`, color: theme.colors.status.error };
      case 'info':
      default: return { backgroundColor: `${theme.colors.status.info}15`, color: theme.colors.status.info };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small': return { paddingVertical: 4, paddingHorizontal: 8, fontSize: 11 };
      case 'medium':
      default: return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.badge, { backgroundColor: variantStyles.backgroundColor, borderRadius: theme.radius.component.badge, paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal }, style]} {...rest}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.text, { ...theme.typography.styles.caption, fontSize: sizeStyles.fontSize, color: variantStyles.color, fontWeight: '600' }, textStyle]}>
          {children}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { textTransform: 'uppercase', letterSpacing: 0.5 },
  icon: { justifyContent: 'center', alignItems: 'center' },
});

export default Badge;
