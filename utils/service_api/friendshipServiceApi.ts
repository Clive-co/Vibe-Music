import axios, { CancelToken } from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

export interface FriendSuggestion {
  userId: string;
  username: string;
  profileImg: string;
  source: string; //from contacts
}

export interface Friend {
    friendId: string;
    username: string | null;
    profileImg: string | null;
    desc: string | null;
    linkedAccount: string | null;
    spotifyAccessToken?: string | null;
    spotifyRefreshToken?: string | null;
    spotifyTokenExpiration?: string | null;
    appleMusicAccessToken?: string | null;
}

export interface FriendOfFriend {
  userId: string
  username: string | null
  profileImg: string | null
  desc: string | null
  friendshipStatus: "accepted" | "pending" | "none"
}

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

export interface SearchUser {
  userId: string;
  username: string;
  profileImg: string;
  friendshipStatus: string | null; // "friends", "pending", null
}

export interface FriendRequest {
  friendId: string;
  username: string | null;
  profileImg: string | null;
  desc: string | null;
}

export interface FriendDetails {
  userId: string;
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

const BASE_URL = "https://ljlpqx2kbk.execute-api.us-east-1.amazonaws.com/dev";

// Helper: Get Authorization header with Cognito ID token
async function getAuthHeader(): Promise<{ Authorization: string }> {
    const session = await fetchAuthSession({ forceRefresh: true });
    const idToken = session.tokens?.idToken;
    if (!idToken) throw new Error("Could not retrieve ID token");
    return { Authorization: `Bearer ${idToken}` };
}

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

/**
 * Fetches the authenticated user's friends list.
 */
export async function fetchFriends(): Promise<Friend[]> {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get<Friend[]>(`${BASE_URL}/friends`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
}

/**
 * Fetches the authenticated user's friends list.
 */
export async function fetchHomeFriends(): Promise<Friend[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<Friend[]>(`${BASE_URL}/getHomeFriends`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
}

/**
 * Fetches incoming or outgoing friend requests.
 */
export async function fetchRequests(
  requestType: 'received' | 'sent'
): Promise<FriendRequest[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<{ requests: FriendRequest[] }>(
      `${BASE_URL}/getRequests`,
      { params: { requestType }, headers }
    );
    return response.data.requests;
  } catch (error) {
    console.error(`Error fetching ${requestType} requests:`, error);
    return [];
  }
}

/**
 * Accepts a friend request by friendId.
 */
export async function acceptFriend(
  friendId: string
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await axios.post(
      `${BASE_URL}/friends/accept`,
      { friendId },
      { headers }
    );
  } catch (error) {
    console.error('Error accepting friend request:', error);
  }
}

/**
 * Searches users by query string. Supports cancellation via CancelToken.
 */
export async function searchUsers(
  query: string,
  cancelToken?: CancelToken
): Promise<SearchUser[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<SearchUser[]>(
      `${BASE_URL}/users/search`,
      { params: { q: query }, headers, cancelToken }
    );
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) return [];
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Sends a friend request to another user.
 */
export async function requestFriend(
  friendId: string
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await axios.post(
      `${BASE_URL}/friends/request`,
      { friendId },
      { headers }
    );
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
}

/**
 * Removes a friend for the authenticated user.
 */
export async function unfriend(
  friendId: string
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await axios.post(
      `${BASE_URL}/removeFriend`,
      { friendId },
      { headers }
    );
  } catch (error) {
    console.error('Error removing friend:', error);
  }
}

/**
 * Update *a friend's* profile data.
 * Must pass `friendId` plus any subset of user fields.
 */
export async function updateFriend(
  friendId: string,
  updates: Record<string, any>
): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await axios.patch(
      `${BASE_URL}/updateFriend`,
      { friendId, ...updates },
      { headers }
    );
    console.log("Friend updated successfully.");
  } catch (error: any) {
    console.error("Error updating friend:", error);

    if (error.response) {
      // Handle specific HTTP errors
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      throw new Error(
        error.response.data?.message || "Failed to update friend. Please try again."
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
 * Fetches details for a given friendId (authenticated user must be logged in)
 */
export async function fetchFriendDetails(friendId: string): Promise<FriendDetails | null> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<FriendDetails>(
      `${BASE_URL}/getFriendDetails`,
      { params: { friendId }, headers }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching friend details:", error);

    if (error.response) {
      // Handle specific HTTP errors
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      throw new Error(
        error.response.data?.message || "Failed to fetch friend details. Please try again."
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
 * Fetches the weekly recap for a user or friend (no caching).
 */
export const fetchFriendWeeklyRecap = async (
  friendId?: string
): Promise<WeeklyRecap | null> => {
  try {
    const weekStart = computePreviousMonday();
    // build URL, include friendId if provided
    let url = `${BASE_URL}/getWeeklyRecap?weekStart=${weekStart}`;
    if (friendId) url += `&friendId=${friendId}`;

    const headers = await getAuthHeader();
    const response = await axios.get<WeeklyRecap>(url, { headers });
    const recap = response.data;

    // Just return the recap, no caching
    return recap;
  } catch (error) {
    console.error("Error fetching weekly recap:", error);
    return null;
  }
};

export async function fetchFriendsOfFriend(
  friendId: string
): Promise<FriendOfFriend[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<FriendOfFriend[]>(
      `${BASE_URL}/getFriendsOfFriend`,
      { params: { friendId }, headers }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching friends of friend:", error);

    if (error.response) {
      // Handle specific HTTP errors
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      throw new Error(
        error.response.data?.message || "Failed to fetch friends of friend. Please try again."
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
 * Send a (possibly large) array of E.164 phone‐numbers
 * to the server, get back up to 5 random matching users.
 */
export async function fetchFriendSuggestions(
  phoneNumbers: string[]
): Promise<FriendSuggestion[]> {
  if (phoneNumbers.length === 0) return [];

  // we only need a maximum of 5, server should also cap it
  // but let's be extra cautious on the client
  const body = { phoneNumbers: phoneNumbers.slice(0, 100) };
  // (we send at most 100 numbers just to keep the payload reasonable)

  const headers = await getAuthHeader();
  try {
    const resp = await axios.post<FriendSuggestion[]>(
      `${BASE_URL}/suggestFriendsByContact`,
      body,
      { headers }
    );
    return resp.data;
  } catch (err: any) {
    console.error("Error fetching friend suggestions:", err);
    return [];
  }
}
