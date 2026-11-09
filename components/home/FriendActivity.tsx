import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { FriendActivityType } from "@/types/friendActivityType";
import { Path, Svg } from "react-native-svg";
import { Colors } from "@/constants/Colors";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { differenceInDays, differenceInHours, differenceInMinutes, formatDistanceToNow, parseISO } from 'date-fns';
import EmojiBubble from "./EmojiBubble";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import OnclickSongSheet, {Ref as BottomSheetRef} from "./OnclickSongSheet";
import { AppleMusicImg, SpotifyImg } from "../ProviderImg";
import { GlobalContext } from "../../context/GlobalProvider";
import { Track } from "@/utils/service_api/friendRecentTracksService";


const { width, height } = Dimensions.get("screen");

interface Props {
  friendActivity: Track[];
  selectedEmoji: { [key: string]: string };
  onViewableItemsChanged: (info: { viewableItems: any[] }) => void;
  showNewBadge?: boolean;
  onClearNewBadge?: () => void;
  currentFriendId?: string;
}

interface ViewableItem {
    index: number | null;
    item: Track;
    key: string;
    isViewable: boolean;
    section?: any;
  }

  interface ViewableItemsChangedInfo {
    viewableItems: any[];
    changed: ViewableItem[];
  }

interface ScrollEvent {
    nativeEvent: {
      contentOffset: {
        x: number;
      };
    };
}

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

