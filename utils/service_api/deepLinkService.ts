// utils/deepLinkService.ts
import { Linking } from 'react-native';

function encodeTerm(query: string) {
  // 1) URI-encode – turns spaces into %20
  let s = encodeURIComponent(query);
  // 2) Just in case any '+' exist (e.g. from a mis-used URLSearchParams upstream), convert them back to %20
  s = s.replace(/\+/g, '%20');
  return s;
}

/**
 * Try to open Spotify app to search for the given track+artist.
 * Falls back to web search if the app isn't installed.
 */
export async function openSpotifyTrackOrSearch(
  trackName: string,
  artistName: string
) {
  const raw = `${trackName} ${artistName}`;
  const encoded = encodeTerm(raw);
  const appUrl = `spotify:search:${encoded}`;
  const webUrl = `https://open.spotify.com/search/${encoded}`;

  try {
    const supported = await Linking.canOpenURL(appUrl);
    await Linking.openURL(supported ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}

/**
 * Try to open Apple Music app to search for the given track+artist.
 * Falls back to web search if the app isn't installed.
 */
export async function openAppleMusicTrackOrSearch(
  trackName: string,
  artistName: string
) {
  const raw = `${trackName} ${artistName}`;
  const encoded = encodeTerm(raw);
  const appUrl = `music://search?term=${encoded}`;
  const webUrl = `https://music.apple.com/search?term=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(appUrl);
    await Linking.openURL(supported ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
