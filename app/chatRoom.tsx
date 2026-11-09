import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View, Dimensions } from 'react-native'
import React, { useEffect, useState, useContext, useRef } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors';
import { Entypo, Ionicons } from '@expo/vector-icons';
import MessageInput from '@/components/Inbox/MessageInput';
import { useActiveColors } from '@/constants/ThemeMode';
import { fetchChatHistory, ChatHistoryResponse, getChatByParticipant, createChat, ChatMessage , markRead, mark_Read , fetchChatHistoryWithUnread, leaveGroup, addGroupMembers } from "../utils/service_api/chatApi";
import { GlobalContext } from "../context/GlobalProvider";
import { getCurrentUser } from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";
import { SafeAreaView } from 'react-native-safe-area-context';
import {useHeaderHeight} from '@react-navigation/elements'
import {LegendList, LegendListRef} from '@legendapp/list'
import { RecentChat } from "@/utils/service_api/chatApi";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from 'uuid'
import { FlashList } from '@shopify/flash-list';
import { useViewability } from '@legendapp/list';

const CACHE_CAP = 200
const { width: screenWidth } = Dimensions.get('window');

type MediaMessage = ChatMessage & {
  type: 'image' | 'document' | 'text' | 'reaction';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  // Reaction-specific fields
  trackData?: {
    trackName: string;
    artistName: string;
    trackImageUrl: string;
    trackId: string;
  };
  emoji?: string;
  reactorUsername?: string;
}

type PendingMessage = MediaMessage & { 
  pending: true; 
  failed?: boolean;
  localUri?: string; // Add localUri for pending images
}

const updateCacheWithMessage = async (chatId: string, newMessage: ChatMessage) => {
  try {
    const cacheKey = `chatHistory:${chatId}`;
    const raw = await AsyncStorage.getItem(cacheKey);
    
    if (raw) {
      const cached: ChatHistoryResponse = JSON.parse(raw);
      
      // Check if message already exists in cache
      const messageExists = cached.messages.some(m => m.messageId === newMessage.messageId);
      
      if (!messageExists) {
        // Add new message and maintain cache cap
        const updatedMessages = [...cached.messages, newMessage].slice(-CACHE_CAP);
        
        const updatedCache: ChatHistoryResponse = {
          ...cached,
          messages: updatedMessages
        };
        
        await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedCache));
        console.log('Message added to cache:', newMessage.messageId);
      }
    }
  } catch (error) {
    console.warn('Failed to update cache with new message:', error);
  }
};

