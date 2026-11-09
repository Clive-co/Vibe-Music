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

  // Use the `vibeDB` database
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Lambda handler to load leaderboard entries from MongoDB Atlas
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Extract leagueId from query parameters
  const leagueId = event.queryStringParameters?.leagueId;
  if (!leagueId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "leagueId parameter is required" }),
    };
  }

  try {
    const db = await getDb();

    // Query the leaderboards collection and sort by rank ascending
    const items = await db.collection("leaderboards")
      .find({ leagueId })
      .sort({ rank: 1 })
      .toArray();

    // Map to desired response shape
    const formatted = items.map((item) => ({
      leagueId: item.leagueId,
      rank: item.rank,
      username: item.username,
      userId: item.userId,
      profileImg: item.profileImg,
      cumulativeMinutes: item.cumulativeMinutes,
      lastUpdated: item.lastUpdated,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(formatted),
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
