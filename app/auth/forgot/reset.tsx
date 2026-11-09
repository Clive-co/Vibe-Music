import { View, Text, KeyboardAvoidingView, Platform, TextInput, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useNavigation, useRouter, useLocalSearchParams  } from 'expo-router';
import { useActiveColors } from '@/constants/ThemeMode';
import { Colors } from '@/constants/Colors';
import { AntDesign } from '@expo/vector-icons';
import { confirmResetPassword } from 'aws-amplify/auth';

const Reset = () => {
  const { email } = useLocalSearchParams(); 
  const navigation = useNavigation();
  const router = useRouter();
  const activeColors = useActiveColors();

  const [isFocused1, setIsFocused1] = useState(false)
  const [isFocused2, setIsFocused2] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const handleConfirmResetPassword = async () => {
    setError('')
    try {
      await confirmResetPassword({ username: email, confirmationCode, newPassword });
      router.replace('auth/sign-in')
    } catch (e) {
      setError(e)
      console.log(e);
    }
  }
  return (
    <KeyboardAvoidingView
    behavior={Platform.OS == "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS == 'ios' ? 6 : 0}
    contentContainerStyle={{ backgroundColor: activeColors.background, flex: 1 }}
    style={{
         flex: 1, 
         backgroundColor: activeColors.background,
        }}
  >
<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
<View 
style={{
    padding: 25,
            //paddingTop: 50,
           // paddingBottom: 20,
            flex: 1,
            //gap: 50,
            justifyContent: 'space-evenly',
}}
>
<Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 20, alignSelf: 'center',}}>Set New Password</Text>

<View style={{gap: 15, width: '80%', }}>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 14,}}>-Enter a new Password</Text>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 14,}}>-Use something you can remember</Text>
    <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 14,}}>-Mix letters, numbers and symbols for extra strength</Text>
    </View>


    <View style={{gap: 20,}}>
    {/* Password */}
    <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
             Reset Code
            </Text>
            <TextInput
            onFocus={()=> setIsFocused1(true)}
            onBlur={()=> setIsFocused1(false)}
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 15,
                borderColor: isFocused1? activeColors.colorText : Colors.GRAY,
                fontFamily: "dmsans",
              }}
              secureTextEntry={true}
              placeholder="Enter Reset Code"
              placeholderTextColor={Colors.GRAY}
              value={confirmationCode}
              onChangeText={setConfirmationCode}
            />
          </View>

          {/*Confirm Password */}
          <View
            style={{
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "dmsans",
                paddingBottom: 5,
                left: 5,
                color: activeColors.text,
              }}
            >
              New Password
            </Text>
            <TextInput
            onFocus={()=> setIsFocused2(true)}
            onBlur={()=> setIsFocused2(false)}
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 15,
                borderColor: isFocused2? activeColors.colorText : Colors.GRAY,
                fontFamily: "dmsans",
              }}
              secureTextEntry={true}
              placeholder="Enter New Password"
              placeholderTextColor={Colors.GRAY}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          </View>


          <TouchableOpacity style={{
      padding:15,
      width: '100%',
      alignSelf: 'center',
      backgroundColor:Colors.PRIMARY,
      borderRadius: 99,
      shadowOpacity: 0.2,
      elevation:2,
    }} onPress={() => handleConfirmResetPassword()}>
      <Text style={{
          color:Colors.WHITE,
          textAlign: "center",
          fontSize: 15
      }}>Set password</Text>
    </TouchableOpacity>


</View>
</TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  )
}

export default Reset