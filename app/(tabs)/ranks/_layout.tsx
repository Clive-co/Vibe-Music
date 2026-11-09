import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useActiveColors } from '@/constants/ThemeMode'

const _layout = () => {

    const activeColors = useActiveColors();
    const { leagueName } = useLocalSearchParams<{ leagueName: string }>();
  return (
    <Stack>
        <Stack.Screen
        name='index'
        options={{
           headerTitle: "Challenges & Ranks",
           headerShown: true,
           headerStyle: {backgroundColor: activeColors.background,},
           headerTitleStyle: {color: activeColors.text,},
           contentStyle: {backgroundColor: activeColors.background,},
        }}
        />

        <Stack.Screen
         name="LeagueDetails"
         options={{
           headerShown: true, // Show the header
           headerStyle: { backgroundColor: activeColors.background,},
           headerTitleStyle: { color: activeColors.text, },
           headerBackButtonDisplayMode: 'minimal',
           headerTintColor: activeColors.text,
           contentStyle: {backgroundColor: activeColors.background,},
          //  headerBackground: () => (
          //   <View></View>
          //  ),
          
         }}
        />
    </Stack>
  )
}

export default _layout

const styles = StyleSheet.create({})