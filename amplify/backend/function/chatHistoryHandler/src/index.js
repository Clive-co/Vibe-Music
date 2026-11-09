// chatHistoryHandler.js
const { MongoClient } = require("mongodb");

// Env var for your Atlas URI
const MONGODB_URI = process.env.MONGODB_URI;

// Atlas DB & collection
const DB_NAME = "vibeDB";
const MESSAGES_COLL = "messages";

// Cached client across invocations
let cachedClient = null;

/** Get (or create) the vibeDB database connection */
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

exports.handler = async (event) => {
  try {
    // 1) Auth: ensure we have a sub claim
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // 2) Parse query parameters
    const qs = event.queryStringParameters || {};
    const chatId = qs.chatId;
    if (!chatId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing chatId" }),
      };
    }
    const limit = qs.limit ? parseInt(qs.limit, 10) : 20;
    const lastKeyTimestamp = qs.lastKeyTimestamp 
      ? Number(qs.lastKeyTimestamp) 
      : undefined;

    // 3) Build Mongo query
    const db = await getDb();
    const coll = db.collection(MESSAGES_COLL);

    const filter = { chatId };
    if (lastKeyTimestamp != null) {
      // For pagination: get messages newer than the last page's last timestamp
      filter.timestamp = { $gt: lastKeyTimestamp };
    }

    // 4) Get the newest messages first, then reverse to oldest→newest
    const docs = await coll
      .find(filter)
      .sort({ timestamp: -1 }) // Sort newest first
      .limit(limit)             // Take the newest N messages
      .toArray();

    // 5) Reverse the array to get oldest→newest order
    const sortedDocs = docs.reverse();

    return {
      statusCode: 200,
      body: JSON.stringify(sortedDocs),
    };
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch chat history" }),
    };
  }
};