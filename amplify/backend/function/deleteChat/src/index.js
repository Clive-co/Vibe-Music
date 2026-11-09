// deleteChat.js
const { MongoClient } = require("mongodb");

// Cached MongoClient across invocations
let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Lambda handler to delete or leave a chat.
 * Expects JSON body: { chatId: string }
 * Uses Cognito authorizer on API Gateway.
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  // 1) Auth
  const userSub = event.requestContext?.authorizer?.claims?.sub;
  if (!userSub) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // 2) Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  const { chatId } = body;
  if (!chatId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required field: chatId" }) };
  }

  try {
    const db = await getDb();
    const chatsColl = db.collection("chats");
    const msgsColl  = db.collection("messages");

    // 3) Verify chat exists & participant
    const chat = await chatsColl.findOne({ chatId });
    if (!chat) {
      return { statusCode: 404, body: JSON.stringify({ error: "Chat not found" }) };
    }
    if (!Array.isArray(chat.participants) || !chat.participants.includes(userSub)) {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    // 4a) If one‑on‑one, delete chat + its messages for everyone
    if (!chat.isGroup) {
      await chatsColl.deleteOne({ chatId });
      await msgsColl.deleteMany({ chatId });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Chat deleted successfully." }),
      };
    }

    // 4b) If group chat, just remove this user from participants & unreadCounts
    await chatsColl.updateOne(
      { chatId },
      {
        $pull: { participants: userSub },
        $unset: { [`unreadCounts.${userSub}`]: "" }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Left group chat successfully." }),
    };
  } catch (err) {
    console.error("deleteChat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