const ChatRoom = () => {
  const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;
  const activeColors = useActiveColors();
  const [history, setHistory] = useState<ChatHistoryResponse>({ messages: [] });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<Promise<{ chatId: string } | null> | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const params = useLocalSearchParams<{
    chatId?: string;
    userId?: string;
    title?: string;
    chatImg?: string;
    friendId?: string;
    username?: string;
    profileImg?: string;
  }>();

  const [userId, setUserId] = useState<string | null>(params.userId ?? null);
  const { sendMessageWS, wsReady, socket } = useContext(GlobalContext)!
  const router = useRouter();
  const { chatId: incomingChatId, title, chatImg, friendId, username, profileImg } = params;

  const [resolvedChatId, setResolvedChatId] = useState<string | null>(
    incomingChatId || null
  );

  // Resolve chatId if missing
  useEffect(() => {
    if (resolvedChatId) return;
    if (friendId) {
      (async () => {
        try {
          const existing = await getChatByParticipant(friendId);
          if (existing?.chatId) {
            setResolvedChatId(existing.chatId);
            console.log("Existing chatId found:", existing.chatId);
          } else {
            console.log("No existing chatId found for friend:", friendId);
          }
        } catch (e) {
          console.error("Error resolving chatId for friend:", e);
        }
      })();
    }
  }, [friendId, resolvedChatId]);

  useEffect(() => {
    if (userId !== null) return;
    const checkUser = async () => {
      try {
        const authUser = await getCurrentUser();
        if (authUser) {
          setUserId(authUser.userId);
        }
      } catch (error) {
        setUserId(null);
      }
    };
    checkUser();
  }, [userId]);

  // **NEW**: Resolve any storage key → signed URL back into history.messages
  useEffect(() => {
    (async () => {
      for (let msg of history.messages) {
        if (
          !('pending' in msg) &&
          (msg.type === 'image' || msg.type === 'document') &&
          msg.mediaUrl &&
          !msg.mediaUrl.startsWith('http')
        ) {
          try {
            const { url } = await getUrl({ path: msg.mediaUrl });
            setHistory(h => ({
              ...h,
              messages: h.messages.map(m =>
                m.messageId === msg.messageId
                  ? { ...m, mediaUrl: url.toString() }
                  : m
              )
            }));
          } catch (e) {
            console.warn('Could not resolve media URL for', msg.mediaUrl, e);
          }
        }
      }
    })();
  }, [history.messages]);

  useEffect(() => {
    if (userId === null) return
    if (!resolvedChatId) return

    let active = true
    setLoadingHistory(true)
    ;(async () => {
      if (active) setLoadingHistory(false)
    })()
    return () => { active = false }
  }, [resolvedChatId, userId])

  const updateRecentChatsCache = async (chatId: string, newMessage: ChatMessage) => {
    try {
      const CHATS_CACHE_KEY = 'cachedRecentChats';
      const cachedJson = await AsyncStorage.getItem(CHATS_CACHE_KEY);
      
      if (cachedJson) {
        const cached: RecentChat[] = JSON.parse(cachedJson);
        
        // Find and update the chat with the new last message
        const updatedChats = cached.map(chat => {
          if (chat.chatId === chatId) {
            return {
              ...chat,
              lastMessage: {
                messageId: newMessage.messageId,
                senderId: newMessage.senderId,
                senderName: newMessage.senderName,
                content: newMessage.content,
                timestamp: newMessage.timestamp,
                type: newMessage.type || 'text'
              },
              timestamp: newMessage.timestamp,
              // Reset unread count if the current user sent the message
              unreadCount: newMessage.senderId === userId ? 0 : (chat.unreadCount || 0) + 1
            };
          }
          return chat;
        });
        
        // Sort by timestamp (most recent first)
        updatedChats.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
        
        await AsyncStorage.setItem(CHATS_CACHE_KEY, JSON.stringify(updatedChats));
        console.log('Updated recent chats cache with new message');
      }
    } catch (error) {
      console.warn('Failed to update recent chats cache:', error);
    }
  };

  // Subscribe to real-time newMessage frames
  useEffect(() => {
  if (!socket || !wsReady || !resolvedChatId) return
  
  const onMsg = async (evt: WebSocketMessageEvent) => {
    const msg = JSON.parse(evt.data)
    if (msg.action !== 'newMessage' || msg.data.chatId !== resolvedChatId) return

    const newMessage = msg.data;

    setHistory(h => {
      // Filter out the temporary message that matches the clientTempId
      const filtered = h.messages.filter(
          m => m.messageId !== msg.data.clientTempId
        )
      // Add the new message from server
      return {
        ...h,
        messages: [...filtered, newMessage].slice(-CACHE_CAP),
      }
    })
    
    // Cache the received message
    await updateCacheWithMessage(resolvedChatId, newMessage);
    
    // Update the recent chats cache
    await updateRecentChatsCache(resolvedChatId, newMessage);
    
    mark_Read(resolvedChatId).catch(() => {})
  }
  
  socket.addEventListener('message', onMsg)
  return () => void socket.removeEventListener('message', onMsg)
}, [socket, wsReady, resolvedChatId, userId])

  // Load cache → fetch network → merge new → markRead → cap & persist
  useEffect(() => {
  if (!resolvedChatId) return
  let active = true
  setLoading(true)

  ;(async () => {
    try {
      // Load from cache first
      const raw = await AsyncStorage.getItem(`chatHistory:${resolvedChatId}`)
      const lastOpenedRaw = await AsyncStorage.getItem(`chatLastOpened:${resolvedChatId}`)
      const lastOpened = lastOpenedRaw ? parseInt(lastOpenedRaw) : 0
      
      if (raw && active) {
        const cached: ChatHistoryResponse = JSON.parse(raw)
        setHistory(cached)
        setLoading(false)
      }
    } catch (e) {
      console.warn("cache load failed", e)
    }

    try {
      // Use the enhanced fetch function
      const fresh = await fetchChatHistoryWithUnread(resolvedChatId, 50) // Load more initially
      if (!active) return

      setHistory(prev => {
        const seen = new Set(prev.messages.map(m => m.messageId))
        const newOnly = fresh.messages.filter(m => !seen.has(m.messageId))
        
        let merged: ChatMessage[]
        
        if (fresh.hasUnread && fresh.unreadCount > 0) {
          // If there are unread messages, prioritize showing them
          // Keep all messages to ensure unread ones are visible
          merged = [...prev.messages, ...newOnly]
            .sort((a, b) => a.timestamp - b.timestamp) // Sort chronologically
            .slice(-Math.max(CACHE_CAP, fresh.unreadCount + 50)) // Keep enough messages
        } else {
          // Normal flow - just add new messages and cap
          merged = [...prev.messages, ...newOnly].slice(-CACHE_CAP)
        }

        // Cache the merged result
        AsyncStorage.setItem(
          `chatHistory:${resolvedChatId}`,
          JSON.stringify({ messages: merged, lastKey: fresh.lastKey ?? null })
        ).catch(console.warn)
        
        return { messages: merged, lastKey: fresh.lastKey ?? null }
      })

      await mark_Read(resolvedChatId)
    } catch (e) {
      console.error("fetch history failed", e)
    } finally {
      if (active) setLoading(false)
    }

    // Update last opened timestamp
    AsyncStorage.setItem(
      `chatLastOpened:${resolvedChatId}`,
      Date.now().toString()
    ).catch(() => {})

  })()

  return () => { active = false }
}, [resolvedChatId])

//scroll to bottom
const listRef = useRef<FlashList<any>>(null);
useEffect(() => {
    // Wait for next frame so list renders, then scroll to end
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 50);
  }, []);

