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

export interface FriendPlaybackStatus {
  isListening: boolean;
  accessToken: string;
}

// 1) Refresh Spotify token if expired
async function ensureFreshSpotifyToken(friend: FriendDetails): Promise<string> {
  let token = friend.spotifyAccessToken!;
  const expiry = Number(friend.spotifyTokenExpiration);
  if (Date.now() >= expiry) {
    console.log('Access Token:', friend.spotifyAccessToken);
    console.log('Refreshing token for friend:', friend.userId);
    const resp = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: friend.spotifyRefreshToken!,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    token = resp.data.access_token;
    const newExpiry = Date.now() + resp.data.expires_in * 1000;

    // Persist to backend
    await updateFriend(friend.userId, {
      spotifyAccessToken: token,
      spotifyTokenExpiration: newExpiry,
    });
    friend.spotifyAccessToken = token;
    friend.spotifyTokenExpiration = newExpiry.toString();
  }
  
  const rtoken = await ensureFreshSpotifyToken(friend);
  console.log('Refreshed Token:', rtoken);
  return token;
}

/**
 * Check a friend's playback status (Spotify or Apple).
 */
export async function checkFriendPlaybackStatus(
  friend: FriendDetails
): Promise<FriendPlaybackStatus | null> {
  if (friend.linkedAccount === 'spotify') {
    const token = await ensureFreshSpotifyToken(friend);
    try {
      const { data } = await axios.get(
        'https://api.spotify.com/v1/me/player/currently-playing',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { isListening: data.is_playing === true, accessToken: token };
    } catch (err: any) {
      if ([401, 403].includes(err.response?.status)) {
        return { isListening: false, accessToken: token };
      }
      console.error('Spotify playback check failed:', err);
      return null;
    }
  }

  if (friend.linkedAccount === 'apple music' && friend.appleMusicAccessToken) {
    try {
      const { data } = await axios.get(
        'https://api.music.apple.com/v1/me/now-playing',
        { headers: { Authorization: `Bearer ${friend.appleMusicAccessToken}` } }
      );
      const isListening = Array.isArray(data.data) && data.data.length > 0;
      return { isListening, accessToken: friend.appleMusicAccessToken };
    } catch (err) {
      console.error('Apple Music playback check failed:', err);
      return null;
    }
  }

  return null;
}

/**
 * Fetch a friend's currently playing track.
 */
export async function fetchFriendCurrentTrack(
  friend: FriendDetails
): Promise<Track | null> {
  if (friend.linkedAccount === 'spotify') {
    const token = await ensureFreshSpotifyToken(friend);
    try {
      const { data, status } = await axios.get(
        'https://api.spotify.com/v1/me/player/currently-playing',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (status !== 200 || !data?.item) return null;
      const item = data.item;
      return {
        id: item.id,
        name: item.name,
        artist: item.artists[0]?.name,
        playedAt: new Date(data.timestamp).toISOString(),
        imageUrl: item.album?.images[0]?.url ?? '',
        trackUrl: item.external_urls?.spotify ?? '',
      };
    } catch (err: any) {
      if (err.response?.status === 204) return null;
      console.error('Error fetching Spotify current track:', err);
      return null;
    }
  }

  if (friend.linkedAccount === 'apple music' && friend.appleMusicAccessToken) {
    try {
      const { data } = await axios.get(
        'https://api.music.apple.com/v1/me/now-playing',
        { headers: { Authorization: `Bearer ${friend.appleMusicAccessToken}` } }
      );
      const now = Array.isArray(data.data) && data.data[0];
      if (!now) return null;
      const attr = now.attributes;
      return {
        id: now.id,
        name: attr.name,
        artist: attr.artistName,
        playedAt: attr.date,
        imageUrl: attr.artwork.url.replace('{w}x{h}', '1000x1000'),
        trackUrl: attr.url,
      };
    } catch (err) {
      console.error('Error fetching Apple Music current track:', err);
      return null;
    }
  }

  return null;
}

/**
 * Fetch a friend's recently played tracks.
 */
export async function fetchFriendRecentTracks(
  friend: FriendDetails
): Promise<Track[]> {
  if (friend.linkedAccount === 'spotify') {
    const token = await ensureFreshSpotifyToken(friend);
    console.log('Using Spotify Token:', token);

    try {
      const { data } = await axios.get(
        'https://api.spotify.com/v1/me/player/recently-played',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Recent Tracks API Response:', data);

      if (!data.items || data.items.length === 0) {
        console.log('No recent tracks found for friend.');
        return [];
      }

      return data.items.map((it: any) => ({
        id: it.track.id,
        name: it.track.name,
        artist: it.track.artists[0]?.name,
        playedAt: it.played_at,
        imageUrl: it.track.album.images[0]?.url,
        trackUrl: it.track.external_urls.spotify,
      }));
    } catch (err) {
      console.error('Error fetching Spotify recent tracks:', err);
      return [];
    }
  }

  if (friend.linkedAccount === 'apple music') {
    const token = friend.appleMusicAccessToken!;
    console.log('Using Apple Music Token:', token);

    try {
      const { data } = await axios.get(
        'https://api.music.apple.com/v1/me/recent/played',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Recent Tracks API Response:', data);

      if (!data.data || data.data.length === 0) {
        console.log('No recent tracks found for friend.');
        return [];
      }

      return data.data.map((it: any) => ({
        id: it.id,
        name: it.attributes.name,
        artist: it.attributes.artistName,
        playedAt: it.attributes.date,
        imageUrl: it.attributes.artwork.url.replace('{w}x{h}', '1000x1000'),
        trackUrl: it.attributes.url,
      }));
    } catch (err) {
      console.error('Error fetching Apple Music recent tracks:', err);
      return [];
    }
  }

  return [];
}
