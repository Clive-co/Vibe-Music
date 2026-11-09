import { useFonts } from "expo-font";
import { Link, router, Stack } from "expo-router";
import "@/global.css";
import { GlobalProvider } from "../context/GlobalProvider";
import { Colors, theme } from "@/constants/Colors";
import { TouchableOpacity, useColorScheme, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { useActiveColors } from "@/constants/ThemeMode";
import { Amplify } from "aws-amplify";
import amplifyconfig from "../src/amplifyconfiguration.json";
import React, { useEffect, useState } from "react";
//import { NavigationIntentProvider } from "@/utils/navigationTrigger";
import { MyDarkTheme, MyLightTheme } from "@/constants/myNavigationTheme";
import { ThemeProvider, useTheme } from "@/constants/ThemeProvider";
//import { ThemeProvider } from "@react-navigation/native";
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';

Amplify.configure(amplifyconfig);

const ThemeContext = React.createContext('light');


export default function RootLayout() {
  const activeColors = useActiveColors();
  const closeButtonDisplay = Platform.OS == "android" ? "none" : "flex";

  useFonts({
    dmsans: require("../assets/fonts/DMSans-Regular.ttf"),
    "dmsans-medium": require("../assets/fonts/DMSans-Medium.ttf"),
    "dmsans-semibold": require("../assets/fonts/DMSans-SemiBold.ttf"),
    "dmsans-bold": require("../assets/fonts/DMSans-Bold.ttf"),
  });

  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? MyDarkTheme : MyLightTheme

  const {mode, setMode} = useTheme()

  const resolvedMode = mode === 'system' ? (scheme ?? 'light') : mode;

  function getMode(theme: any) {
  return theme.dark ? 'dark' : 'light';
}

//const { resolvedMode } = useTheme();

 useEffect(() => {
    const setNavigationBar = async () => {
      if (resolvedMode === 'dark') {
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light');
      } else {
        await NavigationBar.setBackgroundColorAsync('#ffffff');
        await NavigationBar.setButtonStyleAsync('dark');
      }
    };

    setNavigationBar();
  }, [resolvedMode]);

  return (
<ThemeProvider>
    <GlobalProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: activeColors.background }}>
        <BottomSheetModalProvider>
          <PaperProvider>
            {/* <ThemeProvider value={theme}> */}
            <Stack screenOptions={{animation: 'default', headerShown: false,  contentStyle: {backgroundColor: activeColors.background,} }} >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />

              {/* <Stack.Screen name="(tabs)"/>  */}

              <Stack.Screen
                name="(modals)/new-interaction"
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "New Interaction",
                  headerTransparent: true,
                  headerBlurEffect: "regular",
                  headerTintColor: activeColors.text,
                  headerStyle: {
                    backgroundColor: activeColors.background,
                  },
                  headerTitleStyle: { color: activeColors.text },
                  headerSearchBarOptions: {
                    placeholder: "Find a friend",
                    hideWhenScrolling: false,
                    textColor: activeColors.text,
                    headerIconColor: activeColors.text,
                    tintColor: activeColors.text,
                    hintTextColor: activeColors.text,
                    shouldShowHintSearchIcon: false,
                  },
                  headerRight: () => (
                    
                      <TouchableOpacity
                        style={{
                          backgroundColor: Colors.lightGray,
                          borderRadius: 20,
                          padding: 4,
                          display: closeButtonDisplay,
                        }}
                        onPress={()=> router.back()}
                      >
                        <Ionicons name="close" color={Colors.GRAY} size={30} />
                      </TouchableOpacity>
                    
                  ),
                }}
              />

              {/* <Stack.Screen name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          headerBackTitleVisible: false,
          headerBackVisible: true,
          //headerLargeTitle: true,      
          // headerSearchBarOptions: {
          //   placeholder: "Find a friend",
          //   hideWhenScrolling: true,
          // },
        }}
        /> */}

              <Stack.Screen
                name="auth/forgot/index"
                options={{
                  title: "forgot password",
                  presentation: "modal",
                }}
              />

              <Stack.Screen
                name="auth/forgot/reset"
                options={{
                  title: "reset password",
                  presentation: "modal",
                }}
              />

              <Stack.Screen
                name="auth/verify/index"
                options={{
                  title: "Verify Email",
                }}
              />

              <Stack.Screen
              name="(modals)/notifications"
              options={{
                title: "notifications",
                presentation: 'modal',
                animation: "fade_from_bottom"
                
              }}
              />

            
            </Stack>
            
            {/* </ThemeProvider> */}
            {/* <StatusBar style={theme.mode === "dark" ? "light" : "dark"} /> */}
              <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'}/>
              
              

          </PaperProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </GlobalProvider>
    </ThemeProvider>
  );
}
