// getUserRank.js
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable not set");
  }
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * GET /getUserRank?leagueId=...
 */
exports.handler = async (event) => {
  try {
    // 1) Auth
    const userId =
      event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // 2) Extract leagueId (from queryStringParameters or pathParameters)
    const leagueId =
      event.queryStringParameters?.leagueId ||
      event.pathParameters?.leagueId;
    if (!leagueId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing leagueId" }),
      };
    }

    // 3) Connect to Mongo and query
    const db = await getDb();
    const coll = db.collection("leaderboards");
    const doc = await coll.findOne({ leagueId, userId });

    if (!doc) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Rank not found for this user & league" }),
      };
    }

    // 4) Return the found document
    return {
      statusCode: 200,
      body: JSON.stringify(doc),
    };

  } catch (err) {
    console.error("getUserRank error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
