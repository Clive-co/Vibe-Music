
import { useState } from 'react'
import { View, TextInput, Button, Alert, Platform, Text, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useActiveColors } from '@/constants/ThemeMode'
import { AntDesign } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import {
  fetchNonMemberFriends,
  createLeagues,
  addLeagueMembers,
} from '@/utils/service_api/leagueApi';


export default function CreateLeagueScreen() {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState<'6' | '12'>('6')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const activeColors = useActiveColors()

  const handleNext = (leagueId: string) => {
    if (!name.trim()) return Alert.alert('League name required');
    router.replace({
      pathname: '/ranks/createLeague',
      params: { name, duration, leagueId },
    });
  };

  // Create league
  const handleCreateLeague = async () => {
    try {
      if (!name.toString().trim()) {
        Alert.alert('Error', 'League name cannot be empty.');
        return;
      }
      const { league } = await createLeagues(name, Number(duration));
      const leagueId = league.leagueId; // Assuming the response contains the league ID
      Alert.alert('Success', 'League created!');
      handleNext(leagueId); // Call handleNext with leagueId, name, and duration
    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Error', 'Failed to create league. Please try again.');
    }
  };

  return (
    <>
    <Stack.Screen
    options={{
        title: 'New League',
        headerShown: true,
        headerStyle: {backgroundColor: activeColors.background,},
        headerTintColor: activeColors.tint,
        contentStyle: {backgroundColor: activeColors.background,},
        headerTitleAlign: 'center',
        headerTitleStyle: {fontSize: 17, fontWeight: 'bold',}, 
    }}
    />
    <View style={{backgroundColor: activeColors.background, paddingHorizontal: 10, marginTop: 30,}}>

        <Text style={{color: activeColors.text, fontSize: 16, fontWeight: 'bold',}}>Input a name for your new league</Text>

    <View
 style={{
    backgroundColor: activeColors.input,
    borderRadius: 10,
    padding: Platform.OS === 'ios'? 14 : 14,
   // paddingHorizontal: Platform.OS === 'android'? 12: undefined,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 5,
    flexShrink: 1,
}}
>
<TextInput
    placeholderTextColor={Colors.GRAY} 
    placeholder="League name" value={name} 
    onChangeText={setName} 
    multiline={false}
    style={{
        flex: 1,
        width: '100%',
        color: activeColors.text,
    }}
    />
</View>


     <Text style={{fontWeight: '500', fontSize: 16, marginBottom: 10, color: activeColors.text, marginTop: 30,}}>Select Duration</Text>
      <View style={styles.radioGroup}>
        {['6', '12'].map((value) => (
          <Pressable
            key={value}
            onPress={() => setDuration(value as '6' | '12')}
            style={styles.radioItem}
          >
            <View style={[styles.outerCircle, duration === value && styles.outerCircleSelected]}>
              {duration === value && <View style={styles.innerCircle} />}
            </View>
            <Text style={{ marginLeft: 8, fontSize: 16, color: activeColors.text,}}>{value} Months</Text>
          </Pressable>
        ))}
      </View>

      <TouchableOpacity 
      style={styles.nextButton}
      onPress={ () => {
        setLoading(true);
        handleCreateLeague();
      }}
      disabled = {loading? true : false}
      >
        {
          loading? <ActivityIndicator/> 
          :
          <Text style={styles.nextText}>Create league</Text>
        }
        
      </TouchableOpacity>
    </View>
    </>
  )
}
const styles = StyleSheet.create({
    radioGroup: { flexDirection: 'row', gap: 20 },
    radioItem: { flexDirection: 'row', alignItems: 'center' },
    outerCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#aaa',
      justifyContent: 'center',
      alignItems: 'center',
    },
    outerCircleSelected: {
      borderColor: '#007AFF',
    },
    innerCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#007AFF',
    },
    nextButton: {
      backgroundColor: '#007AFF',
      padding: 14,
      borderRadius: 10,
      marginTop: 40,
      alignItems: 'center',
    },
    nextText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  });