import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  StyleSheet,
  Easing,
  Alert,
} from "react-native";
import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import {  Stack, useNavigation, useRouter } from "expo-router";
import { Entypo, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { Colors, } from "../../constants/Colors";
import { useHeaderHeight, Screen } from "@react-navigation/elements";
import { Path, Svg } from "react-native-svg";
import FriendActivity from "@/components/home/FriendActivity";
import friendActivityData from "@/data/friendactivity.json";
import EmojiPicker, { EmojiKeyboard } from "rn-emoji-keyboard";
import { DefaultTheme } from "@react-navigation/native";
import { useActiveColors } from "@/constants/ThemeMode";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalContext } from "@/context/GlobalProvider";
import UnlinkedHome from "@/components/home/UnlinkedHome";
import { fetchHomeFriends, Friend } from '@/utils/service_api/friendshipServiceApi';
import { fetchRequests, FriendRequest } from '@/utils/service_api/friendshipServiceApi';
import {
  fetchRecentTracks,
  Track,
  checkFriendPlaybackStatus,
} from '@/utils/service_api/friendRecentTracksService';

import NoFriends from "@/components/home/NoFriends";
import { set } from "date-fns";
import { FriendActivitySkeleton } from "@/components/LoadingSkeletons";
import { sendReaction } from '@/utils/service_api/reactionServiceApi';
import { getUser, User } from '@/utils/service_api/userServiceApi';

const FRIENDS_CACHE_KEY = 'cachedHomeFriends';
const TRACKS_CACHE_KEY = 'cachedRecentTracks';
const MAX_URL_REQUESTS = 10

