import { Animated, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { FriendActivityType } from '@/types/friendActivityType';
import {  Colors } from '@/constants/Colors';
import { AppleMusicImg, SpotifyImg } from '../ProviderImg';
import { useActiveColors } from '@/constants/ThemeMode';
import { Track } from '@/utils/service_api/friendRecentTracksService';
import { openSpotifyTrackOrSearch, openAppleMusicTrackOrSearch } from '@/utils/service_api/deepLinkService';

export type  Ref = BottomSheetModal;

interface Props {
    songData: Track | null;
  }

const OnclickSongSheet = forwardRef<Ref, Props>(({songData}, ref) => {
    
    const snapPoints = useMemo(() => ["45%"], [])

    const renderBackdrop = useCallback(
        (props: any) => (
          <BottomSheetBackdrop
            opacity={0.6}
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        ),
        []
      );

      const activeColors = useActiveColors()
      
  return (
    <BottomSheetModal
    ref={ref}
    index={0}
    snapPoints={snapPoints}
    enableDynamicSizing = {false}
    backdropComponent={renderBackdrop}
    handleIndicatorStyle={{backgroundColor: activeColors.tint,}}
    backgroundStyle={{backgroundColor: activeColors.sheet, borderTopLeftRadius: 40, borderTopRightRadius: 40,}}
    >
        <BottomSheetView style={{flex: 1, alignItems: 'center', paddingTop: 20, gap: Platform.OS=='ios'? 30 : 25, }}>
            <Animated.View 
            style={{
                width: 70, 
                height: 70, 
                backgroundColor: 'rgba(25, 25, 25, .5)',
                borderRadius: 99,  
                alignItems: 'center', 
                justifyContent: 'center',
                shadowColor: "#171717",
                animationName: "spin",
                animationDuration: "1s",
                shadowOffset: { width: -2, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 5,
                }}>
            <Animated.Image 
            source={{uri: songData?.imageUrl}}
            style={{width: 70, height: 70, borderRadius: 99, }}
            />
            </Animated.View>
            
            <Text style={{fontWeight: '700', fontSize: 16, color: activeColors.text,}}>{songData?.trackName} - {songData?.artist}</Text>

            <TouchableOpacity 
            onPress={() => {
              if (!songData) return;
              openSpotifyTrackOrSearch(songData.trackName, songData.artist);
            }}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: '#1DB954',
                gap: 10,
                width: '60%',
            }}
            >
                {/* <View style={{width: 30, height: 30, borderRadius: 99, backgroundColor: Colors.WHITE,}}> */}
                <SpotifyImg width={30} height={30} fill={Colors.WHITE}/>
                {/* </View> */}
                
                
                <Text style={{color: Colors.WHITE, fontWeight: '500',}}>Open on spotify</Text>
                
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={() => {
              if (!songData) return;
              openAppleMusicTrackOrSearch(songData.trackName, songData.artist);
            }}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: '#FA253D',
                gap: 10,
                width: '60%',
            }}
            >
                <View style={{width: 30, height: 30, borderRadius: 99, backgroundColor: Colors.WHITE,}}>
                <AppleMusicImg width={30} height={30}/>
                </View>
                
                
                <Text style={{color: Colors.WHITE, fontWeight: '500',}}>Open on Apple music</Text>
                
            </TouchableOpacity>
        </BottomSheetView>
    </BottomSheetModal>
  )
})

export default OnclickSongSheet

const styles = StyleSheet.create({})