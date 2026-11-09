// lambda/updateUser.js

const { MongoClient } = require("mongodb");

// Cache the MongoClient across invocations
let cachedClient = null;
let cachedDb = null;
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Update user Lambda handler using MongoDB Atlas
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Only allow PATCH or PUT
  if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Extract userId from Cognito claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // Parse request body
  let updateData;
  try {
    updateData = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  // Prevent overwriting the Mongo document _id
  delete updateData.id;

  if (Object.keys(updateData).length === 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "No fields provided to update" }),
    };
  }

  try {
    const db = await getDb();
    // Update the authenticated user's document
    const result = await db.collection("user").findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: "after" }
    );

    // Handle case where no document was matched
    const updatedUser = result.value ?? result;
    if (!updatedUser) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Update successful",
        updatedItem: result.value,
      }),
    };
  } catch (error) {
    console.error("MongoDB update error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
