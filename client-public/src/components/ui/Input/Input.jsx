/**
 * Input Component
 * 
 * Champ de saisie avec styling cohérent et states.
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const Input = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  multiline = false,
  icon,
  iconPosition = 'left',
  style,
  inputStyle,
  ...rest
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles = [
    styles.container,
    {
      backgroundColor: theme.colors.background.paper,
      borderRadius: theme.radius.component.input,
      borderWidth: 1.5,
      borderColor: error
        ? theme.colors.status.error
        : isFocused
        ? theme.colors.primary.main
        : theme.colors.border.light,
      ...theme.shadows.soft,
    },
    disabled && styles.disabled,
    style,
  ];

  const inputStyles = [
    styles.input,
    {
      ...theme.typography.styles.body,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.base,
    },
    icon && iconPosition === 'left' && { paddingLeft: theme.spacing.xl + 8 },
    icon && iconPosition === 'right' && { paddingRight: theme.spacing.xl + 8 },
    multiline && { minHeight: 100, textAlignVertical: 'top' },
    inputStyle,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { ...theme.typography.styles.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm }]}>
          {label}
        </Text>
      )}
      <View style={containerStyles}>
        {icon && iconPosition === 'left' && <View style={[styles.iconLeft, { left: theme.spacing.base }]}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          editable={!disabled}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyles}
          {...rest}
        />
        {icon && iconPosition === 'right' && <View style={[styles.iconRight, { right: theme.spacing.base }]}>{icon}</View>}
      </View>
      {error && (
        <Text style={[styles.error, { ...theme.typography.styles.caption, color: theme.colors.status.error, marginTop: theme.spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  container: { position: 'relative' },
  input: { width: '100%' },
  label: { fontWeight: '500' },
  disabled: { opacity: 0.5 },
  iconLeft: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  iconRight: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  error: {},
});

export default Input;
