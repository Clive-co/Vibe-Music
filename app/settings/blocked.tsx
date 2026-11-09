import { FlatList, Image, ListRenderItem, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import {  Colors } from '@/constants/Colors'
import blockedUsers from '@/data/blocked.json'
import { useActiveColors } from '@/constants/ThemeMode';

interface BlockedUserProps {
  first_name: string;
  last_name: string;
  img: string;
  desc: string;
}
const Blocked = () => {
  const activeColors = useActiveColors();

  const renderItems: ListRenderItem<BlockedUserProps> = ({item, index}) => {

    const blockedUserName =  <Text>{item.first_name} {item.last_name}</Text>

    return(
        <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center',}}>
                <View style={{flexDirection: 'row', gap: 15, alignItems: 'center',}}>
                  <View>
                  <Image source={{uri: item.img,}} style={{width: 50, height: 50, borderRadius: 99,}}/>
                  </View>
                  <Text style={{fontSize: 15, fontWeight: 'bold', color: Colors.GRAY,}}>{blockedUserName}</Text>
                </View>
              
              <TouchableOpacity style={{backgroundColor: activeColors.button1, borderRadius: 99, padding: 6,}}>
                <Text style={{color: Colors.WHITE, paddingHorizontal: 6, fontWeight: 500, fontSize: 14,}}>Unblock</Text>
              </TouchableOpacity>
              </View>
    )
  }

  const emptyList = () => {
    return(
      <View style={{flex: 1, backgroundColor: Colors.WHITE, alignItems: 'center', paddingTop: '60%', gap: 20, padding: 40,}}>
      <Text  style={{fontSize: 20, fontWeight: 'bold', color: Colors.GRAY, textAlign: 'center',}}>No Blocked Users</Text>
      <Text style={{fontSize: 16, color: Colors.GRAY, textAlign: 'center', fontWeight: 500,}}>You have to go into a users profile to block them</Text>
    </View>
    )
  }

  return ( 
    
    <ScrollView style={{flex:1, backgroundColor: activeColors.background,}} contentContainerStyle={{flex: 1,}}>
      <FlatList
      scrollEnabled={false}
      data={blockedUsers} 
      keyExtractor={(item) => item.id}
      //ItemSeparatorComponent={()=> <View style={[defaultStyles.separator, {marginLeft: 90,}]} />}
      renderItem={renderItems}
      ListEmptyComponent={emptyList}
      contentContainerStyle={{ flex: 1, paddingVertical: 20, }}
      />
    </ScrollView>
    
    
  )
}

export default Blocked

const styles = StyleSheet.create({})