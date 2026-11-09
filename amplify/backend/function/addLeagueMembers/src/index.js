// addLeagueMembersHandler.js
const { MongoClient } = require("mongodb");

// Env var for Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Atlas database & collection names
const DB_NAME             = "vibeDB";
const LEAGUES_COLL        = "leagues";
const MEMBERS_COLL        = "leagueMemberships";
const LEADERBOARDS_COLL   = "leaderboards";

let cachedClient = null;

/** Get (or create) and return the vibeDB database */
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

exports.handler = async (event) => {
  console.log("Incoming event:", JSON.stringify(event, null, 2));

  // 1) Auth: actor’s userId
  const actorId = event.requestContext?.authorizer?.claims?.sub;
  if (!actorId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: no user sub in token" }),
    };
  }

  // 2) Parse leagueId + friendIds
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }
  const { leagueId, friendIds } = body;
  if (!leagueId || !Array.isArray(friendIds)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing leagueId or friendIds array" }),
    };
  }

  try {
    const db             = await getDb();
    const leaguesColl    = db.collection(LEAGUES_COLL);
    const membersColl    = db.collection(MEMBERS_COLL);
    const usersColl      = db.collection("user");
    const leaderboardsColl = db.collection(LEADERBOARDS_COLL);

    // 3) Verify league exists and still open
    const league = await leaguesColl.findOne({ leagueId });
    if (!league) {
      return { statusCode: 404, body: JSON.stringify({ error: "League not found" }) };
    }
    if (new Date() > new Date(league.joinDeadline)) {
      return { statusCode: 403, body: JSON.stringify({ error: "Joining period is over" }) };
    }

    // 4) Insert membership docs
    const now = new Date().toISOString();
    const membershipDocs = friendIds.map(friendId => ({
      leagueId,
      userId: friendId,
      joinDate: now,
      cumulativeMinutes: 0,
      invitedBy: actorId,
    }));
    await membersColl.insertMany(membershipDocs);

    // 5) For each friend, insert empty leaderboard entry
    const leaderboardDocs = await Promise.all(friendIds.map(async friendId => {
      // fetch username/profileImg from user collection
      const u = await usersColl.findOne(
        { userId: friendId },
        { projection: { _id: 0, username: 1, profileImg: 1 } }
      ) || {};
      return {
        leagueId,
        userId: friendId,
        username:   u.username  || "",
        profileImg: u.profileImg || "",
        cumulativeMinutes: 0,
        rank: "-",
        lastUpdated: now,
      };
    }));
    // insert them
    if (leaderboardDocs.length) {
      await leaderboardsColl.insertMany(leaderboardDocs);
    }

    // 6) Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "League members added and leaderboard initialized." }),
    };
  } catch (error) {
    console.error("Error adding league members:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
