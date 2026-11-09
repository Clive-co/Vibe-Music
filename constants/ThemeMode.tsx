// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import { useColorScheme } from 'react-native';
// import { Colors } from './Colors';

// type ThemeMode = 'light' | 'dark';

// export function useActiveColors() {
//   const scheme = useColorScheme();
//   return scheme ? Colors[scheme] : Colors.light;
// }

import { useTheme } from './ThemeProvider';

export function useActiveColors() {
  const { colors } = useTheme();
  return colors;
}