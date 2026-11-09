import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useActiveColors } from '@/constants/ThemeMode'
import { Colors } from '@/constants/Colors'
import { AntDesign } from '@expo/vector-icons'
import axios, { CancelTokenSource } from 'axios';
import { searchUsers, requestFriend, SearchUser, fetchFriendSuggestions, FriendSuggestion } from '@/utils/service_api/friendshipServiceApi';
import { Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import * as Contacts from 'expo-contacts';

interface User {
  id: string;
  username: string;
  profileImg: string;
}


const FindFriends = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const activeColors = useActiveColors()
  const router = useRouter()
  const pageBottomPadding = useBottomTabBarHeight()
  let [error, setError] = useState<string | undefined>(undefined)
  let [contacts, setContacts] = useState(undefined)
  const [contactsList, setContactsList] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleSearch(query);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async (term: string) => {
    try {
      if (cancelTokenRef.current) cancelTokenRef.current.cancel();
      cancelTokenRef.current = axios.CancelToken.source();
      setIsLoading(true);
      const users = await searchUsers(term, cancelTokenRef.current.token);
      setResults(users);
      console.log('Search results:', users);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Search request canceled');
      } else {
        console.error('Error searching for users:', error);
        alert('Failed to search for users. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add friend functionality 
  const handleAddFriend = async (userIdToAdd: string) => {
    // 1) Optimistically mark pending
    setResults(rs =>
      rs.map(u =>
        u.userId === userIdToAdd ? { ...u, friendshipStatus: 'pending' } : u
      )
    );

    try {
      await requestFriend(userIdToAdd);
      // keep "pending" until server notifies acceptance
    } catch (err) {
      console.error(err);
      alert('Couldn’t send request');
      // rollback to no-relationship (null)
      setResults(rs =>
        rs.map(u =>
          u.userId === userIdToAdd ? { ...u, friendshipStatus: null } : u
        )
      );
    }
  };

  /*useEffect(() => {
    (async() => {
      const { status } = await Contacts.requestPermissionsAsync();
      if(status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [ Contacts.Fields.Birthday, Contacts.Fields.FirstName, Contacts.Fields.LastName, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers]
        });

        if(data.length > 0) {
          console.log(`contacts: ${data}`)
          //@ts-ignore
          setContacts(data);
        }else {
          setError("No contacts found.");
        }
      } else {
        setError("Permission to access contacts denied.");
      }
    })();
  }, [])*/

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access contacts denied.");
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      // normalize to E.164 here or in lambda
      const phones: string[] = [];
      data.forEach((c) => {
        (c.phoneNumbers || []).forEach((p) => {
          if (p.number) {
            phones.push(p.number);
          }
        });
      });
      setContactsList(phones);
    })();
  }, []);

  // 2) Once we have contacts, fetch suggestions
  useEffect(() => {
    if (contactsList.length === 0) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sug = await fetchFriendSuggestions(contactsList);
        if (!cancelled) setSuggestions(sug);
        console.log('Friend suggestions:', sug);
      } catch (e) {
        if (!cancelled) setError("Failed to load suggestions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactsList]);


  return (
    <View style={{flex: 1, paddingBottom: pageBottomPadding,}}>
      <View
 style={{
    backgroundColor: activeColors.input,
    borderRadius: 10,
    padding: Platform.OS === 'ios'? 12 : 12,
    paddingHorizontal: Platform.OS === 'android'? 12: undefined,
    //marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 5,
    //flexShrink: 1,
    marginHorizontal: 20,
    //maxHeight: 44,
}}
>
    <AntDesign name='search1' color={Colors.GRAY} size={16}/>
<TextInput
    placeholder='Find a new friend'
    placeholderTextColor={Colors.GRAY}
    multiline={false}
    style={{
        flex: 1,
        color: activeColors.text,
    }}
    value={query}
    onChangeText={(query) => {
      setIsLoading(true); 
      setQuery(query);
    }}
    />
</View>

{query? <View style={{paddingTop: 20, gap: 25, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios'? pageBottomPadding + 10 : pageBottomPadding + 20,}}>
  {
    isLoading? <ActivityIndicator color={Colors.GRAY} /> :
    results.length === 0? <Text style={{color: Colors.GRAY, fontSize: 14,}}>No results found for "{query.toString()}"</Text>:
    results.map((item) => (
    <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/(tabs)/profile/friend-profile/[friendId]',
              params: { friendId: item.userId, friendName: item.username, friendImg: item.profileImg, },
            })}
            style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}
            key={item.userId}
            >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                <Image
                source={{uri: item.profileImg?? 'https://ui-avatars.com/api/?name=User&background=ddd&color=555&size=128'}}
                style={{width: 40, height: 40, borderRadius: 99,}}
                />
                <Text style={{color: activeColors.text, fontSize: 16, fontWeight: 500,}}>
                  {/* {item.userName.length > 0 ? item.userName : `${item.first_name} ${item.last_name}`} */}
                  {item.username}
                  </Text>
                </View>

{
 item.friendshipStatus === 'pending' ? 
 <Text style={{fontSize: 12, color: activeColors.text,}}>pending</Text>
 : item.friendshipStatus === 'none' ?
 <TouchableOpacity
                onPress={() => handleAddFriend(item.userId)}
                style={{
                    padding: 10, 
                    borderRadius: 99, 
                    backgroundColor: activeColors.tint, 
                    flexDirection: 'row',
                    alignItems: 'center',
                    }}>
                    <AntDesign name='adduser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                    <Text style={{color: activeColors.background, fontSize: 13, fontWeight: 700,}}>add</Text>
                </TouchableOpacity> : null
}
                
            </TouchableOpacity>

          
  ))
  }
  
</View> 
  : 
  <View style={{paddingHorizontal: 20, }}>
    <Text style={{color: activeColors.text, fontSize: 14, fontWeight: 'bold', paddingVertical: 20,}}>People you may know</Text>

    {
      suggestions.map((item) => (
        <TouchableOpacity key={item.userId} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
            <Image source={{uri: item.profileImg,}} width={40} height={40} style={{borderRadius: 99,}} />
          <Text style={{color: activeColors.text, fontSize: 14, fontWeight: 500,}}>{item.username}</Text>
          </View>
          
          <TouchableOpacity
                                      onPress={() => {handleAddFriend(item.userId)}}
                                      style={{
                                          paddingHorizontal: 7,
                                          paddingVertical: 5, 
                                          borderRadius: 7, 
                                          backgroundColor: activeColors.tint, 
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          }}>
                                            <Text style={{color: activeColors.background, fontSize: 11, fontWeight: 700,}}>add</Text>
                                          <AntDesign name='adduser' size={17} color={activeColors.background} style={{fontWeight: 700,}}/>
                                          
                                      </TouchableOpacity>
        </TouchableOpacity>
      ))
    }
  </View>
  }
    </View>
  )
}

export default React.memo(FindFriends)

const styles = StyleSheet.create({})