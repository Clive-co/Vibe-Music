// connect.js

const { MongoClient } = require("mongodb");

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient && cachedClient.isConnected && cachedClient.isConnected()) {
    return cachedClient;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Grab the Cognito sub from the Lambda‑authorizer context
  const auth = event.requestContext.authorizer || {};
  const userId = auth.sub;

  if (!userId) {
    console.error("Unauthorized: missing userId in authorizer context");
    return { statusCode: 401, body: "Unauthorized" };
  }

  let client;
  try {
    client = await connectToDatabase();
  } catch (dbErr) {
    console.error("MongoDB connection error:", dbErr);
    return { statusCode: 500, body: "Database connection failed" };
  }

  const db = client.db("vibeDB");
  const connections = db.collection("connections");

  try {
    await connections.insertOne({
      connectionId,
      userId,
      connectedAt: new Date(),
    });
    console.log(`Connected: ${connectionId} ↔ ${userId}`);
    return { statusCode: 200, body: "Connected" };
  } catch (err) {
    console.error("connectHandler error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
