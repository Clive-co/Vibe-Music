// getChatByParticipant.js
const { MongoClient } = require("mongodb");

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
 * Lambda for GET /chat?participant={friendId}
 * Finds a one‑on‑one chat between the current user and friendId.
 * 
 * Expects Cognito User‑Pool authorizer on the route so that
 * event.requestContext.authorizer.jwt.claims.sub is populated.
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

    // 2. Parse query parameter
    const friendId = event.queryStringParameters?.participant;
    if (!friendId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing participant query parameter" }),
      };
    }

    // 3. Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("vibeDB");
    const chats = db.collection("chats");

    // 4. Look for an existing one-on-one chat (exactly two participants)
    const existing = await chats.findOne(
      {
        isGroup: false,
        $and: [
          { participants: { $all: [userId, friendId] } },
          { participants: { $size: 2 } }
        ]
      },
      { projection: { chatId: 1, _id: 0 } }
    );

    // 5. Return
    if (existing) {
      return {
        statusCode: 200,
        body: JSON.stringify({ chatId: existing.chatId }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({}),
      };
    }
  } catch (err) {
    console.error("getChatByParticipant error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
