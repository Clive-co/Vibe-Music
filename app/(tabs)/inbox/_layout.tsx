import { ContactsButton } from '@/components/stackButtons';
import { Colors } from '@/constants/Colors';
import { useActiveColors } from '@/constants/ThemeMode';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { useNavigationContainerRef } from '@react-navigation/native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Button, Image, Platform, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchFriends, Friend } from '@/utils/service_api/friendshipServiceApi'

const FRIENDS_CACHE_KEY = 'cachedHomeFriends'
const MAX_INITIAL = 10

const Layout = () => {
  const activeColors = useActiveColors();
  const item = useLocalSearchParams();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([])

  // fetch & cache on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // load from cache first
      const j = await AsyncStorage.getItem(FRIENDS_CACHE_KEY)
      if (j && !cancelled) {
        setFriends(JSON.parse(j))
      }
      // then fresh
      try {
        const fresh = await fetchFriends()
        if (!cancelled) {
          setFriends(fresh)
          await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(fresh))
        }
      } catch (e) {
        console.error('Failed to load friends:', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const onNewInteraction = () => {
    const initial = friends
      .slice(0, MAX_INITIAL)
      .map(f => ({
        friendID:   f.friendId,
        username:   f.username,
        profileImg: f.profileImg
      }))
    const qs = encodeURIComponent(JSON.stringify(initial))
    router.push({
      pathname: '/(modals)/new-interaction',
      params: { initialFriends: qs }
    })
  }

  const navigationRef = useNavigationContainerRef()
  return (
    <Stack>
        <Stack.Screen
        name='index'
        options={{
            title: 'Inbox',
            headerLargeTitle: true,
            headerShadowVisible: false,
            headerTitleStyle: {color: activeColors.text,},
            headerStyle: {backgroundColor: activeColors.background,},
       // headerTintColor: activeColors.tint,
           // headerTransparent: true,
            headerBlurEffect: 'regular',
            //headerStyle: { backgroundColor: Colors.WHITE },
            headerSearchBarOptions: {
                placeholder: 'Search',
                textColor: activeColors.text,
                tintColor: activeColors.text,
                headerIconColor: activeColors.text,
                hintTextColor: activeColors.text,
                shouldShowHintSearchIcon: false,
            },
            


            headerRight: () => (
              <TouchableOpacity
              onPressIn={onNewInteraction}
              style={{width: 35, 
              height: 35, 
              borderRadius: 99, 
              backgroundColor: activeColors.buttonBackdrop,
               alignItems: 'center', 
               justifyContent: 'center',
      
              }}>
                <Ionicons name="create-outline" size={25} color={activeColors.colorText} />
              </TouchableOpacity>
            )
    
           
        }} 
        />
    </Stack>
  )
}

export default Layout;