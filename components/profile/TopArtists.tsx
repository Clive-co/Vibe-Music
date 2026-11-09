import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import artists from '@/data/topartists.json'
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Path, Svg } from 'react-native-svg';
import { useActiveColors } from '@/constants/ThemeMode';
import { TopArtist } from '@/utils/service_api/userServiceApi';

interface TopArtistsProps {
  topArtists: TopArtist[]; 
}

const TopArtists = ({topArtists = []}: TopArtistsProps) => {
  const activeColors = useActiveColors();
    const orderedTopArtists = [...topArtists]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10);

    const First = ({ fill = '#D4AF37', width = 18, height = 18,}) => {
        return (
            <Svg width={width} height={height} viewBox="0 0 14 20" fill={fill} >
            <Path d="M0 6.999C0.00115034 8.10036 0.262536 9.18587 0.762851 10.167C1.26317 11.1482 1.98825 11.9973 2.879 12.645L2.88 12.646C3.45342 13.0663 4.08775 13.3965 4.761 13.625L4.812 13.644C5.19112 13.7677 5.58024 13.8584 5.975 13.915C6.3137 13.9692 6.65601 13.9976 6.999 14H7C7.35 14 7.69 13.966 8.027 13.916L8.209 13.888C8.545 13.829 8.873 13.749 9.19 13.645L9.232 13.629C12 12.693 14 10.078 14 6.999C14 3.14 10.86 0 7 0C3.14 0 0 3.14 0 6.999ZM7 2C9.756 2 12 4.242 12 6.999H10C9.99894 6.20377 9.6825 5.44142 9.12009 4.8792C8.55768 4.31698 7.79523 4.00079 7 4V2ZM2.521 14.795V20L7 18.5L11.479 20L11.48 14.795C10.119 15.584 8.57368 15.9995 7.0005 15.9995C5.42732 15.9995 3.88204 15.584 2.521 14.795Z"/>
            <Path d="M7.75355 4.72727V12H6.21591V6.18679H6.1733L4.50781 7.23082V5.86719L6.30824 4.72727H7.75355Z" fill="white"/>
            </Svg>
        )
      };

      const Second = ({ fill = '#C0C0C0', width = 18, height = 18,}) => {
        return (
            <Svg width={width} height={height} viewBox="0 0 14 20" fill={fill} >
<Path d="M0 6.999C0.00115034 8.10036 0.262536 9.18587 0.762851 10.167C1.26317 11.1482 1.98825 11.9973 2.879 12.645L2.88 12.646C3.45342 13.0663 4.08775 13.3965 4.761 13.625L4.812 13.644C5.19112 13.7677 5.58024 13.8584 5.975 13.915C6.3137 13.9692 6.65601 13.9976 6.999 14H7C7.35 14 7.69 13.966 8.027 13.916L8.209 13.888C8.545 13.829 8.873 13.749 9.19 13.645L9.232 13.629C12 12.693 14 10.078 14 6.999C14 3.14 10.86 0 7 0C3.14 0 0 3.14 0 6.999ZM7 2C9.756 2 12 4.242 12 6.999H10C9.99894 6.20377 9.6825 5.44142 9.12009 4.8792C8.55768 4.31698 7.79523 4.00079 7 4V2ZM2.521 14.795V20L7 18.5L11.479 20L11.48 14.795C10.119 15.584 8.57368 15.9995 7.0005 15.9995C5.42732 15.9995 3.88204 15.584 2.521 14.795Z" />
<Path d="M4.58949 12V10.892L7.17827 8.49503C7.39844 8.28196 7.5831 8.0902 7.73224 7.91974C7.88376 7.74929 7.99858 7.58239 8.0767 7.41903C8.15483 7.25331 8.19389 7.07457 8.19389 6.88281C8.19389 6.66974 8.14536 6.48627 8.0483 6.33239C7.95123 6.17614 7.81866 6.05658 7.65057 5.97372C7.48248 5.88849 7.2919 5.84588 7.07884 5.84588C6.8563 5.84588 6.66217 5.89086 6.49645 5.98082C6.33073 6.07079 6.20289 6.19981 6.11293 6.3679C6.02296 6.53598 5.97798 6.73603 5.97798 6.96804H4.51847C4.51847 6.49219 4.62618 6.07907 4.84162 5.72869C5.05705 5.37831 5.3589 5.10724 5.74716 4.91548C6.13542 4.72372 6.58286 4.62784 7.08949 4.62784C7.61032 4.62784 8.06368 4.72017 8.44957 4.90483C8.83783 5.08712 9.13968 5.34044 9.35511 5.66477C9.57055 5.98911 9.67827 6.3608 9.67827 6.77983C9.67827 7.05445 9.62382 7.32552 9.51491 7.59304C9.40838 7.86056 9.2178 8.15767 8.94318 8.48438C8.66856 8.80871 8.28149 9.19815 7.78196 9.6527L6.72017 10.6932V10.7429H9.77415V12H4.58949Z" fill="white"/>
</Svg>
        )
      };


      const Third = ({ fill = '#CD7F32', width = 18, height = 18,}) => {
        return (
            <Svg width={width} height={height} viewBox="0 0 14 20" fill={fill} >
<Path d="M0 6.999C0.00115034 8.10036 0.262536 9.18587 0.762851 10.167C1.26317 11.1482 1.98825 11.9973 2.879 12.645L2.88 12.646C3.45342 13.0663 4.08775 13.3965 4.761 13.625L4.812 13.644C5.19112 13.7677 5.58024 13.8584 5.975 13.915C6.3137 13.9692 6.65601 13.9976 6.999 14H7C7.35 14 7.69 13.966 8.027 13.916L8.209 13.888C8.545 13.829 8.873 13.749 9.19 13.645L9.232 13.629C12 12.693 14 10.078 14 6.999C14 3.14 10.86 0 7 0C3.14 0 0 3.14 0 6.999ZM7 2C9.756 2 12 4.242 12 6.999H10C9.99894 6.20377 9.6825 5.44142 9.12009 4.8792C8.55768 4.31698 7.79523 4.00079 7 4V2ZM2.521 14.795V20L7 18.5L11.479 20L11.48 14.795C10.119 15.584 8.57368 15.9995 7.0005 15.9995C5.42732 15.9995 3.88204 15.584 2.521 14.795Z" />
<Path d="M7.2777 12.0994C6.7474 12.0994 6.27509 12.0083 5.8608 11.826C5.44886 11.6413 5.12334 11.388 4.88423 11.0661C4.64749 10.7417 4.52557 10.3677 4.51847 9.94389H6.06676C6.07623 10.1214 6.13423 10.2777 6.24077 10.4126C6.34967 10.5452 6.49408 10.6482 6.67401 10.7216C6.85393 10.795 7.05634 10.8317 7.28125 10.8317C7.51562 10.8317 7.72277 10.7902 7.9027 10.7074C8.08262 10.6245 8.22348 10.5097 8.32528 10.3629C8.42708 10.2161 8.47798 10.0469 8.47798 9.85511C8.47798 9.66098 8.42353 9.48935 8.31463 9.3402C8.2081 9.18868 8.05421 9.07031 7.85298 8.98509C7.65412 8.89986 7.41738 8.85724 7.14276 8.85724H6.46449V7.72798H7.14276C7.37476 7.72798 7.57955 7.68774 7.7571 7.60724C7.93703 7.52675 8.0767 7.41548 8.17614 7.27344C8.27557 7.12902 8.32528 6.96094 8.32528 6.76918C8.32528 6.58688 8.28149 6.42708 8.19389 6.28977C8.10866 6.15009 7.98793 6.04119 7.83168 5.96307C7.67779 5.88494 7.49787 5.84588 7.2919 5.84588C7.08357 5.84588 6.89299 5.88376 6.72017 5.95952C6.54735 6.03291 6.40885 6.13826 6.30469 6.27557C6.20052 6.41288 6.14489 6.57386 6.13778 6.75852H4.66406C4.67116 6.33949 4.79072 5.97017 5.02273 5.65057C5.25473 5.33097 5.56723 5.0812 5.96023 4.90128C6.35559 4.71899 6.80185 4.62784 7.29901 4.62784C7.8009 4.62784 8.24006 4.71899 8.61648 4.90128C8.9929 5.08357 9.28527 5.32978 9.49361 5.63991C9.70431 5.94768 9.80848 6.29332 9.80611 6.67685C9.80848 7.08404 9.68182 7.42377 9.42614 7.69602C9.17282 7.96828 8.84257 8.1411 8.43537 8.21449V8.27131C8.97041 8.33996 9.3776 8.5258 9.65696 8.82884C9.93868 9.1295 10.0784 9.50592 10.076 9.9581C10.0784 10.3724 9.95881 10.7405 9.71733 11.0625C9.47822 11.3845 9.14796 11.6378 8.72656 11.8224C8.30516 12.0071 7.82221 12.0994 7.2777 12.0994Z" fill="white"/>
</Svg>
        )
      }

  return (
    <View style={{width: '100%', alignItems: 'center', marginTop: 30,}}>
      <Text style={{fontWeight: '500', fontSize: 20, color: activeColors.text,}}>Top Artists</Text>

<ScrollView
style={{marginTop: 20, }}
horizontal
bounces={false}
showsHorizontalScrollIndicator={false}
contentContainerStyle={{gap: 10, paddingHorizontal: 10,}}
>
{orderedTopArtists.map((artist: TopArtist, index: any) => (

    index == 0 ? 
        <View style={{alignItems: 'center', gap: 8, width: 95,}} key={index}>
            <View style={{alignItems: 'center',}}>
            <Image source={{uri: artist.artistImageUrl}} style={{ height: 105, width: 95, borderRadius: 40,}}/>
            <View style={{position: 'absolute', bottom: -10,}}>
            <First  fill={'#D4AF37'} height={24} width={24} />
            </View>
            </View>
            <Text style={{fontWeight: 'bold', fontSize: 12, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{artist.artistName}</Text>
        </View>
        :
        index == 1 ?
        <View style={{alignItems: 'center', gap: 8, width: 95,}} key={index}>
            <View style={{alignItems: 'center',}}>
            <Image source={{uri: artist.artistImageUrl}} style={{ height: 105, width: 95, borderRadius: 40,}}/>
            <View style={{position: 'absolute', bottom: -10,}}>
            <Second  fill={'#C0C0C0'} height={24} width={24} />
            </View>
            </View>
            <Text style={{fontWeight: 'bold', fontSize: 12, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{artist.artistName}</Text>
        </View>
        :
        index == 2 ?
        <View style={{alignItems: 'center', gap: 8, width: 95,}} key={index}>
            <View style={{alignItems: 'center',}}>
            <Image source={{uri: artist.artistImageUrl}} style={{ height: 105, width: 95, borderRadius: 40,}}/>
            <View style={{position: 'absolute', bottom: -10,}}>
            <Third  fill={'#CD7F32'} height={24} width={24} />
            </View>
            </View>
            <Text style={{fontWeight: 'bold', fontSize: 12, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{artist.artistName}</Text>
        </View>
        :
        <View style={{alignItems: 'center', gap: 8, width: 95,}} key={index}>
            <Image source={{uri: artist.artistImageUrl}} style={{ height: 103, width: 95, borderRadius: 40,}}/>
            {/* <View style={{backgroundColor: 'black', opacity: 0.7, position: 'absolute', height: 103, width: 95, borderRadius: 40, alignItems: 'center', justifyContent: 'center',}}>
              <Text style={{fontWeight: 'bold', fontSize: 11, color: Colors.WHITE}} ellipsizeMode='tail' numberOfLines={1}>{artist.playCount} plays</Text>
            </View> */}
            <Text style={{fontWeight: 'bold', fontSize: 12, color: activeColors.text,}} ellipsizeMode='tail' numberOfLines={1}>{artist.artistName}</Text>
        </View>
      ))}
</ScrollView>

{/* <View style={{alignItems: 'center', gap: 8,}}>
            <Image source={{uri: artist.artistPicture}} style={{ height: 103, width: 95, borderRadius: 40,}}/>
            <Text style={{fontWeight: 'bold', fontSize: 12,}}>{artist.artistName}</Text>
        </View> */}
      
    </View>
  )
}

export default TopArtists

const styles = StyleSheet.create({})