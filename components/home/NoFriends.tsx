import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import NoFriends1 from '@/assets/svg/NoFriends1'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { useRouter } from 'expo-router'



const NoFriends = () => {
    const activeColors = useActiveColors()
    const paddingBottom = useBottomTabBarHeight()
    const navigation = useNavigation()



const router = useRouter();

const goToFindFriends = () => {
  router.push('/noFriendsScreen'); // Switch to Profile tab only
};
  return (
    <View style = {{flex: 1,  gap: 20, backgroundColor: activeColors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: paddingBottom}}>
        <NoFriends1 size={150}/>
      <Text style={{color: activeColors.text, fontWeight: 'bold',}}>Oops! You have no friends</Text>
      <TouchableOpacity onPress={goToFindFriends} style={{padding:10, borderRadius: 10, borderWidth: 1.5, borderColor: activeColors.colorText, alignItems: 'center', justifyContent: 'center', marginTop: 20,}}>
        <Text style = {{color: activeColors.text, fontSize: 13,}}>Find friends</Text>
      </TouchableOpacity>
    </View>
  )
}

export default NoFriends

const styles = StyleSheet.create({})