import { Alert, FlatList, Image, ListRenderItem, ListRenderItemInfo, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native'
import React, {  useEffect, useState, useContext } from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import { AntDesign } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
//import friendsData from '@/data/friends.json'
import { FlashList } from '@shopify/flash-list'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { fetchFriends, unfriend, Friend } from '@/utils/service_api/friendshipServiceApi';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router'
import { se } from 'rn-emoji-keyboard'
import { set } from 'date-fns'

const FRIENDS_CACHE_KEY = "cachedFriends";

const FriendList = () => {
    const [friendsData, setFriendsData] = useState<Friend[]>([]);
    const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const activeColors = useActiveColors()
    const pageBottomPadding = useBottomTabBarHeight()
    const [loading, setLoading] = useState(false);

    const router = useRouter()
//     interface FriendType {
//   username: string;
//   img: string;
//   desc: string;
//   userName: string;
// }

    useEffect(() => {
      let cancelled = false;

      const loadFriends = async () => {
        setLoading(true);
        try {
          // 1) load from cache immediately
          const cachedJson = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
          if (cachedJson && !cancelled) {
            const cached: Friend[] = JSON.parse(cachedJson);
            setFriendsData(cached);
            console.log("Loaded friends from cache:", cached);
          }

          // 2) fetch fresh from network
          const fresh: Friend[] = await fetchFriends();
          if (!cancelled) {
            setFriendsData(fresh);
            console.log("Fetched friends from network:", fresh);
            // 3) update cache
            await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(fresh));
          }
        } catch (error) {
          if (!cancelled) {
            console.error("Error loading friends:", error);
            Alert.alert("Error", "Failed to load friends. Please try again later.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadFriends();
      return () => {
        cancelled = true;
      };
    }, []);
  
  const handleUnfriend = async (friendID: string) => {
  try {
    // 1️⃣ Tell the server to unfriend
    await unfriend(friendID);

    // 2️⃣ Remove from in-memory lists
    setFriendsData(prev => prev.filter(f => f.friendId !== friendID));
    setFilteredFriends(prev => prev.filter(f => f.friendId !== friendID));

    // 3️⃣ Update the cached friends list
    const raw = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
    if (raw) {
      const cached: Friend[] = JSON.parse(raw);
      const updated = cached.filter(f => f.friendId !== friendID);
      await AsyncStorage.setItem(
        FRIENDS_CACHE_KEY,
        JSON.stringify(updated)
      );
    }

    // 4️⃣ Optionally clear any per-chat cache for this friend, if you store one:
    // await AsyncStorage.multiRemove([
    //   `chatHistory:${friendID}`,
    //   `chatLastOpened:${friendID}`
    // ]);

    Alert.alert('Success', 'Friend removed successfully.');
  } catch (error) {
    console.error('Error unfriending user:', error);
    Alert.alert('Error', 'Failed to remove friend. Please try again.');
  }
};

  // Debounced search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery) {
        setFilteredFriends(friendsData);
      } else {
        const lower = searchQuery.toLowerCase();
        setFilteredFriends(
          friendsData.filter(f =>
            f.username?.toLowerCase().includes(lower)
          )
        );
        console.log("Filtered friends:", filteredFriends);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, friendsData]);

//const [friends, setFriends] = useState<Friend[]>(friendsData)

const removeFriend = (indexToRemove: number) => {setFriendsData(friendsData.filter((_, index) => index !== indexToRemove))}

const removeFriendAlert = (index: number, name: string | null, friendId: string) =>
    Alert.alert(`${name}`, `Are you sure you would like to remove ${name} as a friend?`, [
      {
        text: 'remove',
        onPress: () => {
          removeFriend(index);
          handleUnfriend(friendId);
        },
        style: 'default',
      },
      {text: 'cancel', style: 'destructive'},
    ]);


    const renderFriends: ListRenderItem<Friend> = (({item, index}) => {
        //const setName = (item.username?.length ? item.username : `${item.first_name} ${item.last_name}`)
        return (
        <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/(tabs)/profile/friend-profile/[friendId]',
          params: { friendId: item.friendId, friendName: item.username, friendProvider: item.linkedAccount, friendImg: item.profileImg, },
        })}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
        key={item.friendId}
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
            
            <TouchableOpacity 
            //onPress={() => setFriends((prevFriends) => prevFriends.filter((_,i) => i !== index))}
            onPress={() => removeFriendAlert(index, item.username, item.friendId)}
            style={{
                padding: 10, 
                borderRadius: 99, 
                backgroundColor: activeColors.tint, 
                flexDirection: 'row',
                alignItems: 'center',
                }}>
                <AntDesign name='deleteuser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                <Text style={{color: activeColors.background, fontSize: 13, fontWeight: 700,}}>remove</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )})


  return (
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
  <View style={{paddingTop: 20, gap: 25, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios'? pageBottomPadding + 10 : pageBottomPadding + 20,}}>
  {filteredFriends.map((item, index) => (
    <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/(tabs)/profile/friend-profile/[friendId]',
          params: { friendId: item.friendId, friendName: item.username, friendProvider: item.linkedAccount, friendImg: item.profileImg, },
        })}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
        key={item.friendId}
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
            
            <TouchableOpacity 
            //onPress={() => setFriends((prevFriends) => prevFriends.filter((_,i) => i !== index))}
            onPress={() => removeFriendAlert(index, item.username, item.friendId)}
            style={{
                padding: 10, 
                borderRadius: 99, 
                backgroundColor: activeColors.tint, 
                flexDirection: 'row',
                alignItems: 'center',
                }}>
                <AntDesign name='deleteuser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                <Text style={{color: activeColors.background, fontSize: 13, fontWeight: 700,}}>remove</Text>
            </TouchableOpacity>
        </TouchableOpacity>
  ))}
  </View>
  :
  <FlatList
data={friendsData}
renderItem={renderFriends}
keyExtractor={(_, index) => index.toString()}
contentContainerStyle={{paddingTop: 20, gap: 25, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios'? pageBottomPadding + 10 : pageBottomPadding + 20,}}
/>
}

    </View>
  )
}

export default React.memo(FriendList)

const styles = StyleSheet.create({})