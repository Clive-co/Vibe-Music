// leaveGroup.js
import { MongoClient } from "mongodb";

// Cache the MongoDB client across invocations
let cachedClient = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * Lambda handler for POST /leaveGroup
 * Body expects JSON: { chatId: string }
 * Requires Cognito User-Pool authorizer on the route so that
 * event.requestContext.authorizer.jwt.claims.sub is populated.
 */
export const handler = async (event) => {
  try {
    // 1. Auth: get userId from Cognito claims
    const authorizer = event.requestContext?.authorizer;
    const userId =
      authorizer?.jwt?.claims?.sub ||
      authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    // 2. Parse and validate body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON" }) };
    }
    const { chatId } = body;
    if (typeof chatId !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing or invalid chatId" }),
      };
    }

    // 3. Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("vibeDB");
    const chats = db.collection("chats");

    // 4. Remove userId from participants
    const result = await chats.updateOne(
      { chatId, isGroup: true },
      {
        $pull: { participants: userId },
        $unset: { [`unreadCounts.${userId}`]: "" } // optional: clear unreadCounts entry
      }
    );

    if (result.matchedCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: "Group not found" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Left group successfully" }),
    };
  } catch (err) {
    console.error("leaveGroup error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
