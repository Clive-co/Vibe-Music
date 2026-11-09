import { FlatList, StyleSheet, Text, View, ListRenderItem, Pressable, Alert} from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import { Colors } from '@/constants/Colors'

import request from '@/data/requests.json'
import { Image } from 'react-native'
import { ScrollView } from 'react-native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import friends from "@/data/friends.json"
import {
  fetchRequests,
  acceptFriend,
  unfriend,
  FriendRequest,
} from '@/utils/service_api/friendshipServiceApi';
import NoReceivedRequestSvg from '@/assets/svg/NoReceivedRequests'
import NoSentRequestSvg from '@/assets/svg/NoSentRequests'

interface RequestType {
  id: number;
  type: string;
  userName: string;
  img: string;
}


const Requests = () => {

    const activeColors = useActiveColors()

    const [receivedRequests, setReceivedRequests] = useState<RequestType[]>(request.filter((item) => item.type === "received")) 
    const [sentRequests, setSentRequests] = useState<RequestType[]>(request.filter((item) => item.type === "sent"))
    const [receivedRequest, setReceivedRequest] = useState<FriendRequest[]>([]);
    const [sentRequest, setSentRequest] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    const pageBottomPadding = useBottomTabBarHeight();

    const cancelSentRequest = (indexToRemove: number) => {setSentRequests(sentRequests.filter((item) => item.id !== indexToRemove))}
    const deleteReceivedRequest = (indexToRemove: number) => setReceivedRequests(receivedRequests.filter((item) => item.id !== indexToRemove))

    // Load requests
    useEffect(() => {
      setLoading(true);
      const loadRequests = async () => {
        try {
          //  Parallel fetch both lists
          const [received, sent] = await Promise.all([
            fetchRequests("received"),
            fetchRequests("sent"),
          ]);

          //  Update state
          setReceivedRequest(received);
          console.log("Received Requests:", received);

          setSentRequest(sent);
          console.log("Sent Requests:", sent);
        } catch (err) {
          console.error("Error loading requests:", err);
        } finally {
          setLoading(false);
        }
      };

      loadRequests();
    }, []);

    // Accept handler
    const handleAccept = async (friendId: string) => {
      await acceptFriend(friendId);
      setReceivedRequests(prev => prev.filter(r => r.id !== parseInt(friendId)));
    };


  //unfriend or remove friend functionality
  /*
    const handleUnfriend = async (friendId: string) => {
      try {
        const payload = { userId, friendId };
        const response = await axios.post(REMOVE_API_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Friend removed:", response.data);
        // Update the state to remove the friend from the UI
        setReceivedRequests(receivedRequests.filter((item) => item.friendID !== friendId));
      } catch (error) {
        console.error("Error removing friend:", error);
      }
    };*/

    const handleUnfriend = async (friendId: string) => {
        try {
          await unfriend(friendId);
          setReceivedRequests((prev) => prev.filter((f) => f.id !== parseInt(friendId)));
          Alert.alert('Success', 'Friend removed successfully.');
        } catch (error) {
          console.error('Error unfriending user:', error);
          Alert.alert('Error', 'Failed to remove friend. Please try again.');
        }
      };

    const renderReceived: ListRenderItem<FriendRequest> = (({item, index}) => (
        <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
          <View style={{flexDirection: 'row', gap: 10, alignItems: 'center',}}>
            <Image source={{uri: String(item.profileImg)}} style={{width: 50, height: 50, borderRadius: 99,}}/>
          <Text style={{color: activeColors.text, fontSize: 14, fontWeight: 600,}}>{item.username}</Text>
          </View>
            
            <View style={{flexDirection: 'row', gap: 10,}}>
              <Pressable onPress={() => {
                  //acceptRequest(item);
                  handleAccept(item.friendId);
                }} 
                style={{width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.PRIMARY,}}>
                <Text style={{color: Colors.WHITE,}}>accept</Text>
                </Pressable>

                <Pressable onPress={()=> {
                  deleteReceivedRequestAlert(parseInt(item.friendId), item.username);
                  handleUnfriend(item.friendId);
                }} 
                style={{ width: 70, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: activeColors.blurButton,}}>
                <Text style={{color: activeColors.text,}}>delete</Text>
                </Pressable>
            </View>
        </View>
    ))

    const renderSent: ListRenderItem<FriendRequest> = (({item, index})=> (
      <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center',}}>
        <Image source={{uri: String(item.profileImg)}} style={{width: 50, height: 50, borderRadius: 99,}}/>
      <Text style={{color: activeColors.text, fontSize: 14, fontWeight: 600,}}>{item.username}</Text>
      </View>
            <Pressable onPress={()=> {
              cancelSentRequestAlert(parseInt(item.friendId), item.username);
              handleUnfriend(item.friendId);
            }} 
            style={{ width: 90, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: activeColors.blurButton,}}>
            <Text style={{color: activeColors.text,}}>cancel</Text>
            </Pressable>
    </View>
    ))

    const deleteReceivedRequestAlert = (itemId: number, name: string | null) => {
      Alert.alert(`Request from ${name}`, `Are you sure you would like to delete friend request from ${name}`, [
            {
              text: 'remove',
              onPress: () => deleteReceivedRequest(itemId), style: 'default',
            },
            {text: 'cancel', style: 'destructive'},
          ])
    };

    const cancelSentRequestAlert = (itemId: number, name: string | null) => {
      Alert.alert(`Request sent to ${name}`, `Cancelling means you and ${name} would not become friends`, [
        {
          text: 'cancel',
          onPress: () => cancelSentRequest(itemId), style: 'destructive',
        },
        {text: 'keep', style: 'default'},
      ])
    }
    
    const acceptRequest = (item: any) => {
      friends.push(item)
      setReceivedRequests(receivedRequests.filter((itemId) => itemId !== item))
    }
  return (
    <ScrollView
    scrollEnabled={true}
    contentContainerStyle={{ paddingBottom: pageBottomPadding + 30 , gap: 30,}}
     style={{ paddingHorizontal: 20, gap: 30, flex: 1}}>
      
      <FlatList
      data={receivedRequest}
      renderItem={renderReceived}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={<Text style={{color: Colors.GRAY, textTransform: 'uppercase', fontWeight: 600,}}>Received</Text>}
      stickyHeaderHiddenOnScroll
      ListEmptyComponent={
      <View style={{ height: 150, justifyContent: 'center', alignItems: 'center', gap: 20,}}>
        <NoReceivedRequestSvg height={80} width={80} />
        <Text style={{color: activeColors.text, fontSize: 13, fontWeight: 'bold',}}>Friend requests you receive will appear here</Text>
      </View>
      }
      scrollEnabled={false}
      contentContainerStyle={{
        //backgroundColor: 'red',
        flexGrow: 1,
        gap: 20,
    }}
      />

      <FlatList
      data={sentRequest}
      renderItem={renderSent}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={<View style={{backgroundColor: activeColors.background,}}><Text style={{color: Colors.GRAY, textTransform: 'uppercase', fontWeight: 600,}}>Sent</Text></View>}
      stickyHeaderIndices={[0]}
      ListEmptyComponent={
      <View style={{ height: 150, justifyContent: 'center', alignItems: 'center', gap: 20,}}>
        <NoSentRequestSvg height={100} width={100} />
        <Text style={{color: activeColors.text, fontSize: 13, fontWeight: 'bold',}}>Friend requests you send will appear here</Text>
      </View>
        }
      scrollEnabled={false}
      stickyHeaderHiddenOnScroll
      //StickyHeaderComponent={}
      contentContainerStyle={{
        //backgroundColor: 'blue',
        gap: 20,
        //paddingBottom: pageBottomPadding,
    }}
      />
    
    </ScrollView>
  )
}

export default React.memo(Requests)

const styles = StyleSheet.create({})