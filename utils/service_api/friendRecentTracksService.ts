import axios from 'axios';
import { updateFriend } from '@/utils/service_api/friendshipServiceApi';
import type { Friend } from './friendshipServiceApi';

export interface Track {
  id: string;
  imageUrl: string;
  url: string;
  artist: string;
  trackName: string;
  friendId: string;
  username: string | null;
  profileImg: string | null;
  linkedAccount: string | null;
  playedAt: string;
}

export interface PlaybackStatus {
  isListening: boolean;
}

/**
 * Refreshes a friend's Spotify access token when expired.
 */
export async function refreshSpotifyToken(friend: Friend): Promise<void> {
  if (!friend.spotifyRefreshToken) return;
  try {
    const resp = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: friend.spotifyRefreshToken,
        client_id:     process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
        client_secret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET!,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const newToken  = resp.data.access_token;
    const newExpiry = Date.now() + resp.data.expires_in * 1000;

    // 1) write back to your DB
    await updateFriend(friend.friendId, {
      spotifyAccessToken: newToken,
      spotifyTokenExpiration: newExpiry,
    });

    // 2) also update the in‐memory object
    friend.spotifyAccessToken     = newToken;
    friend.spotifyTokenExpiration = newExpiry.toString(); // or number
  } catch (err) {
    console.error('Error refreshing Spotify token:', err);
  }
}

/**
 * Fetches recent Spotify tracks for a friend (up to 3 items).
 */
export async function fetchSpotifyRecentTracks(friend: Friend, totalFriends: number): Promise<Track[]> {
  if (!friend.spotifyAccessToken) return [];
  try {
    const { data } = await axios.get(
      'https://api.spotify.com/v1/me/player/recently-played',
      { headers: { Authorization: `Bearer ${friend.spotifyAccessToken}` } }
    );

    // Determine the slice value dynamically
    const sliceValue = totalFriends > 5 ? 2 : 5;

    // Use a Map to store the most recent track for each unique track ID
    const trackMap = new Map<string, Track>();

    data.items.forEach((item: any) => {
      const trackId = item.track.id;
      const playedAt = item.played_at;

      // Create the track object
      const track: Track = {
        id: trackId,
        imageUrl: item.track.album.images[0].url,
        url: item.track.external_urls.spotify,
        artist: item.track.artists[0].name,
        trackName: item.track.name,
        friendId: friend.friendId,
        username: friend.username,
        profileImg: friend.profileImg,
        linkedAccount: friend.linkedAccount,
        playedAt,
      };

      // If the track is already in the Map, compare timestamps and keep the most recent one
      if (!trackMap.has(trackId) || new Date(playedAt).getTime() > new Date(trackMap.get(trackId)!.playedAt).getTime()) {
        trackMap.set(trackId, track);
      }
    });

    // Convert the Map values to an array and return the most recent tracks (up to sliceValue)
    return Array.from(trackMap.values()).slice(0, sliceValue);
  } catch (err) {
    console.error('Error fetching Spotify tracks:', err.response?.data, err.response?.status);
    return [];
  }
}

/**
 * Fetches recent Apple Music tracks for a friend (up to 3 items).
 */
export async function fetchAppleMusicRecentTracks(friend: Friend, totalFriends: number): Promise<Track[]> {
  if (!friend.appleMusicAccessToken) return [];
  try {
    const { data } = await axios.get(
      'https://api.music.apple.com/v1/me/recent/played',
      { headers: { Authorization: `Bearer ${friend.appleMusicAccessToken}` } }
    );

    // Determine the slice value dynamically
    const sliceValue = totalFriends > 5 ? 2 : 5;

    return data.data.slice(0, sliceValue).map((item: any) => ({
      id: item.id,
      imageUrl: item.attributes.artwork.url,
      url: item.attributes.url,
      artist: item.attributes.artistName,
      trackName: item.attributes.name,
      friendId: friend.friendId,
      username: friend.username,
      profileImg: friend.profileImg,
      linkedAccount: friend.linkedAccount,
      playedAt: item.attributes.playedAt,
    }));
  } catch (err) {
    console.error('Error fetching Apple Music tracks:', err);
    return [];
  }
}

/**
 * Consolidates fetching recent tracks from all friends, including token refresh, and returns sorted array.
 */
export async function fetchRecentTracks(friends: Friend[]): Promise<Track[]> {
  const all: Track[] = [];
  const totalFriends = friends.length; // Calculate the total number of friends

  for (const f of friends) {
    try {
      if (f.linkedAccount === 'spotify') {
        // Silently refresh if needed
        if (f.spotifyTokenExpiration &&
            new Date(f.spotifyTokenExpiration) < new Date()) {
          await refreshSpotifyToken(f);
        }
        // Now use the up‑to‑date token on `f`
        const spotifyTracks = await fetchSpotifyRecentTracks(f, totalFriends);
        all.push(...spotifyTracks);

      } else if (f.linkedAccount === 'apple music') {
        const appleTracks = await fetchAppleMusicRecentTracks(f, totalFriends);
        all.push(...appleTracks);
      }
    } catch (err) {
      // Log and skip this friend
      console.warn(`⚠️ Skipping ${f.linkedAccount} friend ${f.friendId}:`, err);
      continue;
    }
  }
  // Newest first
  return all.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
}

/**
 * Checks whether *this friend* is currently playing something on Spotify or Apple Music.
 * If Spotify returns 401/403, we treat them as “not listening” (free-tier).
 */
export async function checkFriendPlaybackStatus(
  friend: Friend
): Promise<PlaybackStatus | null> {
  if (friend.linkedAccount === 'spotify' && friend.spotifyAccessToken) {
    try {
      const resp = await axios.get(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: { Authorization: `Bearer ${friend.spotifyAccessToken}` }
        }
      );
      return { isListening: !!resp.data.is_playing };
    } catch (err: any) {
      if ([401, 403].includes(err.response?.status)) {
        console.warn(`Friend ${friend.username} an error occured skipping playback check.`);
        return { isListening: false };
      }
      console.error(`Error checking Spotify playback for ${friend.username}:`, err);
      return null;
    }
  }

  if (friend.linkedAccount === 'apple music' && friend.appleMusicAccessToken) {
    try {
      const resp = await axios.get(
        'https://api.music.apple.com/v1/me/player',
        {
          headers: { Authorization: `Bearer ${friend.appleMusicAccessToken}` }
        }
      );
      return { isListening: Array.isArray(resp.data.data) && resp.data.data.length > 0 };
    } catch (err) {
      console.error(`Error checking Apple playback for ${friend.username}:`, err);
      return null;
    }
  }

  return null;
}