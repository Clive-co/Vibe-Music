const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "vibeDB";
const READ_RECEIPTS_COLL = "readReceipts";

let cachedClient = null;

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
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const qs = event.queryStringParameters || {};
    const chatId = qs.chatId;
    if (!chatId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing chatId" }),
      };
    }

    const db = await getDb();
    const readReceiptsColl = db.collection(READ_RECEIPTS_COLL);

    const readReceipt = await readReceiptsColl.findOne({
      userId: userId,
      chatId: chatId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        lastReadTimestamp: readReceipt?.lastReadTimestamp || null
      }),
    };
  } catch (err) {
    console.error("Error getting last read timestamp:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get last read timestamp" }),
    };
  }
};