// Enhanced load more function
const loadMore = async () => {
  if (!resolvedChatId || !history.lastKey) return;
  setLoadingMore(true);
  try {
    const res = await fetchChatHistoryWithUnread(
      resolvedChatId,
      50,
      history.lastKey
    );
    setHistory(prev => ({
      messages: [...res.messages, ...prev.messages], // Prepend older messages
      lastKey: res.lastKey,
    }));
  } catch (e) {
    console.error("Failed to load more:", e);
  }
  setLoadingMore(false);
};

  // Upload media to S3 and get the path
  const uploadMedia = async (uri: string, fileName: string, mimeType: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const key = `protected/${userId}/${fileName}`;
      console.log("Uploading to path:", key);
      console.log("User ID:", userId);
      
      const result = await uploadData({
        path: key,
        data: blob,
        options: { contentType: mimeType }
      }).result;

      return result.path;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  // Send message (text or media)
  const sendMessage = async (content: string, mediaUri?: string, fileName?: string, mimeType?: string) => {
    if (!wsReady) {
      console.error('WebSocket not ready');
      return;
    }

    const tempId = `temp-${uuidv4()}`;
    let mediaUrl: string | undefined;
    let messageType: 'text' | 'image' | 'document' = 'text';

    if (mediaUri && mimeType) {
      messageType = mimeType.startsWith('image/') ? 'image' : 'document';
    }

    const tempMsg: PendingMessage = {
      messageId: tempId,
      chatId: resolvedChatId ?? tempId,
      senderId: userId!,
      senderName: username!,
      content: content || (fileName ? `📎 ${fileName}` : 'Media'),
      type: messageType,
      timestamp: Date.now(),
      pending: true,
      localUri: messageType === 'image' ? mediaUri : undefined,
      fileName,
    };

    setHistory(h => ({
      ...h,
      messages: [...h.messages, tempMsg].slice(-CACHE_CAP),
    }));

    // 🔥 NEW: Update recent chats cache immediately when sending
    if (resolvedChatId) {
      await updateRecentChatsCache(resolvedChatId, {
        messageId: tempId,
        chatId: resolvedChatId,
        senderId: userId!,
        senderName: username!,
        content: content || (fileName ? `📎 ${fileName}` : 'Media'),
        timestamp: Date.now(),
        type: messageType
      });
    }

    let chatPromise: Promise<{ chatId: string }>;
    if (!resolvedChatId) {
      chatPromise = createChat(friendId!).then(result => {
        if (!result || !result.chatId) throw new Error('createChat did not return a chatId');
        return result;
      });
      setResolving(chatPromise);
    } else {
      chatPromise = Promise.resolve({ chatId: resolvedChatId! });
    }

    let created: { chatId: string };
    try {
      created = await chatPromise;
      if (!created.chatId) throw new Error('createChat did not return a chatId');
      if (!resolvedChatId) setResolvedChatId(created.chatId);
    } catch (e) {
      console.error('Failed to create chat:', e);
      setHistory(h => ({
        ...h,
        messages: h.messages.map(m =>
          m.messageId === tempId
            ? { ...(m as PendingMessage), pending: false, failed: true }
            : m
        ),
      }));
      return;
    } finally {
      setResolving(null);
    }

    if (mediaUri && fileName && mimeType) {
      try {
        mediaUrl = await uploadMedia(mediaUri, fileName, mimeType);
      } catch (error) {
        console.error('Failed to upload media:', error);
        setHistory(h => ({
          ...h,
          messages: h.messages.map(m =>
            m.messageId === tempId
              ? { ...(m as PendingMessage), pending: false, failed: true }
              : m
          ),
        }));
        return;
      }
    }

    // Update local state with media URL
    if (mediaUrl) {
      setHistory(h => ({
        ...h,
        messages: h.messages.map(m =>
          m.messageId === tempId
            ? { ...m, mediaUrl, pending: false, localUri: undefined }
            : m
        ),
      }));
    }

    // Send message via WebSocket
    const messagePayload = {
      action: 'sendMessage',
      chatId: created.chatId,
      content: content || (fileName ? `📎 ${fileName}` : 'Media'),
      type: messageType,
      clientTempId: tempId,
      mediaUrl,
      fileName,
    };

    sendMessageWS(messagePayload);
  };
  
  const UnreadIndicator = ({ unreadCount }: { unreadCount: number }) => {
    if (unreadCount === 0) return null;
    
    return (
      <View style={{
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        zIndex: 1000,
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: Colors.GRAY,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}>
          <Text style={{ color: Colors.WHITE, fontSize: 12, fontWeight: '500' }}>
            {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  };

  // Update the renderMessage function to handle reactions
  const renderMessage = (item: MediaMessage) => {
    const isSender = item.senderId === userId;
    const isPending = (item as PendingMessage).pending;
    const isFailed = (item as PendingMessage).failed;
    const localUri = (item as PendingMessage).localUri;

    // Special rendering for reaction messages
    if (item.type === 'reaction' && item.trackData) {
      return (
        <View style={{
          padding: 10,
          alignItems: 'center',
          marginVertical: 10,
        }}>
          {/* Floating track image */}
          <View style={{
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            position: 'relative', // Add this to establish positioning context
          }}>
            <Image 
              source={{ uri: item.trackData.trackImageUrl }} 
              style={{ 
                width: '100%', 
                height: '100%',
                backgroundColor: Colors.lightGray 
              }}
              resizeMode="cover"
            />
            
            {/* Emoji overlay on the track image */}
            {item.emoji && (
              <View style={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: 'white',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
                zIndex: 10, // Add this to ensure it's on top
              }}>
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              </View>
            )}
          </View>
        </View>

          {/* Reaction message bubble */}
          <View style={{
            backgroundColor: isSender ? Colors.GRAY : Colors.lightGray,
            padding: 12,
            borderRadius: 16,
            maxWidth: '80%',
            alignItems: 'center',
          }}>
            <Text style={{ 
              color: isSender ? Colors.WHITE : Colors.BLACK,
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 20,
            }}>
              {item.content}
            </Text>
            
            {/* Track info */}
            <View style={{
              marginTop: 8,
              alignItems: 'center',
            }}>
              <Text style={{
                color: isSender ? Colors.WHITE : Colors.BLACK,
                fontSize: 12,
                fontWeight: '600',
              }}>
                "{item.trackData.trackName}"
              </Text>
              <Text style={{
                color: isSender ? Colors.WHITE : Colors.BLACK,
                fontSize: 12,
                opacity: 0.8,
              }}>
                by {item.trackData.artistName}
              </Text>
            </View>

            {/* Timestamp */}
            <Text style={{
              fontSize: 10,
              color: isSender ? Colors.WHITE : Colors.BLACK,
              opacity: 0.7,
              marginTop: 8,
            }}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: "2-digit", 
                minute: "2-digit" 
              })}
            </Text>
          </View>
        </View>
      );
    }

  // Original message rendering for non-reaction messages
  return (
    <View style={{
      padding: 10,
      borderRadius: 10,
      //flexDirection: 'row',
      gap: 6,
      maxWidth: '80%',
      alignSelf: isSender ? "flex-end" : "flex-start"
    }}>
      <View style={{
        backgroundColor: isSender ? Colors.GRAY : Colors.lightGray,
        flex: 1,
        padding: 10,
        borderRadius: 10,
        opacity: isPending ? 0.7 : 1,
      }}>
        {item.type === 'image' && (
          <View style={{ marginBottom: 5 }}>
            <Image 
              source={{ uri: isPending && localUri ? localUri : item.mediaUrl }} 
              style={{ 
                width: screenWidth * 0.6, 
                height: 200, 
                borderRadius: 8, 
                backgroundColor: Colors.lightGray 
              }}
              resizeMode="cover"
              onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
            />
            {isPending && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </View>
        )}
        
        {item.type === 'document' && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            backgroundColor: isSender ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: 8,
            marginBottom: 5
          }}>
            <Ionicons name="document-outline" size={24} color={isSender ? Colors.WHITE : Colors.BLACK} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ color: isSender ? Colors.WHITE : Colors.BLACK, fontWeight: '500' }}>
                {item.fileName || 'Document'}
              </Text>
            </View>
            {isPending && <ActivityIndicator size="small" />}
          </View>
        )}

        {/* Only show content for text and document messages, not for images */}
        {item.content && item.type !== 'image' && (
          <Text style={{ color: isSender ? Colors.WHITE : Colors.BLACK }}>
            {item.content}
          </Text>
        )}

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 5
        }}>
          <Text style={{
            fontSize: 10,
            color: isSender ? Colors.WHITE : Colors.BLACK,
            opacity: 0.7
          }}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </Text>
          {isFailed && <Ionicons name="alert-circle" size={16} color="red" />}
        </View>
      </View>
    </View>
  );
};


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerBackVisible: true,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: {backgroundColor: activeColors.background,},
          headerTitleAlign: 'center',
          headerBlurEffect: 'regular',
          headerTitleStyle: { color: activeColors.text },
          headerTintColor: activeColors.text,
          headerStyle: { backgroundColor: activeColors.background },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: Colors.GRAY }}>
                <Image source={{ uri: chatImg || profileImg }} style={{ width: 40, height: 40, borderRadius: 50 }} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: activeColors.text }}>
                {title || username}
              </Text>
            </View>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1,  backgroundColor: activeColors.background, bottom: 0,}} edges={["bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: activeColors.background,}} behavior='padding' keyboardVerticalOffset={headerHeight}>
          <LegendList
            data={history.messages}
            renderItem={({ item }) => renderMessage(item as MediaMessage)}
            keyExtractor={(item) => item?.messageId ?? "unknown"}
            contentContainerStyle={{ padding: 10 }}
           estimatedItemSize={320}
      alignItemsAtEnd = {true}
    maintainScrollAtEnd = {true}
      maintainScrollAtEndThreshold={0.1}
          />

          <MessageInput onShouldSendMessage={sendMessage} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

export default ChatRoom

const styles = StyleSheet.create({
  
   bubble: {
    backgroundColor: '#e0e0ff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignSelf: 'flex-start',
  },
})
