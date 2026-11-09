const { MongoClient } = require("mongodb");

// Cache across invocations
let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db("vibeDB");
  return cachedDb;
}

function computeWeekBoundaries() {
  const now = new Date();
  const ref = new Date(now);
  ref.setDate(ref.getDate() - 7);
  const day = ref.getUTCDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(ref);
  monday.setDate(monday.getDate() - diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => d.toISOString().split("T")[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}

async function processUser(user, weekStart, weekEnd, listeningColl, weeklyRecapsColl) {
  const dailyRecords = await listeningColl
    .find({ userId: user.userId, date: { $gte: weekStart, $lte: weekEnd } })
    .toArray();

  let totalMinutes = 0;
  const artistsSet = new Set();
  const tracksSet = new Set();
  const artistPlay = {};
  const trackPlay = {};

  for (const rec of dailyRecords) {
    totalMinutes += rec.totalMinutesListened || 0;

    if (Array.isArray(rec.artistsListened)) {
      rec.artistsListened.forEach(a => artistsSet.add(a));
    }
    if (Array.isArray(rec.tracksListened)) {
      rec.tracksListened.forEach(t => tracksSet.add(t));
    }

    if (Array.isArray(rec.topArtists)) {
      for (const a of rec.topArtists) {
        if (!a.artistName) continue;
        const prev = artistPlay[a.artistName] || { count: 0, artistImageUrl: a.artistImageUrl };
        artistPlay[a.artistName] = {
          count: prev.count + (a.playCount || 0),
          artistImageUrl: prev.artistImageUrl || a.artistImageUrl,
        };
      }
    }

    if (Array.isArray(rec.topTracks)) {
      for (const t of rec.topTracks) {
        if (!t.trackName || !t.artistName) continue;
        const key = `${t.trackName}||${t.artistName}`;
        const prev = trackPlay[key] || { count: 0, ...t };
        trackPlay[key] = { ...prev, count: prev.count + (t.playCount || 0) };

        if (!artistPlay[t.artistName]) {
          artistPlay[t.artistName] = { count: 0, artistImageUrl: null };
        }
      }
    }
  }

  const totalArtists = artistsSet.size;
  const totalTracks = tracksSet.size;

  const topArtists = Object.entries(artistPlay)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([artistName, { count, artistImageUrl }]) => ({
      artistName,
      artistImageUrl,
      playCount: count,
    }));

  const topTracks = Object.values(trackPlay)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ trackName, artistName, trackImageUrl, count }) => ({
      trackName,
      artistName,
      trackImageUrl,
      playCount: count,
    }));

  const recapStartTimestamp = new Date(weekStart).getTime();
  const endDate = new Date(weekEnd);
  endDate.setUTCHours(23, 59, 59, 999);
  const recapEndTimestamp = endDate.getTime();

  const doc = {
    userId: user.userId,
    weekStart,
    totalMinutesListened: totalMinutes,
    totalTracksListened: totalTracks,
    totalArtistsListened: totalArtists,
    topArtists,
    topTracks,
    recapStartTimestamp,
    recapEndTimestamp,
    recapGeneratedAt: Date.now(),
    nextRecapTime: recapStartTimestamp + 14 * 24 * 3600 * 1000 + 40 * 60 * 1000,
  };

  await weeklyRecapsColl.updateOne(
    { userId: user.userId, weekStart },
    { $set: doc },
    { upsert: true }
  );
}

exports.handler = async () => {
  console.log("Starting weekly recap computation.");
  const { weekStart, weekEnd } = computeWeekBoundaries();
  console.log(`Week boundaries: ${weekStart} - ${weekEnd}`);

  const db = await getDb();
  const usersColl = db.collection("user");
  const listeningColl = db.collection("listeningData");
  const weeklyRecapsColl = db.collection("weeklyRecaps");

  const users = await usersColl
    .find({ linkedAccount: { $ne: "" } })
    .project({ userId: 1, _id: 0 })
    .toArray();
  console.log(`Found ${users.length} users to process.`);

  const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 10;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i/BATCH_SIZE + 1} with ${batch.length} users.`);
    await Promise.all(
      batch.map(u => processUser(u, weekStart, weekEnd, listeningColl, weeklyRecapsColl))
    );
  }

  console.log("Weekly recaps computed.");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Weekly recaps generated", weekStart, count: users.length })
  };
};
