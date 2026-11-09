import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform, ScrollView, ListRenderItem, ListRenderItemInfo } from "react-native";
import React, { useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import friends from "@/data/friends.json";
import { AlphabetList, IData } from "react-native-section-alphabet-list";
import { useHeaderHeight, Screen } from "@react-navigation/elements";
import { Colors } from "@/constants/Colors";
import { defaultStyles } from "@/constants/Styles";
import LottieView from "lottie-react-native";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useActiveColors } from "@/constants/ThemeMode";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { fetchFriends, Friend } from "@/utils/service_api/friendshipServiceApi"
import { SafeAreaView } from "react-native-safe-area-context";

type InitialFriend = {
  friendID:   string
  username:   string | null
  profileImg: string | null
}

const Page = () => {
  const activeColors = useActiveColors();
  const headerHeight = useHeaderHeight();
  const screenHieght = Dimensions.get("window").height
  const { initialFriends } = useLocalSearchParams<{ initialFriends?: string }>()
  const [allFriends, setAllFriends] = useState<Friend[]>([])
  const [display, setDisplay] = useState<InitialFriend[]>([])

  const router = useRouter()

  // 1) rehydrate the initial slice
  useEffect(() => {
    if (!initialFriends) return
    try {
      const arr: InitialFriend[] = JSON.parse(decodeURIComponent(initialFriends))
      setDisplay(arr)
    } catch (e) {
      console.error("Could not parse initialFriends:", e)
    }
  }, [initialFriends])

  // 2) fetch the full list, append any that aren't in `display`
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const fresh = await fetchFriends()
        if (cancelled) return

        setAllFriends(fresh)

        // filter out the ones we already passed
        const existingIDs = new Set(display.map(d => d.friendID))
        const remaining: InitialFriend[] = fresh
          .filter(f => !existingIDs.has(f.friendId))
          .map(f => ({
            friendID:   f.friendId,
            username:   f.username,
            profileImg: f.profileImg
          }))

        // append
        setDisplay(d => [...d, ...remaining])
      } catch (e) {
        console.error("Failed to fetch full friends:", e)
      }
    })()
    return () => { cancelled = true }
  }, [display])

  const data = friends.map((friend, index) => ({
    value: `${friend.first_name} ${friend.last_name}`,
    name: `${friend.first_name} ${friend.last_name}`,
    img: friend.img,
    desc: friend.desc,
    key: `${friend.first_name} ${friend.last_name}-${index}`,
  }));

  const emptyListRender = () => {
    //const viewHeight = Dimensions.get('window').height
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center",   }}>
        <LottieView
          source={require("../../assets/lottie/anim3.json")}
          style={{
            width: "50%",
            height: "30%",
            // backgroundColor: 'red',
          }}
          autoPlay
          loop
        />
        <View style={{ gap: 5, alignItems: "center" }}>
          <Text style={{ fontFamily: "dmsans-bold", color: Colors.GRAY }}>
                You currently have no friends to interact with
          </Text>
          <Text
            style={{
              fontFamily: "dmsans-semibold",
              textAlign: "center",
              color: Colors.GRAY,
            }}
          >
            That's a bit sad
          </Text>
        </View>

        <Text
          style={{
           fontSize: 30,
            paddingVertical: 15,
          }}
        >
          🤷‍♂️
        </Text>
        <Text
          style={{
            fontFamily: "dmsans-semibold",
            textAlign: "center",
            color: Colors.GRAY,
          }}
        >
          Invite some!
        </Text>

        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 99,
            //backgroundColor: "rgba(25, 25, 25, .1)",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Entypo name="sound" size={40} color={Colors.PRIMARY} />
          <View
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "40%",
              height: "40%",
              borderRadius: 100,
              backgroundColor: Colors.WHITE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="share-circle"
              size={16}
              color={Colors.PRIMARY}
              style={{ alignSelf: "center", textAlign: "center" }}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  type AlphabetFriendItem = {
  key: string;
  value: string;
  friend: InitialFriend;
};

const alphabetData: AlphabetFriendItem[] = display.map((friend) => ({
  key: friend.friendID,
  value: friend.username ?? '',
  friend,
}));

  const renderFriends = ({ item }: { item: InitialFriend }) => (
    <>
            <TouchableOpacity 
             onPress={() => router.push({
              pathname: `/chatRoom`,
              params: {
                friendId: item.friendID,
                username: item.username,
                profileImg: item.profileImg
              },
            })}
            style={[styles.listItemContainer, {backgroundColor: activeColors.background2,}]}
            >
              <Image
                source={{ uri: item.profileImg?.toString() }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
              <View>
                <Text style={{ color: activeColors.text, fontSize: 14 }}>
                  {item.username}
                </Text>
                {/* <Text style={{ color: Colors.GRAY, fontSize: 12 }}>
                  {item.desc.length > 40
                    ? `${item.desc.substring(0, 40)}...`
                    : item.desc}
                </Text> */}
              </View>
            </TouchableOpacity>
            {/* <View style={[defaultStyles.separator]}/> */}
          </>
  )

 

  return (

    <>
    <Stack.Screen
    options={{
      presentation: 'modal',
      animation: "fade_from_bottom",
      headerTintColor: activeColors.tint,
      headerStyle: {backgroundColor: activeColors.background,},
      headerTitleStyle: {color: activeColors.text,},
        headerSearchBarOptions: {
                placeholder: 'Search',
                textColor: activeColors.text,
                tintColor: activeColors.text,
                headerIconColor: activeColors.text,
                hintTextColor: activeColors.text,
                shouldShowHintSearchIcon: false,
            },
      contentStyle: {backgroundColor: activeColors.background,},
    }}
    />
    <SafeAreaView  //YOU may want to change this to regular view later when you check how it looks on ios
      style={{ 
        flex: 1,
       paddingTop:  Platform.OS == "ios"? headerHeight + 55: headerHeight,
        backgroundColor: activeColors.background,
      }}
    >

      <TouchableOpacity 
      onPress={() => router.push({
        pathname: '/(modals)/group/add-members',
        params: {friendsData: JSON.stringify(display)},
      })}
      style={{
        padding: 12, 
        width: '80%', 
        alignSelf: 'center', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        flexDirection: 'row', 
        gap: 15,
        borderRadius: 15,
        backgroundColor: activeColors.buttonBackdrop,
        marginBottom: 20,
      }}
      >
        <Ionicons name="people-outline" size={24} color={'#1DB954'}  style={{paddingLeft: 10,}}/>
        <Text style={{color: activeColors.text, fontWeight: 'semibold', fontSize: 15,}}>New group</Text>
      </TouchableOpacity>
      <AlphabetList
      scrollEnabled
        data={alphabetData}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={emptyListRender}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 20,}}
        indexLetterStyle={{
          color: activeColors.colorText,
          fontSize: 12,
        }}
        showsVerticalScrollIndicator={false}
        indexContainerStyle={{
          width: 24,
          backgroundColor: activeColors.background,
        }}
        indexLetterContainerStyle={{
          marginVertical: 4,
        }}
        style={{ marginLeft: 14, flexGrow: 1, }}
        renderCustomSectionHeader={(section) => (
          <View style={[styles.sectionHeaderContainer, {backgroundColor: activeColors.background,}]}>
            <Text style={{color: activeColors.text,}}>{section.title}</Text>
          </View>
        )}
        renderCustomItem={(item) => {
    const typedItem = item as AlphabetFriendItem;
    return renderFriends({ item: typedItem.friend });
  }}
      />
    </SafeAreaView>
    </>

  );
};

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    height: 30,
    paddingHorizontal: 14,
    justifyContent: "center",
    //backgroundColor: activeColors.background,
  },

  listItemContainer: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    //backgroundColor: activeColors.background2,
    borderRadius: 20,
    marginBottom: 5,
  },
});

export default Page;
