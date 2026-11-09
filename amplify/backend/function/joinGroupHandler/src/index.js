// addGroupMembers.js
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
 * Lambda handler for POST /addGroupMembers
 * Body expects JSON: { chatId: string, newMembers: string[] }
 * Requires Cognito User-Pool authorizer, so:
 *   event.requestContext.authorizer.jwt.claims.sub is the caller’s userId.
 */
export const handler = async (event) => {
  try {
    // 1. Auth: extract userId from Cognito claims
    const authorizer = event.requestContext?.authorizer;
    const userId =
      authorizer?.jwt?.claims?.sub ||
      authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // 2. Parse and validate body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON body" }),
      };
    }
    const { chatId, newMembers } = body;
    if (
      typeof chatId !== "string" ||
      !Array.isArray(newMembers) ||
      newMembers.some((m) => typeof m !== "string")
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Request must include string chatId and string[] newMembers",
        }),
      };
    }

    // 3. Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db("vibeDB");
    const chats = db.collection("chats");

    // 4. Update: add each new member if not already in participants
    const result = await chats.updateOne(
      { chatId, isGroup: true },
      {
        // $addToSet ensures no duplicates
        $addToSet: { participants: { $each: newMembers } },
        // optional: record who added and when
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Group chat not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Members added successfully" }),
    };
  } catch (err) {
    console.error("addGroupMembers error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
