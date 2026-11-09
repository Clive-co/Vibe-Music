const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

/**
 * Returns a connected MongoDB database instance.
 */
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Lambda handler to retrieve friend requests (sent or received)
 */
exports.handler = async (event) => {
  try {
    // Enforce GET
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Extract requestType (sent or received)
    const requestType = event.queryStringParameters?.requestType;
    if (!["sent", "received"].includes(requestType)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid or missing requestType. Use 'sent' or 'received'." }),
      };
    }

    // Authenticated userId from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const db = await getDb();
    const friendsColl = db.collection("friends");
    const usersColl = db.collection("user");

    // Fetch pending friend requests matching requestType
    const friendRequests = await friendsColl
    .find({
      requestType,
      relationshipStatus: "pending",
      userId,
    })
    .sort({ createdAt: -1 }) 
    .toArray();

    if (!friendRequests.length) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ requests: [] }),
      };
    }

    // Unique friendIds
    const friendIds = [
      ...new Set(friendRequests.map((fr) => fr.friendId))
    ];

    // Fetch user details in bulk
    const users = await usersColl
      .find({ userId: { $in: friendIds } })
      .project({ userId: 1, username: 1, profileImg: 1, desc: 1, _id: 0 })
      .toArray();

    const userMap = new Map(users.map((u) => [u.userId, u]));

    const formatted = friendRequests.map((fr) => {
      const usr = userMap.get(fr.friendId) || {};
      return {
        friendId: fr.friendId,
        username: usr.username || "Unknown",
        profileImg: usr.profileImg || null,
        desc: usr.desc || null,
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ requests: formatted }),
    };
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to retrieve friend requests", details: err.message }),
    };
  }
};
