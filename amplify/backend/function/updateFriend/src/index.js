// src/lambdas/updateFriend.js
const { MongoClient } = require("mongodb");

// Cache across invocations
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

exports.handler = async (event) => {
  console.log("Event:", event);

  // Only PATCH/PUT allowed
  if (!["PATCH","PUT"].includes(event.httpMethod)) {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Auth: extract your Cognito sub
  const yourUserId = event.requestContext?.authorizer?.claims?.sub;
  if (!yourUserId) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // Parse JSON body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Must pass friendId
  const { friendId, ...fieldsToSet } = body;
  if (!friendId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing friendId" }) };
  }
  delete fieldsToSet.friendId;

  if (Object.keys(fieldsToSet).length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "No fields to update" }) };
  }

  try {
    const db = await getDb();
    // Update the *friend’s* user doc by their sub (friendId)
    const result = await db.collection("user").findOneAndUpdate(
      { userId: friendId },
      { $set: fieldsToSet },
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
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Friend updated", updatedItem: result.value }),
    };
  } catch (err) {
    console.error("Mongo error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal" }) };
  }
};
