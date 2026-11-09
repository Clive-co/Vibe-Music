// getUserLeaguesWithRank.js
const { MongoClient } = require("mongodb");

// Cache MongoClient across Lambda invocations
let cachedClient = null;
let cachedDb     = null;

async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Lambda handler to retrieve leagues for the authenticated user,
 * including their current rank in each league.
 */
exports.handler = async (event) => {
  // Only allow GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // Extract authenticated userId from Cognito claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  try {
    const db = await getDb();
    const membershipsColl  = db.collection("leagueMemberships");
    const leaguesColl      = db.collection("leagues");
    const leaderboardsColl = db.collection("leaderboards");

    // 1) Find leagueMemberships for this user
    const memberships = await membershipsColl
      .find({ userId })
      .project({ leagueId: 1, _id: 0 })
      .toArray();

    if (memberships.length === 0) {
      // no leagues
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify([])
      };
    }

    // 2) Extract leagueIds
    const leagueIds = memberships.map(m => m.leagueId);

    // 3) Fetch league details in bulk
    const leagues = await leaguesColl
      .find({ leagueId: { $in: leagueIds } })
      .project({ leagueId: 1, name: 1, _id: 0 })
      .toArray();

    // 4) For each league, lookup the user's rank
    const leaguesWithRank = await Promise.all(
      leagues.map(async (lg) => {
        const entry = await leaderboardsColl.findOne(
          { leagueId: lg.leagueId, userId },
          { projection: { rank: 1, _id: 0 } }
        );
        return {
          leagueId: lg.leagueId,
          name:     lg.name,
          rank:     entry?.rank != null ? entry.rank : "-"  // fallback "-"
        };
      })
    );

    // 5) Return enriched list
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(leaguesWithRank)
    };

  } catch (err) {
    console.error("Error fetching user leagues with rank:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message })
    };
  }
};
