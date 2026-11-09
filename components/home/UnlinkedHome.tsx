import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHeaderHeight, Screen } from '@react-navigation/elements';
import React, { useContext } from 'react';
import { useActiveColors } from '@/constants/ThemeMode';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { AppleMusicImg, SpotifyImg } from '../ProviderImg';
import LottieView from 'lottie-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlobalContext } from '../../context/GlobalProvider';
import { useAuthRequest, ResponseType, makeRedirectUri, AuthSessionResult } from 'expo-auth-session';
import { getSpotifyRedirectUri } from '../../utils/spotifyRedirect';
import { updateUser } from '@/utils/service_api/userServiceApi';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AppleMusicTokenResponse {
  user_token: string;
}

interface UpdateUserFields {
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiration?: number;
  appleMusicAccessToken?: string;
  linkedAccount?: string;
}

const UnlinkedHome = () => {
  const headerHeight = useHeaderHeight();
  const activeColors = useActiveColors();
  const pageBottomPadding = useBottomTabBarHeight();

  const { linkSpotify, linkApple, resetLinks } = useContext(GlobalContext)!;

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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => (
            <Text
              style={{ fontFamily: 'dmsans-semibold', color: activeColors.text }}
              className="ml-8 font-bold text-2xl"
            >
              Activity
            </Text>
          ),
        }}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: activeColors.background,
          paddingTop: headerHeight,
          paddingBottom: pageBottomPadding,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
          <LottieView
                autoPlay
                source={require('@/assets/lottie/anim1.json')}
                loop
                style={{ width: '30%', height: '30%', position: 'absolute', top: headerHeight + 20, }}
                />

            <View style={{
                borderRadius: 20,
                backgroundColor: activeColors.buttonBackdrop,
                width: '80%',
                //padding: 30,
                paddingVertical: 20,
                paddingHorizontal: 10,
                
            }}> 

                <View style={{ top: 20, width: '100%', alignItems: 'center', gap: 10,}}>
                <Text style={{color: activeColors.text, fontWeight: '700', fontSize: 15,  }}>oops:( You have no feed</Text>
                <Text style={{textAlign: 'center', fontSize: 12, color: activeColors.text,}}>Connect to a provider to see what your friends are listening to</Text>
                </View>


<View style={{marginTop: 50,  }}>

    {/* ---------------------------------------Apple Music-------------------------------------------------- */}
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
                >
                  <Text
                    style={{
                      color: Colors.WHITE,
                      paddingHorizontal: 8,
                      fontWeight: 500,
                    }}
                  >
                    Connect
                  </Text>
                </TouchableOpacity>
              </View>


{/* ---------------------------------------Spotify-------------------------------------------------- */}
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
                >
                  <Text
                    style={{
                      color: Colors.WHITE,
                      paddingHorizontal: 8,
                      fontWeight: 500,
                    }}
                  >
                    Connect
                  </Text>
                </TouchableOpacity>
              </View>

              </View>

            </View>

            <View style={{
              position: 'absolute', 
              bottom: pageBottomPadding + 70, 
              borderRadius: 99, 
              padding: 2, 
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 1, 
              shadowOpacity: 0.2,
              shadowColor: activeColors.shadowColor,
              shadowOffset: {
                width: 2,
                height: 2,
              }
              }}>
              <MaterialIcons name='offline-bolt' size={70} color={'red'} />
            </View>
      </View>
    </>
  );
};

export default UnlinkedHome;

const styles = StyleSheet.create({});
