import React, { useRef, useContext, useState, useEffect } from 'react';
import { Animated, Image, StyleSheet, Text, View, I18nManager, TouchableWithoutFeedback, TouchableOpacity, TouchableHighlight } from 'react-native';
import { GestureHandlerRootView, RectButton, Swipeable } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { InteractionsProps } from '@/types/InteractionTypes';
import { Link, useNavigation } from 'expo-router';
import { useActiveColors } from '@/constants/ThemeMode';
import { RecentChat } from '@/utils/service_api/chatApi';
import { GlobalContext } from '@/context/GlobalProvider'
import { getCurrentUser } from "aws-amplify/auth";

const Interactions: React.FC<RecentChat> = ({
  // id,
  // date,
  // name,
  // img,
  // msg,
  // read,
  // unreadCount,
  // removeInteraction,
  // handleOpenSwipeable,
  // router,

  chatId,
  isGroup,
  title,
  chatImg,
  lastMessage,
  unreadCount,
  removeInteraction,
  handleOpenSwipeable,
  router,

}) => {

  const activeColors = useActiveColors();

  const swipeableRef = useRef<Swipeable>(null);
  const { markChatReadLocally } = useContext(GlobalContext)!
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const renderRightAction = (
    text: string,
    color: string,
    x: number,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });

    const pressHandler = () => {
      closeSwipeable();
      if (text === 'Delete') {
        removeInteraction();
      }
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={pressHandler}>
          <Octicons
            name={text === 'Pin' ? 'pin' : text === 'Mute' ? 'bell-slash' : 'trash'}
            size={24}
            color="#fff"
          />
        </RectButton>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>
  ) => (
    <View style={{ width: 192, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
      {renderRightAction('Pin', '#E3DFE5', 192, progress)}
      {renderRightAction('Mute', '#756181', 128, progress)}
      {renderRightAction('Delete', '#74222f', 64, progress)}
    </View>
  );

  const closeSwipeable = () => {
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
  };

  const handleSwipeableOpen = (ref: Swipeable | null) => {
    handleOpenSwipeable(ref === swipeableRef.current ? ref : swipeableRef.current);
  };

  //const pathname = usePathname()

  const openChatRoom = () => {
    if ( unreadCount > 0) {
      markChatReadLocally( chatId )
    }
    router.push({pathname: `/chatRoom`, params: {chatId, userId: userId, title:title, chatImg:chatImg, timestamp:lastMessage.timestamp, senderId:lastMessage.senderId, senderName: lastMessage.senderName, msg:lastMessage.content},})
   
  }

  return (
    <GestureHandlerRootView>
    <Swipeable
      ref={swipeableRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      leftThreshold={30}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => handleSwipeableOpen(swipeableRef.current)}
    >
      
       <TouchableHighlight onPress={openChatRoom} > 
      <RectButton onPress={closeSwipeable} style={[styles.container, {backgroundColor: activeColors.background,}]}>
        <Image source={{ uri: chatImg }} style={styles.avatar} />
        <View style={styles.content}>
          <View style={{flexDirection: 'row',}}>
            <Text style={[styles.from, {color: activeColors.text,}]}>{title}</Text>
            <Text style={styles.date}>{format(new Date(lastMessage.timestamp), 'MM.dd.yy')}</Text>
          </View>


          <View style={{flexDirection: 'row', justifyContent: 'space-between',}}>
            <Text style={[styles.msg, {color: unreadCount? activeColors.text : Colors.GRAY,}]}>{lastMessage.content.length > 40 ? `${lastMessage.content.substring(0, 40)}...` : lastMessage.content}</Text>
            {
              unreadCount? 
               <View style={{ maxHeight: 15, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',  borderRadius: 100, backgroundColor: Colors.PRIMARY, alignSelf:  'center', }}>
              <Text style={{ fontSize: 12, color: Colors.WHITE, alignSelf: 'flex-end', fontWeight: 'semibold',}}>{unreadCount}</Text>
            </View>
            : null
            }
           
          </View>
          
            
          
          {/* <Text style={styles.msg} ellipsizeMode='tail' numberOfLines={1}>{msg}</Text> */}
        </View>
        
        
      </RectButton>
       </TouchableHighlight> 
    </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    //backgroundColor: activeColors.background,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  from: {
    fontSize: 16,
    fontWeight: 'bold',
    //color: activeColors.text,
  },
  msg: {
    fontSize: 13,
    alignItems: 'center',
  },
  date: {
    color: Colors.GRAY,
    marginLeft: 'auto',
    alignSelf: 'flex-start',
  },
  rightAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Interactions;