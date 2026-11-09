const { MongoClient } = require("mongodb");

// Cache MongoClient and database across invocations
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
 * GET /friend?friendId={friendId}
 * Retrieves the user document for the given friendId.
 * Auth: extracts caller's userId from Cognito claims (not used in lookup but for auth).
 */
exports.handler = async (event) => {
  try {
    // 1. Authenticated userId from Cognito
    const callerId = event.requestContext?.authorizer?.claims?.sub;
    if (!callerId) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // 2. Extract friendId from query parameters
    const friendId = event.queryStringParameters?.friendId;
    if (!friendId) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing friendId query parameter" }),
      };
    }

    // 3. Query MongoDB for the friend's user document
    const db = await getDb();
    const user = await db.collection("user").findOne(
      { userId: friendId },
      { projection: { _id: 0 } }
    );

    if (!user) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // 4. Return the user document
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(user),
    };
  } catch (err) {
    console.error("Error in getFriendsDetails handler:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
