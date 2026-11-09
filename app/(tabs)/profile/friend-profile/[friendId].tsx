import { formatNumber, numberComma } from '@/components/FormatNumber';
import Recap from '@/components/profile/Recap';
import Recents from '@/components/profile/Recents';
import TopArtists from '@/components/profile/TopArtists';
import TopTracks from '@/components/profile/TopTracks';
import { AppleMusicImg, SpotifyImg } from '@/components/ProviderImg';
import { Colors } from '@/constants/Colors';
import { useActiveColors } from '@/constants/ThemeMode';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Tooltip } from '@rneui/themed';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState } from 'react';
import { fetchFriendDetails, FriendDetails } from '@/utils/service_api/friendshipServiceApi';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useColorScheme } from 'react-native';
import { fetchFriendRecentTracks, fetchFriendCurrentTrack, checkFriendPlaybackStatus, Track } from '@/utils/service_api/recentTracksService';
import { fetchFriendWeeklyRecap, WeeklyRecap } from '@/utils/service_api/friendshipServiceApi';
import {Skeleton} from 'moti/skeleton';
import { LoadingArtists, LoadingRecents, LoadingTracks } from '@/components/LoadingSkeletons';
import { set } from 'date-fns';
import { Equalizer } from '@/assets/svg/Equaliser';
import { getCurrentUser } from "aws-amplify/auth";

