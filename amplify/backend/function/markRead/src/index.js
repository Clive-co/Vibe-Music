// markRead.js
const { MongoClient } = require("mongodb");

let cached = null;
async function connect() {
  if (cached) return cached;
  const c = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await c.connect();
  cached = c;
  return c;
}

exports.handler = async (event) => {
  // 1. Auth: get the userId from Cognito authorizer claims
  const userId =
    event.requestContext.authorizer?.jwt?.claims?.sub ||
    event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // 2. Parse chatId from the JSON body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  const { chatId } = body;
  if (!chatId) {
    return { statusCode: 400, body: "Missing chatId" };
  }

  // 3. Zero out this user's unreadCounts for that chat
  let client;
  try {
    client = await connect();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return { statusCode: 500, body: "Database connection failed" };
  }
  const chats = client.db("vibeDB").collection("chats");
  try {
    await chats.updateOne(
      { chatId },
      { $set: { [`unreadCounts.${userId}`]: 0 } }
    );
  } catch (err) {
    console.error("Error updating unreadCounts:", err);
    return { statusCode: 500, body: "Failed to mark as read" };
  }

  // 4. Success
  return { statusCode: 200, body: "OK" };
};
