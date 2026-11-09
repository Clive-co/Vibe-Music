const { MongoClient } = require("mongodb");

// Cache MongoClient across Lambda invocations
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
 * Lambda handler to send a friend request (creates two records) in MongoDB Atlas
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  // Extract authenticated userId from Cognito claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  // Parse request body for friendId
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const { friendId } = body;
  if (!friendId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Missing friendId" }),
    };
  }

  const timestamp = new Date().toISOString();

  try {
    const db = await getDb();
    const coll = db.collection("friends");

    // Check if either direction already exists
    const existing = await coll.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    });

    if (existing) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Friend request already exists or is pending" }),
      };
    }

    // Insert two documents: sent and received
    const requests = [
      {
        userId,
        friendId,
        relationshipStatus: "pending",
        requestType: "sent",
        createdAt: timestamp
      },
      {
        userId: friendId,
        friendId: userId,
        relationshipStatus: "pending",
        requestType: "received",
        createdAt: timestamp
      }
    ];

    await coll.insertMany(requests);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Friend request sent successfully!" }),
    };
  } catch (error) {
    console.error("Error sending friend request:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Failed to send friend request", details: error.message }),
    };
  }
};
