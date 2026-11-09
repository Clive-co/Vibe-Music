import React, { createContext, useContext, useState, useEffect } from 'react';
//import { useColorScheme } from 'nativewind';
import { Colors } from './Colors';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof Colors.light; // or dark
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  colors: Colors.light,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [colors, setColors] = useState(Colors.light);

  useEffect(() => {
    const colorScheme = mode === 'system' ? systemScheme : mode;
    if (colorScheme === 'dark') setColors(Colors.dark);
    else setColors(Colors.light);
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export function useTheme() {
  const { mode, setMode, colors } = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  // Decide resolvedMode: if 'system', use phone setting, else use app setting
  const resolvedMode = mode === 'system' ? (systemScheme ?? 'light') : mode;

  return { mode, setMode, colors, resolvedMode };
}