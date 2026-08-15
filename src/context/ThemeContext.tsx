// ROKDA THEME CONTEXT & BESPOKE DESIGN SYSTEM TOKENS
// Obsidian Midnight & Emerald/Coral Fusion Palette (Unique & Original Identity)

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

// Bespoke Dark Obsidian Midnight & Emerald/Coral Palette
const darkColors: ThemeColors = {
  bg: '#0B0F17',
  card: '#141C2E',
  cardBorder: '#222E4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accent: '#10B981',           // Emerald Jade (Income & Primary Action)
  accentLight: '#10B98122',    // Emerald Glow Tint
  accentSecondary: '#FF6B4A',  // Coral Sunset Accent
  danger: '#FB7185',           // Rose Red (Expense)
  warning: '#FBBF24',          // Champagne Gold
  success: '#34D399',          // Mint Green
  tabBar: '#0E1524',
  tabBarBorder: '#1C283F',
  inputBg: '#1A243B'
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
  accentSecondary: '#F97316',
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
