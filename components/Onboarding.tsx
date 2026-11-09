import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { AntDesign } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useActiveColors } from '@/constants/ThemeMode'

export default function Onboarding() {

    const router = useRouter();
    const activeColors = useActiveColors();

  return (
    <View>
      <Image source={require('../assets/images/splash2.jpg')}
      style={{
        width: '100%',
        height: '40%',
      }}
      />

      <View style={{
        backgroundColor: activeColors.background,
        marginTop: -80,
        height: '100%' ,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30, 
        padding: 25
      }}>
        <Text style={{
            fontSize: 28,
            fontFamily: 'dmsans-bold',
            textAlign: 'center',
            marginTop: 10,
            color: activeColors.text,
        }}>Vibe Connect</Text>

        <Text style={{
            fontFamily: 'dmsans',
            fontSize: 17,
            textAlign: 'center',
            color: Colors.GRAY,
            marginTop: 20
        }}>Find your rhythm, find your people. Together, the music sounds better.</Text>

        <TouchableOpacity style={{
           padding: 15,
           backgroundColor: Colors.PRIMARY,
           borderRadius: 99,
           marginTop: '25%'
        }} 
        onPress={()=> router.replace('auth/sign-in')}
        >
            <Text style={{color:Colors.WHITE,
                textAlign: 'center',
                fontFamily: 'dmsans',
                fontSize: 17
            }}>Begin <AntDesign name='arrowright' size={15}/></Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
})