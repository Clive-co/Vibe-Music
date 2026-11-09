const { MongoClient } = require("mongodb");

// Cached MongoDB client and DB across Lambda invocations
let cachedClient = null;
let cachedDb = null;

/**
 * Connects (or returns cached) to MongoDB Atlas
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
 * Lambda handler to fetch a weekly recap, with optional friend override
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Extract query and body parameters
  const queryParams = event.queryStringParameters || {};
  const bodyParams = event.body ? JSON.parse(event.body) : {};
  const { friendId, weekStart } = { ...queryParams, ...bodyParams };

  // Extract Cognito userId (sub) from authorizer claims
  const userSub = event.requestContext?.authorizer?.claims?.sub;
  if (!userSub) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // Use friendId if provided, otherwise fallback to authenticated userId
  const userId = friendId || userSub;

  // Validate required parameters
  if (!userId || !weekStart) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing required parameters: friendId or authenticated user, and weekStart." }),
    };
  }

  try {
    const db = await getDb();
    const recap = await db.collection("weeklyRecaps").findOne(
      { userId, weekStart },
      { projection: { _id: 0 } }
    );

    if (!recap) {
      return {
        statusCode: 200, // Use 200 status code for a friendly response
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: "No recap found for last week, recap for this week will be generated soon.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(recap),
    };
  } catch (err) {
    console.error("Error fetching weekly recap:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
