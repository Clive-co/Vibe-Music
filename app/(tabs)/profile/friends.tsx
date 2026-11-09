import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import { Stack, useLocalSearchParams } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import FindFriends from '@/components/profile/friends/FindFriends';
import FriendList from '@/components/profile/friends/FriendList';
import Requests from '@/components/profile/friends/Requests';
import PagerView from 'react-native-pager-view';

const Tab = createMaterialTopTabNavigator();

const Friends = () => {

    const activeColors = useActiveColors();

    const [page, setPage] = useState(0);
    const { initialTab } = useLocalSearchParams();
  const pagerRef = useRef<PagerView>(null);

  const tabs = ['Friends', 'Find friends', 'Requests'];
    // Set initial page based on param
    useEffect(() => {
      if (initialTab) {
        const tabIndex = tabs.findIndex(
          tab => tab.toLowerCase() === initialTab.toString().toLowerCase()
        );
        if (tabIndex >= 0) {
          // Wait for PagerView to mount before navigating
          const timeout = setTimeout(() => {
            pagerRef.current?.setPage(tabIndex);
            setPage(tabIndex);
          }, 100); // 100ms is usually safe
    
          return () => clearTimeout(timeout);
        }
      }
    }, [initialTab]);

    const handleTabPress = (index: number) => {
      pagerRef.current?.setPage(index);
      setPage(index);
    };

    

    

  return (
    <>
        <Stack.Screen
        options={{
            contentStyle: {backgroundColor: activeColors.background,},
            headerStyle: {backgroundColor: activeColors.background,},
            headerTitleStyle: {color: activeColors.text,},
            headerTintColor: activeColors.text,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            // headerSearchBarOptions: {
            //     placeholder: 'Search',
            //     textColor: activeColors.text,
            //     tintColor: activeColors.text,
            //     headerIconColor: activeColors.text,
            //     hintTextColor: activeColors.text,
            //     shouldShowHintSearchIcon: false,
            // },
        }}
        />
        {/* <Tab.Navigator style={{backgroundColor: activeColors.background,}}>
      <Tab.Screen 
      name="friend list" 
      component={FriendList}  
      options={{
        title: 'friends',
        tabBarStyle: {backgroundColor: activeColors.background,},
        tabBarInactiveTintColor: activeColors.text,
        tabBarActiveTintColor: activeColors.text,
        tabBarIndicatorStyle: {backgroundColor: activeColors.text,  borderBottomWidth: 0.5,},
        //tabBarContentContainerStyle: {backgroundColor: activeColors.background,},
        sceneStyle:{backgroundColor: activeColors.background, paddingTop: 20,}
      }}
      />
       <Tab.Screen 
      name="find friends" 
      component={FindFriends} 
      options={{
        tabBarStyle: {backgroundColor: activeColors.background,},
        tabBarInactiveTintColor: activeColors.text,
        tabBarActiveTintColor: activeColors.text,
        tabBarIndicatorStyle: {backgroundColor: activeColors.text, borderBottomWidth: 0.5,},
        //tabBarContentContainerStyle: {backgroundColor: activeColors.background,},
        //tabBarItemStyle: {backgroundColor: activeColors.background,},
        sceneStyle:{backgroundColor: activeColors.background, paddingTop: 20,}
      }}
      />
      <Tab.Screen 
      name="requests" 
      component={Requests} 
      options={{
        tabBarStyle: {backgroundColor: activeColors.background,},
        tabBarInactiveTintColor: activeColors.text,
        tabBarActiveTintColor: activeColors.text,
        tabBarIndicatorStyle: {backgroundColor: activeColors.text,  borderBottomWidth: 0.5,},
        //tabBarContentContainerStyle: {backgroundColor: activeColors.background,},
        sceneStyle:{backgroundColor: activeColors.background, paddingTop: 20,}
      }}
      />
    </Tab.Navigator> */}

<View style={{ flex: 1, backgroundColor: activeColors.background }}>
      {/* Tab Header */}
      <View style={[styles.tabRow, { backgroundColor: activeColors.background }]}>
        {tabs.map((label, index) => (
          <TouchableOpacity
            key={label}
            onPress={() => handleTabPress(index)}
            style={[
              styles.tabButton,
              {
                borderBottomColor: page === index ? activeColors.text : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: page === index ? activeColors.text : activeColors.text,
                  fontWeight: page === index ? 'bold' : 'normal',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pager View */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <View key="0" style={{ paddingTop: 20 }}><FriendList /></View>
        <View key="1" style={{ paddingTop: 20 }} ><FindFriends /></View>
        <View key="2" style={{ paddingTop: 20 }}><Requests /></View>
      </PagerView>
    </View>
   </>
  )
}

export default Friends

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
});