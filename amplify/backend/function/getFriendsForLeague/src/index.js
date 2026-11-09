const { MongoClient } = require("mongodb");

// Cache MongoClient across invocations
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
 * Handler to fetch friends eligible to join a league
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Allow only GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Extract leagueId
  const leagueId = event.queryStringParameters?.leagueId;
  if (!leagueId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing required parameter: leagueId" }),
    };
  }

  // Extract authenticated userId from Cognito claims
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
    const membershipsColl = db.collection("leagueMemberships");

    // 1) Find accepted friends of the user
    const friends = await friendsColl
      .find({ userId, relationshipStatus: "accepted" })
      .toArray();

    if (!friends.length) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([]),
      };
    }

    const friendIds = friends.map(f => f.friendId);

    // 2) Fetch user profiles for these friends
    const users = await usersColl
      .find({ userId: { $in: friendIds } })
      .project({ userId: 1, username: 1, profileImg: 1, desc: 1, linkedAccount: 1, _id: 0 })
      .toArray();

    const userMap = new Map(users.map(u => [u.userId, u]));

    // 3) Map to details and filter out unlinked accounts
    let eligibleFriends = friends
      .map(f => {
        const prof = userMap.get(f.friendId) || {};
        return {
          friendId: f.friendId,
          username: prof.username || null,
          profileImg: prof.profileImg || null,
          desc: prof.desc || null,
          linkedAccount: prof.linkedAccount || "none",
        };
      })
      .filter(f => f.linkedAccount !== "none");

    if (!eligibleFriends.length) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([]),
      };
    }

    // 4) Find existing league memberships
    const memberships = await membershipsColl
      .find({ leagueId })
      .project({ userId: 1, _id: 0 })
      .toArray();
    const memberIds = new Set(memberships.map(m => m.userId));

    // 5) Filter out friends already in the league
    eligibleFriends = eligibleFriends.filter(f => !memberIds.has(f.friendId));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(eligibleFriends),
    };
  } catch (err) {
    console.error("Error fetching eligible friends:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not load eligible friends", details: err.message }),
    };
  }
};
