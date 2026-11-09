import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getSpotifyAccessToken from '@/utils/spotifyUtils';
import { FriendDetails, updateFriend } from '@/utils/service_api/friendshipServiceApi';

export interface Track {
  id: string;
  name: string;
  artist: string;
  playedAt: string;
  imageUrl: string;
  trackUrl: string;
}

export interface PlaybackStatus {
  provider: 'spotify' | 'apple music';
  accessToken: string;
  isListening: boolean;
}

/**
 * Refresh Spotify token when needed.
 */
interface Friend {
  userId: string;
  linkedAccount: string;
  spotifyAccessToken: string;
  spotifyRefreshToken: string;
  spotifyTokenExpiration: number | string;
  appleMusicAccessToken: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

async function ensureFreshSpotifyToken(friend: Friend): Promise<string> {
  let token = friend.spotifyAccessToken!;
  const expiry = Number(friend.spotifyTokenExpiration);
  if (Date.now() >= expiry) {
    try {
      const resp = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: friend.spotifyRefreshToken!,
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('Spotify token refreshed:', resp.data);
      token = resp.data.access_token;
      const newExpiry = Date.now() + resp.data.expires_in * 1000;

      // Persist to backend
      await updateFriend(friend.userId, {
        spotifyAccessToken: token,
        spotifyTokenExpiration: newExpiry,
      });

      // Update in-memory
      friend.spotifyAccessToken = token;
      friend.spotifyTokenExpiration = newExpiry.toString();
    } catch (err) {
      console.error('Failed to refresh Spotify token:', err);
      throw err;
    }
  }
  return token;
}

/**
 * Checks whether the user is currently playing something on Spotify or Apple Music.
 */
export async function checkPlaybackStatus(
  linkedAccount: string
): Promise<PlaybackStatus | null> {
  if (linkedAccount !== 'spotify' && linkedAccount !== 'apple music') {
    console.log('No linked account; polling disabled.');
    return null;
  }
  const provider = linkedAccount as 'spotify' | 'apple music';
  const accessToken = provider === 'spotify'
    ? await getSpotifyAccessToken()
    : await AsyncStorage.getItem('appleAccessToken');
  if (!accessToken) throw new Error('No access token found');

  const endpoint = provider === 'spotify'
    ? 'https://api.spotify.com/v1/me/player/currently-playing'
    : 'https://api.music.apple.com/v1/me/now-playing';

  const resp = await axios.get(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  const isListening = resp.status === 200 && (
    provider === 'spotify'
      ? resp.data.is_playing === true
      : Array.isArray(resp.data.data) && resp.data.data.length > 0
  );
  return { provider, accessToken, isListening };
}

/**
 * Fetches the user’s recently played tracks.
 */
export async function fetchRecentTracks(
  provider: 'spotify' | 'apple music',
  accessToken: string
): Promise<Track[]> {
  const endpoint = provider === 'spotify'
    ? 'https://api.spotify.com/v1/me/player/recently-played'
    : 'https://api.music.apple.com/v1/me/recent/played';
  const { data } = await axios.get(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  const items = provider === 'spotify' ? data.items : data.data;
  return items.map((item: any) => ({
    id: provider === 'spotify' ? item.track.id : item.id,
    name: item.track?.name || item.attributes?.name,
    artist: item.track?.artists?.[0]?.name || item.attributes?.artistName,
    playedAt: item.played_at || item.attributes?.playParams?.timestamp,
    imageUrl: item.track?.album?.images?.[0]?.url || item.attributes?.artwork?.url.replace('{w}x{h}', '1000x1000'),
    trackUrl: provider === 'spotify'
      ? item.track?.external_urls?.spotify
      : item.attributes?.url,
  }));
}

/**
 * Fetches the user’s currently playing track.
 */
export async function fetchCurrentTrack(
  accessToken: string
): Promise<Track | null> {
  try {
    const { data, status } = await axios.get(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (status !== 200 || !data || !data.item) return null;
    const item = data.item;
    return {
      id: item.id,
      name: item.name,
      artist: item.artists[0]?.name,
      playedAt: new Date(data.timestamp).toISOString(),
      imageUrl: item.album?.images?.[0]?.url ?? '',
      trackUrl: item.external_urls?.spotify ?? '',
    };
  } catch (err: any) {
    if (err.response?.status === 204) return null;
    console.error('Error fetching current track:', err);
    return null;
  }
}

export async function checkFriendPlaybackStatus(
  friend: {
    userId: string;
    linkedAccount: string;
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
    spotifyTokenExpiration: number;
    appleMusicAccessToken: string;
  }
): Promise<PlaybackStatus | null> {
  if (friend.linkedAccount !== 'spotify' && friend.linkedAccount !== 'apple music') {
    console.log('No linked account; polling disabled.');
    return null;
  }
  const provider = friend.linkedAccount as 'spotify' | 'apple music';
  const accessToken = provider === 'spotify'
    ? await ensureFreshSpotifyToken(friend)
    : await AsyncStorage.getItem('appleAccessToken');
  if (!accessToken) throw new Error('No access token found');

  const endpoint = provider === 'spotify'
    ? 'https://api.spotify.com/v1/me/player/currently-playing'
    : 'https://api.music.apple.com/v1/me/now-playing';

  const resp = await axios.get(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  const isListening = resp.status === 200 && (
    provider === 'spotify'
      ? resp.data.is_playing === true
      : Array.isArray(resp.data.data) && resp.data.data.length > 0
  );
  return { provider, accessToken, isListening };
}

export async function fetchFriendRecentTracks(
  friend: {
    userId: string;
    linkedAccount: string;
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
    spotifyTokenExpiration: number;
    appleMusicAccessToken: string;
  }
): Promise<Track[]> {
  // Spotify path
  if (friend.linkedAccount === "spotify") {
    let token = friend.spotifyAccessToken;
    // refresh if expired
    const provider = friend.linkedAccount as 'spotify' | 'apple music';
    const accessToken = provider === 'spotify'
      ? await ensureFreshSpotifyToken(friend)
      : await AsyncStorage.getItem('appleAccessToken');
    if (!accessToken) throw new Error('No access token found');
    
    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/player/recently-played",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.items.map((it: any) => ({
      name: it.track.name,
      artist: it.track.artists[0]?.name,
      playedAt: it.played_at,
      imageUrl: it.track.album.images[0]?.url,
      trackUrl: it.track.external_urls.spotify,
    }));
  }

  // Apple Music
  if (friend.linkedAccount === "apple music") {
    const token = friend.appleMusicAccessToken;
    const { data } = await axios.get(
      "https://api.music.apple.com/v1/me/recent/played",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.data.map((it: any) => ({
      name: it.attributes.name,
      artist: it.attributes.artistName,
      playedAt: it.attributes.date,
      imageUrl: it.attributes.artwork.url.replace("{w}x{h}", "1000x1000"),
      trackUrl: it.attributes.url,
    }));
  }

  return [];
}

export async function fetchFriendCurrentTrack(
  friend: {
    linkedAccount: string;
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
    spotifyTokenExpiration: number;
    appleMusicAccessToken: string;
  }
): Promise<Track | null> {
  try {
    const { data, status } = await axios.get(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${friend.spotifyAccessToken}` } }
    );
    if (status !== 200 || !data || !data.item) return null;
    const item = data.item;
    return {
      id: item.id,
      name: item.name,
      artist: item.artists[0]?.name,
      playedAt: new Date(data.timestamp).toISOString(),
      imageUrl: item.album?.images?.[0]?.url ?? '',
      trackUrl: item.external_urls?.spotify ?? '',
    };
  } catch (err: any) {
    if (err.response?.status === 204) return null;
    console.error('Error fetching current track:', err);
    return null;
  }
}
