// createChat.js
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

// Cache the MongoDB client across Lambda invocations
let cachedClient = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI env var");
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * Lambda for POST /chat
 * Creates a new one‑on‑one chat between the current user and friendId.
 *
 * Expects:
 *  - Cognito User‑Pool authorizer on the route,
 *    so event.requestContext.authorizer.jwt.claims.sub is populated.
 *  - JSON body: { participant: string }
 */
exports.handler = async (event) => {
  try {
    // 1. Auth: extract userId
    const authorizer = event.requestContext.authorizer;
    const userId =
      authorizer?.jwt?.claims?.sub ||
      authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // 2. Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON body" }),
      };
    }
    const friendId = body.participant;
    if (!friendId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing participant in body" }),
      };
    }

    // 3. Derive deterministic chatId (e.g. sorted IDs joined by "#")
    const [a, b] = [userId, friendId].sort();
    const hash = crypto.createHash("sha256").update(`${a}${b}`).digest("hex");
    const chatId = hash.slice(0, 16); // Use the first 16 characters of the hash

    // 4. Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("vibeDB");
    const chats = db.collection("chats");

    // 5. Insert new chat document
    const now = new Date().getTime();
    const newChat = {
      chatId,
      isGroup: false,
      participants: [a, b],
      createdAt: now,
      groupName: null,
      groupImage: null,
      lastMessage: {
        content: "new chat", // Default content
        senderId: "default", // Default senderId
        senderName: "default", // Default senderName
        timestamp: now, // Current timestamp
      },
      unreadCounts: { [a]: 0, [b]: 0 },
    };
    await chats.insertOne(newChat);

    // 6. Return the created chatId
    return {
      statusCode: 200,
      body: JSON.stringify({ chatId }),
    };
  } catch (err) {
    console.error("createChat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