const  FriendProfile = () =>  {
  const { friendId, friendName, friendProvider, friendImg } = useLocalSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [friendDetails, setFriendDetails] = useState<FriendDetails | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recapData, setRecapData] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(false);
  const [recaploading, setRecapLoading] = useState(false);
  const [recentloading, setRecentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeColors = useActiveColors()
  const router = useRouter()
  const navigation = useNavigation()
  const isDark = useColorScheme() === 'dark';

  
  useEffect(() => {
    if (!friendId) return;
    let cancelled = false;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchFriendDetails(friendId as string);
        if (!cancelled) setFriendDetails(data);
        console.log('Friend details:', data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [friendId]);

  useEffect(() => {
  if (!friendDetails) return;
  let cancelled = false;
  setRecentLoading(true);

  const fetchInitialRecentTracks = async () => {
      try {
        const tracks = await fetchFriendRecentTracks({
          userId: friendDetails.userId,
          linkedAccount: friendDetails.linkedAccount,
          spotifyAccessToken: friendDetails.spotifyAccessToken,
          spotifyRefreshToken: friendDetails.spotifyRefreshToken,
          spotifyTokenExpiration: friendDetails.spotifyTokenExpiration as number,
          appleMusicAccessToken: friendDetails.appleMusicAccessToken!,
        });
        if (!cancelled) {
          setRecentTracks(tracks);
        }
      } catch (err) {
        if (!cancelled) console.error('Error fetching initial recent tracks:', err);
      } finally {
        if (!cancelled) {
          // Hide loader once initial recent-tracks are in
          setRecentLoading(false);
        }
    }
    };

    fetchInitialRecentTracks();
    return () => {
      cancelled = true;
    };
  }, [friendDetails]);

    // 2. Poll playback & recent & current track
    useEffect(() => {
      if (!friendDetails) return;

      let cancelled = false;
      let interval: NodeJS.Timeout;

      // Poll playback status every 60s
      const pollPlaybackStatus = async () => {
        try {
          const playbackStatus = await checkFriendPlaybackStatus({
            userId: friendDetails.userId,
            linkedAccount: friendDetails.linkedAccount,
            spotifyAccessToken: friendDetails.spotifyAccessToken,
            spotifyRefreshToken: friendDetails.spotifyRefreshToken,
            spotifyTokenExpiration: friendDetails.spotifyTokenExpiration as number,
            appleMusicAccessToken: friendDetails.appleMusicAccessToken!,
          });

          if (playbackStatus?.isListening) {
            // Fetch current track and recent tracks only if listening
            const [current, tracks] = await Promise.all([
              fetchFriendCurrentTrack({
                linkedAccount: friendDetails.linkedAccount,
                spotifyAccessToken: friendDetails.spotifyAccessToken,
                spotifyRefreshToken: friendDetails.spotifyRefreshToken,
                spotifyTokenExpiration: friendDetails.spotifyTokenExpiration as number,
                appleMusicAccessToken: friendDetails.appleMusicAccessToken!,
              }),
              fetchFriendRecentTracks({
                userId: friendDetails.userId,
                linkedAccount: friendDetails.linkedAccount,
                spotifyAccessToken: friendDetails.spotifyAccessToken,
                spotifyRefreshToken: friendDetails.spotifyRefreshToken,
                spotifyTokenExpiration: friendDetails.spotifyTokenExpiration as number,
                appleMusicAccessToken: friendDetails.appleMusicAccessToken!,
              }),
            ]);
            if (!cancelled) {
              setCurrentTrack(current);
              setRecentTracks(tracks);
              console.log(' freind Current track:', current);
            }
          } else {
            if (!cancelled) setCurrentTrack(null);
            console.log('Friend is not listening to any track.');
          }
        } catch (err) {
          if (!cancelled) console.error("Error polling friend's playback status:", err);
        }
      };

      // Initial fetch
      pollPlaybackStatus();
      interval = setInterval(pollPlaybackStatus, 60_000);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [friendDetails]);

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


useEffect(() => {
  if (!friendId) return;
  let cancelled = false;
  setRecapLoading(true);

  const loadRecap = async () => {
    try {
      const recap = await fetchFriendWeeklyRecap(friendId as string);
      if (!cancelled && recap) {
        setRecapData(recap);
        console.log('Weekly Recap:', recap);
      }
    } catch (err) {
      if (!cancelled) console.error('Error fetching weekly recap:', err);
    } finally {
      if (!cancelled) setRecapLoading(false);
    }
  };

  loadRecap();
  return () => {
    cancelled = true;
  };
}, [friendId]);

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

    

    const minutes = 1408000000;
    const artists = 199;
    const tracks = 482;

    const pageBottomPadding = useBottomTabBarHeight()

    // useEffect(() => {
    //     if (friendDetails?.username) {
    //       navigation.setOptions({
    //         title: friendDetails.username, // Set the league name as the header title
    //       });
    //     }
    //   }, [friendDetails?.username, navigation]);
  return (
    <> 
    <Stack.Screen
    name= {friendDetails?.username}
    options={{
      title: friendName.toString().toLowerCase(),
      headerStyle: { backgroundColor: activeColors.background,},
      headerTintColor: activeColors.tint,
      contentStyle: {backgroundColor: activeColors.background,},
      headerShadowVisible: false,
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
              {loading? 
              <Skeleton
               width={'100%'} 
              height={'100%'} 
              radius={'round'}
              colorMode={isDark? 'dark' : 'light'}
              /> 
              : 
              <Image source={{uri: friendDetails?.profileImg}} style={{ width: '100%', height: '100%', borderRadius: 99,}} resizeMode='cover'/>
              }
            
            <View style={{display: loading? 'none' : 'flex', position: 'absolute', right: 0, bottom: 0, width: '30%', height: '30%', borderRadius: 100, backgroundColor: activeColors.background, alignItems: 'center', justifyContent: 'center',}}>
            {
      friendDetails?.linkedAccount === 'spotify' ? (
        <SpotifyImg width={18} height={18} />
      ) : friendDetails?.linkedAccount === 'apple music' ? (
        <AppleMusicImg width={15} height={15} />
      ) : (
        <MaterialIcons name="offline-bolt" size={18} color="red" />
      )
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
          {
            loading ? <Skeleton colorMode={isDark? 'dark' : 'light'} height={15}  width={'20%'}/> : <Text style={{fontWeight: 'bold', color: activeColors.text,}}>{friendDetails?.username}</Text>
          }
            
            {
              loading ? <Skeleton width={'40%'} height={15} colorMode={isDark? 'dark' : 'light'}/>
              :
               
               currentTrack? 
                            <View style={{width: '80%', flexDirection: 'row', alignItems: 'center',}}>
                            <Text style={{fontSize: 12, color: activeColors.text, }} ellipsizeMode='tail' numberOfLines={1}>Listening to {currentTrack?.name} <Equalizer color={friendDetails?.linkedAccount === 'spotify'? '#1DB954' : friendDetails?.linkedAccount === 'apple music'? '#FA233B' : 'purple'}/></Text> 
                            </View>
                            : 
                            <Text>not listening to anything</Text>
            }

           
            
          </View>

<View style={{flexDirection: 'row', width: '90%',  gap: 20, alignSelf: 'center', alignItems: 'center', justifyContent: 'space-evenly', marginVertical: 20,}}>

            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/(tabs)/profile/user-friends',
                params: { friendId: friendDetails?.userId, name: friendName }
              })}
              disabled={loading || !friendDetails}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '43%',
                borderRadius: 10,
                paddingVertical: 5,
                backgroundColor: Colors.GRAY,
                opacity: loading || !friendDetails ? 0.5 : 1, // visually indicate disabled
                shadowColor: "#171717",
                shadowOffset: { width: -2, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <Text style={{ color: activeColors.text }}>Friends</Text>
            </TouchableOpacity>



{
  userId === friendId ? null :
  <TouchableOpacity
            onPress={() => router.push({
              pathname: `/chatRoom`,
              params: {
                friendId: friendDetails?.userId,
                username: friendDetails?.username,
                profileImg: friendDetails?.profileImg
              },
            })}
            disabled={loading || !friendDetails}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: "#171717",
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
              width: "43%",
              paddingVertical: 5,
              backgroundColor: Colors.GRAY,
              borderRadius: 10,
              opacity: loading || !friendDetails ? 0.5 : 1, // visually indicate disabled
            }}
          >
            <Text style={{ color: activeColors.text }}>Message</Text>
          </TouchableOpacity>
}
</View>
          

          {/*---------------------------------------------------------- recents ----------------------------------------------------------------*/}
          <View style={{width: '90%', marginVertical: 10,}}>
            {
              recentloading? <LoadingRecents/> : <Recents tracks={recentTracks} />
            }
            
          </View>

           <Recap data={recapData} artists={recapData?.totalArtistsListened} minutes={recapData?.totalMinutesListened} tracks={recapData?.totalTracksListened} />

           {
            recaploading? <LoadingArtists/> : <TopArtists topArtists={recapData?.topArtists || []} />
           }

           {
            recaploading? <LoadingTracks/> : <TopTracks tracks={recapData?.topTracks || []} />
           }
           
         
      </ScrollView>
    </>
  );
}

export default FriendProfile

const styles = StyleSheet.create({
  tooltipContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Optional: Background color of the tooltip
   // borderRadius: 5,
    padding: 5,
  },
})