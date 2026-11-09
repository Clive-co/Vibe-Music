import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import FindFriends from '@/components/profile/friends/FindFriends';
import FriendList from '@/components/profile/friends/FriendList';
import Requests from '@/components/profile/friends/Requests';
import { useActiveColors } from '@/constants/ThemeMode';

const Tab = createMaterialTopTabNavigator();


const FriendsTabs = React.memo(() => {
    const activeColors = useActiveColors();
  
    return (
      <Tab.Navigator
        initialLayout={{ width: Dimensions.get('window').width }}
        // lazy
        removeClippedSubviews
        screenOptions={{
          tabBarStyle: {
            backgroundColor: activeColors.background,
          },
          tabBarActiveTintColor: activeColors.text,
          tabBarInactiveTintColor: activeColors.text,
          tabBarIndicatorStyle: {
            backgroundColor: activeColors.text,
            height: 2,
          },
        }}
      >
        <Tab.Screen name="FriendList" component={FriendList} options={{ title: 'friends' }} />
        <Tab.Screen name="FindFriends" component={FindFriends} />
        <Tab.Screen name="Requests" component={Requests} />
      </Tab.Navigator>
    );
  });
  

export default FriendsTabs

const styles = StyleSheet.create({})