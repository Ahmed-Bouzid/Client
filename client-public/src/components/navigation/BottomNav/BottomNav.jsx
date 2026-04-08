/**
 * BottomNav Component
 * 
 * Navigation bottom customisée avec forme organique
 * Basée sur le design des templates
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export const BottomNav = ({
  items = [],
  activeIndex = 0,
  onItemPress,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface.default, ...theme.shadows.strong }, style]} {...rest}>
      <View style={styles.itemsContainer}>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => onItemPress && onItemPress(index)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && { backgroundColor: `${theme.colors.primary.main}15` }]}>
                {item.icon && item.icon}
              </View>
              
              {item.label && (
                <Text style={[
                  styles.label,
                  { ...theme.typography.styles.caption, color: isActive ? theme.colors.primary.main : theme.colors.text.secondary }
                ]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  itemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default BottomNav;