const FriendActivity = ({ friendActivity, selectedEmoji, onViewableItemsChanged, showNewBadge, onClearNewBadge }: Props) => {

  const flatListRef = useRef<FlatList>(null)
  const [selectedSong, setSelectedSong] = useState<Track | null>(null)
  //i added to stop the screen from jumping backwards when the recentracks are updated
  const prevLength = useRef(friendActivity.length);
  const [scrollOffset, setScrollOffset] = useState(0);
  const songSheetRef = useRef<BottomSheetModal>(null)
  const openSongSheet = (song: Track) => {
    setSelectedSong(song)
    songSheetRef.current?.present()
  }

  // useEffect(() => {
  //   console.log('currentFriendId in FriendActivity:', currentFriendId);
  // }, [currentFriendId]);
  
  //i added to stop the screen from jumping backwards when the recentracks are updated

  const handleScroll = (event: ScrollEvent): void => {
    setScrollOffset(event.nativeEvent.contentOffset.x);
  };

  //go to the first item in the list when the new badge is clicked
  const scrollToStart = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    if (onClearNewBadge) onClearNewBadge();
  };

  useEffect(() => {
  if (flatListRef.current && scrollOffset > 0) {
    // If a new item is prepended, adjust offset
    if (friendActivity.length > prevLength.current) {
      flatListRef.current.scrollToOffset({ offset: scrollOffset + width, animated: false });
    } else {
      flatListRef.current.scrollToOffset({ offset: scrollOffset, animated: false });
    }
  }
  prevLength.current = friendActivity.length;
}, [friendActivity]);

  //i added to stop the screen from jumping backwards when the recentracks are updated

  const handleViewableItemsChanged = useCallback((info: ViewableItemsChangedInfo) => {
    // Hide badge if first item is visible
    if (info.viewableItems.some(item => item.index === 0)) {
      if (onClearNewBadge) onClearNewBadge();
    }
    // Call parent handler to update currentFriendId
    if (onViewableItemsChanged) onViewableItemsChanged(info);
  }, [onClearNewBadge, onViewableItemsChanged]);

  const scrollX = React.useRef(new Animated.Value(0)).current;
  
  const renderItems: ListRenderItem<Track>  = ({ item, index }) => {
    

    const { width, height } = Dimensions.get("screen");

   
    return (
      <View
        style={{
          //backgroundColor: 'green',
          alignItems: "center",
          height: "87%",
          flex: 1,
          gap: 5,
        }}
      >
        <View
          style={{
            //flex: 1,
            // backgroundColor: 'red',
            width,
            //height: '80%',
            //justifyContent: 'center',
            alignItems: "center",
            flexDirection: "column",
            margin: 0,
            
          }}
        >
          <View
            style={{
              width: "80%",
              height: "100%",
              shadowColor: "#fff",
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 10,
              //backgroundColor: 'blue',
            }}
          >
            
            <Image
              //source={{uri: item.cover}}
              source={{uri: item.imageUrl}}
              style={{
                width: "100%",
                height: "100%",
               // alignSelf: 'center',
                resizeMode: "cover",
                
                borderRadius: 20,
              }}
              
            />
            
            {selectedEmoji[item.id] && <EmojiBubble emoji={selectedEmoji[item.id]} />}
            
            

            <TouchableOpacity onPress={() => openSongSheet(item)}
              style={{
                position: "absolute",
                alignSelf: "center",
                justifyContent: "space-evenly",
                alignItems: "center",
                width: "70%",
                height: "10%",
                bottom: "10%",
                borderRadius: 99,
                backgroundColor: "rgba(25, 25, 25, .7)",
                flexDirection: "row",
                //gap: 5,
              }}
            >
              <Image
                source={item.profileImg ? { uri: item.profileImg } : undefined}
                style={{ width: 30, height: 30, borderRadius: 99 }}
              />
               
              <Text
                style={{
                  color: Colors.WHITE,
                  width: "50%",
                  // backgroundColor: 'red',
                  textAlign: "center",
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
                //lineBreakMode='tail'
              >
                {item.trackName} - {item.artist}
              </Text>

{item.linkedAccount == 'spotify'? <SpotifyImg fill={Colors.WHITE} width={23} height={23}/> : <AppleMusicImg fill={Colors.WHITE} width={20} height={20}/>}
              
            </TouchableOpacity>
            

          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            width: "30%",
            borderRadius: 99,
            backgroundColor: "rgba(25, 25, 25, .3)",
            paddingVertical: 3,
            marginTop: 15,
          }}
        >
          <Text
            style={{
              color: Colors.WHITE,
              width: "50%",
              // backgroundColor: 'red',
              textAlign: "center",
              fontWeight: 'bold',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.username}
          </Text>

          <Text style={{ color: Colors.WHITE }}>-</Text>

          <Text
            style={{
              color: Colors.WHITE,
              width: "30%",
              //backgroundColor: 'blue',
              textAlign: "center",
              fontWeight: 'bold',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatRelativeTime(item.playedAt)}
          </Text>
        </View>
        <OnclickSongSheet ref={songSheetRef} songData={selectedSong} />
      </View>
    );
  };

  
 


  return (
    <View
      //className='bg-blue-600  w-full'
      style={[{
        // height: '70%',
       // marginTop: 10,
       flex: 1,
      }]}
    >

      <View style={StyleSheet.absoluteFillObject}>
      {friendActivity.map((image, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width
        ]
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0, 1, 0]
        })
    return <Animated.Image
    key={`cover-${index}`}
    source={{uri: image.imageUrl}}
    resizeMode={'cover'}
    style={[
      StyleSheet.absoluteFillObject,
      {
        opacity: opacity,
      }
    ]}

    blurRadius={50}
    />
  })}
      </View>
      {showNewBadge && (
        <TouchableOpacity
          onPress={scrollToStart}
          style={{
            position: 'absolute',
            left: 10,
            top: '45%',
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: 20,
            padding: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 5 }}>New</Text>
          <Text style={{ color: 'white', fontSize: 18 }}>{'⬅️'}</Text>
        </TouchableOpacity>
      )}
      <Animated.FlatList
      onScroll={Animated.event(
        [{nativeEvent: {contentOffset: {x: scrollX}}}],
        {useNativeDriver: true, listener: handleScroll}
      )}
      ref={flatListRef}
        horizontal
        data={friendActivity}
        renderItem={renderItems}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        contentContainerStyle={{height: '55%', alignSelf: 'center',}}
      />
    </View>
  );
};

export default FriendActivity;

const styles = StyleSheet.create({
  emoji:{
    //position: 'absolute', 
    //right: 10, 
    //top: 10, 
    fontSize: 24 
  },

 
 
});
