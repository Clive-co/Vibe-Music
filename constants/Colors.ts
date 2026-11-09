/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#756181';
const tintColorDark = '#756181';

const tintColorLight2 = '#000';
const tintColorDark2 = '#fff';

export const Colors = {
  LIGHTSLATE: "#fbfbfc",
  slate: "#f7f7f9",
  BLACK: "#000",
  WHITE: '#fff',
  PRIMARY: '#4A227A',
  GRAY: '#7d7d7d',
  lightGray: '#DCDCE2',
  light: {
    colorText: '#4A227A',
    text: '#11181C',
    background: '#fff',
    background2: 'rgba(25, 25, 25, .03 )',
    shadowColor: "#171717",
    sheet: "#fff",
    input: "#DCDCE2",
    tabBlurIntensity: 90,
    inputBlurIntensity: 200, //80 former value
    tint: '#000',
    border: "#DCDCE2",
    icon: '#687076',
    button1: "rgba(25, 25, 25, .5)",
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight2,
    buttonBackdrop: 'rgba(25, 25, 25, 0.06)',
    homeButtonBackdrop: 'rgba(255, 255, 255, 0.1)',
    blurButton: 'rgba(25, 25, 25, 0.07)',
  },
  dark: {
    colorText: '#756181',
    text: '#ECEDEE',
    background: '#000',
    background2: 'rgba(255, 255, 255, 0.07)',
    sheet: "#151718",
    input: "#151718",
    tint: '#fff',
    tabBlurIntensity: 8,
    inputBlurIntensity: 15,
    border: "#000",
    shadowColor: "#fff",
    icon: '#9BA1A6',
    button1: '#000',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark2,
    buttonBackdrop: 'rgba(255, 255, 255, 0.06)',
    homeButtonBackdrop: 'rgba(25, 25, 25, 0.15)',
    blurButton: 'rgba(255, 255, 255, 0.08)',
  },
};

type ThemeMode = 'light' | 'dark';

export const theme: { mode: ThemeMode } = { mode: "dark" };
  
  export let activeColors = Colors[theme.mode];