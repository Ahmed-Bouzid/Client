/**
 * BottomSheet Component
 */

import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { useTheme } from '../../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BottomSheet = ({ children, visible, onClose, height = 'auto', style, ...rest }) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) translateY.setValue(gestureState.dy); },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose && onClose();
        } else {
          Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} {...rest}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface.overlay, opacity }]} />
        </TouchableOpacity>
        <Animated.View
          style={[styles.sheet, { backgroundColor: theme.colors.background.paper, ...theme.getPartialRadius.top('xl'), ...theme.shadows.strong, maxHeight: height === 'auto' ? SCREEN_HEIGHT * 0.9 : height, transform: [{ translateY }] }, style]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border.medium }]} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject },
  sheet: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  content: { flex: 1 },
});

export default BottomSheet;
