import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TouchableHighlight } from 'react-native'
import React, { useState, useContext, useEffect, useCallback } from 'react'
import SwipeableList from '@/context/SwipeableContext'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Link, Stack, useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Path, Svg } from 'react-native-svg';
import friends from '@/data/friends.json';
import Recents from '@/components/profile/Recents';
import Recap from '@/components/profile/Recap';
import TopArtists from '@/components/profile/TopArtists';
import TopTracks from '@/components/profile/TopTracks';
import { formatNumber, numberComma } from '@/components/FormatNumber';
import { Tooltip } from '@rneui/themed';
import { AppleMusicImg, SpotifyImg } from '@/components/ProviderImg';
import { useActiveColors } from '@/constants/ThemeMode';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlobalContext } from "@/context/GlobalProvider";
import axios from "axios";
import getSpotifyAccessToken from "@/utils/spotifyUtils";
import { post } from "aws-amplify/api";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import UnlinkedProfile from '@/components/profile/UnlinkedProfile';
import { fetchWeeklyRecap, WeeklyRecap, getUser, User } from "@/utils/service_api/userServiceApi";
import { checkPlaybackStatus, fetchRecentTracks, fetchCurrentTrack, Track as RecentTrack } from '@/utils/service_api/recentTracksService';
import {Equalizer} from '@/assets/svg/Equaliser';
import { LoadingArtists, LoadingRecents, LoadingTracks } from '@/components/LoadingSkeletons';


interface Friend {
  img: string;
}

const getRandomFriends = (friendsList: any[], count: number) => {
  const shuffled = [...friendsList];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

// fixed cache name.
const CACHE_NAME = 'weeklyRecap';
const USER_CACHE_KEY = 'cachedUser';
  
  const Page = () => {

   
    const activeColors = useActiveColors();
    const router = useRouter();
    const pathname = usePathname(); // Current screen path


    const { spotifyLinked, appleLinked } = useContext<any>(GlobalContext);
    const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
    const [currentTrack, setCurrentTrack] = useState<RecentTrack | null>(null);
    const [recapData, setRecapData] = useState<WeeklyRecap | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const randomFriends = getRandomFriends(friends, 3);
    const [loading, setLoading] = useState(false);
    const [recentLoading, setRecentLoading] = useState(false);
    const [recaploading, setRecapLoading] = useState(false);

    const [scrollY, setScrollY] = useState(0);
   
    const handleScroll = (event: any) => {
      setScrollY(event.nativeEvent.contentOffset.y);
    };


      const [visibleTooltip, setVisibleTooltip] = useState<number | null>(null);

  const handleTooltipVisibility = (index: number) => {
    setVisibleTooltip(index);
  };

  const handleTooltipHide = () => {
    setVisibleTooltip(null);
  };

  // …inside your component…

// 1. Fetch current user on mount
 useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadUser = async () => {
        setLoading(true);
        try {
          // 1) Read from cache first
          const cachedJson = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (cachedJson && !cancelled) {
            const cachedUser: User = JSON.parse(cachedJson);
            setUser(cachedUser);
            console.log('Loaded user from cache', cachedUser);
          }

          // 2) Then fetch fresh
          const freshUser = await getUser();
          if (!cancelled) {
            setUser(freshUser);
            console.log('Fetched fresh user', freshUser);
            // 3) Update cache
            await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(freshUser));
          }
        } catch (err) {
          if (!cancelled) console.error('Error loading user:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadUser();
      return () => {
        cancelled = true;
      };
    }, [])
  );

// 2. poll playback, current & recent
  useEffect(() => {
  if (!user || (user.linkedAccount !== 'spotify' && user.linkedAccount !== 'apple music')) return;

  let cancelled = false;
  let pollInterval: NodeJS.Timeout;
  let minuteInterval: NodeJS.Timeout | null = null;

  setRecentLoading(true);

  async function poll(firstRun = false) {
    if (cancelled) return;

    // Use the user's linked provider
    const provider = user!.linkedAccount as 'spotify' | 'apple music';

    // 1) check playback status
    const status = await checkPlaybackStatus(provider);
    if (!status) return;
    const { accessToken, isListening } = status;

    // 2) fetch current track
    const now = await fetchCurrentTrack(accessToken);
    if (!cancelled) {
      setCurrentTrack(now);
      console.log('Current track:', now);
    }

    // 3) fetch recent tracks
    const recs = await fetchRecentTracks(provider, accessToken);
    if (!cancelled) {
      setRecentTracks(recs);
      console.log('Initial recent tracks:', recs);
    }

    // 4) only after both are fetched, turn off loader on first run
    if (firstRun) {
      setRecentLoading(false);
    }

    // 5) if they start listening, kick off 1-minute loop
    if (isListening && !minuteInterval) {
      minuteInterval = setInterval(async () => {
        if (cancelled) return;
        const now2 = await fetchCurrentTrack(accessToken);
        if (!cancelled) setCurrentTrack(now2);
        const recs2 = await fetchRecentTracks(provider, accessToken);
        if (!cancelled) setRecentTracks(recs2);
      }, 60_000);
    }

    // 6) if they stop, clear that loop
    if (!isListening && minuteInterval) {
      clearInterval(minuteInterval);
      minuteInterval = null;
    }
  }

  poll(true);
  pollInterval = setInterval(() => poll(false), 300_000);

  return () => {
    cancelled = true;
    clearInterval(pollInterval);
    if (minuteInterval) clearInterval(minuteInterval);
  };
}, [user]);


// 3. Fetch weekly recap on mount
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    setRecapLoading(true);
    try {
      const recapData = await fetchWeeklyRecap();
      if (!cancelled && recapData) {
        setRecapData(recapData);
        console.log('Weekly Recap:', recapData);
      }
    } catch (err) {
      if (!cancelled) console.error('Error fetching weekly recap:', err);
    } finally {
      if (!cancelled) setRecapLoading(false);
   }
  };

  fetchData();
  return () => {
    cancelled = true;
  };
}, []);


