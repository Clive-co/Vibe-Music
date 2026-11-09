export interface FriendActivityType {
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