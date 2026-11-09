// createGroupHandler.js
import { MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";

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
 * Lambda handler for POST /createGroup
 *
 * Body JSON:
 *   {
 *     "groupName": "My Group",
 *     "participants": ["friendId1","friendId2", ...],
 *     "groupImage": "https://s3.amazonaws.com/..."  // optional
 *   }
 *
 * Expects Cognito authorizer on the route so that
 * event.requestContext.authorizer.jwt.claims.sub is set.
 */
export const handler = async (event) => {
  try {
    // 1. Auth: extract current userId
    const auth = event.requestContext.authorizer;
    const userId = auth?.jwt?.claims?.sub || auth?.claims?.sub;
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
    const { groupName, participants: rawParticipants, groupImage } = body;
    if (typeof groupName !== "string" || groupName.trim() === "") {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing or invalid groupName" }) };
    }
    if (!Array.isArray(rawParticipants) || rawParticipants.some(id => typeof id !== "string")) {
      return { statusCode: 400, body: JSON.stringify({ message: "participants must be string[]" }) };
    }

    // Set default group image if none is provided
    const finalGroupImage = groupImage || "https://vibe-group-icons.s3.us-east-1.amazonaws.com/group1.jpg";

    // 3. Build participants list (include creator, dedupe)
    const participantsSet = new Set(rawParticipants);
    participantsSet.add(userId);
    const participants = Array.from(participantsSet);

    // 4. Generate a chatId and timestamps
    const chatId = uuidv4();
    const createdAt = new Date().toISOString();

    // 5. Prepare unreadCounts (all zero)
    const unreadCounts = {};
    participants.forEach(id => { unreadCounts[id] = 0; });

    // 6. Connect to MongoDB and insert
    const client = await connectToDatabase();
    const db = client.db("vibeDB");
    const chats = db.collection("chats");

    const now = new Date().getTime(); // Current timestamp in milliseconds

    await chats.insertOne({
      chatId,
      isGroup: true,
      admin: userId, 
      participants,
      groupName: groupName.trim(),
      groupImage: finalGroupImage,
      createdAt,
      lastMessage: {
        content: `${groupName.trim()} was created`, // Group creation message
        senderId: "default", // Default senderId
        senderName: "default", // Default senderName
        timestamp: now, // Current timestamp
      },
      unreadCounts,
    });

    // 7. Return the new chatId
    return {
      statusCode: 200,
      body: JSON.stringify({ chatId })
    };
  } catch (err) {
    console.error("createGroupHandler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
