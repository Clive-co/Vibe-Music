import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useRouter, router, } from 'expo-router';
//import { ExpoRouter } from 'expo-router/types/expo-router';

export interface InteractionsProps {
    id: string;
    name: string;
    date: string;
    img: string;
    msg: string;
    read: boolean;
    unreadCount: number;
    removeInteraction: () => void;
  handleOpenSwipeable: (ref: Swipeable | null) => void;
  router: typeof router; 
  }

  export type Message = {
    id: String;
    content: string;
    createdAt: string;
    user: InteractionsProps;
  }

  export type ChatRoom = {
    id: String;
    users: InteractionsProps[];
    lastMessage: Message;
  }