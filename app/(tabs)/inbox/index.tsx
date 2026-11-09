import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useContext } from 'react'
import { BackHandler, Dimensions, FlatList, Platform, Pressable, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import interactions from '@/data/interactions.json'
import { defaultStyles } from '@/constants/Styles';
import Interactions from '@/components/Inbox/Interactions';
import { Colors } from '@/constants/Colors';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Parties from '@/components/Inbox/Parties';
import { useActiveColors } from '@/constants/ThemeMode';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetchRecentChats, RecentChat, deleteChat  } from "@/utils/service_api/chatApi";
//import for the createGroup api call
import { createGroup } from "@/utils/service_api/chatApi";
import NoChats from '@/assets/svg/NoChats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalContext } from '@/context/GlobalProvider'; 
import { getCurrentUser } from 'aws-amplify/auth';

const CHATS_CACHE_KEY = 'cachedRecentChats';

const Page = () => {
  const activeColors = useActiveColors();
  const { socket, wsReady } = useContext(GlobalContext)!;

  const [items, setItems] = useState(interactions);
  const [chats, setChats] = useState<RecentChat[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const openSwipeableRef = React.useRef<Swipeable | null>(null);
  const [loading, setLoading] = useState(false);

  //handle the create group functionalityconst handleCreateGroup = async () => {
  /*  ************
  ****************
  try {
    //create state variables for group name and participants
    const newGroupName = "New Group Chat"; // You can replace this with user input later
    const participants = []; // add participant IDs as needed
    const result = await createGroup(newGroupName, participants);
    console.log("Created group with chatId:", result.chatId);
    // Optionally navigate to the new chat screen:
    router.push(`/chatRoom/${result.chatId}`);
  } catch (err) {
    console.error("Failed to create group:", err);
  }
};
*************
*/

// Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.userId);
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    getUserId();
  }, []);

useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadChats = async () => {
        setLoading(true);
        try {
          // 1) Load from cache
          const cachedJson = await AsyncStorage.getItem(CHATS_CACHE_KEY);
          if (cachedJson && !cancelled) {
            const cached: RecentChat[] = JSON.parse(cachedJson);
            setChats(cached);
            console.log('Loaded chats from cache:', cached);
          }

          // 2) Fetch fresh from network
          const fresh: RecentChat[] = await fetchRecentChats();
          if (!cancelled) {
            setChats(fresh);
            await AsyncStorage.setItem(CHATS_CACHE_KEY, JSON.stringify(fresh));
            console.log('Fetched recent chats from network and updated cache:', fresh);
          }
        } catch (err) {
          if (!cancelled) {
            console.error('Error loading recent chats:', err);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadChats();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Helper function to update recent chats cache
  // Helper function to update recent chats cache
  const updateRecentChatsCache = useCallback(async (chatId: string, newMessage: any) => {
    try {
      const cachedJson = await AsyncStorage.getItem(CHATS_CACHE_KEY);
      let cached: RecentChat[] = cachedJson ? JSON.parse(cachedJson) : [];
      
      // Check if the chat already exists in the cache
      const existingChatIndex = cached.findIndex(chat => chat.chatId === chatId);
      
      if (existingChatIndex >= 0) {
        // Update existing chat
        cached[existingChatIndex] = {
          ...cached[existingChatIndex],
          lastMessage: {
            messageId: newMessage.messageId,
            senderId: newMessage.senderId,
            senderName: newMessage.senderName,
            content: newMessage.content,
            timestamp: newMessage.timestamp,
            type: newMessage.type || 'text'
          },
          timestamp: newMessage.timestamp,
          // Increment unread count if the message is from someone else
          unreadCount: newMessage.senderId === userId ? 0 : (cached[existingChatIndex].unreadCount || 0) + 1
        };
      } else {
        // This is a new chat - we need to fetch the chat details
        console.log('New chat detected, fetching fresh chat list...');
        
        try {
          // Fetch fresh chat list from the server to get the new chat details
          const fresh: RecentChat[] = await fetchRecentChats();
          
          // Find the new chat in the fresh data
          const newChat = fresh.find(chat => chat.chatId === chatId);
          
          if (newChat) {
            // Add the new chat to the beginning of the list
            cached = [newChat, ...cached];
            console.log('Added new chat to list:', newChat);
          } else {
            // Fallback: create a minimal chat entry if we can't find it in fresh data
            const newChatEntry: RecentChat = {
              chatId: chatId,
              lastMessage: {
                messageId: newMessage.messageId,
                senderId: newMessage.senderId,
                senderName: newMessage.senderName,
                content: newMessage.content,
                timestamp: newMessage.timestamp,
                type: newMessage.type || 'text'
              },
              timestamp: newMessage.timestamp,
              unreadCount: newMessage.senderId === userId ? 0 : 1,
              // Add default values for required fields
              title: newMessage.senderName || 'Unknown',
              chatImg: "",
              isGroup: false
            };
            
            cached = [newChatEntry, ...cached];
            console.log('Created minimal chat entry for new chat');
          }
        } catch (fetchError) {
          console.error('Failed to fetch fresh chat list for new chat:', fetchError);
          
          // Fallback: create a minimal chat entry
          const newChatEntry: RecentChat = {
            chatId: chatId,
            lastMessage: {
              messageId: newMessage.messageId,
              senderId: newMessage.senderId,
              senderName: newMessage.senderName,
              content: newMessage.content,
              timestamp: newMessage.timestamp,
              type: newMessage.type || 'text'
            },
            timestamp: newMessage.timestamp,
            unreadCount: newMessage.senderId === userId ? 0 : 1,
            title: newMessage.senderName || 'Unknown',
            chatImg: "",
            isGroup: false
          };
          
          cached = [newChatEntry, ...cached];
        }
      }
      
      // Sort by timestamp (most recent first)
      cached.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
      
      // Update both cache and state
      await AsyncStorage.setItem(CHATS_CACHE_KEY, JSON.stringify(cached));
      setChats(cached);
      
      console.log('Updated recent chats in real-time');
    } catch (error) {
      console.warn('Failed to update recent chats cache:', error);
    }
  }, [userId]);

  // Listen for real-time WebSocket messages
  useEffect(() => {
    if (!socket || !wsReady || !userId) return;

    const handleWebSocketMessage = async (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data);
        
        // Only handle newMessage events
        if (msg.action === 'newMessage' && msg.data) {
          const newMessage = msg.data;
          
          // Update the recent chats list with the new message
          await updateRecentChatsCache(newMessage.chatId, newMessage);
          
          console.log('Received real-time message for chat:', newMessage.chatId);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleWebSocketMessage);

    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, wsReady, userId, updateRecentChatsCache]);

const handleDelete = async (chatId: string) => {
  try {
    // 1️⃣ delete on the server
    await deleteChat(chatId)

    // 2️⃣ remove from in-memory list
    setChats(prev => {
      const next = prev.filter(c => c.chatId !== chatId)
      return next
    })

    // 3️⃣ update the recent-chats cache
    const raw = await AsyncStorage.getItem(CHATS_CACHE_KEY)
    if (raw) {
      const cached: RecentChat[] = JSON.parse(raw)
      const filtered = cached.filter(c => c.chatId !== chatId)
      await AsyncStorage.setItem(
        CHATS_CACHE_KEY,
        JSON.stringify(filtered)
      )
    }

    // 4️⃣ clear that chat’s message cache + last-opened timestamp
    await AsyncStorage.multiRemove([
      `chatHistory:${chatId}`,
      `chatLastOpened:${chatId}`
    ])
  } catch (err) {
    console.error("Failed to delete chat:", err)
  }
}

  const removeInteraction = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  const handleOpenSwipeable = (ref: Swipeable | null) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  };

  const closeOpenSwipeable = () => {
    if (openSwipeableRef.current) {
      openSwipeableRef.current.close();
      openSwipeableRef.current = null;
    }
  };

  // Handle Android back press to close swipeables
  if (Platform.OS === 'android') {
    useEffect(() => {
      const handleBackPress = () => {
        closeOpenSwipeable();
        return true; // Prevent default back button behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => backHandler.remove();
    }, []);
  }

  const router = useRouter();

  const pageBottomPadding = useBottomTabBarHeight()

  const screenHeight = Dimensions.get('window').height

  const emptyListRender = () => {
    return(
      <View style={{height: screenHeight - pageBottomPadding - 200, alignItems: 'center', justifyContent: 'center', gap: 20,}}>
        <NoChats size={150}/>
      <Text style={{color: activeColors.text, fontWeight: 'bold', fontSize: 14,}}>You have no conversations</Text>
      <Text style={{color: Colors.GRAY, fontWeight: 'bold', fontSize: 12,}}>Messages between you and friends will appear here</Text>
    </View>
    ) 
  }
  return (
    // <Stack.Screen
    // options={{
    //   headerRight: () => (
    //     <TouchableOpacity
    //     style={{width: 35, 
    //     height: 35, 
    //     borderRadius: 99, 
    //     backgroundColor: "rgba(25, 25, 25, .1)",
    //      alignItems: 'center', 
    //      justifyContent: 'center',

    //     }}>
    //       <Ionicons name="create-outline" size={20} color={'#4a227a'} />
    //     </TouchableOpacity>
    // )
    // }}
    // />
    <View style={{flex: 1, backgroundColor: activeColors.background, }}>
      <TouchableWithoutFeedback onPress={closeOpenSwipeable}>
    <ScrollView
    //pointerEvents="none"
    showsVerticalScrollIndicator={false}
    contentInsetAdjustmentBehavior='automatic'
    contentContainerStyle={{ paddingBottom: pageBottomPadding, backgroundColor: activeColors.background,}}
    >
      {/* <Parties /> */}

      <FlatList 
      scrollEnabled={false}
      data={chats} 
      ListEmptyComponent={emptyListRender}
      ListHeaderComponent={
      <Text style={{paddingHorizontal: 20, paddingVertical: 10, fontFamily: 'dmsans-semibold', fontSize: 16, color: Colors.GRAY, }}>
        Interactions
        </Text>
    }
      //keyExtractor={(item) => item.lastMessage.senderId}
      keyExtractor={(item) => item.chatId}
      //ItemSeparatorComponent={()=> <View style={[defaultStyles.separator, {marginLeft: 90,}]} />}
      renderItem={({ item }) => 
      <Interactions {...item} 
      removeInteraction={() => {
        removeInteraction(item.lastMessage.senderId);
        handleDelete(item.chatId);
      }}
      handleOpenSwipeable={handleOpenSwipeable}
      router={router}
      />}/>
    </ScrollView>
    </TouchableWithoutFeedback>
    </View>
  )
}

export default Page;