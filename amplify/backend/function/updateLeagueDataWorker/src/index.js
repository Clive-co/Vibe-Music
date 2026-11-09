const { MongoClient } = require("mongodb");

// Cache the MongoClient and DB across Lambda invocations
let cachedClient = null;
let cachedDb = null;

/**
 * Returns a connected MongoDB database instance
 */
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

/**
 * Calculates the Monday of the week that just ended (previous week) in YYYY-MM-DD
 */
function getPreviousMonday() {
  // Start with today, then step back exactly one week
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 7);

  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Compute how many days back to get to Monday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - diffToMonday);

  return monday.toISOString().split("T")[0];
}

/**
 * Processes a batch of membership records: updates cumulativeMinutes and lastUpdatedWeek
 */
async function processBatch(batch, weekStart, weeklyRecapsColl, leagueMembershipsColl) {
  await Promise.all(batch.map(async ({ leagueId, userId }) => {
    // Fetch weekly recap for user and weekStart
    const recap = await weeklyRecapsColl.findOne(
      { userId, weekStart },
      { projection: { totalMinutesListened: 1 } }
    );
    const additional = recap?.totalMinutesListened || 0;

    // Build update ops
    const update = { $set: { lastUpdatedWeek: weekStart } };
    if (additional) {
      update.$inc = { cumulativeMinutes: additional };
    }

    // Apply update
    await leagueMembershipsColl.updateOne(
      { leagueId, userId },
      update
    );
  }));
}

/**
 * Lambda handler to refresh weekly membership totals
 */
exports.handler = async () => {
  console.log("Scheduled weekly membership update started.");
  try {
    const db = await getDb();
    const leagueMembershipsColl = db.collection("leagueMemberships");
    const weeklyRecapsColl = db.collection("weeklyRecaps");

    const weekStart = getPreviousMonday();
    console.log(`Week start: ${weekStart}`);

    // Find memberships needing update
    const filter = {
      $or: [
        { lastUpdatedWeek: { $exists: false } },
        { lastUpdatedWeek: { $ne: weekStart } }
      ]
    };
    const memberships = await leagueMembershipsColl
      .find(filter, { projection: { leagueId: 1, userId: 1, _id: 0 } })
      .toArray();
    console.log(`Found ${memberships.length} memberships to update.`);

    const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 10;
    for (let i = 0; i < memberships.length; i += BATCH_SIZE) {
      const batch = memberships.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
      await processBatch(batch, weekStart, weeklyRecapsColl, leagueMembershipsColl);
    }

    console.log("Weekly membership update complete.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Memberships updated.", count: memberships.length })
    };
  } catch (err) {
    console.error("Error during weekly membership update:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
