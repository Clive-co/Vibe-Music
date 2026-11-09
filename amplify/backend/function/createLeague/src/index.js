// createLeagueHandler.js
const { MongoClient } = require("mongodb");

// Env var for your Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Atlas DB & collection names
const DB_NAME            = "vibeDB";
const LEAGUES_COLL       = "leagues";
const MEMBERS_COLL       = "leagueMemberships";
const LEADERBOARDS_COLL  = "leaderboards";

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function getJoinDeadline() {
  const now        = new Date();
  const currentDay = now.getUTCDay(); // Sun=0…Sat=6
  const daysUntil  = currentDay === 1 ? 7 : ((8 - currentDay) % 7);
  const deadline   = new Date(now);
  deadline.setUTCDate(now.getUTCDate() + daysUntil);
  deadline.setUTCHours(0, 0, 0, 0);
  return deadline.toISOString();
}

function calculateEndDate(startDate, durationMonths) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + Number(durationMonths));
  return d.toISOString().split("T")[0];
}

exports.handler = async (event) => {
  try {
    // 1) Auth
    const creatorId = event.requestContext?.authorizer?.claims?.sub;
    if (!creatorId) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // 2) Parse
    let data;
    try { data = JSON.parse(event.body); }
    catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }
    const { name, duration } = data;
    if (!name || !duration) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or duration" }),
      };
    }

    // 3) Build league + membership docs
    const now         = new Date();
    const nowISO      = now.toISOString();
    const leagueId    = generateId("league");
    const inviteToken = generateId("invite");
    const startDate   = nowISO.split("T")[0];
    const endDate     = calculateEndDate(startDate, duration);
    const joinDeadline= getJoinDeadline();

    const leagueItem = {
      leagueId,
      name,
      creatorId,
      inviteToken,
      duration,
      startDate,
      endDate,
      joinDeadline,
      type: "private", 
      createdAt: nowISO,
    };
    const membershipItem = {
      leagueId,
      userId: creatorId,
      joinDate: nowISO,
      cumulativeMinutes: 0,
    };

    // 4) Insert into MongoDB
    const db             = await getDb();
    const leaguesColl    = db.collection(LEAGUES_COLL);
    const membersColl    = db.collection(MEMBERS_COLL);
    const usersColl      = db.collection("user");
    const leaderboardsColl = db.collection(LEADERBOARDS_COLL);

    await leaguesColl.insertOne(leagueItem);
    await membersColl.insertOne(membershipItem);

    // 5) Fetch creator’s profile
    const userDoc = await usersColl.findOne(
      { userId: creatorId },
      { projection: { _id:0, username:1, profileImg:1 } }
    );
    const username  = userDoc?.username  || "";
    const profileImg= userDoc?.profileImg || "";

    // 6) Insert placeholder leaderboard entry
    await leaderboardsColl.insertOne({
      leagueId,
      userId: creatorId,
      username,
      profileImg,
      cumulativeMinutes: 0,
      rank: "-",            // placeholder until ranked update
      lastUpdated: nowISO,
    });

    // 7) Return success
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "League created successfully",
        league: leagueItem,
      }),
    };

  } catch (error) {
    console.error("Error creating league:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
