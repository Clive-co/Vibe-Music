import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState, useContext } from 'react'
import { Colors } from '@/constants/Colors'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { RadioButton } from 'react-native-paper'
import { useActiveColors } from '@/constants/ThemeMode'
import { useRouter } from 'expo-router'
import { signOut } from 'aws-amplify/auth';
import { GlobalContext } from "../../context/GlobalProvider";

const DangerButtons = () => {
    const activeColors = useActiveColors();
    const router = useRouter();
    const [error, setError] = useState('')
    const { removeUserId } = useContext<any>(GlobalContext);

  async function handleSignOut() {
    removeUserId ()
    setError('')
    try {
      await signOut();
      router.replace('auth/sign-in')
    } catch (e) {
      setError(e)
      console.log('error signing out: ', e);
    }
  }
  
  return (
    <>
      <View style={{ width: "90%", marginVertical: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.GRAY }}>
            Danger
          </Text>
        </View>

        <View
          style={{
            width: "100%",
            borderRadius: 20,
            //gap: 20,
            backgroundColor: activeColors.background2,
          }}
        >
            {/* <Link href={'/auth/sign-in'} asChild> */}
        
        <TouchableOpacity
        onPress={()=> handleSignOut()}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
          }}
        >
            
          <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}>
          
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                backgroundColor: activeColors.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="power-outline" size={24} color="#ef233c" />
            </View>

            <Text style={{ fontSize: 14, color: '#ef233c', }}>Logout</Text>
          </View>

          <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
        </TouchableOpacity>

        <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash-outline" size={24} color={Colors.PRIMARY}/>
              </View>

              <Text style={{ fontSize: 14, color: activeColors.colorText,}}>Delete account</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>
          
        {/* </Link> */}
        </View>
    </>
  )
}

export default DangerButtons

const styles = StyleSheet.create({})