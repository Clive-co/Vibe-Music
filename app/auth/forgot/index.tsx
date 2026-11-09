import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import { useHeaderHeight } from '@react-navigation/elements'
import { useActiveColors } from '@/constants/ThemeMode'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { AntDesign } from '@expo/vector-icons'
import { resetPassword } from 'aws-amplify/auth';
import PhoneNumberPicker from '@/components/auth/PhoneNumberInput'

const ForgotPassword = () => {
  const activeColors = useActiveColors();
  const router = useRouter()
  const [callingCode, setCallingCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [error, setError] = useState('')

  const handleResetPassword = async () => {
    handleLogPhoneNumber()
    setError('')
    try {
      const output = await resetPassword({ username: fullPhoneNumber });
      router.push({ pathname: 'auth/forgot/reset', params: { fullPhoneNumber } });
    } catch (e) {
      setError(e)
      console.log(e);
    }
  }

  const handleLogPhoneNumber = () => {
    const appendedPhoneNumber = `${callingCode}${phoneNumber}`;
    setFullPhoneNumber(appendedPhoneNumber)
    console.log(fullPhoneNumber);  // Log the full phone number
  }
 
  const height = useHeaderHeight()
  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={height}
  style={{flex: 1,}}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{backgroundColor: activeColors.background, flex: 1, alignItems: 'center', justifyContent: 'space-evenly',}}>
    
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 20, alignSelf: 'center',}}>Reset Your Password</Text>

    <View style={{gap: 20, width: '80%', }}>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 14,}}>-Enter the mobile number used to register your account</Text>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 14,}}>-You will be sent a password reset code</Text>
    </View>
    
    
    
    {/* <TextInput
    placeholder='email'
    placeholderTextColor={activeColors.text}
    value={email}
    onChangeText={setEmail}
    keyboardType='email-address'
      style={{
        width: '80%', padding: 16, 
        backgroundColor: activeColors.background2, 
        borderRadius: 99, 
        fontSize: 16, 
        color: activeColors.text, 
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.GRAY,
      }}
    /> */}

    {/* Phone number */}
    <View
        style={{
          marginTop: 25,
          width: '90%',
        }}
      >

        <View style={{flexDirection: 'row', justifyContent: 'space-between',}}>
          <View style={{
            width: '30%', 
            alignItems: 'center',
            justifyContent: 'center',
           // backgroundColor: 'red',
            borderWidth: 1, 
            borderRadius: 15, borderColor: Colors.GRAY,
            }}>
        <PhoneNumberPicker onSelectCode={setCallingCode} />
        </View>
        <TextInput
                style={{ padding: 15,
                    borderWidth: 1,
                    width: '67%',
                    borderRadius: 15,
                    color: activeColors.text,
                    borderColor: Colors.GRAY,
                    fontFamily: "dmsans",}}
                placeholder="123456789"
                placeholderTextColor={'gray'}
                selectionColor={"#000"}
                keyboardType='numeric'
                value={phoneNumber}
                onChangeText={setPhoneNumber}
            />
            </View>
        {/* <Text onPress={()=> handleLogPhoneNumber()}>log</Text> */}
      </View>
    
    {/* <Link href={'settings'} asChild> */}
    <TouchableOpacity style={{
      padding:15,
      width: '80%',
      backgroundColor:Colors.PRIMARY,
      borderRadius: 99,
      shadowOpacity: 0.2,
      elevation:2,
          }} onPress={() => {
            handleResetPassword()
          }}>
      <Text style={{
          color:Colors.WHITE,
          textAlign: "center",
          fontSize: 15
      }}>Get code<AntDesign name='arrowright' size={13}/></Text>
    </TouchableOpacity>
    {/* </Link> */}
  </View>
  </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  )
}

export default ForgotPassword

const styles = StyleSheet.create({})