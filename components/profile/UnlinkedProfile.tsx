import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext } from 'react';
import { useActiveColors } from '@/constants/ThemeMode';
import { Colors } from '@/constants/Colors';
import { AppleMusicImg, SpotifyImg } from '../ProviderImg';
import { GlobalContext } from '../../context/GlobalProvider';
import { useAuthRequest, ResponseType, makeRedirectUri, AuthSessionResult } from 'expo-auth-session';
import { getSpotifyRedirectUri } from '../../utils/spotifyRedirect';
import axios from 'axios';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { updateUser } from '@/utils/service_api/userServiceApi';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AppleMusicTokenResponse {
  user_token: string;
}

interface SpotifyDiscovery {
  authorizationEndpoint: string;
  tokenEndpoint: string;
}

interface AppleDiscovery {
  authorizationEndpoint: string;
}

const UnlinkedProfile = () => {
  const activeColors = useActiveColors();
  const { linkSpotify, linkApple, spotifyLinked, appleLinked, resetLinks } = useContext(GlobalContext)!;

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

  const pageBottomPadding = useBottomTabBarHeight();

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: activeColors.buttonBackdrop,
        width: '80%',
        paddingVertical: 20,
        paddingHorizontal: 10,
        top: 40,
      }}
    >
      <View style={{ top: 20, width: '100%', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: activeColors.text, fontWeight: '700', fontSize: 15 }}>
          oops:( We can't get your data
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 12, color: activeColors.text }}>
          Connect to a provider to see and share your streaming statistics
        </Text>
      </View>

      <View style={{ marginTop: 50 }}>
        {/* Apple Music */}
        <View style={styles.providerContainer}>
          <View style={styles.providerInner}>
            <AppleMusicImg width={40} height={40} />
            <Text style={styles.providerText}>Apple Music</Text>
          </View>

          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: activeColors.button1 }]}
            onPress={connectAppleMusic}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>

        {/* Spotify */}
        <View style={styles.providerContainer}>
          <View style={styles.providerInner}>
            <SpotifyImg width={40} height={40} />
            <Text style={styles.providerText}>Spotify</Text>
          </View>

          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: activeColors.button1 }]}
            onPress={connectSpotify}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>    
      </View>
    </View>
  );
};

export default UnlinkedProfile;

const styles = StyleSheet.create({
  providerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
  },
  providerInner: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  providerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.GRAY,
  },
  connectButton: {
    borderRadius: 99,
    padding: 8,
  },
  connectButtonText: {
    color: Colors.WHITE,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
});
