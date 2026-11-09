// addUserMongo.js
const { MongoClient } = require("mongodb");
const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
const PNF = require("google-libphonenumber").PhoneNumberFormat;

// Cache the client across invocations
let cachedClient = null;
let cachedDb = null;
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
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

// Normalize arbitrary phone string to E.164 (or return null)
function normalizeE164(raw) {
  try {
    // You can replace "US" with your default region
    const num = phoneUtil.parseAndKeepRawInput(raw, region);
    return phoneUtil.format(num, PNF.E164);
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  console.log("EVENT:", event);
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const {
    id,
    username,
    email,
    phonenumber,
    linkedAccount,
    spotifyAccessToken,
    spotifyRefreshToken,
    spotifyTokenExpiration,
    appleMusicAccessToken,
    isPremium,
    joinedAt,
    region,
    timezone,
    profileImg,
    desc,
  } = body;

  if (!id || !username || !email || !phonenumber || !region) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const normalized = normalizeE164(phonenumber);
  if (!normalized) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid phone number format" }),
    };
  }

  const defaultProfileImg = "https://vibe-profile-images.s3.us-east-1.amazonaws.com/profile1.jpg";

  const userDoc = {
    userId: id,
    username: username.trim(),
    email,
    phonenumber: normalized,
    linkedAccount: linkedAccount || "none",
    spotifyAccessToken: spotifyAccessToken || "",
    spotifyRefreshToken: spotifyRefreshToken || "",
    spotifyTokenExpiration: spotifyTokenExpiration || "",
    appleMusicAccessToken: appleMusicAccessToken || "",
    isPremium: isPremium || false,
    joinedAt: joinedAt || new Date().toISOString(),
    region,
    timezone: timezone || "",
    profileImg: profileImg || defaultProfileImg,
    desc: desc || "",
  };

  try {
    const db = await getDb();
    const result = await db.collection("user").insertOne(userDoc);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, insertedId: result.insertedId }),
    };
  } catch (err) {
    console.error("MongoDB Insert Error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Could not add user", details: err.message }),
    };
  }
};
