import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useRef } from "react";
import { Colors } from "@/constants/Colors";
import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Link, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Provider from "@/components/settings/ProviderSheet";
import Terms from "@/components/settings/Terms";
import ThemeButtons from "@/components/settings/ThemeButtons";
import { useActiveColors } from "@/constants/ThemeMode";
import DangerButtons from "@/components/settings/DangerButtons";

const Settings = () => {
  const activeColors = useActiveColors();
    const router = useRouter();
    const navigation = useNavigation();

    const {userName, profileImg} = useLocalSearchParams<{userName: string, profileImg: string,}>()
    const providerSheetRef = useRef<BottomSheetModal>(null)
    const termsSheetRef = useRef<BottomSheetModal>(null)
    const openProviderModal = useCallback(() => {
      providerSheetRef.current?.present();
    }, []);
    //const openProviderModal = () => providerSheetRef.current?.present()
    const openTerms = () => termsSheetRef.current?.present()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: activeColors.background, paddingVertical: 20,  }}
      contentContainerStyle={{ alignItems: "center", }}
      scrollEnabled
      bounces={false}
      showsHorizontalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "80%",
        }}
        onPress={() => router.push({
          pathname: '/settings/edituser',
          params: {userName, profileImg}
        })}  
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
          }}
        >
          <View
            style={{
              backgroundColor: activeColors.background2,
              width: 80,
              height: 80,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 99,
              shadowColor: "#171717",
              shadowOffset: { width: -2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Image
              source={{uri: profileImg,}}
              style={{ width: "95%", height: "95%", borderRadius: 99 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ gap: 10 }}>
            <Text style={{ fontWeight: "bold", color: activeColors.text,}}>Oscar Bobb</Text>
            <Text style={{ fontSize: 12, color: Colors.GRAY }}>@{userName}</Text>
          </View>
        </View>

        <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
      </TouchableOpacity>

      <View style={{ width: "90%", alignItems: "center" }}>
        {/*---------------------------------------------------------- Account buttons ------------------------------------------------------*/}
        <View style={{ width: "90%", marginBottom: 10, marginTop: 20, }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.GRAY }}>
            Account
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            borderRadius: 20,
            //gap: 20,
            backgroundColor: activeColors.background2,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="key-star" size={24} color={activeColors.text}/>
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Upgrade to plus</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={() => router.push('/settings/change-email')}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="mail" size={22} color={activeColors.text}/>
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Change email address</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>
        </View>
        {/*---------------------------------------------------------- Account buttons end------------------------------------------------------*/}

        {/*---------------------------------------------------------- Additional buttons ------------------------------------------------------*/}
        <View style={{ width: "90%", marginVertical: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.GRAY }}>
            Additional
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            borderRadius: 20,
            //gap: 20,
            backgroundColor: activeColors.background2,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="widgets-outline" size={24} color={activeColors.text} />
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Adding widget</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={openProviderModal}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="music-box-multiple-outline"
                  size={24}
                  color={activeColors.text}
                />
              </View>

              <Text style={{ fontSize: 14,  color: activeColors.text,}}>Music provider</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={() => router.push('/settings/blocked')}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="block" size={24} color={activeColors.text}/>
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Blocked</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY} />
          </TouchableOpacity>

          <View style={[styles.separator, {borderBottomColor: activeColors.border,}]} />

          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
            }}
            onPress={openTerms}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 40 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: activeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="file-sign" size={24} color={activeColors.text} />
              </View>

              <Text style={{ fontSize: 14, color: activeColors.text, }}>Terms and Conditions</Text>
            </View>

            <MaterialIcons name="navigate-next" size={30} color={Colors.GRAY}  />
          </TouchableOpacity>
        </View>
        {/*---------------------------------------------------------- Additional buttons end------------------------------------------------------*/}


        <ThemeButtons/>

        {/*---------------------------------------------------------- Danger buttons ------------------------------------------------------*/}
        <DangerButtons/>
        {/*---------------------------------------------------------- Danger buttons end ------------------------------------------------------*/}

        
      </View>
      <View style={{width: '100%',  marginTop: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 25, marginBottom: 30,}}>
      <FontAwesome6 name="instagram" size={26} color={Colors.GRAY} />
      <FontAwesome6 name="x-twitter" size={26} color={Colors.GRAY} />
      <FontAwesome6 name="tiktok" size={26} color={Colors.GRAY} />
      </View>
      <Provider ref={providerSheetRef} />
      <Terms ref={termsSheetRef}/>
    </ScrollView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    //borderBottomColor: activeColors.border,
    width: "85%",
    alignSelf: "center",
  },
});
