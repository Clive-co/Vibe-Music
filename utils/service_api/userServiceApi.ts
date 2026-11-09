import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

export interface TopArtist {
  artistName: string;
  artistImageUrl: string;
  playCount: number;
}

export interface TopTrack {
  trackName: string;
  artistName: string;
  trackImageUrl: string;
  playCount: number;
}

export interface WeeklyRecap {
  userId: string;
  weekStart: string;
  nextRecapTime: number;
  recapGeneratedAt: number;
  topArtists: TopArtist[]; 
  topTracks: TopTrack[];   
  totalArtistsListened: number;
  totalMinutesListened: number;
  totalTracksListened: number;
}

export interface User {
  id: string; // userId
  username: string;
  email: string;
  phonenumber: string;
  profileImg: string; 
  desc: string;
  linkedAccount: string;
  spotifyAccessToken: string;
  spotifyRefreshToken: string;
  spotifyTokenExpiration: number | string; 
  appleMusicAccessToken: string;
  isPremium: boolean;
  region: string;
  joinedAt: string; 
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

const BASE_URL = "https://ljlpqx2kbk.execute-api.us-east-1.amazonaws.com/dev";

const CACHE_NAME = "weeklyRecap";

// Helper: Compute the previous Monday date in "yyyy-mm-dd" format.
const computePreviousMonday = (): string => {
  const now = new Date();
  const ref = new Date(now);
  ref.setDate(now.getDate() - 7);
  const dayOfWeek = ref.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - diffToMonday);
  return monday.toISOString().split("T")[0];
};

// Helper: Get Authorization header with Cognito ID token
async function getAuthHeader(): Promise<{ Authorization: string }> {
  const session = await fetchAuthSession({ forceRefresh: true });
  const idToken = session.tokens?.idToken;
  if (!idToken) throw new Error("Could not retrieve ID token");
  return { Authorization: `Bearer ${idToken}` };
}

/**
 * Fetches the weekly recap, caching in AsyncStorage until nextRecapTime.
 */
export const fetchWeeklyRecap = async (
  friendId?: string
): Promise<WeeklyRecap | null> => {
  try {
    const weekStart = computePreviousMonday();
    const cacheKey = friendId ? `${CACHE_NAME}-${friendId}` : CACHE_NAME;

    // 1) Check AsyncStorage cache
    const cachedJSON = await AsyncStorage.getItem(cacheKey);
    const cached: WeeklyRecap | null = cachedJSON ? JSON.parse(cachedJSON) : null;
    const now = Date.now();

    // Remove cache if it exists but has no nextRecapTime
    if (cached && !cached.nextRecapTime) {
      await AsyncStorage.removeItem(cacheKey);
    }

    // 2) If no cache or expired, fetch fresh
    if (!cached || cached.nextRecapTime < now) {
      // build URL, include friendId if provided
      let url = `${BASE_URL}/getWeeklyRecap?weekStart=${weekStart}`;
      if (friendId) url += `&friendId=${friendId}`;

      const headers = await getAuthHeader();
      const response = await axios.get<WeeklyRecap>(url, { headers });
      const recap = response.data;

      // Only cache if recap has a nextRecapTime (i.e., it's a real recap)
      if (recap && recap.nextRecapTime) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(recap));
        return recap;
      }

      // If not a real recap, don't cache, just return null or handle as needed
      return null;
    }

    // 3) return cached
    return cached;
  } catch (error) {
    console.error("Error fetching weekly recap:", error);
    return null;
  }
};

/**
 * Retrieves the current user record from the backend.
 */
export async function getUser(): Promise<User> {
  const headers = await getAuthHeader();
  const response = await axios.get<User>(`${BASE_URL}/getUser`, { headers });
  return response.data;
}

/**
 * Updates the user record in the backend. Passes only the fields to be updated.
 * Uses HTTP PATCH so the Lambda can apply a MongoDB $set on these values.
 */
export async function updateUser(
  updates: Record<string, any>
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await axios.patch(`${BASE_URL}/updateUser`, updates, { headers });
    console.log("User updated successfully.");
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error.response) {
      // Handle specific HTTP errors
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      throw new Error(
        error.response.data?.message || "Failed to update user. Please try again."
      );
    } else if (error.request) {
      // Handle no response from server
      console.error("No response received:", error.request);
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Handle other errors
      throw new Error(error.message || "An unknown error occurred.");
    }
  }
}

/**
 * Creates a new user in the backend.
 * @param userData Object containing user details
 */
export async function createUser(userData: {
  id: string;
  username: string;
  email: string;
  phonenumber: string;
  profileImg: string;
  desc: string;
  linkedAccount: string;
  spotifyAccessToken: string;
  spotifyRefreshToken: string;
  spotifyTokenExpiration: string;
  appleMusicAccessToken: string;
  isPremium: boolean;
  region: string;
  timezone: string;
  joinedAt: string;
}): Promise<boolean> {
  try {
    const endpoint = `${BASE_URL}/addUser`;
    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(endpoint, userData, { headers });
    console.log("User created successfully:", response.data);
    return true;
  } catch (error) {
    console.error("Error creating user:", error);
    return false;
  }
}

/**
 * Deletes a user from the backend.
 * @param userId ID of the user to delete
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const endpoint = `${BASE_URL}/deleteUser`;
    const headers = { "Content-Type": "application/json" };
    const body = { id: userId };
    const response = await axios.post(endpoint, body, { headers });
    console.log("User deleted successfully:", response.data);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

/**
 * Requests a pre‐signed upload URL and fileUrl for a given fileName/fileType.
 */
export async function getPreSignedURL(
  fileName: string,
  fileType: string
): Promise<PresignedUrlResponse> {
  // 1) Get the Cognito ID token header
  const headers = await getAuthHeader();

  // 2) POST to your API
  const response = await axios.post<PresignedUrlResponse>(
    `${BASE_URL}/getPreSignedURL`,
    { fileName, fileType },
    { headers }
  );

  // 3) Return the uploadUrl & fileUrl
  return response.data;
}