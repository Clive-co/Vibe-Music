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
    const fromTimestamp = qs.fromTimestamp 
      ? Number(qs.fromTimestamp) 
      : undefined;

    const db = await getDb();
    const messagesColl = db.collection(MESSAGES_COLL);
    const readReceiptsColl = db.collection(READ_RECEIPTS_COLL);

    // Get user's last read timestamp for this chat
    const readReceipt = await readReceiptsColl.findOne({
      userId: userId,
      chatId: chatId
    });
    const lastReadTimestamp = readReceipt?.lastReadTimestamp || 0;

    // Count unread messages
    const unreadCount = await messagesColl.countDocuments({
      chatId: chatId,
      timestamp: { $gt: lastReadTimestamp }
    });
    const hasUnread = unreadCount > 0;

    // Build query filter
    const filter = { chatId };
    
    if (lastKeyTimestamp != null) {
      // Pagination: get messages older than the last key (for "load more")
      filter.timestamp = { $lt: lastKeyTimestamp };
    } else if (hasUnread && fromTimestamp) {
      // Load from last read point to show unread messages
      filter.timestamp = { $gte: fromTimestamp };
    }

    // Fetch messages
    let docs;
    if (lastKeyTimestamp != null) {
      // For "load more" - get older messages
      docs = await messagesColl
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      docs = docs.reverse(); // Oldest first
    } else if (hasUnread && unreadCount > limit) {
      // If too many unread messages, get recent ones including unread
      const recentLimit = Math.max(limit, Math.min(unreadCount + 10, 100));
      docs = await messagesColl
        .find({ chatId })
        .sort({ timestamp: -1 })
        .limit(recentLimit)
        .toArray();
      docs = docs.reverse();
    } else {
      // Normal case - get recent messages
      docs = await messagesColl
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      docs = docs.reverse();
    }

    // Calculate lastKey for pagination
    const lastKey = docs.length === limit && lastKeyTimestamp == null
      ? { chatId, timestamp: docs[0]?.timestamp } // Oldest message for "load more"
      : null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        messages: docs,
        hasUnread,
        unreadCount,
        lastKey
      }),
    };
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch chat history" }),
    };
  }
};