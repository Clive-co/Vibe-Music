// friendSuggestions.js
const { MongoClient } = require("mongodb");
const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
const PNF = require("google-libphonenumber").PhoneNumberFormat;

// Cache client & db between invocations
let cachedClient = null;
async function connect() {
  if (cachedClient) return cachedClient.db("vibeDB");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  cachedClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await cachedClient.connect();
  return cachedClient.db("vibeDB");
}

// Normalize any raw phone string to E.164 (or null)
function normalizeE164(raw) {
  try {
    // "US" is only a default for parsing; leading '+' numbers will still parse.
    const num = phoneUtil.parseAndKeepRawInput(raw, "US");
    return phoneUtil.format(num, PNF.E164);
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  // 1) Auth
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // 2) Parse incoming body, accept either { contacts: [...] } or flat { phoneNumbers: [...] }
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Extract raw phone strings
  let rawNumbers = [];
  if (Array.isArray(body.phoneNumbers)) {
    rawNumbers = body.phoneNumbers;
  } else if (Array.isArray(body.contacts)) {
    rawNumbers = body.contacts.flatMap(c => (c.phoneNumbers || []).map(p => p.number || ""));
  }

  // 3) Normalize & dedupe
  const allNums = rawNumbers
    .map(normalizeE164)
    .filter(n => n && n !== userId);
  const unique = Array.from(new Set(allNums)).slice(0, 100);

  // 4) Connect to DB & fetch your accepted friends
  const db = await connect();
  const friendsColl = db.collection("friends");

  const accepted = await friendsColl
    .find({ userId, relationshipStatus: "accepted" })
    .project({ friendId: 1, _id: 0 })
    .toArray();
  const friendIds = new Set(accepted.map(f => f.friendId));
  friendIds.add(userId);

  // 5) Build an aggregation: only if we actually have some numbers
  let suggestions = [];
  if (unique.length > 0) {
    const pipeline = [
      {
        $match: {
          phonenumber: { $in: unique },
          userId: { $nin: Array.from(friendIds) }
        }
      },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: 0,
          userId: 1,
          username: 1,
          profileImg: 1
        }
      }
    ];
    const matches = await db.collection("user").aggregate(pipeline).toArray();
    suggestions = matches.map(u => ({
      userId:     u.userId,
      username:   u.username,
      profileImg: u.profileImg,
      source:     "from contacts"
    }));
  }

  // 6) If we still have nothing, give back exactly one dummy suggestion
  if (suggestions.length === 0) {
    suggestions = [{
      userId:     "1234666",
      username:   "John Doe",
      profileImg: "https://vibe-profile-images.s3.us-east-1.amazonaws.com/profile1.jpg",
      source:     "from contacts"
    }];
  }

  // 7) Return
  return {
    statusCode: 200,
    headers: {
      "Content-Type":             "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(suggestions),
  };
};
