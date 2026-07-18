import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateTheme as saveTheme } from '../services/api/settings';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (user?.settings?.theme) setTheme(user.settings.theme.toLowerCase());
  }, [user?.settings?.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const previousTheme = theme;
    setTheme(nextTheme);
    try { await saveTheme(nextTheme); } catch (error) { setTheme(previousTheme); }
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
