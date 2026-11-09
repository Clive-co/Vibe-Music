import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DefaultTheme } from '@react-navigation/native'
import { Colors } from '@/constants/Colors'
import {useHeaderHeight} from '@react-navigation/elements'
import { useActiveColors } from '@/constants/ThemeMode'

const Layout = () => {
  const activeColors = useActiveColors();
    const router = useRouter();

    const height = useHeaderHeight();
  return (
    <Stack>
        <Stack.Screen name="index"
        options={{
          title: 'Settings',
          headerShown: true,
         // headerBackTitleVisible: false,
          headerBackVisible: true,
          headerShadowVisible: false,
          headerStyle: {backgroundColor: activeColors.background,},
          headerTintColor: activeColors.tint,
          headerTitleStyle: {color: activeColors.text,},
          //headerLargeTitle: true,      
          // headerSearchBarOptions: {
          //   placeholder: "Find a friend",
          //   hideWhenScrolling: true,
          // },

          headerLeft: () => (
            <TouchableOpacity style={{display: Platform.OS == 'ios'? 'flex': 'none',}} onPress={() => router.back()}>
                <Ionicons name="chevron-back-outline" size={24} color={activeColors.text} />
                </TouchableOpacity>
          ),
        }}
        />

        <Stack.Screen name='change-email'
        options={{
            title: 'change email',
            //headerShown: Platform.OS == 'ios'? true : false,
            headerShown: true,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            // headerStyle: {
            //     backgroundColor: DefaultTheme.colors.background, 
            // },
            headerStyle: {backgroundColor: activeColors.background,},
            headerTintColor: activeColors.tint,
            headerTitleStyle: {color: activeColors.text,},

            header: () => (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: activeColors.background, padding: 30,}}>
                <TouchableOpacity style={{position: 'absolute', left: 30, borderRadius: 99, backgroundColor: "rgba(25, 25, 25, .1)", padding: 5,}} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={{fontSize: 17, alignSelf: 'center', fontWeight: 'bold', color: activeColors.text,}}>Change Email</Text>
              </View>
            ),
        }}
        />

<Stack.Screen name='blocked'
        options={{
            title: 'Blocked',
            //headerShown: Platform.OS == 'ios'? true : false,
            headerShown: true,
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            headerStyle: {backgroundColor: activeColors.background,},
            headerTintColor: activeColors.tint,
            headerTitleStyle: {color: activeColors.text,},

            header: () => (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: activeColors.background, padding: 30,}}>
                <TouchableOpacity style={{position: 'absolute', left: 30, borderRadius: 99, backgroundColor: "rgba(25, 25, 25, .1)", padding: 5,}} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={{fontSize: 17, alignSelf: 'center', fontWeight: 'bold', color: activeColors.text,}}>Blocked</Text>
              </View>
            ),
        }}
        />

<Stack.Screen name='edituser'
options={{
  title: '',
 // headerBackTitleVisible: false,
  headerShadowVisible: false,
  contentStyle: {backgroundColor: activeColors.background},
  headerStyle: {backgroundColor: activeColors.background,},
  headerTintColor: activeColors.tint,
}}
/>
    </Stack>
  )
}

export default Layout

const styles = StyleSheet.create({})