import React, {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
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
  BottomSheetModalProvider,
  BottomSheetView
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import {  Colors } from "@/constants/Colors";
import friend from "@/data/friends.json";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { AppleMusicImg, SpotifyImg } from "../ProviderImg";
import { useActiveColors } from "@/constants/ThemeMode";
import { useAuthRequest, ResponseType, makeRedirectUri, CodeChallengeMethod } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlobalContext } from "../../context/GlobalProvider";
import axios from "axios";
import { getSpotifyRedirectUri } from "@/utils/spotifyRedirect";
import { updateUser } from '@/utils/service_api/userServiceApi';

export type Ref = BottomSheetModal;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AppleMusicTokenResponse {
  user_token: string;
}

const Provider = forwardRef<Ref>((props, ref) => {
  const activeColors = useActiveColors();
  const { linkSpotify, linkApple, spotifyLinked, appleLinked, resetLinks } = useContext(GlobalContext)!;
  const snapPoints = useMemo(() => ["90%"], []);
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

  const disconnectSpotify = async (): Promise<void> => {
    try {
      await updateUser({
        spotifyAccessToken: "",
        spotifyRefreshToken: "",
        spotifyTokenExpiration: "",
        linkedAccount: "none",
      });

      resetLinks();
      console.log("Spotify disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting Spotify:", error);
    }
  };

  const disconnectAppleMusic = async (): Promise<void> => {
    try {
      await updateUser({
        appleMusicAccessToken: "",
        linkedAccount: "none",
      });

      resetLinks();
      console.log("Apple Music disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting Apple Music:", error);
    }
  };

  const SPOTIFY_REDIRECT_URI = getSpotifyRedirectUri();
  const SPOTIFY_SCOPES =
    "user-read-recently-played user-read-currently-playing user-top-read playlist-read-private playlist-modify-private user-library-read";
  const spotifyDiscovery = {
    authorizationEndpoint: "https://accounts.spotify.com/authorize",
    tokenEndpoint: "https://accounts.spotify.com/api/token",
  };

  const [spotifyRequest, spotifyResponse, spotifyPromptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
      scopes: SPOTIFY_SCOPES.split(" "),
      redirectUri: SPOTIFY_REDIRECT_URI,
      responseType: ResponseType.Code,
      usePKCE: false,
    },
    spotifyDiscovery
  );

  const connectSpotify = async (): Promise<void> => {
    try {
      const disconnect = await disconnectAppleMusic();
      const result = await spotifyPromptAsync();

      if (result?.type === "success" && result?.params?.code) {
        const tokenPayload = new URLSearchParams({
          grant_type: "authorization_code",
          code: result.params.code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          client_id: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
          client_secret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET!,
        }).toString();

        const response = await axios.post<TokenResponse>(
          spotifyDiscovery.tokenEndpoint,
          tokenPayload,
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log

        const { access_token, refresh_token, expires_in } = response.data;
        const expirationTime = Date.now() + expires_in * 1000;

        await updateUser({
          spotifyAccessToken: access_token,
          spotifyRefreshToken: refresh_token,
          spotifyTokenExpiration: expirationTime,
          linkedAccount: "spotify",
        });

        linkSpotify();
        console.log("Spotify connected successfully!");
      } else {
        console.error("Spotify authentication failed. Result:", result);
      }
    } catch (error) {
      console.error("Error connecting to Spotify:", error);
    }
  };

  const APPLE_MUSIC_REDIRECT_URI = makeRedirectUri();
  const appleDiscovery = {
    authorizationEndpoint: "https://music.apple.com/us/authorize",
  };

  const [appleRequest, appleResponse, applePromptAsync] = useAuthRequest(
    {
      clientId: "your_client_id",
      redirectUri: APPLE_MUSIC_REDIRECT_URI,
      responseType: ResponseType.Code,
      scopes: ["playback"],
    },
    appleDiscovery
  );

  const connectAppleMusic = async (): Promise<void> => {
    try {
      await disconnectSpotify();
      const result = await applePromptAsync();

      if (result?.type === "success" && result?.params?.code) {
        const response = await axios.post<AppleMusicTokenResponse>(
          "https://our-backend.example.com/apple-music/token",
          { code: result.params.code, redirect_uri: APPLE_MUSIC_REDIRECT_URI },
          { headers: { "Content-Type": "application/json" } }
        );

        const { user_token } = response.data;

        await updateUser({
          appleMusicAccessToken: user_token,
          linkedAccount: "apple music",
        });

        linkApple();
        console.log("Apple Music connected successfully!");
      } else {
        console.error("Apple Music authentication failed. Result:", result);
      }
    } catch (error) {
      console.error("Error connecting to Apple Music:", error);
    }
  };
  

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
      handleIndicatorStyle={{ backgroundColor: activeColors.tint }}
      backgroundStyle={{ backgroundColor: activeColors.background }}
    >
      <BottomSheetView style={{flex:1}}>
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
          <Text
            style={[styles.containerHeadline, { color: activeColors.text }]}
          >
            Link Provider
          </Text>

          {/* <View style={styles.separator} /> */}

          <View
            style={{
              flex: 1,
              width: "90%",
              gap: 30,
            }}
          >
            <View
              style={{
                width: "100%",
                height: "50%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LottieView
                source={require("@/assets/lottie/anim1.json")}
                style={{ width: "70%", height: "70%" }}
                autoPlay
                loop
              />
              <Text
                style={{
                  textAlign: "center",
                  color: Colors.GRAY,
                }}
              >
                Choose your music provider from the list of services we have
                below
              </Text>
            </View>

            <View style={{ gap: 30 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 10,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 15,
                    alignItems: "center",
                  }}
                >
                  <View>
                    <SpotifyImg width={40} height={40} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color: Colors.GRAY,
                    }}
                  >
                    Spotify
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: activeColors.button1,
                    borderRadius: 99,
                    padding: 8,
                  }}
                  onPress={spotifyLinked ? disconnectSpotify : connectSpotify} // Call disconnectSpotify if linked
                  disabled={false} 
                >
                  <Text
                    style={{
                      color: Colors.WHITE,
                      paddingHorizontal: 8,
                      fontWeight: 500,
                    }}
                  >
                    {spotifyLinked ? "Disconnect" : "Connect"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 10,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 15,
                    alignItems: "center",
                  }}
                >
                  <View>
                    <AppleMusicImg width={40} height={40} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color: Colors.GRAY,
                    }}
                  >
                    Apple Music
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: activeColors.button1,
                    borderRadius: 99,
                    padding: 8,
                  }}
                  onPress={appleLinked ? disconnectAppleMusic : connectAppleMusic} // Call disconnectAppleMusic if linked
                  disabled={false} 
                >
                  <Text
                    style={{
                      color: Colors.WHITE,
                      paddingHorizontal: 8,
                      fontWeight: 500,
                    }}
                  >
                    {appleLinked ? "Disconnect" : "Connect"}
                  </Text>
                </TouchableOpacity>
              </View>
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

export default Provider;