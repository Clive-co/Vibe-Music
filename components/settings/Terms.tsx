import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import {
  BottomSheetModal,
  useBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import friend from "@/data/friends.json";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { AppleMusicImg, SpotifyImg } from "../ProviderImg";
import { useActiveColors } from "@/constants/ThemeMode";


export type Ref = BottomSheetModal;


const Terms = forwardRef<Ref>((props, ref) => {
  const activeColors = useActiveColors();
  const snapPoints = useMemo(() => ["95%"], []);
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


  const { height } = useWindowDimensions();

  

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      //index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      style={{ padding: 12 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={{backgroundColor: activeColors.tint,}}
      backgroundStyle={{backgroundColor: activeColors.background,}}
    >
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
          <Text style={[styles.containerHeadline, {color: activeColors.text,}]}>Terms & Conditions</Text>

          {/* <View style={styles.separator} /> */}

          <ScrollView
            style={{
              flex: 1,
              width: "90%",
              paddingTop: '80%',
            }}
            contentContainerStyle={{alignItems: 'center',}}
          >
            <Text style={{color: activeColors.text,}}>Terms and conditions will be here</Text>


          </ScrollView>
          {/* </View> */}

          {/* </View> */}
        </View>
      </KeyboardAvoidingView>
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
    //color: activeColors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.GRAY,
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

export default Terms;