/**
 * Animations Core
 * 
 * Définitions d'animations réutilisables pour toute l'app.
 * Utilise React Native Animated ou Reanimated.
 * 
 * Animations:
 * - slide (left/right/up/down)
 * - fade (in/out)
 * - scale (in/out)
 * - bounce
 * - spring
 */

import { Animated, Easing } from 'react-native';

/**
 * Duration presets
 */
export const duration = {
  fast: 200,
  normal: 300,
  slow: 500,
};

/**
 * Easing presets
 */
export const easing = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  spring: Easing.elastic(1),
};

/**
 * Fade Animation
 */
export const fadeIn = (animatedValue, duration = 300, callback) => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

export const fadeOut = (animatedValue, duration = 300, callback) => {
  Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Slide Animation
 */
export const slideIn = (animatedValue, direction = 'right', duration = 300, callback) => {
  const toValue = 0;
  Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

export const slideOut = (animatedValue, direction = 'left', distance = 300, duration = 300, callback) => {
  const toValue = direction === 'left' ? -distance : distance;
  Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Scale Animation
 */
export const scaleIn = (animatedValue, duration = 300, callback) => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

export const scaleOut = (animatedValue, duration = 300, callback) => {
  Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: easing.smooth,
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Spring Animation
 */
export const springIn = (animatedValue, callback) => {
  Animated.spring(animatedValue, {
    toValue: 1,
    friction: 7,
    tension: 40,
    useNativeDriver: true,
  }).start(callback);
};

/**
 * Bounce Animation
 */
export const bounce = (animatedValue, callback) => {
  Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.1,
      duration: 150,
      easing: easing.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      easing: easing.easeIn,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

/**
 * Shake Animation (pour erreurs)
 */
export const shake = (animatedValue, callback) => {
  Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start(callback);
};

/**
 * Category Slide Animation (CRITICAL pour Menu)
 */
export const categorySlide = {
  out: (animatedValue, callback) => {
    Animated.timing(animatedValue, {
      toValue: -300,
      duration: 250,
      easing: easing.smooth,
      useNativeDriver: true,
    }).start(callback);
  },
  in: (animatedValue, callback) => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 250,
      easing: easing.smooth,
      useNativeDriver: true,
    }).start(callback);
  },
};

export default {
  duration,
  easing,
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scaleIn,
  scaleOut,
  springIn,
  bounce,
  shake,
  categorySlide,
};
