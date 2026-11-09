import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import tracks from '@/data/toptracks.json'
import { Colors } from '@/constants/Colors';
import { useActiveColors } from '@/constants/ThemeMode';
import { TopTrack } from '@/utils/service_api/userServiceApi';

interface TopTracksProps {
  tracks: TopTrack[]; 
}

const TopTracks = ({ tracks = [] }: TopTracksProps) => {
  const activeColors = useActiveColors();
    const topTracks = [...tracks]
    .sort((a,b)=> b.playCount - a.playCount)
    .slice(0, 10);
  return (
    <View style={{width: '100%', alignItems: 'center', marginTop: 30,}}>
        <Text style={{fontWeight: '500', fontSize: 20, color: activeColors.text,}}>Top Tracks</Text>

        <ScrollView
style={{marginTop: 20, }}
horizontal
bounces={false}
showsHorizontalScrollIndicator={false}
contentContainerStyle={{gap: 13, paddingHorizontal: 10,}}
>
    {topTracks.map((track, index) => (
        <View style={{alignItems: 'center', gap: 8, width: 95,}} key={index}>
        <Image source={{uri: track.trackImageUrl}} style={{ height: 103, width: 95, borderRadius: 10,}}/>
        <View style={{width: '100%', alignItems: 'center', gap: 4,}}>
        <Text style={{fontWeight: 'bold', color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{track.trackName}</Text>
        <Text style={{fontSize: 12, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{track.artistName}</Text>
        <Text style={{fontSize: 11, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{track.playCount} plays</Text>
        </View>
        
    </View>
    ))}
</ScrollView>
    </View>
  )
}

export default TopTracks

const styles = StyleSheet.create({})