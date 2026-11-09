import { MongoClient } from "mongodb";

// Env var for Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI;
// Atlas database & collection names
const DB_NAME = "vibeDB";
const COLL_NAME = "friends";

// Global cached client across invocations
let cachedClient = null;

/**
 * Connects (or re‑uses) to MongoDB Atlas
 */
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Extract userId from the authorizer JWT claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: no user sub in token" })
    };
  }

  // Parse friendId from request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }
  const { friendId } = body;
  if (!friendId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing friendId in body" })
    };
  }

  const timestamp = new Date().toISOString();

  let session;
  try {
    const db = await getDb();
    const coll = db.collection(COLL_NAME);
    session = cachedClient.startSession();

    // Run both updates in a transaction
    await session.withTransaction(async () => {
      // 1) Update the sender’s “received” record
      await coll.updateOne(
        { userId: friendId, friendId: userId },
        {
          $set: {
            relationshipStatus: "accepted",
            acceptedAt: timestamp,
          },
        },
        { session }
      );

      // 2) Update the receiver’s “sent” record
      await coll.updateOne(
        { userId: userId, friendId: friendId },
        {
          $set: {
            relationshipStatus: "accepted",
            acceptedAt: timestamp,
          },
        },
        { session }
      );
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Friend request accepted successfully" }),
    };
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error accepting friend request",
        details: error.message,
      }),
    };
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
