import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { useActiveColors } from '@/constants/ThemeMode'

const _layout = () => {

    const activeColors = useActiveColors();
  return (
    <Stack>
        <Stack.Screen
        name='index'
        options={{
           headerTitle: "",
        }}
        />

        <Stack.Screen
        name='friends'
        options={{
            title: 'Friends',
        }}
        />
    </Stack>
  )
}

export default _layout

const styles = StyleSheet.create({})