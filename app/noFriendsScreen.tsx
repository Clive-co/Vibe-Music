import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import FindFriends from '@/components/profile/friends/FindFriends'
import { useActiveColors } from '@/constants/ThemeMode'

const NoFriendScreen = () => {

    const activeColors = useActiveColors()
  return (
    <>
    <Stack.Screen
    name='nofriends'
    options={{
        title: "Find Friends",
        headerShown: true,
        contentStyle: {
            backgroundColor: activeColors.background,
        },
        headerStyle: {
            backgroundColor: activeColors.background,
        },
        headerTintColor: activeColors.text,
        
    }}
    />
    <View style={{flex: 1, marginTop: 20, backgroundColor:activeColors.background,}}>
      <FindFriends/>
    </View>
    </>
  )
}

export default NoFriendScreen

const styles = StyleSheet.create({})