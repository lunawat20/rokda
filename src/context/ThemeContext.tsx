// ROKDA THEME CONTEXT & BESPOKE DESIGN SYSTEM TOKENS
// Modern Gen-Z Cyber Obsidian & Neon Emerald Palette

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentSecondary: string;
  danger: string;
  warning: string;
  success: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
}

// Gen-Z Cyber Obsidian & Neon Emerald Palette
const darkColors: ThemeColors = {
  bg: '#06090E',
  card: '#0E1420',
  cardBorder: '#1C293E',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accent: '#00FF9D',           // Neon Cyber Emerald
  accentLight: '#00FF9D1A',    // Neon Emerald Tint
  accentSecondary: '#A855F7',  // Electric Purple
  danger: '#FF5E7E',           // Hot Crimson Coral
  warning: '#FFB800',          // Cyber Amber
  success: '#00FF9D',
  tabBar: '#0A0F19',
  tabBarBorder: '#1A2436',
  inputBg: '#141D2E'
};

const lightColors: ThemeColors = {
  bg: '#F8FAF9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accent: '#059669',
  accentLight: '#ECFDF5',
  accentSecondary: '#8B5CF6',
  danger: '#E11D48',
  warning: '#D97706',
  success: '#10B981',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  inputBg: '#F1F5F9'
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: true,
  colors: darkColors,
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useRNColorScheme();
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
