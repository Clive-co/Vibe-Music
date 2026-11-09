const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "vibeDB";
const MESSAGES_COLL = "messages";
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

    const body = JSON.parse(event.body || "{}");
    const { chatId } = body;
    if (!chatId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing chatId" }),
      };
    }

    const db = await getDb();
    const readReceiptsColl = db.collection(READ_RECEIPTS_COLL);
    const messagesColl = db.collection(MESSAGES_COLL);

    // Get the latest message timestamp in this chat
    const latestMessage = await messagesColl
      .findOne({ chatId }, { sort: { timestamp: -1 } });

    if (latestMessage) {
      // Upsert the read receipt
      await readReceiptsColl.updateOne(
        { userId, chatId },
        {
          $set: {
            userId,
            chatId,
            lastReadTimestamp: latestMessage.timestamp,
            updatedAt: Date.now()
          }
        },
        { upsert: true }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Error marking messages as read:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to mark messages as read" }),
    };
  }
};