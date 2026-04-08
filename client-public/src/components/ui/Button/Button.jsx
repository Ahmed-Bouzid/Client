/**
 * Button Component
 * 
 * Composant bouton premium avec variants et tailles multiples.
 * Basé sur le design des templates (pill-shaped, moderne).
 * 
 * Variants:
 * - primary: Bouton principal (rouge/corail)
 * - secondary: Bouton secondaire (navy)
 * - tertiary: Bouton tertiaire (outline)
 * - ghost: Bouton fantôme (transparent)
 * 
 * Sizes:
 * - small: Compact
 * - medium: Standard
 * - large: Prominent
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'tertiary' | 'ghost'
 * - size: 'small' | 'medium' | 'large'
 * - fullWidth: boolean
 * - disabled: boolean
 * - loading: boolean
 * - icon: React element (icon à afficher)
 * - iconPosition: 'left' | 'right'
 * - onPress: function
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  ...rest
}) => {
  const { theme } = useTheme();

  // Styles dynamiques basés sur variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.text.tertiary
              : theme.colors.primary.main,
            borderWidth: 0,
          },
          text: {
            color: theme.colors.primary.contrast,
          },
          loader: theme.colors.primary.contrast,
        };

      case 'secondary':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.text.tertiary
              : theme.colors.secondary.main,
            borderWidth: 0,
          },
          text: {
            color: theme.colors.secondary.contrast,
          },
          loader: theme.colors.secondary.contrast,
        };

      case 'tertiary':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled
              ? theme.colors.border.medium
              : theme.colors.primary.main,
          },
          text: {
            color: disabled
              ? theme.colors.text.tertiary
              : theme.colors.primary.main,
          },
          loader: theme.colors.primary.main,
        };

      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: disabled
              ? theme.colors.text.tertiary
              : theme.colors.text.primary,
          },
          loader: theme.colors.text.primary,
        };

      default:
        return getVariantStyles.call(this, 'primary');
    }
  };

  // Styles dynamiques basés sur size
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            minHeight: 36,
          },
          text: {
            ...theme.typography.styles.buttonSmall,
          },
          iconSize: 16,
        };

      case 'medium':
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: 24,
            minHeight: 48,
          },
          text: {
            ...theme.typography.styles.button,
          },
          iconSize: 20,
        };

      case 'large':
        return {
          container: {
            paddingVertical: 18,
            paddingHorizontal: 32,
            minHeight: 56,
          },
          text: {
            ...theme.typography.styles.button,
            fontSize: 18,
          },
          iconSize: 24,
        };

      default:
        return getSizeStyles.call(this, 'medium');
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Styles du container
  const containerStyles = [
    styles.base,
    {
      borderRadius: theme.radius.pill, // Pill-shaped !
      ...theme.shadows.soft,
      ...variantStyles.container,
      ...sizeStyles.container,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  // Styles du texte
  const textStyles = [
    styles.text,
    sizeStyles.text,
    variantStyles.text,
    textStyle,
  ];

  // Rendu du contenu
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={variantStyles.loader}
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        <Text style={textStyles}>{children}</Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
