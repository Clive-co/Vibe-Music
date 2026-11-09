const { MongoClient } = require("mongodb");

// This Lambda function fetches recent chats for the authenticated user
let cachedClient = null;
let cachedDb     = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}


/**
 * Lambda handler to fetch recent chats for the authenticated user
 */
exports.handler = async (event) => {
  try {
    // 1) Extract userId from Cognito authorizer
    const userId =
      event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // 2) Connect to MongoDB
    const db = await getDb();
    const chatsColl = db.collection("chats");
    const usersColl = db.collection("user");

    // 3) Fetch chats where this user is a participant
    const chats = await chatsColl
      .find({ participants: userId })
      .project({
        _id: 0,
        chatId:       1,
        isGroup:      1,
        admin:        1,       
        participants: 1,
        groupName:    1,
        groupImage:   1,
        lastMessage:  1,
        unreadCounts: 1,
      })
      .toArray();

    // 4) Enrich chats with title and chatImg
    const enriched = await Promise.all(
      chats.map(async (chat) => {
        let title, chatImg;
        if (chat.isGroup) {
          title   = chat.groupName  || "Unnamed Group";
          chatImg = chat.groupImage || "https://vibe-group-icons.s3.us-east-1.amazonaws.com/group1.jpg";
        } else {
          const otherId = chat.participants.find(id => id !== userId);
          const user    = await usersColl.findOne(
            { userId: otherId },
            { projection: { _id:0, username:1, profileImg:1 } }
          );
          title   = user?.username  || "Unknown";
          chatImg = user?.profileImg || "https://vibe-profile-images.s3.us-east-1.amazonaws.com/profile1.jpg";
        }
        return {
          chatId:      chat.chatId,
          isGroup:     chat.isGroup,
          admin:       chat.admin,                         
          title,
          chatImg,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCounts?.[userId] || 0,
        };
      })
    );

    // 5) Sort: groups first (no lastMessage) then by lastMessage.timestamp desc
    enriched.sort((a, b) => {
      if (!a.lastMessage && b.lastMessage) return -1;
      if (a.lastMessage && !b.lastMessage) return 1;
      const ta = a.lastMessage?.timestamp || 0;
      const tb = b.lastMessage?.timestamp || 0;
      return tb - ta;
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ enriched }),
    };
  } catch (err) {
    console.error("Error in recentChatsHandler:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
};
