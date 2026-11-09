const { MongoClient } = require("mongodb");

// Cache MongoClient across Lambda invocations
let cachedClient = null;
let cachedDb = null;

/** Returns a connected MongoDB database instance */
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI env var");
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/** Process a single league's leaderboard */
async function processLeague( leagueId, membershipsColl, usersColl, leaderboardsColl ) {
  const memberships = await membershipsColl.find({ leagueId }).toArray();
  if (!memberships.length) return;

  // Gather all the userIds we need
  const userIds = memberships.map(m => m.userId);

  // Fetch their profiles by your `userId` field, not `id`
  const users = await usersColl.find({
      userId: { $in: userIds }
    })
    .project({ userId: 1, username: 1, profileImg: 1, _id: 0 })
    .toArray();

  // Map them back by the same key
  const userMap = new Map(users.map(u => [u.userId, u]));

  // Sort and upsert as before…
  memberships.sort((a, b) =>
    (b.cumulativeMinutes || 0) - (a.cumulativeMinutes || 0)
  );

  let rank = 1;
  const now = new Date().toISOString();

  for (const m of memberships) {
    const u = userMap.get(m.userId) || {};
    await leaderboardsColl.updateOne(
      { leagueId: m.leagueId, userId: m.userId },
      {
        $set: {
          leagueId:   m.leagueId,
          userId:     m.userId,
          username:   u.username || "",
          profileImg: u.profileImg || "",
          cumulativeMinutes: Math.round(m.cumulativeMinutes || 0), // Convert to whole number
          rank,
          lastUpdated: now,
        }
      },
      { upsert: true }
    );
    rank++;
  }
}


/** Lambda handler with batch concurrency */
exports.handler = async () => {
  console.log("Starting batched leaderboard update.");
  try {
    const db = await getDb();
    const membershipsColl = db.collection("leagueMemberships");
    const usersColl = db.collection("user");
    const leaderboardsColl = db.collection("leaderboards");

    // Fetch all distinct league IDs
    const leagueIds = await membershipsColl.distinct("leagueId");
    console.log(`Found ${leagueIds.length} leagues.`);

    // Batch size from env or default
    const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 10;

    for (let i = 0; i < leagueIds.length; i += BATCH_SIZE) {
      const batch = leagueIds.slice(i, i + BATCH_SIZE);
      console.log(`Processing league batch ${i / BATCH_SIZE + 1} of ${Math.ceil(leagueIds.length / BATCH_SIZE)}`);
      await Promise.all(
        batch.map(leagueId => processLeague(leagueId, membershipsColl, usersColl, leaderboardsColl))
      );
    }

    console.log("Batched leaderboard update complete.");
    return { statusCode: 200, body: JSON.stringify({ message: "Leaderboards updated." }) };
  } catch (err) {
    console.error("Error updating leaderboards:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
