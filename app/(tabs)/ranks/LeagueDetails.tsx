import { useActiveColors } from "@/constants/ThemeMode";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Image, FlatList, ScrollView, Alert } from "react-native";
import axios, { AxiosError } from 'axios';
import { fetchLeagueLeaderboard, LeaderboardItem, fetchUserRank, UserRankResponse } from '@/utils/service_api/leagueApi';
import leagueData from "@/data/leagueDetails.json"
import { Colors } from "@/constants/Colors";
import { addLeagueMembers } from "@/utils/service_api/leagueApi";
import { LeaderboardSkeleton, MyRankSkeleton, TopThreeSkeleton } from "@/components/LoadingSkeletons";


const LeagueDetails = () => {
  const { leagueName, leagueId } = useLocalSearchParams<{ leagueName: string, leagueId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userRank, setUserRank] = useState<UserRankResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  //const leagueId = '1234'; // placeholder value for the passed league prop

  const navigation = useNavigation()
 const activeColors = useActiveColors()
 const pageBottomPadding = useBottomTabBarHeight()

 useEffect(() => {
  if (!leagueId) return;

  const loadLeagueData = async () => {
    try {
      setLoading(true);

      // Fetch leaderboard
      const leaderboardData: LeaderboardItem[] = await fetchLeagueLeaderboard(leagueId);
      setLeaderboard(leaderboardData);

      // Fetch user rank
      const userRankData = await fetchUserRank(leagueId);
      setUserRank(userRankData);

      console.log('Leaderboard:', leaderboardData);
      console.log('User rank:', userRankData);
    } catch (error) {
      console.error('Error loading league data:', error);
      Alert.alert('Error', 'Failed to load league data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  loadLeagueData();
}, [leagueId]);

 useEffect(() => {
    if (leagueName) {
      navigation.setOptions({
        title: leagueName, // Set the league name as the header title
      });
    }
  }, [leagueName, navigation]);

  const arrangedLeagueData = leaderboard.sort((a, b) => b.cumulativeMinutes - a.cumulativeMinutes )

  const top3 = leaderboard.slice(0, 3); // Get the top 3 items
const reorderedTop3 = [top3[1], top3[0], top3[2]]; // Reorder: [second, first, third]

  return (
    
    <View style={[styles.container, {backgroundColor: activeColors.background, paddingBottom: pageBottomPadding, alignItems: "center",}]}>
        <View style={{width: '90%',}}>
      {/* <Text style={[styles.title, {color: activeColors.text,}]}>{decodeURIComponent(leagueName)}</Text> */}

      {
        loading? 
        <TopThreeSkeleton/>
        :
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
        {reorderedTop3.map((data, index) => {
           // const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
           if (!data) return null;
            return(
            <View style={{alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth: data.rank == 1? 90 : 70,}} key={data.userId}>
              <View className="" 
              style={{
                shadowColor: activeColors.shadowColor, 
                shadowOpacity: 0.5, 
                shadowOffset: {
                  height: 4, 
                  width: 0,
                }, 
                elevation: 2,
                }}>
                <Image source={{uri: data.profileImg}} className="rounded-full" style={{ width: data.rank === 1? 90:  70, height: data.rank === 1? 90: 70, }} />
                </View>
                <Text style={{color: activeColors.text, fontWeight: '600',}} numberOfLines={1} ellipsizeMode="tail">{data.username}</Text>
                <Text style={{color: activeColors.text, fontSize: 12, fontWeight: "600",}}>{data.cumulativeMinutes} mins</Text>
                {/* <Text style={{color: activeColors.text,}}>{rank}</Text> */}
            </View>
        )})}
      </View>
      }


<Text style={{color: activeColors.text, marginTop: 30, fontWeight: "bold",}}>Your Rank</Text>

    
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20,}}>

        {
        loading? 
        <MyRankSkeleton/>
        :
        <>
        <Text style={{color: activeColors.text, fontSize: 20,}}>{userRank?.rank}</Text>
      <View style={{
        backgroundColor: 
        activeColors.tint, 
        borderRadius: 99, 
        width: '90%', 
        //height: 40, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems:'center',
        paddingRight: 10,
        }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
            <Image source={{uri: userRank?.profileImg}}  style={{height: 40, width: 60, borderTopLeftRadius: 40, borderBottomLeftRadius: 40,}}/>
            <Text style={{color: activeColors.background, fontWeight: 'bold',}}>{userRank?.username}</Text>
            </View>
        
        <Text style={{color: activeColors.background, fontWeight: 'bold',}}>{userRank?.cumulativeMinutes ? `${userRank.cumulativeMinutes}min` : null}</Text>
      </View>
      </>
      }
        
      </View>


      <View style={{marginTop: 25, height: 0.2, width: "100%", backgroundColor: Colors.GRAY,}}/>

      </View>

      <ScrollView 
      style={{marginTop: 25, flex: 1, marginBottom: 10, width: '100%',}}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      >

        {
          loading? <LeaderboardSkeleton/>
          :
          <FlatList
        data={arrangedLeagueData.slice(3)}
        keyExtractor={(item) => item.userId}
        scrollEnabled={false}
        contentContainerStyle={{gap: 20, flex: 1,}}
        renderItem={({item, index}) => {
          //const rank = index + 4
          return(
          <View className={`w-full rounded-2xl`} 
          style={{
            width: '100%', 
            backgroundColor: activeColors.buttonBackdrop, 
            height: 50,
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 15,}}>
              <Text style={{color: activeColors.text,}}>{item.rank}</Text>

              <View style={{flexDirection: 'row', gap: 5, alignItems: 'center',}}>
                <Image source={{uri: item.profileImg}} style={{width: 40, height: 40,}} className="rounded-full" />
                <Text style={{color: activeColors.text, fontWeight: '600', fontSize: 13,}}>{item.username}</Text>
              </View>
              </View>

          <Text style={{color: activeColors.text, fontWeight: '300', fontSize: 13,}}>{item.cumulativeMinutes} {item.cumulativeMinutes === 1 ? "min" : 'mins'}</Text>
          </View>
        )}}
        />
        }
        
      </ScrollView>
    </View>
  );
};

export default LeagueDetails;

LeagueDetails.options = {
    headerShown: false,
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});