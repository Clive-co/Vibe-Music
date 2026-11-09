const { MongoClient } = require("mongodb");

// Cache the MongoClient across Lambda invocations
let cachedClient = null;
let cachedDb = null;

/**
 * Returns a connected database instance
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
 * Lambda handler to load accepted friends with descriptions from MongoDB Atlas
 */
exports.handler = async (event) => {
  console.log("Received event:\n", JSON.stringify(event, null, 2));

  // 1) Authenticate via Cognito sub claim
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    const db = await getDb();
    const friendsColl = db.collection("friends");
    const usersColl = db.collection("user");

    // 2) Find accepted friend relationships for this user
    const friends = await friendsColl
      .find({ userId, relationshipStatus: "accepted" })
      .toArray();

    if (!friends.length) {
      // No accepted friends
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([]),
      };
    }

    // 3) Extract friendIds
    const friendIds = friends.map(f => f.friendId);

    // 4) Bulk fetch user profiles, including desc
    const users = await usersColl
      .find({ userId: { $in: friendIds } })
      .project({ userId: 1, username: 1, profileImg: 1, desc: 1, _id: 0 })
      .toArray();

    // 5) Map userId to profile
    const userMap = new Map(users.map(u => [u.userId, u]));

    // 6) Build response array
    const results = friends.map(f => {
      const profile = userMap.get(f.friendId) || {};
      return {
        friendId: f.friendId,
        username: profile.username || null,
        profileImg: profile.profileImg || null,
        desc: profile.desc || null
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error("Error loading friends:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not load friends", details: err.message }),
    };
  }
};
