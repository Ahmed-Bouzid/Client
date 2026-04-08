/**
 * Background Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const Background = ({ children, variant = 'default', style, ...rest }) => {
  const { theme } = useTheme();

  const getBackgroundStyles = () => {
    switch (variant) {
      case 'gradient': return { backgroundColor: theme.colors.background.default };
      case 'pattern': return { backgroundColor: theme.colors.background.subtle };
      case 'default':
      default: return { backgroundColor: theme.colors.background.default };
    }
  };

  return <View style={[styles.background, getBackgroundStyles(), style]} {...rest}>{children}</View>;
};

const styles = StyleSheet.create({ background: { flex: 1 } });

export default Background;
