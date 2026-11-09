import { Keyboard, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import {  Colors } from '@/constants/Colors'
import { Link, useRouter } from 'expo-router'
import { Platform } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { useActiveColors } from '@/constants/ThemeMode'

const Email = () => {
  const activeColors = useActiveColors();
  const router = useRouter()

  const height = useHeaderHeight()
  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={height}
  style={{flex: 1,}}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{backgroundColor: activeColors.background, flex: 1, alignItems: 'center', justifyContent: 'space-evenly',}}>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 20,}}>Edit your Email</Text>

    <TextInput
    placeholder='email'
    placeholderTextColor={activeColors.text}
      secureTextEntry={true}
      style={{
        width: '80%', 
        padding: 16, 
        backgroundColor: activeColors.background2, 
        borderRadius: 99, 
        fontSize: 16, 
        color: activeColors.text,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.GRAY,
      }}
    />
    
    {/* <Link href={'settings'} asChild> */}
    <TouchableOpacity style={{
      padding:15,
      width: '80%',
      backgroundColor:Colors.PRIMARY,
      borderRadius: 99,
      shadowOpacity: 0.2,
      elevation:2,
    }} onPress={() => router.back()}>
      <Text style={{
          color:Colors.WHITE,
          textAlign: "center",
      }}>Save</Text>
    </TouchableOpacity>
    {/* </Link> */}
  </View>
  </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  )
}

export default Email

const styles = StyleSheet.create({})