const insets = useSafeAreaInsets()
const pageBottomPadding = useBottomTabBarHeight()
    return (
      <>
      <Stack.Screen
    options={{
      headerTitle: "",
      //headerTransparent: true,
      contentStyle: {backgroundColor: activeColors.background,},
      headerStyle: {backgroundColor: activeColors.background,},
      headerShadowVisible: false,
      headerRight: () => (
        <TouchableOpacity style={{marginRight: 20, padding: 6, }}  onPressIn={() => router.push({
          pathname: '/settings',
          params: {profileImg: user?.profileImg, userName: user?.username, }
        })}>
          {/* <Link href={'/settings'} > */}
          <AntDesign name='setting' size={24} color={activeColors.text}/>
          {/* </Link> */}
          </TouchableOpacity>
      ),
    }}
    />
      <ScrollView 
      style={{flex:1, backgroundColor: activeColors.background, width: '100%', }} contentContainerStyle={{alignItems: 'center', paddingTop: 10, paddingBottom: pageBottomPadding + 10,}}
      showsVerticalScrollIndicator={false}
      bounces={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      >
        <View style={{flexDirection: 'row', gap: 20, width:'90%', alignItems: 'center',  justifyContent: 'space-between', }}>

          <View 
          style={{
            width: 80, 
            height: 80, 
            borderRadius: 99,
            shadowColor: activeColors.shadowColor,
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 1, 
            }}>
            <Image source={{uri: user?.profileImg}} style={{ width: '100%', height: '100%', borderRadius: 99,}} resizeMode='cover'/>
            <View style={{position: 'absolute', right: 0, bottom: 0, width: '30%', height: '30%', borderRadius: 100, backgroundColor: activeColors.background, alignItems: 'center', justifyContent: 'center',}}>
              {
               user?.linkedAccount === "spotify" ? <SpotifyImg width={18} height={18} /> :  user?.linkedAccount === 'apple music' ? <AppleMusicImg width={15} height={15} /> : <MaterialIcons name='offline-bolt' size={18} color={'red'}/>
              }
                {/* <SpotifyImg width={18} height={18} /> */}
                </View>
          </View>

          <View style={{gap: 30, flexDirection: 'row', right: 15,}}>
          <Tooltip
          popover={<Text style={{color: Colors.WHITE,}}>{numberComma(recapData?.totalMinutesListened || 0)} min</Text>}
          visible={visibleTooltip === 1}
          onOpen={() => handleTooltipVisibility(1)}
          onClose={handleTooltipHide}
          containerStyle={styles.tooltipContainer}
          pointerColor={'rgba(0, 0, 0, 0.7)'}
        >
            <View style={{gap: 5, alignItems: 'center', justifyContent: 'center',}}>
              <Text style={{fontWeight: 'bold', color: activeColors.text,}}>{formatNumber(recapData?.totalMinutesListened || 0)}</Text>
              <Text style={{fontSize: 12, color: activeColors.text,}}>Min Played</Text>
            </View>
            </Tooltip>


            <Tooltip
          popover={<Text style={{color: Colors.WHITE,}}>{recapData?.totalArtistsListened} artists</Text>}
          visible={visibleTooltip === 2}
          onOpen={() => handleTooltipVisibility(2)}
          onClose={handleTooltipHide}
          containerStyle={styles.tooltipContainer}
          pointerColor={'rgba(0, 0, 0, 0.7)'}
        >
            <View style={{gap: 5, alignItems: 'center', justifyContent: 'center',}}>
            <Text style={{fontWeight: 'bold', color: activeColors.text,}}>{formatNumber(recapData?.totalArtistsListened || 0)}</Text>
            <Text style={{fontSize: 12, color: activeColors.text,}}>Artists</Text>
            </View>
            </Tooltip>


            <Tooltip
          popover={<Text style={{color: Colors.WHITE,}}>{recapData?.totalTracksListened} tracks</Text>}
          visible={visibleTooltip === 3}
          onOpen={() => handleTooltipVisibility(3)}
          onClose={handleTooltipHide}
          containerStyle={styles.tooltipContainer}
          pointerColor={'rgba(0, 0, 0, 0.7)'}
        >
            <View style={{gap: 5, alignItems: 'center', justifyContent: 'center',}}>
            <Text style={{fontWeight: 'bold', color: activeColors.text,}}>{formatNumber(recapData?.totalTracksListened || 0)}</Text>
            <Text style={{fontSize: 12, color: activeColors.text,}}>Tracks Played</Text>
            </View>
</Tooltip>
          
          </View>

        </View>
        <View style={{width: '90%', paddingHorizontal: 5, marginTop: 5, gap: 3,}}>
            <Text style={{fontWeight: 'bold', color: activeColors.text,}}>{user?.username}</Text>

            {/* comment */}
            
            {
              currentTrack? 
              <View style={{width: '80%', flexDirection: 'row', alignItems: 'center',}}>
              <Text style={{fontSize: 12, color: activeColors.text, }} ellipsizeMode='tail' numberOfLines={1}>Listening to {currentTrack?.name} </Text> 
              <Equalizer color={user?.linkedAccount === 'spotify'? '#1DB954' : user?.linkedAccount === 'apple music'? '#FA233B' : 'purple'}/>
              </View>
              : 
              <Text>not listening to anything</Text>
            }
            

          </View>

          <View style={{
            width: '100%', 
            //backgroundColor: 'red',
            marginVertical: 20, 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile/friends')}
            style={{
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center',
              shadowColor: "#171717",
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2, 
              }}>
            <View
            style={{
              paddingVertical: 3,
              paddingHorizontal: 5,
              backgroundColor: activeColors.background2,
              borderRadius: 5,
              
            }}
            >
              <Text style={{color: activeColors.text,}}>Friends</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',}}>
            {randomFriends.map((friend: any, index: number) => (
        <Image 
          key={index}
          source={{ uri: friend.img }} 
          style={[
            [styles.friendImage, {borderColor: activeColors.tint,}],
            index === 1 ? [styles.middleImage, {borderColor: activeColors.tint,}] : null
          ]} 
        />
      ))}
            </View>
            </TouchableOpacity>
          </View>

          {/*---------------------------------------------------------- recents ----------------------------------------------------------------*/}

          {
            loading || !user ? 
            // Show your loading skeletons or a single loading component here
            <>
            <View style={{width: '90%', marginVertical: 10,}}>
              <LoadingRecents />
            </View>
              <LoadingArtists />
              <LoadingTracks />
            </>
          : 
           user.linkedAccount === 'spotify' || user.linkedAccount === 'apple music' ? 
          <>
          <View style={{width: '90%', marginVertical: 10,}}>
            {
              recentLoading ? <LoadingRecents/> : <Recents tracks={recentTracks} />
            }
            
          </View>
          
          {
            <Recap data={recapData} minutes={recapData?.totalMinutesListened} artists={recapData?.totalArtistsListened} tracks={recapData?.totalTracksListened} />
          }
           

           {
            recaploading? <LoadingArtists/> : <TopArtists topArtists={recapData?.topArtists || []} />
           }

           {
            recaploading ? <LoadingTracks/> : <TopTracks tracks={recapData?.topTracks || []} />
           }
           </>
           :
           <UnlinkedProfile/>
          }
         
      </ScrollView>
      </>
    )
  }
  
  export default Page
  
  const styles = StyleSheet.create({
    friendImage: {
      width: 20,
      height: 23,
      borderRadius: 5,
      borderWidth: 1,    
      //borderColor: activeColors.tint,
    },
    middleImage: {
      marginBottom: 10,  // Move the middle image up
      zIndex: 1,         // Ensure it is on top=
      borderWidth: 1,    // Optional: add a border to make it stand out
      //borderColor: activeColors.tint,
    },

    tooltipContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Optional: Background color of the tooltip
     // borderRadius: 5,
      padding: 5,
    },
  })