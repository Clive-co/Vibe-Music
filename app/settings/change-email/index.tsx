import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { Link, useRouter } from 'expo-router'
import { AntDesign } from '@expo/vector-icons'
import { useActiveColors } from '@/constants/ThemeMode'

const Page = () => {
  const activeColors = useActiveColors();
  const router = useRouter()
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios'? 'padding' : undefined }
      keyboardVerticalOffset={60}
    style={{flex: 1,}}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={{backgroundColor: activeColors.background, flex: 1, alignItems: 'center', justifyContent: 'space-evenly',}}>
      <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 20,}}>Enter your password</Text>

      <TextInput
      placeholder='password'
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
      
      {/* <Link href={'/settings/change-number/number'} asChild> */}
      <TouchableOpacity style={{
        padding:15,
        width: '80%',
        backgroundColor:Colors.PRIMARY,
        borderRadius: 99,
        shadowOpacity: 0.2,
        elevation:2,
      }} onPress={() => router.replace('/settings/change-email/email')}>
        <Text style={{
            color:Colors.WHITE,
            textAlign: "center",
            alignItems: 'center',
            justifyContent: 'center',
        }}>Confirm <AntDesign name="arrowright" size={12} color={Colors.WHITE}/></Text>
      </TouchableOpacity>
      {/* </Link> */}
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default Page

const styles = StyleSheet.create({})