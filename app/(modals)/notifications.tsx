import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import {  Stack, useRouter } from 'expo-router'
import { AntDesign, EvilIcons, MaterialIcons } from '@expo/vector-icons'
import { useActiveColors } from '@/constants/ThemeMode'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/Colors'
import { useLocalSearchParams } from 'expo-router'
import { fetchRequests, acceptFriend, FriendRequest } from '@/utils/service_api/friendshipServiceApi'

type PreviewItem = {
  friendId:   string
  username:   string | null
  profileImg: string | null
}

const Notifications = () => {
  const { preview } = useLocalSearchParams<{ preview?: string }>()
  const [requests, setRequests] = useState<PreviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const activeColors = useActiveColors()
  const router = useRouter()

  useEffect(() => {
    if (!preview) return
    try {
      const decoded = decodeURIComponent(preview)
      const arr: PreviewItem[] = JSON.parse(decoded)
      setRequests(arr)
      console.log('Parsed preview param:', arr)
    } catch (err) {
      console.error('Could not parse preview param', err)
    }
  }, [preview])

  // 2) Fetch the full “received” requests and append any new ones
  useEffect(() => {
    let cancelled = false
    const loadFull = async () => {
      setLoading(true)
      try {
        const received: FriendRequest[] = await fetchRequests('received')
        if (cancelled) return

        // Map to our PreviewItem shape
        const full: PreviewItem[] = received.map(r => ({
          friendId: r.friendId,
          username: r.username,
          profileImg: r.profileImg,
        }))

        // Dedupe / append only new friendIDs
        setRequests(prev => {
          const existingIds = new Set(prev.map(i => i.friendId))
          const toAdd = full.filter(i => !existingIds.has(i.friendId))
          return [...prev, ...toAdd]
        })
      } catch (err) {
        console.error('Error fetching full received requests', err)
        Alert.alert('Error', 'Could not load notifications')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadFull()
    return () => { cancelled = true }
  }, [])

  return (
    <>
    <Stack.Screen
    options={{
      // headerShown: true,
      // headerShadowVisible: false,
      // headerTitleAlign: 'center',
      // headerBackVisible: false,
      // headerRight: () => (
      //   <TouchableOpacity onPressIn={()=> router.back()} style={{right: 10,}}>
      //     <AntDesign name='closecircleo' size={25} color={activeColors.colorText} />
      //   </TouchableOpacity>
        
      // ),
    }}
    />
    <SafeAreaView style={{backgroundColor: activeColors.background, flex: 1,}}>
      <View style={{alignItems: 'center', justifyContent: 'center', marginTop: 20, flexDirection: 'row',}}>
        <Text style={{color: activeColors.text, fontSize: 18, fontWeight: 'bold',}}>Notifications</Text>
          <TouchableOpacity onPress={()=> router.back()} style={{right: 25, position: 'absolute',}}>
          <AntDesign name='closecircleo' size={25} color={activeColors.tint} />
         </TouchableOpacity>
      </View>


      <View>
      <Text style={{color: activeColors.text,}}>Notifications</Text>
      </View>
    </SafeAreaView>
    </>
  )
}

export default Notifications

const styles = StyleSheet.create({})