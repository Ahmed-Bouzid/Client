/**
 * ThemeProvider
 * 
 * Context React pour exposer le thème à toute l'application.
 * Permet également de supporter plusieurs thèmes (restaurant-specific).
 * 
 * Usage:
 * 
 * // Dans App.jsx
 * <ThemeProvider>
 *   <YourApp />
 * </ThemeProvider>
 * 
 * // Dans un composant
 * const { theme } = useTheme();
 * <View style={{ backgroundColor: theme.colors.background.default }} />
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { defaultTheme } from './theme';

/**
 * Theme Context
 */
const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
});

/**
 * ThemeProvider Component
 */
export const ThemeProvider = ({ children, initialTheme = defaultTheme }) => {
  const [theme, setTheme] = useState(initialTheme);

  // Memoize context value pour éviter re-renders inutiles
  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * 
 * Hook personnalisé pour accéder au thème dans les composants
 * 
 * @returns {Object} { theme, setTheme }
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * withTheme HOC (Higher Order Component)
 * 
 * Alternative au hook pour les class components
 * 
 * @param {Component} Component - Composant à wrapper
 * @returns {Component} - Composant avec props.theme
 */
export const withTheme = (Component) => {
  return (props) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeProvider;
