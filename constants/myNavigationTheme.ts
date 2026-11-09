import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { Colors } from './Colors';

export const MyDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.PRIMARY,
    notification: Colors.dark.tint,
  },
};

export const MyLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.PRIMARY,
    notification: Colors.light.tint,
  },
};