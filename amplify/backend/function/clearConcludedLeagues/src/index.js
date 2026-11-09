// cleanupHandler.js
const { MongoClient } = require("mongodb");

// Env var for your Atlas URI
const MONGODB_URI = process.env.MONGODB_URI;

// Atlas DB & collection names
const DB_NAME = "vibeDB";
const LEAGUES_COLL = "leagues";
const MEMBERS_COLL = "leagueMemberships";
const LB_COLL = "leaderboards";

// Cached client across invocations
let cachedClient = null;

/** Get (or create) and return the vibeDB database */
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

/** Returns today’s date in “YYYY-MM-DD” */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

exports.handler = async (event) => {
  try {
    // 1) Auth: extract caller’s userId from the Cognito authorizer
    const actorId = event.requestContext?.authorizer?.claims?.sub;
    if (!actorId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const today = getTodayDate();
    console.log(`Cleanup triggered by ${actorId} — looking for leagues ending on or before ${today}`);

    // 2) Connect and grab collections
    const db = await getDb();
    const leagues = db.collection(LEAGUES_COLL);
    const memberships = db.collection(MEMBERS_COLL);
    const leaderboards = db.collection(LB_COLL);

    // 3) Find expired leagues
    const expiredLeagues = await leagues
      .find({ endDate: { $lte: today } })
      .toArray();
    console.log(`Found ${expiredLeagues.length} expired league(s).`);

    // 4) For each, delete related docs then the league itself
    for (const { leagueId } of expiredLeagues) {
      const { deletedCount: memCount } = await memberships.deleteMany({ leagueId });
      console.log(`→ Deleted ${memCount} membership record(s) for league ${leagueId}`);

      const { deletedCount: lbCount } = await leaderboards.deleteMany({ leagueId });
      console.log(`→ Deleted ${lbCount} leaderboard record(s) for league ${leagueId}`);

      const { deletedCount: leagueCount } = await leagues.deleteOne({ leagueId });
      console.log(`→ Deleted ${leagueCount} league record for ${leagueId}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Cleanup completed successfully" }),
    };

  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