export default function HomeScreen() {
  const {spotifyLinked, appleLinked} = useContext(GlobalContext)!
  const activeColors = useActiveColors();
  const headerHeight = useHeaderHeight();
  const [friendsData, setFriendsData] = useState<Friend[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  //states for the new badge 
  const [showNewBadge, setShowNewBadge] = useState(false);
  const isFirstLoad = useRef(true);
  const [prevTrackIds, setPrevTrackIds] = useState<string[] | undefined>();
  const { sendMessageWS, wsReady, socket } = useContext(GlobalContext)!
  const router = useRouter()
  const { width, height } = Dimensions.get('window');
  //notifications
  const [hasRequests, setHasRequests] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState({});
  const [currentFriendId, setCurrentFriendId] = useState(friendActivityData[0].id);
  const [rainEmojis, setRainEmojis] = useState([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTrackData, setCurrentTrackData] = useState<{
    trackName: string;
    artistName: string;
    trackImageUrl: string;
    trackId: string;
    friendId: string;
  } | null>(null);

  const predefinedEmojis = ['😊', '😂', '😍', '😢', '😡', '🚮'];

  const handlePick = async (emoji) => {
    const newEmoji = emoji.emoji;
    setSelectedEmoji(prevEmojis => ({ ...prevEmojis, [currentFriendId]: newEmoji }));
    setIsOpen(false);
    startEmojiRain(newEmoji);
    
    // Send reaction if we have track data and WebSocket is ready
    if (currentTrackData && sendMessageWS && wsReady) {
      try {
        await sendReaction(
          currentTrackData.friendId,
          {
            trackName: currentTrackData.trackName,
            artistName: currentTrackData.artistName,
            trackImageUrl: currentTrackData.trackImageUrl,
            trackId: currentTrackData.trackId,
          },
          newEmoji,
          sendMessageWS
        );
        
        console.log(`Reaction sent to friend ${currentTrackData.friendId} with emoji ${newEmoji}`);
      } catch (error) {
        console.error('Failed to send reaction:', error);
        // You might want to show an error message to the user here
      }
    }
    
    console.log(`Reacted to friend ${currentFriendId} with emoji ${newEmoji}`);
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
  if (viewableItems.length > 0 && viewableItems[0].item.id !== currentFriendId) {
    const currentTrack = viewableItems[0].item;
    setCurrentFriendId(currentTrack.id);
    
    // Set current track data for reactions
    setCurrentTrackData({
      trackName: currentTrack.trackName || currentTrack.name || 'Unknown Track',
      artistName: currentTrack.artistName || currentTrack.artist || 'Unknown Artist',
      trackImageUrl: currentTrack.imageUrl || currentTrack.albumArt || '',
      trackId: currentTrack.trackId || currentTrack.id,
      friendId: currentTrack.friendId || currentTrack.userId, // Adjust based on your data structure
    });
  }

}, [currentFriendId]);

  const startEmojiRain = (emoji) => {
    const animations = [];
    const animatedValues = [];
    for (let i = 0; i < 30; i++) {
      const animatedValue = new Animated.Value(0);
      animatedValues.push(animatedValue);
      const randomX = Math.random() * (width - 50); // Keep emojis within the screen width
      const randomSize = 30 + Math.random() * 20; // Random sizes between 30 and 50
      const animationDuration = 2000 + Math.random() * 1000; // Randomize duration between 3000 and 5000ms
      animations.push({ emoji, animatedValue, randomX, randomSize, animationDuration, id: Math.random().toString() });
    }
    setRainEmojis(animations);

    Animated.stagger(50, animatedValues.map((animatedValue, index) => 
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: animations[index].animationDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )).start();

    setTimeout(() => setRainEmojis([]), Math.max(...animations.map(anim => anim.animationDuration)));
  };

  const renderRainEmojis = () => {
    return rainEmojis.map(({ emoji, animatedValue, randomX, randomSize, id }) => {
      const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [height + 50, -randomSize], // Move emojis from bottom to top
      });

      return (
        <Animated.Text 
          key={id} 
          style={[
            styles.rainEmoji, 
            { 
              transform: [{ translateY }], 
              left: randomX, 
              fontSize: randomSize 
            }
          ]}
        >
          {emoji}
        </Animated.Text>
      );
    });
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadReceived = async () => {
      try {
        const received = await fetchRequests("received");
        if (cancelled) return;
        setReceivedRequests(received);
        setHasRequests(received.length > 0);
        console.log("Received requests:", received);
      } catch (err) {
        console.error("Error loading received requests:", err);
      }
    };
    loadReceived();
    return () => { cancelled = true };
  }, []);

  const handlePredefinedEmoji = async (emoji: string) => {
    setSelectedEmoji(prevEmojis => ({ ...prevEmojis, [currentFriendId]: emoji }));
    startEmojiRain(emoji);
    
    // Send reaction if we have track data and WebSocket is ready
    if (currentTrackData && sendMessageWS && wsReady) {
      try {
        await sendReaction(
          currentTrackData.friendId,
          {
            trackName: currentTrackData.trackName,
            artistName: currentTrackData.artistName,
            trackImageUrl: currentTrackData.trackImageUrl,
            trackId: currentTrackData.trackId,
          },
          emoji,
          sendMessageWS
        );
        
        console.log(`Reaction sent to friend ${currentTrackData.friendId} with emoji ${emoji}`);
      } catch (error) {
        console.error('Failed to send reaction:', error);
        // You might want to show an error message to the user here
      }
    }
    
    console.log(`Reacted to friend ${currentFriendId} with emoji ${emoji}`);
  };

  //function to set the showNewBadge state to true when a new track is added
  useEffect(() => {
    if (recentTracks.length === 0) return;

    const newIds = recentTracks.map(t => t.id);
    if (isFirstLoad.current) {
      setPrevTrackIds(newIds);
      isFirstLoad.current = false;
      return;
    }

    // Only show badge if the first track is not in the previous list
    if (!(prevTrackIds ?? []).includes(recentTracks[0].id)) {
      setShowNewBadge(true);
    }
    setPrevTrackIds(newIds);
  }, [recentTracks]);

  useEffect(() => {
  let cancelled = false;
  let pollingInterval: NodeJS.Timeout | null = null;

  const loadFriendsAndTracks = async () => {
    setLoading(true);
    try {
      // 1) Load from cache
      const friendsJson = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
      if (friendsJson && !cancelled) {
        setFriendsData(JSON.parse(friendsJson));
        console.log('Loaded friends from cache');
      }
      const tracksJson = await AsyncStorage.getItem(TRACKS_CACHE_KEY);
      if (tracksJson && !cancelled) {
        setRecentTracks(JSON.parse(tracksJson));
        console.log('Loaded tracks from cache');
      }

      // Immediately hide loading if we have any cached data
      if ((friendsJson || tracksJson) && !cancelled) {
        setLoading(false);
      }

      // 2) Fetch fresh friends
      const freshFriends = await fetchHomeFriends();
      if (!cancelled) {
        setFriendsData(freshFriends);
        await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(freshFriends));
        console.log('Fetched friends from network and updated cache');
      }

      // 3) Fetch fresh tracks for those friends
      const freshTracks: Track[] = await fetchRecentTracks(freshFriends);
      if (!cancelled) {
        setRecentTracks(freshTracks);
        await AsyncStorage.setItem(TRACKS_CACHE_KEY, JSON.stringify(freshTracks));
        console.log('Fetched tracks from network and updated cache');
      }

      // 4) Start polling for actively listening friends
      startPolling(freshFriends);
    } catch (err) {
      if (!cancelled) {
        console.error('Error loading friends/tracks:', err);
        Alert.alert('Error', 'Failed to load friends or tracks. Please try again later.');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);  
      }
    }
  };

  const startPolling = (friends: Friend[]) => {
    pollingInterval = setInterval(async () => {
      try {
        // 1) Determine which friends are actively listening
        const statuses = await Promise.all(
          friends.map(f => checkFriendPlaybackStatus(f))
        );
        const activeFriends = friends.filter((_, i) => statuses[i]?.isListening);

        if (activeFriends.length > 0) {
          console.log(`Active friends: ${activeFriends.map(f => f.username).join(', ')}`);

          // 2) Fetch recent tracks only for those active friends
          const activeTracks = await fetchRecentTracks(activeFriends);

          // 3) Merge into existing feed, keeping most recent per track ID
          setRecentTracks(prev => {
            // Compare IDs and playedAt timestamps
            const prevIds = prev.map(t => t.id + t.playedAt).join(',');
            const newIds = activeTracks.map(t => t.id + t.playedAt).join(',');
            if (prevIds === newIds) return prev; // No change, don't update state
            // Otherwise, update as before
            const map = new Map<string, Track>();
            prev.forEach(t => map.set(t.id, t));
            activeTracks.forEach(t => {
              const existing = map.get(t.id);
              if (!existing || new Date(t.playedAt) > new Date(existing.playedAt)) {
                map.set(t.id, t);
              }
            });
            return Array.from(map.values()).sort((a, b) =>
              new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
            );
          });
        }
      } catch (err) {
        console.error('Error polling for active friends:', err);
      }
    }, 60_000); // poll every minute
  };

  loadFriendsAndTracks();

  return () => {
    cancelled = true;
    if (pollingInterval) clearInterval(pollingInterval);
  };
}, []);

