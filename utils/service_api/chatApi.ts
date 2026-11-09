// api/chatAxios.ts
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import { router } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";

export interface RecentChat {
  chatId: string;
  isGroup: boolean;
  admin?: string;
  title: string;
  chatImg: string;
  lastMessage: { 
    messageId?: string;
    senderName: string; 
    content: string; 
    senderId: string; 
    timestamp: number;
    type?: string;
  };
  timestamp?: number;
  unreadCount: number;
  removeInteraction?: () => void;
  handleOpenSwipeable?: (ref: Swipeable | null) => void;
  router?: typeof router; 
}

/*export interface ChatMessage {
  chatId: string;
  messageId: string;
  senderId: string;
  senderName: string; 
  content: string;
  timestamp: number;
  type: string;
}*/

export interface ChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderImg?: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'reaction';
  timestamp: number;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  lastKey?: { chatId: string; timestamp: number } | null;
}

export interface CreateGroupResponse {
  chatId: string;
}

// Base URL of your REST API
const API_BASE =
  "https://ljlpqx2kbk.execute-api.us-east-1.amazonaws.com/dev";

// Helper: get Authorization header with Cognito ID token
async function getAuthHeader(): Promise<{ Authorization: string }> {
  const session = await fetchAuthSession({ forceRefresh: true });
  const idToken = session.tokens?.idToken;
  if (!idToken) {
    throw new Error("Could not retrieve ID token");
  }
  return { Authorization: `Bearer ${idToken}` };
}

/**
 * Fetch the list of recent chats.
 */
export async function fetchRecentChats(): Promise<RecentChat[]> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/recentChats`;
  const resp = await axios.get<{ enriched: RecentChat[] }>(url, { headers });
  return resp.data.enriched;
}

/**
 * Fetch paginated chat history for a given chatId.
 */
export async function fetchChatHistory(
  chatId: string,
  limit = 20,
  lastKey?: { chatId: string; timestamp: number }
): Promise<ChatHistoryResponse> {
  const headers = await getAuthHeader();
  const params: Record<string, any> = { chatId, limit };
  if (lastKey) {
    params.lastKeyChatId = lastKey.chatId;
    params.lastKeyTimestamp = lastKey.timestamp;
  }
  const url = `${API_BASE}/chatHistory`;
  const resp = await axios.get<ChatMessage[]>(url, {
    headers,
    params,
  });

  // Ensure `lastKey` is always returned
  const messages = resp.data;
  const lastKeyCalculated =
    messages.length === limit
      ? { chatId, timestamp: messages[messages.length - 1].timestamp }
      : null;

  return {
    messages,
    lastKey: lastKeyCalculated,
  };
}

/**
 * Look up an existing 1‑on‑1 chat by friendId.
 * Returns { chatId } if found, or null.
 */
export async function getChatByParticipant(
  friendId: string
): Promise<{ chatId: string } | null> {
  try {
    const headers = await getAuthHeader();
    const url = `${API_BASE}/getChatByParticipant`;
    const resp = await axios.get<{ chatId: string } | null>(url, {
      headers,
      params: { participant: friendId },
    });
    return resp.data;
  } catch (error) {
    console.error("Error in getChatByParticipant:", error);
    return null; // Return null if an error occurs
  }
}

/**
 * Create a new 1‑on‑1 chat with friendId (and current user).
 * Returns { chatId } of the newly created chat.
 */
export async function createChat(
  friendId: string
): Promise<{ chatId: string } | null> {
  try {
    const headers = await getAuthHeader();
    const url = `${API_BASE}/createChat`;
    const resp = await axios.post<{ chatId: string }>(
      url,
      { participant: friendId },
      { headers }
    );
    return resp.data;
  } catch (error) {
    console.error("Error in createChat:", error);
    return null; // Return null if an error occurs
  }
}

/**
 * Create a new group chat.
 *
 * @param groupName     The display name of the group.
 * @param participants  Array of user‑IDs to include in the group.
 * @param groupImage    Optional: S3 URL for the group's avatar image (or empty string).
 * @returns             { chatId: string } of the newly created group.
 */
export async function createGroup(
  groupName: string,
  participants: string[],
  groupImage: string = ""
): Promise<CreateGroupResponse> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/createGroup`;
  const body = { groupName, participants, groupImage };
  const resp = await axios.post<CreateGroupResponse>(url, body, { headers });
  return resp.data;
}

/**
 * Leave a group chat.
 *
 * @param chatId   The ID of the group chat to leave.
 */
export async function leaveGroup(chatId: string): Promise<void> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/leaveGroup`;
  const body = { chatId };
  await axios.post(url, body, { headers });
}

/**
 * Add members to an existing group chat.
 *
 * @param chatId       The ID of the group chat.
 * @param newMembers   Array of user-IDs to add to the group.
 */
export async function addGroupMembers(
  chatId: string,
  newMembers: string[]
): Promise<void> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/addGroupMembers`;
  const body = { chatId, newMembers };
  await axios.post(url, body, { headers });
}

/**
 * Delete a one‑on‑one or group chat and all its messages.
 */
export async function deleteChat(chatId: string): Promise<void> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/deleteChat`;
  await axios.post(url, { chatId }, { headers });
}

/**
 * Mark all messages in a chat as read for the current user.
 *
 * @param chatId   The ID of the chat to mark as read.
 */
export async function markRead(chatId: string): Promise<void> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/markRead`;
  await axios.post(url, { chatId }, { headers });
}

export async function mark_Read(chatId: string): Promise<void> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/mark_Read`;
  await axios.post(url, { chatId }, { headers });
}


/**
 * Get the timestamp of the last message the user read in a chat
 */
export async function getLastReadTimestamp(chatId: string): Promise<number | null> {
  const headers = await getAuthHeader();
  const url = `${API_BASE}/getLastRead`;
  try {
    const resp = await axios.get<{ lastReadTimestamp: number | null }>(url, {
      headers,
      params: { chatId },
    });
    return resp.data.lastReadTimestamp;
  } catch (error) {
    console.error("Error getting last read timestamp:", error);
    return null;
  }
}

/**
 * Fetch chat history with smart loading strategy
 * - If user has unread messages, load from last read point
 * - Otherwise, load recent messages normally
 */
export async function fetchChatHistoryWithUnread(
  chatId: string,
  limit = 20,
  lastKey?: { chatId: string; timestamp: number }
): Promise<ChatHistoryResponse & { hasUnread: boolean; unreadCount: number }> {
  const headers = await getAuthHeader();
  
  // First, check if there are unread messages
  const lastReadTimestamp = await getLastReadTimestamp(chatId);
  
  const params: Record<string, any> = { 
    chatId, 
    limit,
    includeUnreadInfo: true
  };
  
  if (lastKey) {
    params.lastKeyChatId = lastKey.chatId;
    params.lastKeyTimestamp = lastKey.timestamp;
  } else if (lastReadTimestamp) {
    // On initial load, if there are unread messages, start from last read
    params.fromTimestamp = lastReadTimestamp;
  }
  
  const url = `${API_BASE}/chatHistoryWithUnread`;
  const resp = await axios.get<{
    messages: ChatMessage[];
    hasUnread: boolean;
    unreadCount: number;
    lastKey?: { chatId: string; timestamp: number } | null;
  }>(url, {
    headers,
    params,
  });

  return {
    messages: resp.data.messages,
    lastKey: resp.data.lastKey,
    hasUnread: resp.data.hasUnread,
    unreadCount: resp.data.unreadCount,
  };
}