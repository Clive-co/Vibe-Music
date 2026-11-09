import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  ListRenderItem,
  Image,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  useBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import {  Colors } from "@/constants/Colors";
import friend from "@/data/friends.json";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { useActiveColors } from "@/constants/ThemeMode";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export type Ref = BottomSheetModal;

interface FriendsProps {
  first_name: string;
  last_name: string;
  img: string;
  desc: string;
}

const JoinLeagueSheet = forwardRef<Ref>((props, ref) => {
  const activeColors = useActiveColors();
  const snapPoints = useMemo(() => ["75%"], []);
  const { dismiss } = useBottomSheetModal();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        opacity={0.6}
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const data = friend;

  // const renderItem: ListRenderItem<FriendsProps> = ({ item }) => {
  //     return(
  //         <Text>{item.first_name}</Text>
  //     )
  // }

  //   const renderItem = useCallback(
  //     (item: any) => (
  //       <View key={item.first_name} >
  //         <Text>{item.first_name}</Text>
  //       </View>
  //     ),
  //     []
  //   );

  const renderItem: ListRenderItem<FriendsProps> = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={{ marginBottom: 20, alignItems: "center", width: 70, gap: 5 }}
      >
        <Image
          source={{ uri: item.img }}
          style={{ height: 70, width: 70, borderRadius: 99 }}
        />
        <Text
          style={{ fontSize: 12, width: "100%", textAlign: "center" }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.first_name} {item.last_name}
        </Text>
      </TouchableOpacity>
    ),
    []
  );

  const { height } = useWindowDimensions();

  const onScrollView = () => {
    Keyboard.dismiss();
  };

  const bottomMargin = useBottomTabBarHeight()
  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      //index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      style={{ padding: 12, }}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{backgroundColor: activeColors.background,}}
      handleIndicatorStyle={{backgroundColor: activeColors.tint,}}
    >
      <BottomSheetView style={{flex: 1,}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        //keyboardVerticalOffset={60}
        style={{ flex: 1 }}
      >
        <View style={styles.contentContainer}>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.lightGray,
              borderRadius: 20,
              padding: 4,
              position: "absolute",
              right: 10,
            }}
            onPress={() => dismiss()}
          >
            <Ionicons name="close" color={Colors.GRAY} size={20} />
          </TouchableOpacity>
          <Text style={[styles.containerHeadline, {color: activeColors.text,}]}>Join existing League</Text>

          {/* <View style={[styles.separator, {backgroundColor: Colors.GRAY,}]} /> */}

          <View
            style={{
              //backgroundColor: Colors.WHITE,
             // backgroundColor: 'red',
              //marginTop: 10,
              flex: 1,
              width: "90%",
              //paddingTop: 20,
              //marginBottom: 30,
              // position: 'absolute',
              //gap: Platform.OS == "ios" ? 20 : 10,
              gap: 30,
            }}
          >
            <View style={{width: '100%', height: '50%', alignItems: 'center', justifyContent: 'center',}}>
            <LottieView source={require('@/assets/lottie/search2.json')} style={{width: '80%', height: '90%',}} autoPlay loop/>
            <Text style={{
              textAlign: 'center',
              color: activeColors.text,
            }}>Join a league that already exists by copying the league link and pasting it below</Text>
            </View>

            <View style={{gap: 60,}}>
            <BottomSheetTextInput
              placeholder="Enter League Link"
              style={{
                borderBottomWidth: 2,
                borderBottomColor: Colors.lightGray,
                height: 40,
                marginTop: 20,
                color: activeColors.text,
              }}
              placeholderTextColor={activeColors.text}
            />
            {/* <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%',}}>
            <Text style={{fontSize: 15, fontWeight: '500', }}>Public?</Text>
          <Switch/>
          </View> */}

            <TouchableOpacity
              style={{
                padding: 15,
                width: "100%",
                backgroundColor: Colors.PRIMARY,
                borderRadius: 99,
               // shadowColor: activeColors.shadowColor,
                shadowOpacity: 0.2,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: Colors.WHITE,
                  textAlign: "center",
                }}
              >
                Join
              </Text>
            </TouchableOpacity>
            </View>
          </View>
          {/* </View> */}

          {/* </View> */}
        </View>
      </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 40,
  },

  listContentContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },

  containerHeadline: {
    fontSize: 17,
    fontWeight: "600",
    padding: 5,
    fontFamily: "dmsans-bold",
    // color: activeColors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    //backgroundColor: Colors.GRAY,
    width: "85%",
  },
  // input: {
  //     marginTop: 8,
  //     marginBottom: 10,
  //     borderRadius: 10,
  //     fontSize: 16,
  //     lineHeight: 20,
  //     padding: 8,
  //     backgroundColor: 'rgba(151, 151, 151, 0.25)',
  //   },
});

export default JoinLeagueSheet;
