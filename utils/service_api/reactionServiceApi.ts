// utils/service_api/reactionServiceApi.ts
import { getCurrentUser } from "aws-amplify/auth";
import { getUser } from "./userServiceApi";
import { getChatByParticipant, createChat } from "./chatApi";

export interface ReactionMessage {
  action: string;
  chatId: string;
  content: string;
  type: 'reaction';
  clientTempId: string;
  trackData: {
    trackName: string;
    artistName: string;
    trackImageUrl: string;
    trackId: string;
  };
  emoji: string;
  reactorUsername: string;
}

export const sendReaction = async (
  friendId: string,
  trackData: {
    trackName: string;
    artistName: string;
    trackImageUrl: string;
    trackId: string;
  },
  emoji: string,
  sendMessageWS: (message: any) => void
): Promise<void> => {
  try {
    // Get current user info
    const authUser = await getCurrentUser();
    const currentUser = await getUser();
    
    if (!authUser || !currentUser) {
      throw new Error('User not authenticated');
    }

    // Get or create chat with the friend
    let chatId: string;
    try {
      const existingChat = await getChatByParticipant(friendId);
      if (existingChat?.chatId) {
        chatId = existingChat.chatId;
      } else {
        const newChat = await createChat(friendId);
        if (!newChat?.chatId) {
          throw new Error('Failed to create chat');
        }
        chatId = newChat.chatId;
      }
    } catch (error) {
      console.error('Error handling chat:', error);
      throw error;
    }

    // Generate temp ID for the message
    const tempId = `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Construct the reaction message
    const reactionContent = `${currentUser.username} reacted to "${trackData.trackName}" by ${trackData.artistName} with ${emoji}`;

    const reactionMessage: ReactionMessage = {
      action: 'sendMessage',
      chatId,
      content: reactionContent,
      type: 'reaction',
      clientTempId: tempId,
      trackData,
      emoji,
      reactorUsername: currentUser.username,
    };

    // Send via WebSocket
    sendMessageWS(reactionMessage);
    
    console.log('Reaction sent:', {
      friendId,
      trackName: trackData.trackName,
      emoji,
      chatId
    });

  } catch (error) {
    console.error('Failed to send reaction:', error);
    throw error;
  }
};