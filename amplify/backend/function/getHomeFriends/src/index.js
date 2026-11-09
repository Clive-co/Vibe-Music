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
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Lambda handler to load accepted friends with user details from MongoDB Atlas
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Only allow GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Get userId from Cognito JWT claims
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

    // Find accepted friendships for this user
    const friends = await db.collection("friends")
      .find({ userId, relationshipStatus: "accepted" })
      .toArray();

    if (!friends.length) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([]),
      };
    }

    // Extract friendIds
    const friendIds = friends.map((f) => f.friendId);

    // Fetch user details in bulk
    const users = await db.collection("user")
      .find({ userId: { $in: friendIds } })
      .project({ userId: 1, username: 1, profileImg: 1, desc: 1, linkedAccount: 1,
                 spotifyAccessToken: 1, spotifyRefreshToken: 1, spotifyTokenExpiration: 1,
                 appleMusicAccessToken: 1 })
      .toArray();

    // Map users by ID for quick lookup
    const userMap = {};
    users.forEach((u) => {
      userMap[u.userId] = u;
    });

    // Combine friendship info with user details
    const friendsWithDetails = friends.map((friend) => {
      const user = userMap[friend.friendId];

      // Default empty fields if user not found or no linked account
      if (!user || user.linkedAccount === "none") {
        return {
          friendId: friend.friendId,
          username: null,
          profileImg: null,
          desc: null,
          linkedAccount: null,
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiration: null,
          appleMusicAccessToken: null,
        };
      }

      // Build friend details
      const details = {
        friendId: friend.friendId,
        username: user.username,
        profileImg: user.profileImg,
        desc: user.desc,
        linkedAccount: user.linkedAccount,
      };

      // Attach tokens based on linkedAccount
      if (user.linkedAccount === "spotify") {
        details.spotifyAccessToken = user.spotifyAccessToken;
        details.spotifyRefreshToken = user.spotifyRefreshToken;
        details.spotifyTokenExpiration = user.spotifyTokenExpiration;
      } else if (user.linkedAccount === "apple music") {
        details.appleMusicAccessToken = user.appleMusicAccessToken;
      }

      return details;
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(friendsWithDetails),
    };
  } catch (error) {
    console.error("Error loading friends:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not load friends", details: error.message }),
    };
  }
};
