import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useActiveColors } from '@/constants/ThemeMode'
import { Colors } from '@/constants/Colors'
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons'

type InitialFriend = {
  friendID:   string
  username:   string | null
  profileImg: string | null
}

const CreateGroup = () => {

    const router = useRouter()
    const activeColors = useActiveColors()
    const {selected} = useLocalSearchParams()
    const [members, setMembers ] = useState<InitialFriend[]>([])
    const [name, setName] = useState('')

     useEffect(() => {
        console.log('Raw selected:', selected);

        if (typeof selected === 'string') {
          try {
            const parsed = JSON.parse(selected) as InitialFriend[]
            setMembers(parsed)
          } catch (e) {
            console.error('Failed to parse selected', e)
          }
        }
      }, [selected])

  return (
    <>
     <Stack.Screen
        options = {{
            contentStyle: {backgroundColor: activeColors.background,},
        }}
        />

     <SafeAreaView style={{paddingTop: 20, flex: 1,}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, alignItems: 'center', marginBottom: 16,}}>
                <TouchableOpacity style={{}}>
                    <Text onPress={() => router.back()} style={{color: activeColors.text, fontSize: 15,}}>Cancel</Text>
                </TouchableOpacity>
    
                
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: activeColors.text,}}>New group</Text>

                <TouchableOpacity
                disabled = {selected.length > 0 ? true : false} 
                onPress = {() => router.push({
                    pathname: '/(modals)/group/create-group',
                    params: {selected},
                })}
                style={{}}>
                    <Text style={{color: selected.length > 0 ? activeColors.text : Colors.GRAY, fontSize: 15,}}>Create</Text>
                </TouchableOpacity>
            </View>

            <View style={{
                backgroundColor: activeColors.buttonBackdrop,
                height: 70,
                borderRadius: 15,
                //width: '100%',
                marginHorizontal: 20,
                //alignSelf: 'center',
                marginTop: 20,
                flexDirection: 'row',
                //justifyContent: 'center',
                gap: 20,
                paddingHorizontal: 20,
                alignItems: 'center',
            }}>

                <View style={{padding: 12, backgroundColor: Colors.GRAY, borderRadius: 99, alignItems: 'center', justifyContent: 'center',}}>
                    <Feather name="camera" size={22} color="#1DB954" />
                </View>

                <View style={{flexDirection: 'row', width: '65%', height: '100%', gap: 7, alignItems: 'center',}}>
                    <Ionicons name="pencil" size={15} color={Colors.GRAY} />
                    <TextInput
                                placeholder="Group name"
                                placeholderTextColor={Colors.GRAY}
                                value={name}
                                onChangeText={(text) => setName(text)}
                                multiline={false}
                                style={{
                                  flex: 1,
                                  color: activeColors.text,
                                  height: '100%',
                                  fontSize: 16,
                                }}
                              />
                </View>

                <Pressable onPress={() => setName('')} style={{display: name.length > 0 ? 'flex' : 'none',}}>
                    <MaterialIcons name="cancel" size={20} color={Colors.GRAY} />
                </Pressable>
                
            </View>

            <Text style={{color: Colors.GRAY, fontWeight: 'semibold', marginLeft: 20, fontSize: 13, marginTop: 20,}}>MEMBERS: {members.length} OF 60</Text>
    
      <FlatList
      data={members}
      keyExtractor={(item) => item.friendID}
      renderItem={({item}) => (
      <View style={{alignItems: 'center', gap: 5,}}>
        <Image
        source={{uri: item.profileImg?.toString()}}
        style={{width: 50, height: 50, borderRadius: 99,}}
        />
        <Pressable 
        onPress={() =>
                  setMembers(
                    members.filter((itemId) => itemId !== item)
                  )
                }
        style={{
                              position: "absolute",
                              top: -5,
                              right: -5,
                              padding: 1,
                              borderRadius: 99,
                              backgroundColor: activeColors.background,
                            }}
        >
        <MaterialIcons
                            name="cancel"
                            size={20}
                            color={Colors.GRAY}
                          />
                          </Pressable>
        <Text style={{color: activeColors.text, fontSize: 12,}}>{item.username}</Text>
      </View>
    )}
    contentContainerStyle={{alignItems: 'flex-start', paddingHorizontal: 20, marginTop: 20,}}
      />

    </SafeAreaView>
    </>
  )
}

export default CreateGroup

const styles = StyleSheet.create({})