import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Interface for a user's league
export interface League {
  leagueId: string;
  name: string;
  rank: string;
}

// Interface for leaderboard items
export interface LeaderboardItem {
  leagueId: string;
  rank: number;
  username: string;
  userId: string;
  profileImg: string;
  cumulativeMinutes: number;
  lastUpdated: string;
}

export interface UserRankResponse {
  leagueId: string;
  userId: string;
  username?: string;
  profileImg?: string;
  cumulativeMinutes?: number;
  rank: number;
  lastUpdated?: string;
}

// Interface for friends eligible to join a league
export interface LeagueFriend {
  friendId: string;
  username: string | null;
  profileImg: string | null;
  desc: string | null;
}

const BASE_URL = 'https://ljlpqx2kbk.execute-api.us-east-1.amazonaws.com/dev';

// Helper: get Cognito ID token for Authorization header
async function getAuthHeader(): Promise<{ Authorization: string }> {
  const session = await fetchAuthSession({ forceRefresh: true });
  const idToken = session.tokens?.idToken;
  if (!idToken) throw new Error('Could not retrieve ID token');
  return { Authorization: `Bearer ${idToken}` };
}

/**
 * Fetches leagues for the authenticated user.
 */
export async function fetchUserLeagues(): Promise<League[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<League[]>(`${BASE_URL}/getUserLeagues`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching user leagues:', error);
    return [];
  }
}

/**
 * Fetches the leaderboard for a given league.
 */
export async function fetchLeagueLeaderboard(
  leagueId: string
): Promise<LeaderboardItem[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<LeaderboardItem[]>(
      `${BASE_URL}/getLeagueLeaderboard`,
      { params: { leagueId }, headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching league leaderboard:', error);
    return [];
  }
}

/**
 * Fetches non-member friends for a given league.
 */
export async function fetchNonMemberFriends(
  leagueId: string
): Promise<LeagueFriend[]> {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get<LeagueFriend[]>(
      `${BASE_URL}/getFriendsForLeague`,
      { params: { leagueId }, headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching non-member friends:', error);
    return [];
  }
}

/**
 * Creates a new league.
 * @param name Name of the league
 * @param duration Duration of the league in months
 */
export async function createLeagues(
    name: string,
    duration: number
  ): Promise<{ league: any }> {
    try {
      const headers = await getAuthHeader();
      const response = await axios.post(
        `${BASE_URL}/createLeague`,
        { name, duration },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating league:', error);
      throw new Error(error.response?.data?.message || 'Failed to create league.');
    }
  }
  
  /**
   * Adds members to a league.
   * @param leagueId ID of the league
   * @param friendIds Array of friend IDs to add to the league
   */
  export async function addLeagueMembers(
    leagueId: string,
    friendIds: string[]
  ): Promise<void> {
    try {
      const headers = await getAuthHeader();
      await axios.post(
        `${BASE_URL}/addLeagueMembers`,
        { leagueId, friendIds },
        { headers }
      );
    } catch (error: any) {
      console.error('Error adding league members:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to add league members.'
      );
    }
  }

  export async function fetchUserRank(
    leagueId: string
  ): Promise<UserRankResponse | null> {
    try {
      const headers = await getAuthHeader();
      const resp = await axios.get<UserRankResponse>(
        `${BASE_URL}/getUserRank`,
        { params: { leagueId }, headers }
      );
      return resp.data;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }
