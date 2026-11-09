import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useRef, useContext, useState, useEffect, useCallback } from "react";
import { Colors, } from "@/constants/Colors";
import {
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { formatNumber, numberComma } from "@/components/FormatNumber";

import leagues from "@/data/leagues.json";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import CreateLeagueSheet from "@/components/ranks/CreateLeagueSheet";
import JoinLeagueSheet from "@/components/ranks/JoinLeagueSheet";
import { useActiveColors } from "@/constants/ThemeMode";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchUserLeagues, League } from '@/utils/service_api/leagueApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoLeague from "@/components/ranks/NoLeague";
import { fetchWeeklyRecap, WeeklyRecap } from "@/utils/service_api/userServiceApi";

const LEAGUES_CACHE_KEY = 'cachedUserLeagues';

const Page = () => {

  const activeColors = useActiveColors();
  const createLeagueBottomSheetRef = useRef<BottomSheetModal>(null);
  const joinLeagueBottomSheetRef = useRef<BottomSheetModal>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState<WeeklyRecap | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const recapData = await fetchWeeklyRecap();
        if (!cancelled && recapData) {
          setRecapData(recapData);
          console.log('Weekly Recap:', recapData);
        }
      } catch (err) {
        if (!cancelled) console.error('Error fetching weekly recap:', err);
      } finally {
        if (!cancelled) setLoading(false);
     }
    };
  
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      const loadLeagues = async () => {
        try {
          // 1) Read from cache first
          const cachedJson = await AsyncStorage.getItem(LEAGUES_CACHE_KEY);
          if (cachedJson && !cancelled) {
            const cachedLeagues: League[] = JSON.parse(cachedJson);
            setLeagues(cachedLeagues);
            console.log('Loaded leagues from cache', cachedLeagues);
          }

          // 2) Then fetch fresh
          const data: League[] = await fetchUserLeagues();
          if (!cancelled) {
            setLeagues(data);
            console.log("Fetched leagues:", data);
            // 3) Update cache
            await AsyncStorage.setItem(LEAGUES_CACHE_KEY, JSON.stringify(data));
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Error loading leagues:', error);
            Alert.alert('Error', 'Failed to load leagues. Please try again later.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadLeagues();

      return () => {
        cancelled = true;
      };
    }, []) 
  );

  const handlePresentModalPress = () =>
    createLeagueBottomSheetRef.current?.present();

  const openJoinModal = () => joinLeagueBottomSheetRef.current?.present();

  const minutes = 2345;
  const artists = 87;
  const tracks = 315;

  const pageBottomPadding = useBottomTabBarHeight()

  const router = useRouter();

  type LeagueParams = {
    leagueId: string;
    leagueName: string;
  };

  const handleOpenLeagueDetails = ({leagueId, leagueName}: LeagueParams) => {
    router.navigate({
      pathname: "/ranks/LeagueDetails",
      params: { leagueId, leagueName }, // Pass the league name as a parameter
    });
  };

  return (
    <View
      style={{
        flex: 1,
        margin: 0,
        padding: 0,
        backgroundColor: activeColors.background,
      }}
    >
      <View style={{ backgroundColor: "transparent" }}>
        <View
          style={[styles.topSeparator, { backgroundColor: activeColors.text }]}
        />
        <View style={[styles.week, { backgroundColor: Colors.PRIMARY }]}>
          <Text style={{ color: Colors.WHITE }}>This week</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: pageBottomPadding + 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            gap: 20,
          }}
        >
          <View
            style={[
              styles.stat,
              {
                backgroundColor: activeColors.background2,
                shadowColor: activeColors.shadowColor,
              },
            ]}
          >
            <Text style={[styles.valueText, { color: activeColors.colorText }]}>
              {recapData?.totalArtistsListened}
            </Text>
            <Text style={{ fontSize: 13, color: activeColors.colorText }}>
              artists
            </Text>
          </View>
          <LinearGradient
            colors={["#B6A6C9", "#D5CFD9", "#F7B8DD"]}
            style={[
              styles.middleStat,
              {
                backgroundColor: activeColors.background,
                shadowColor: activeColors.shadowColor,
              },
            ]}
            start={{ x: 0.1, y: 0.2 }}
          >
            <Text style={[styles.valueText, { color: activeColors.colorText }]}>
              {recapData?.totalMinutesListened.toFixed(0)}
            </Text>
            <Text style={{ fontSize: 13, color: activeColors.colorText }}>
              minutes
            </Text>
          </LinearGradient>
          <View
            style={[
              styles.stat,
              {
                backgroundColor: activeColors.background2,
                shadowColor: activeColors.shadowColor,
              },
            ]}
          >
            <Text style={[styles.valueText, { color: activeColors.colorText }]}>
              {recapData?.totalTracksListened}
            </Text>
            <Text style={{ fontSize: 13, color: activeColors.colorText }}>
              tracks
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 30,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            width: "80%",
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: activeColors.text,
            }}
          >
            Leagues
          </Text>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={activeColors.tint}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            width: "90%",
            alignSelf: "center",
            flexDirection: "row",
            gap: 30,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: activeColors.background,
                shadowColor: activeColors.shadowColor,
              },
            ]}
            onPress={openJoinModal}
          >
            <MaterialIcons
              name="add-link"
              size={17}
              color={activeColors.colorText}
            />
            <Text style={{ fontSize: 13, color: activeColors.text }}>
              Join League
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: activeColors.background,
                shadowColor: activeColors.shadowColor,
              },
            ]}
            onPress={() => router.navigate("/ranks/createLeagueName")}
          >
            <Entypo name="plus" size={17} color={activeColors.colorText} />
            <Text style={{ fontSize: 13, color: activeColors.text }}>
              Create League
            </Text>
          </TouchableOpacity>
        </View>

        {
          leagues.length === 0 ? <View style={{ marginTop: 70,}}><NoLeague/></View>  : 
        

        <View style={{ width: "90%", alignSelf: "center" }}>
          <View
            style={[
              styles.leagueSeparator,
              { marginTop: 30, backgroundColor: activeColors.colorText },
            ]}
          />
          <View style={[styles.leagueHead, { backgroundColor: "#3d1021" }]}>
            <Text style={{ color: Colors.WHITE, fontSize: 11 }}>
              Private Leagues
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 50,
              marginTop: 15,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ fontSize: 12, color: Colors.GRAY, fontWeight: "bold" }}
            >
              Rank
            </Text>
            <Text
              style={{ fontSize: 12, color: Colors.GRAY, fontWeight: "bold" }}
            >
              League
            </Text>
          </View>
          <View
            style={[
              styles.leagueSeparator,
              { marginBottom: 10, backgroundColor: activeColors.colorText },
            ]}
          />

          
          {
          leagues.map((league, index) =>
           // league.type === "private" ? (
              <TouchableOpacity
                key={league.leagueId}
                style={{
                  height: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
                onPress={() => handleOpenLeagueDetails({leagueId: league.leagueId, leagueName: league.name,})}

              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 20,
                    width: "80%",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ width: "20%", justifyContent: "center" }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: activeColors.text,
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {/* {numberComma(league.rank)} */} {league.rank}
                    </Text>
                  </View>
                  <View style={{ width: "70%" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: activeColors.text,
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {league.name}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="enter-outline"
                  size={20}
                  color={activeColors.colorText}
                />
              </TouchableOpacity>
           // ) : null
          )
          }
          
        </View>
}

{/* SCRAPPED PUBLIC LEAGUE */}
        {/* <View style={{ width: "90%", alignSelf: "center" }}>
          <View
            style={[
              styles.leagueSeparator,
              { marginTop: 20, backgroundColor: activeColors.colorText },
            ]}
          />
          <View style={[styles.leagueHead, { backgroundColor: "#756181" }]}>
            <Text style={{ color: Colors.WHITE, fontSize: 11 }}>
              General Leagues
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 50,
              marginTop: 15,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ fontSize: 12, color: Colors.GRAY, fontWeight: "bold" }}
            >
              Rank
            </Text>
            <Text
              style={{ fontSize: 12, color: Colors.GRAY, fontWeight: "bold" }}
            >
              League
            </Text>
          </View>
          <View
            style={[
              styles.leagueSeparator,
              { marginBottom: 10, backgroundColor: activeColors.colorText },
            ]}
          />
          
          {leagues.map((league, index) =>
           // league.type == "public" ? (
              <TouchableOpacity
                key={index}
                style={{
                  height: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 20,
                    width: "90%",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ width: "20%", justifyContent: "center" }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: activeColors.text,
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {numberComma(league.rank)} 
                    </Text>
                  </View>
                  <View style={{ width: "70%" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: activeColors.text,
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}
                    >
                      {league.name}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="enter-outline"
                  size={20}
                  color={activeColors.colorText}
                />
              </TouchableOpacity>
           // ) : null
          )}

        </View> */}
      </ScrollView>
      <CreateLeagueSheet ref={createLeagueBottomSheetRef} />
      <JoinLeagueSheet ref={joinLeagueBottomSheetRef} />
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  topSeparator: {
    height: StyleSheet.hairlineWidth,
    //height: 1,
    width: "70%",
    alignSelf: "center",
    display: "none",
  },

  week: {
    height: 20,
    width: "30%",
    //marginTop: 20,
    borderBottomLeftRadius: 99,
    borderBottomRightRadius: 99,
    borderTopRightRadius: 2,
    borderTopLeftRadius: 0,
    alignSelf: "center",
    //backgroundColor: Colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  stat: {
    width: "20%",
    height: 55,
    //backgroundColor: activeColors.background2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    //shadowColor: activeColors.tint,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 0,
  },

  middleStat: {
    width: "30%",
    height: 70,
    //backgroundColor: activeColors.background,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "hidden",
    //shadowColor: activeColors.shadowColor,
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  valueText: {
    fontWeight: "600",
    fontSize: 16,
    //color: activeColors.colorText,
  },

  button: {
    width: "40%",
    height: 40,
    //backgroundColor: activeColors.background,
    borderRadius: 10,
    gap: 2,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    //shadowColor: activeColors.shadowColor,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },

  leagueSeparator: {
    height: StyleSheet.hairlineWidth,
    //height: 1,
    //backgroundColor: activeColors.colorText,
    width: "100%",
    alignSelf: "center",
  },

  leagueHead: {
    height: 20,
    width: "40%",
    //marginTop: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 2,
    borderTopLeftRadius: 0,

    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
});
