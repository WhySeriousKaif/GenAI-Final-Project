// =========================================================================
// Theme Context — Dark / Light Mode Toggle
// =========================================================================
// Manages the global theme state. Persists to localStorage and applies
// the 'dark' class on the <html> element so CSS variables override.

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Respect saved preference, otherwise check system preference
    const saved = localStorage.getItem('lexicore-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('lexicore-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('lexicore-theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
