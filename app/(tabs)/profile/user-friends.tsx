import { ActivityIndicator, FlatList, Image, ListRenderItem, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { fetchFriendsOfFriend, FriendOfFriend } from '../../../utils/service_api/friendshipServiceApi';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActiveColors } from '@/constants/ThemeMode';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Colors';
import { requestFriend } from '@/utils/service_api/friendshipServiceApi';
import { UserFriendLoadingSkeleton } from '@/components/LoadingSkeletons';

const UserFriends = () => {
 const { friendId, name } = useLocalSearchParams<{ friendId: string, name: string }>()
  const [friends, setFriends] = useState<FriendOfFriend[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState<FriendOfFriend[]>([]);
  const activeColors = useActiveColors()
  const router = useRouter()
  const pageBottomPadding =  useBottomTabBarHeight()
  

  useEffect(() => {
    if (!friendId) return
    let cancelled = false

    const loadFriends = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchFriendsOfFriend(friendId)
        console.log('Fetched friends:', data)
        if (!cancelled) {
          setFriends(data)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load friends')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFriends()
    return () => {
      cancelled = true
    }
  }, [friendId])

  // Debounced filter whenever searchQuery or friends changes
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!searchQuery) {
        setFilteredFriends(friends)
      } else {
        const lower = searchQuery.toLowerCase()
        setFilteredFriends(
          friends.filter((f) =>
            f.username?.toLowerCase().includes(lower)
          )
        )
      }
    }, 300)

    return () => clearTimeout(handle)
  }, [searchQuery, friends])

  // Add friend functionality 
    const handleAddFriend = async (userIdToAdd: string) => {
    // 1) Immediately mark pending in UI
    setFriends((prev) =>
      prev.map((f) =>
        f.userId === userIdToAdd
          ? { ...f, friendshipStatus: "pending" }
          : f
      )
    );
    // also update filtered view if you use that
    setFilteredFriends((prev) =>
      prev.map((f) =>
        f.userId === userIdToAdd
          ? { ...f, friendshipStatus: "pending" }
          : f
      )
    );

    // 2) Fire off the network request
    try {
      await requestFriend(userIdToAdd);
      alert("Friend request sent!");
    } catch (err) {
      console.error(err);
      alert("Couldn’t send friend request");
      // If it failed, roll back
      setFriends((prev) =>
        prev.map((f) =>
          f.userId === userIdToAdd
            ? { ...f, friendshipStatus: "none" }
            : f
        )
      );
      setFilteredFriends((prev) =>
        prev.map((f) =>
          f.userId === userIdToAdd
            ? { ...f, friendshipStatus: "none" }
            : f
        )
      );
    }
  };


  const renderFriends: ListRenderItem<FriendOfFriend> = (({item, index}) => {
        //const setName = (item.username?.length ? item.username : `${item.first_name} ${item.last_name}`)
        const isNone   = item.friendshipStatus === 'none'
        const isPending = item.friendshipStatus === 'pending'
        return (
        <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/(tabs)/profile/friend-profile/[friendId]',
          params: { friendId: item.userId, friendName: item.username, friendImg: item.profileImg, },
        })}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
        key={item.userId}
        >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
            <Image
            source={{uri: item.profileImg?? 'https://ui-avatars.com/api/?name=User&background=ddd&color=555&size=128'}}
            style={{width: 40, height: 40, borderRadius: 99,}}
            />
            <Text style={{color: activeColors.text, fontSize: 16, fontWeight: 500,}}>
              {/* {item.userName.length > 0 ? item.userName : `${item.first_name} ${item.last_name}`} */}
              {item.username}
              </Text>
            </View>

            {
              item.friendshipStatus === 'none' ? (

                <TouchableOpacity
                            onPress={() => {handleAddFriend(item.userId)}}
                            disabled={isPending}
                            style={{
                                padding: 7, 
                                borderRadius: 99, 
                                backgroundColor: activeColors.tint, 
                                flexDirection: 'row',
                                alignItems: 'center',
                                }}>
                                  <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>add</Text>
                                <AntDesign name='adduser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                                
                            </TouchableOpacity>

              )  : item.friendshipStatus === 'accepted' ? (
                null
              ) : item.friendshipStatus === 'pending' ? (
                <TouchableOpacity
                            onPress={() => {}}
                            style={{
                                padding: 7, 
                                borderRadius: 99, 
                                backgroundColor: activeColors.tint, 
                                flexDirection: 'row',
                                alignItems: 'center',
                                }}>
                                  <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>pending</Text>
                                <MaterialCommunityIcons name="timer-sand" size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                                {/* <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>pending</Text> */}
                            </TouchableOpacity>
              ) : null

            }
            
        </TouchableOpacity>
    )})

    const renderFilteredFriends: ListRenderItem<FriendOfFriend> = (({item, index}) => {
      const isPending = item.friendshipStatus === 'pending'
      return (
      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/(tabs)/profile/friend-profile/[friendId]',
          params: { friendId: item.userId, friendName: item.username, friendImg: item.profileImg, },
        })}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
        key={item.userId}
        >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
            <Image
            source={{uri: item.profileImg?? 'https://ui-avatars.com/api/?name=User&background=ddd&color=555&size=128'}}
            style={{width: 40, height: 40, borderRadius: 99,}}
            />
            <Text style={{color: activeColors.text, fontSize: 16, fontWeight: 500,}}>
              {/* {item.userName.length > 0 ? item.userName : `${item.first_name} ${item.last_name}`} */}
              {item.username}
              </Text>
            </View>

            {
              item.friendshipStatus === 'none' ? (

                <TouchableOpacity
                            onPress={() => {handleAddFriend(item.userId)}}
                            disabled={isPending}
                            style={{
                                padding: 7, 
                                borderRadius: 99, 
                                backgroundColor: activeColors.tint, 
                                flexDirection: 'row',
                                alignItems: 'center',
                                }}>
                                  <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>add</Text>
                                <AntDesign name='adduser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                                
                            </TouchableOpacity>

              )  : item.friendshipStatus === 'accepted' ? (
                null
              ) : item.friendshipStatus === 'pending' ? (
                <TouchableOpacity
                            onPress={() => {}}
                            style={{
                                padding: 7, 
                                borderRadius: 99, 
                                backgroundColor: activeColors.tint, 
                                flexDirection: 'row',
                                alignItems: 'center',
                                }}>
                                  <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>pending</Text>
                                <MaterialCommunityIcons name="timer-sand" size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                                {/* <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>pending</Text> */}
                            </TouchableOpacity>
              ) : null

            }
        </TouchableOpacity>
    )})

  return (
    <>

     <Stack.Screen
     
            options={{
              title: name.toString().toLowerCase(),
                contentStyle: {backgroundColor: activeColors.background,},
                headerStyle: {backgroundColor: activeColors.background,},
                headerTitleStyle: {color: activeColors.text,},
                headerTintColor: activeColors.text,
                headerBackButtonDisplayMode: 'minimal',
                headerShadowVisible: false,
                // headerSearchBarOptions: {
                //     placeholder: 'Search',
                //     textColor: activeColors.text,
                //     tintColor: activeColors.text,
                //     headerIconColor: activeColors.text,
                //     hintTextColor: activeColors.text,
                //     shouldShowHintSearchIcon: false,
                // },
            }}
            />


    <View style={{paddingBottom: pageBottomPadding, flex: 1,}}>
       <View
 style={{
    backgroundColor: activeColors.input,
    borderRadius: 10,
    padding: Platform.OS === 'ios'? 12 : 12,
    paddingHorizontal: Platform.OS === 'android'? 12: undefined,
    //marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 5,
    flexShrink: 1,
    marginHorizontal: 20,
}}
>
    <AntDesign name='search1' color={Colors.GRAY} size={16}/>
<TextInput
    placeholder='Search friends'
    placeholderTextColor={Colors.GRAY}
    value={searchQuery}
    onChangeText={setSearchQuery}
    multiline={false}
    style={{
        flex: 1,
        color: activeColors.text,
    }}
    />
</View>

{/* {
    friends.map((item, index)=> (
        <View key={index}>
            <Text style={{color: activeColors.text,}}>{item.first_name}</Text>
        </View>
    ))
} */}

{
  searchQuery? 
    <FlatList
data={filteredFriends}
renderItem={renderFilteredFriends}
ListEmptyComponent={() => (<Text style={{color: activeColors.text,}}>No results found for "{searchQuery.toString()}"</Text>)}
keyExtractor={(_, index) => index.toString()}
contentContainerStyle={{flex:1, paddingTop: 20, gap: 25, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios'? pageBottomPadding + 10 : pageBottomPadding + 20,}}
/>

  :

  loading? <UserFriendLoadingSkeleton/> :
  <FlatList
data={friends}
renderItem={renderFriends}
ListEmptyComponent={() => (<Text style={{color: activeColors.text,}}>{name} has no friends</Text>)}
keyExtractor={(_, index) => index.toString()}
contentContainerStyle={{flex:1, paddingTop: 20, gap: 25, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios'? pageBottomPadding + 10 : pageBottomPadding + 20,}}
/>
}
    </View>
    
    </>
  )
}

export default UserFriends

const styles = StyleSheet.create({})