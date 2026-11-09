import { ListRenderItem, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useActiveColors } from '@/constants/ThemeMode'
import { Colors } from '@/constants/Colors'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { FlatList } from 'react-native'

//import friend from '@/data/friends.json'
import { Image } from 'react-native'
import { CheckBox } from '@rneui/themed'
import axios, { AxiosError } from 'axios';
import {
  fetchNonMemberFriends,
  createLeagues,
  addLeagueMembers,
} from '@/utils/service_api/leagueApi';


interface FriendsProps {
    first_name: string;
    last_name: string;
    img: string;
    desc: string;
  }

  interface Friend {
    friendId: string;
    username: string | null;
    profileImg: string | null;
    desc: string | null; 
}

interface LeaguePayload {
    name: string;
    creatorId: any;
    duration: string;
  }

const CreateLeague = () => {

    const activeColors = useActiveColors()
    const [selected, setSelected] = useState<any[]>([]); // move to addMembers screen when ready
    const [friends, setFriends] = useState<Friend[]>([]); // move to addMembers screen when ready
    const { name, duration, leagueId } = useLocalSearchParams()
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const leagueName = name.toString()

    const toggleOptions = (id: any) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((optionId) => optionId !== id ))
        } else {
            setSelected([...selected, id])
        }
    }

    //move to addMembers screen when ready
    // Fetch non-member friends
    useEffect(() => {
      const load = async () => {
        setLoading(true);
        const data = await fetchNonMemberFriends(leagueId.toString());
        setFriends(data);
        console.log('Fetched non-member friends:', data);
        setLoading(false);
      };
      load();
    }, [leagueId]);

    

    // Add members
    const handleAddMembers = async () => {
      try {
        await addLeagueMembers(leagueId.toString(), selectedFriendIds);
        Alert.alert('Success', 'Members added!');
        setSelectedFriendIds([]);
      } catch (error) {
        console.error("Error adding league members:", error);
        Alert.alert("Error", "Failed to add league members. Please try again.");
      }
    };

    // Debounced search filter
      useEffect(() => {
        const timer = setTimeout(() => {
          if (!searchQuery) {
            setFilteredFriends(friends);
          } else {
            const lower = searchQuery.toLowerCase();
            setFilteredFriends(
              friends.filter(f =>
                f.username?.toLowerCase().includes(lower)
              )
            );
            console.log("Filtered friends:", filteredFriends);
          }
        }, 300);
        return () => clearTimeout(timer);
      }, [searchQuery, friends]);


    const renderItem: ListRenderItem<Friend> = (({ item }) => (
        <Pressable 
        style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
        key={item.friendId}
            onPress={()=> toggleOptions(item.friendId)}
        >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
            <Image source={{uri: item.profileImg?.toString()}} style={{ height: 40, width: 40, borderRadius: 99,}} />
            <Text style={{color: activeColors.text,}}>{item.username}</Text>
            </View>
            
            {/* <TouchableOpacity style={{
                width: 25,
                height: 25,
                borderRadius: 99,
                borderColor: Colors.GRAY,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
            }}
            >
                {selected === index ? <TouchableOpacity style={{
                    width: '60%',
                    height: '60%',
                    borderRadius: 99,
                    backgroundColor: activeColors.colorText,
                }}></TouchableOpacity> : undefined}
                
            </TouchableOpacity> */}
             <CheckBox
          key={item.friendId}
          //title={item.first_name}
          checked={selected.includes(item.friendId)}
          //onPress={() => setSelected(index)}
          checkedIcon="dot-circle-o"
          uncheckedIcon="circle-o"
          style={{backgroundColor: 'transparent',}}
          wrapperStyle={{backgroundColor: 'transparent',}}
          containerStyle={{backgroundColor: 'transparent',}}
        />
        </Pressable>
    ))

    // const searchRenderItem: ListRenderItem<Friend> = filteredFriends.map((item) => (
    //   <Pressable 
    //     style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
    //     key={item.friendId}
    //         onPress={()=> toggleOptions(item.friendId)}
    //     >
    //         <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
    //         <Image source={{uri: item.profileImg?.toString()}} style={{ height: 40, width: 40, borderRadius: 99,}} />
    //         <Text style={{color: activeColors.text,}}>{item.username}</Text>
    //         </View>
    //          <CheckBox
    //       key={item.friendId}
    //       //title={item.first_name}
    //       checked={selected.includes(item.friendId)}
    //       //onPress={() => setSelected(index)}
    //       checkedIcon="dot-circle-o"
    //       uncheckedIcon="circle-o"
    //       style={{backgroundColor: 'transparent',}}
    //       wrapperStyle={{backgroundColor: 'transparent',}}
    //       containerStyle={{backgroundColor: 'transparent',}}
    //     />
    //     </Pressable>
    // ))


  return (
    <>
    <Stack.Screen
    name='createLeague'
    options={{
        title: leagueName,
        headerShown: true,
        headerBackButtonDisplayMode: 'minimal',
        headerTitleStyle: {color: activeColors.text, fontSize: 17, fontWeight: 'bold',},
        headerTintColor: activeColors.text,
        headerStyle: {backgroundColor: activeColors.background,},
        headerTitleAlign: 'center',
    }}
    />
    <View style={{backgroundColor: activeColors.background, flex: 1, paddingTop: 0,}}>
    <Text style={{color: Colors.GRAY, paddingHorizontal: 25, marginTop: 20, fontSize: 14, fontWeight: 'bold',}}>Add participants to the {leagueName} league</Text>
      {/* <Text style={{color: Colors.GRAY, paddingHorizontal: 25, marginTop: 5, fontSize: 14, fontWeight: 'bold',}}>This league lasts for {duration} months</Text> */}
        <View style={{paddingHorizontal: 25, marginTop: 10,}}>
   

<View
 style={{
    backgroundColor: activeColors.input,
    borderRadius: 10,
    padding: Platform.OS === 'ios'? 12 : 12,
    paddingHorizontal: Platform.OS === 'android'? 12: undefined,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 5,
    flexShrink: 1,
}}
>
    <AntDesign name='search1' color={Colors.GRAY} size={16}/>
<TextInput
    placeholder='Search'
    placeholderTextColor={Colors.GRAY}
    value={searchQuery}
    onChangeText={setSearchQuery}
    multiline={false}
    style={{
        flex: 1,
        color: activeColors.text,
    }}
    />
</View>
</View>

<ScrollView
style={{flex: 1,}}
scrollEnabled={true}
showsVerticalScrollIndicator={false}
contentContainerStyle={{}}
>
<FlatList
          data={friends.filter((item) => selected.includes(item.friendId))} // Filter selected items
          horizontal
          contentContainerStyle={{paddingLeft: 25,}}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.friendId}
          renderItem={({ item, index }) => (
            <Pressable
            onPress={() =>  setSelected(selected.filter((itemId) => itemId !== item.friendId))}
             style={{height: 60, width: 60, borderRadius: 99,marginTop: 20, marginRight: 15,}}>
            <Image  source={{uri: item.profileImg?.toString()}} style={{ height: 55, width: 55, borderRadius: 99, }} />
            <MaterialIcons 
            name="cancel" size={24}  
            style={{
                position: 'absolute', 
                top: -4,
                right: -4, 
                padding: 1,
                borderRadius: 99, 
                backgroundColor: activeColors.background,  }}
            color={Colors.GRAY}
            />
            </Pressable>
          )}
        />
<FlatList
          scrollEnabled={false}
          data={searchQuery? filteredFriends : friends}
          keyExtractor={(item) => item.friendId}
          renderItem={renderItem}
          ListHeaderComponent={<Text style={{color: activeColors.text, fontSize: 16, fontWeight: 700,}}>Friends</Text>}
          contentContainerStyle={{flex: 1, top: 20, paddingBottom: 30, paddingLeft: 25,}}
        /> 
</ScrollView>

<View style={{alignItems: 'center', justifyContent: 'center', paddingTop: 15, paddingBottom: 30, display: selected.length > 1? 'flex' : 'none',}}>
    <TouchableOpacity style={{
        width: '90%',
        borderRadius: 12,
        padding: Platform.OS === 'ios'? 12 : 10,
        backgroundColor: activeColors.colorText,
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <Text style={{fontWeight: 700, color: Colors.WHITE,}}>
            Create
        </Text>
    </TouchableOpacity>
</View>
    </View>
      
    </>
  )
}

export default CreateLeague

const styles = StyleSheet.create({})