const onBellPress = () => {
    // 1) take first N
    const light = receivedRequests
      .slice(0, MAX_URL_REQUESTS)
      .map(r => ({
        friendId:   r.friendId,
        username:   r.username,
        profileImg: r.profileImg
      }))

    // 2) serialize
    const qs = encodeURIComponent(JSON.stringify(light))

    // 3) push
    router.push({
      pathname: '/(modals)/notifications',
      params: { preview: qs }
    })
  }
    
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerStyle: {backgroundColor:'transparent'},
          //headerStyle: { height: 100},

          headerLeft: () => (
            <Text
              style={{ fontFamily: "dmsans-semibold", color: Colors.GRAY, }}
              className="ml-8 font-bold text-2xl"
            >
              Activity
            </Text>
          ),

          headerRight: () => (
            <View className="flex-row mr-9 justify-between gap-8">
              {
                hasRequests ? 
                <View style={{
                  position: "absolute", 
                  padding: 5, 
                  borderRadius: 99, 
                  backgroundColor: Colors.PRIMARY,
                  right: 0,
                  zIndex: 1,
                  }}>
                </View>
                : null
              }
              <TouchableOpacity 
              onPress={onBellPress}
              style={{width: 35, 
              height: 35, 
              borderRadius: 99, 
              backgroundColor: 'rgba(25, 25, 25, 0.6)',
               alignItems: 'center', 
               justifyContent: 'center',

              }}>
                <Ionicons name="notifications" size={20} color={Colors.WHITE} />
              </TouchableOpacity>

              {/* <TouchableOpacity 
              style={{width: 35, 
              height: 35, 
              borderRadius: 99, 
              backgroundColor: "rgba(25, 25, 25, .1)",
               alignItems: 'center', 
               justifyContent: 'center',

              }}>
                <Ionicons name="chatbubbles" size={20} color={Colors.GRAY} />
              </TouchableOpacity> */}
            </View>
          ),
        }}
      />

