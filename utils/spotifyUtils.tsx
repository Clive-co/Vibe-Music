import axios from 'axios';
import { getUser, updateUser, User } from '@/utils/service_api/userServiceApi';

const getSpotifyAccessToken = async (): Promise<string | null> => {
  try {
    // 1. Fetch user data (no need for context or userId prop)
    const user: User = await getUser();
    const {
      spotifyAccessToken,
      spotifyRefreshToken,
      spotifyTokenExpiration,
    } = user;

    // 2. If expired, refresh via Spotify API
    if (Date.now() > Number(spotifyTokenExpiration)) {
      console.log('Access token expired. Refreshing token...');
      const tokenResp = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: spotifyRefreshToken,
          client_id: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
          client_secret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET!,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { access_token, expires_in } = tokenResp.data;
      const newExpiry = Date.now() + expires_in * 1000;

      // 3. Persist new token in backend
      await updateUser({
        spotifyAccessToken: access_token,
        spotifyTokenExpiration: newExpiry,
      });

      console.log('Access token refreshed successfully!');
      return access_token;
    }

    // 4. If still valid, return existing
    return spotifyAccessToken;
  } catch (error) {
    console.error('Error managing Spotify access token:', error);
    return null;
  }
};

export default getSpotifyAccessToken;
