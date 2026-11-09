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
 * Lambda handler to delete a user document from MongoDB Atlas
 */
exports.handler = async (event) => {
  try {
    // Only allow DELETE or POST for deletion
    if (event.httpMethod !== "DELETE" && event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    const userId = body.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required field: id" }),
      };
    }

    const db = await getDb();
    const result = await db.collection("user").deleteOne({ userId });

    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "User deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
