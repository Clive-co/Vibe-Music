import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native'
import React, { useState } from 'react'
import { Colors } from '@/constants/Colors'
//import recents from '@/data/songhistory.json'
import { differenceInDays, differenceInHours, differenceInMinutes, formatDistanceToNow, parseISO } from 'date-fns';
import { useActiveColors } from '@/constants/ThemeMode';
import { Track } from '@/utils/service_api/recentTracksService';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';


// const images : { [key: string]: any } = {
//     "blinding-lights": require('../../assets/images/covers/blinding-lights.jpg'),
//     "watermelon-sugar": require('../../assets/images/covers/watermelon-sugar.jpg'),
//     "levitating": require('../../assets/images/covers/levitating.jpg'),
//     "peaches": require('../../assets/images/covers/peaches.jpg'),
//     "save-your-tears": require('../../assets/images/covers/save-your-tears.jpg'),
//     "bad-guy": require('../../assets/images/covers/bad-guy.jpg'),
//     "circles": require('../../assets/images/covers/circles.jpg'),
//     "dont-start-now": require('../../assets/images/covers/dont-start-now.png'),
//     "good-4-u": require('../../assets/images/covers/good-4-u.png'),
//     "montero": require('../../assets/images/covers/montero.png')
//   };

// interface RecentSong {
//     songName: string;
//     artist: string;
//     albumCover: string;
//     timePlayed: string;
//   }
  

// Custom function to format time
const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const pastDate = parseISO(dateString);
    const minutes = differenceInMinutes(now, pastDate);
    const hours = differenceInHours(now, pastDate);
    const days = differenceInDays(now, pastDate);
  
    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}hr`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'now'; // or any other placeholder for less than a minute
    }
  };
  

  type RecentsProps = {
    tracks: Track[];
  };

  

  
  const Recents: React.FC<RecentsProps> = ({ tracks }) => {
    const activeColors = useActiveColors();
    const [isLoading, setIsLoading] = useState(false)
  
    const sortedRecents = tracks
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .slice(0, 4);
  
    return (
      <View style={{ width: '100%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: activeColors.text }}>Recents</Text>
          <Text style={{ fontWeight: '600', fontSize: 13, color: activeColors.text }}>See more</Text>
        </View>
  
        <View style={{ gap: 15, marginTop: 15 }}>
          {sortedRecents.map((recent, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, width: '65%', }}>
                <Image
                  source={{uri: recent.imageUrl}}
                  style={{ width: 50, height: 50, borderRadius: 5 }}
                />
                <View style={{ justifyContent: 'space-evenly' }}>
                  <Text style={{ color: activeColors.text, }} numberOfLines={1} ellipsizeMode='tail'>{recent.name}</Text>
                  <Text style={{ color: Colors.GRAY }} numberOfLines={1} ellipsizeMode='tail'>{recent.artist}</Text>
                </View>
              </View>
  
              <View
                style={{
                  borderRadius: 100,
                  height: 20,
                  paddingHorizontal: 15,
                  backgroundColor: activeColors.background2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: activeColors.shadowColor,
                  shadowOffset: { width: -2, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                }}
              >
                <Text style={{ color: activeColors.text }}>
                  {formatRelativeTime(recent.playedAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

export default Recents

const styles = StyleSheet.create({})