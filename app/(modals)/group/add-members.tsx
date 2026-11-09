import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveColors } from "@/constants/ThemeMode";
import { Colors } from "@/constants/Colors";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { AlphabetList } from "react-native-section-alphabet-list";
import { CheckBox } from "@rneui/themed";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type InitialFriend = {
  friendID: string;
  username: string | null;
  profileImg: string | null;
};

type AlphabetFriendItem = {
  key: string;
  value: string;
  friend: InitialFriend;
};
const AddMembers = () => {
  const activeColors = useActiveColors();

  const { friendsData } = useLocalSearchParams();
  const [friends, setFriends] = useState<InitialFriend[]>([]);
  const [selected, setSelected] = useState<InitialFriend[]>([]);

  useEffect(() => {
    if (typeof friendsData === "string") {
      try {
        const parsed = JSON.parse(friendsData) as InitialFriend[];
        setFriends(parsed);
      } catch (e) {
        console.error("Failed to parse friendsData", e);
      }
    }
  }, [friendsData]);

  const alphabetData: AlphabetFriendItem[] = friends.map((friend) => ({
    key: friend.friendID,
    value: friend.username ?? "",
    friend,
  }));

  const toggleOptions = (friend: InitialFriend) => {
    const exists = selected.find((f) => f.friendID === friend.friendID);
    if (exists) {
      setSelected(selected.filter((f) => f.friendID !== friend.friendID));
    } else {
      setSelected([...selected, friend]);
    }
  };

  const renderFriends = ({ item }: { item: InitialFriend }) => (
    <>
      <Pressable
        onPress={() => {
          toggleOptions(item);
        }}
        style={[
          styles.listItemContainer,
          {
            backgroundColor: activeColors.background2,
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Image
            source={{ uri: item.profileImg?.toString() }}
            style={{ width: 35, height: 35, borderRadius: 20 }}
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
        </View>

        <CheckBox
          key={item.friendID}
          //title={item.first_name}
          checked={selected.some((f) => f.friendID === item.friendID)}
          //onPress={() => setSelected(index)}
          checkedIcon="dot-circle-o"
          uncheckedIcon="circle-o"
          style={{ backgroundColor: "transparent" }}
          wrapperStyle={{ backgroundColor: "transparent" }}
          containerStyle={{ backgroundColor: "transparent" }}
        />
      </Pressable>
      {/* <View style={[defaultStyles.separator]}/> */}
    </>
  );

  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const show = selected.length > 0;

  useEffect(() => {
    if (show) {
      translateY.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(10, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scaleY: scale.value }],
  }));

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: activeColors.background },
        }}
      />
      <SafeAreaView style={{ paddingTop: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 25,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <TouchableOpacity style={{}}>
            <Text
              onPress={() => router.back()}
              style={{ color: activeColors.text, fontSize: 15 }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <View
            style={{ alignItems: "center", justifyContent: "center", gap: 1 }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: activeColors.text,
              }}
            >
              Add members
            </Text>
            <Text style={{ fontSize: 11, color: activeColors.text }}>
              {selected.length}/60
            </Text>
          </View>
          <TouchableOpacity
            disabled={selected.length === 0}
            onPress={() =>
              router.push({
                pathname: "/(modals)/group/create-group",
                params: { selected: JSON.stringify(selected) },
              })
            }
          >
            <Text
              style={{
                color: selected.length > 0 ? activeColors.text : Colors.GRAY,
                fontSize: 15,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: activeColors.input,
            borderRadius: 10,
            padding: Platform.OS === "ios" ? 12 : 12,
            paddingHorizontal: Platform.OS === "android" ? 12 : undefined,
            //marginTop: 20,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            gap: 5,
            flexShrink: 1,
            marginHorizontal: 20,
          }}
        >
          <AntDesign name="search1" color={Colors.GRAY} size={16} />
          <TextInput
            placeholder="Search friends"
            placeholderTextColor={Colors.GRAY}
            value={""}
            onChangeText={() => {}}
            multiline={false}
            style={{
              flex: 1,
              color: activeColors.text,
            }}
          />
        </View>

        <Animated.View
          style={[
            {
              backgroundColor: activeColors.buttonBackdrop,
              borderRadius: 15,
              marginHorizontal: 20,
              paddingVertical: 10,
              pointerEvents: show ? "auto" : "none",
            },
            animatedStyle,
          ]}
        >
          <FlatList
            data={friends.filter((item) => selected.includes(item))} // Filter selected items
            horizontal
            contentContainerStyle={{ paddingLeft: 25 }}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.friendID}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() =>
                  setSelected(
                    selected.filter((itemId) => itemId !== item)
                  )
                }
                style={{ alignItems: "center", gap: 8 }}
              >
                <View style={{ width: 60, alignItems: "center" }}>
                  <Image
                    source={{ uri: item.profileImg?.toString() }}
                    style={{ height: 55, width: 55, borderRadius: 99 }}
                  />

                  <MaterialIcons
                    name="cancel"
                    size={20}
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      padding: 1,
                      borderRadius: 99,
                      backgroundColor: activeColors.background,
                    }}
                    color={Colors.GRAY}
                  />
                </View>

                <Text
                  style={{
                    color: activeColors.text,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {item.username}
                </Text>
              </Pressable>
            )}
          />
        </Animated.View>

        <AlphabetList
          scrollEnabled
          data={alphabetData}
          stickySectionHeadersEnabled={true}
          //ListEmptyComponent={emptyListRender}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
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
          style={{ marginLeft: 14, flexGrow: 1 }}
          renderCustomSectionHeader={(section) => (
            <View
              style={[
                styles.sectionHeaderContainer,
                { backgroundColor: activeColors.background },
              ]}
            >
              <Text style={{ color: activeColors.text }}>{section.title}</Text>
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

export default AddMembers;

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    height: 30,
    paddingHorizontal: 14,
    justifyContent: "center",
    //backgroundColor: activeColors.background,
  },

  listItemContainer: {
    flex: 1,
    //height: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    //backgroundColor: activeColors.background2,
    borderRadius: 20,
    marginBottom: 5,
  },
});
