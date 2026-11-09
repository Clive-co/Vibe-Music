// disconnect.js

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
    await connections.deleteOne({ connectionId });
    console.log(`Disconnected: ${connectionId}`);
    return { statusCode: 200, body: "Disconnected" };
  } catch (err) {
    console.error("disconnectHandler error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