{ loading
  ? 
    // loading skeleton
    <FriendActivitySkeleton />
  
  :friendsData.length === 0 ?

<NoFriends/>  
:
      <View
        className="flex-1  bg-white"
        style={{
          //paddingTop: headerHeight,
          //paddingBottom: 50,
         // flexDirection: "column",
          marginBottom: 0,
          //backgroundColor: 'red',
        }}
      >

        
        <View
          //className="ml-8 "
          style={{
            //paddingTop: headerHeight,
            flex: 1,
            backgroundColor: activeColors.background,
            alignItems: 'center',
          justifyContent: 'center',
          }}
        >
          
{/*---------------------------------------------------- Friends Activity code Begins here ----------------------------------------*/}
          <View style={{ flex: 1, marginTop: 0,}}>
          {/*
          passed the newly added showNewBadge state to the FriendActivity component
          and the onClearNewBadge function to clear the badge when the user clicks on it
          */}

            <FriendActivity
              friendActivity={recentTracks}
              selectedEmoji={selectedEmoji}
              currentFriendId={currentFriendId}
              onViewableItemsChanged={onViewableItemsChanged}
              showNewBadge={showNewBadge}
              onClearNewBadge={() => setShowNewBadge(false)}
            />

          
            {/* <Text>Current Friend ID: {currentFriendId}</Text> */}
            <View
           // className="bg-slate-300"
            style={{
              marginTop: 0,
              borderRadius: 99,
              width: "85%",
              height: 50,
              shadowColor: "#171717",
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 1,
              backgroundColor: activeColors.homeButtonBackdrop,
              alignSelf: "center",
              flexDirection: "row",
              position: 'absolute',
              bottom: '15%',
            }}
          >
            <View
            className="recentEmojis"
              style={{
                width: "85%",
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
                {predefinedEmojis.map((emoji, index) => (
                  <TouchableOpacity key={index} onPress={() => handlePredefinedEmoji(emoji)}>
                    <Text style={{ fontSize: 30 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
              style={{
                alignSelf: "flex-end",
                height: "100%",
                width: "15%",
                borderTopRightRadius: 99,
                borderBottomRightRadius: 99,
                backgroundColor: Colors.PRIMARY,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setIsOpen(true)}
            >
              <Feather name="plus" size={24} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
          </View>
          {/*----------------------------------------------------- Friends Activity code Endss here -------------------------------------------*/}

          {/* ----------------------------------------------------------- Reactions code Begins here -------------------------------------------*/}
          
          <EmojiPicker 
          onEmojiSelected={handlePick} 
          open={isOpen} onClose={() => 
          setIsOpen(false)} 
          enableSearchBar 
          enableRecentlyUsed={true}
          theme={{
            header: activeColors.tint, 
            search: {
              background: activeColors.buttonBackdrop, 
              text: activeColors.text,
              placeholder: activeColors.text,
            },

            container: activeColors.sheet,
            category: {
              container: Colors.GRAY,
              icon: activeColors.text,
              containerActive: activeColors.homeButtonBackdrop
            }
            }} 
          />

          {/*--------------------------------------------------------- Reactions code Ends here ------------------------------------------------- */}

          
        </View>
        
      </View>


}

      
      {renderRainEmojis()}
      {/* <StatusBar style={Screen.name == 'index'? theme.mode === "dark" ? "light" : "dark" : undefined}/> */}
    </>
  );
}

const styles = StyleSheet.create({
  rainEmoji: {
    position: 'absolute',
    fontSize: 30,
  },
 
});
