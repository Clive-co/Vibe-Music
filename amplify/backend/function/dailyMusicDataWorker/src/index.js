// dailyMusicWorker.js
const { MongoClient } = require("mongodb");
const axios = require("axios");
const { DateTime } = require("luxon");

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

async function refreshSpotifyToken(refreshToken) {
  const resp = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return resp.data.access_token;
}

async function fetchSpotifyListeningData(accessToken, sinceMs, max = 50) {
  let items = [];
  let url = "https://api.spotify.com/v1/me/player/recently-played";
  let params = { after: sinceMs, limit: 50 };
  while (url && items.length < max) {
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    const batch = resp.data.items || [];
    items = items.concat(batch);
    url = resp.data.next;
    params = null;
    if (!batch.length) break;
  }
  return items.slice(0, max);
}

/**
 * Given a valid Spotify access token and an array of artist IDs,
 * returns a Map from artistId -> smallest artist image URL (if any).
 */
async function fetchArtistImages(accessToken, artistIds) {
  const imagesMap = new Map();
  // Spotify allows up to 50 IDs per request
  for (let i = 0; i < artistIds.length; i += 50) {
    const batch = artistIds.slice(i, i + 50).join(",");
    const resp = await axios.get("https://api.spotify.com/v1/artists", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { ids: batch },
    });
    for (const artist of resp.data.artists || []) {
      // take the smallest (last) image in the array if available
      const url = artist.images?.length
        ? artist.images[artist.images.length - 1].url
        : null;
      imagesMap.set(artist.id, url);
    }
  }
  return imagesMap;
}

async function processUser(user, sinceMs, untilMs, usersColl, listeningColl) {
  const { userId, linkedAccount = "" } = user;
  let token = user.spotifyAccessToken;

  // 1) Refresh token if needed
  if (
    linkedAccount.toLowerCase() === "spotify" &&
    Date.now() >= user.spotifyTokenExpiration
  ) {
    token = await refreshSpotifyToken(user.spotifyRefreshToken);
    await usersColl.updateOne(
      { userId },
      {
        $set: {
          spotifyAccessToken: token,
          spotifyTokenExpiration: Date.now() + 3600 * 1000,
        },
      }
    );
  }

  // 2) Load any existing plays
  const existingDoc = await listeningColl.findOne({ userId, since: sinceMs });
  const existingPlays = existingDoc?.rawListeningData || [];

  // 3) Fetch new plays
  const newPlays =
    linkedAccount.toLowerCase() === "spotify"
      ? await fetchSpotifyListeningData(token, sinceMs)
      : [];

  // 4) Merge & de‐duplicate
  const all = [...existingPlays, ...newPlays];
  const uniq = Array.from(
    new Map(all.map(p => [p.played_at || p.playedAt, p])).values()
  );

  // 5) Clamp to window
  const windowed = uniq.filter(p => {
    const ts = DateTime.fromISO(p.played_at || p.playedAt).toMillis();
    return ts >= sinceMs && ts <= untilMs;
  });

  // 6) Aggregate total minutes
  const totalMinutes = windowed.reduce(
    (sum, i) => sum + ((i.track?.duration_ms || 0) / 60000),
    0
  );

  // 7) Collect unique artist IDs
  const artistIds = Array.from(
    new Set(
      windowed
        .map(i => i.track?.artists?.[0]?.id)
        .filter(id => !!id)
    )
  );

  // 8) Fetch real artist images in bulk
  const artistImageMap =
    artistIds.length > 0
      ? await fetchArtistImages(token, artistIds)
      : new Map();

  // 9) Build artist counts & topArtists
  const artistCounts = {};
  windowed.forEach(i => {
    const artist = i.track.artists[0];
    const name = artist.name;
    const img = artistImageMap.get(artist.id) || null;
    if (name) {
      if (!artistCounts[name]) {
        artistCounts[name] = { count: 0, artistImageUrl: img };
      }
      artistCounts[name].count++;
    }
  });

  const topArtists = Object.entries(artistCounts)
    .map(([artistName, { count, artistImageUrl }]) => ({
      artistName,
      playCount: count,
      artistImageUrl,
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  // 10) Build track stats as before (using album art for tracks)
  const trackCounts = {};
  windowed.forEach(i => {
    const trackName = i.track?.name;
    const artistName = i.track?.artists?.[0]?.name;
    const key = `${trackName}||${artistName}`;
    if (!trackCounts[key]) {
      trackCounts[key] = {
        trackName,
        artistName,
        count: 0,
        trackImageUrl: i.track?.album?.images?.[0]?.url,
      };
    }
    trackCounts[key].count++;
  });

  const topTracks = Object.values(trackCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ trackName, artistName, count, trackImageUrl }) => ({
      trackName,
      artistName,
      playCount: count,
      trackImageUrl,
    }));

  // 11) Determine date label
  const date = DateTime.fromMillis(sinceMs).toISODate();

  // 12) Upsert into Mongo
  await listeningColl.updateOne(
    { userId, since: sinceMs },
    {
      $set: {
        date,
        totalMinutesListened: totalMinutes,
        artistsListened: Object.keys(artistCounts),
        tracksListened: Object.keys(trackCounts),
        topArtists,
        topTracks,
        rawListeningData: windowed,
      },
    },
    { upsert: true }
  );
}

exports.handler = async () => {
  console.log("Starting daily music worker");
  const db = await getDb();
  const usersColl = db.collection("user");
  const listeningColl = db.collection("listeningData");

  const users = await usersColl.find({ linkedAccount: { $ne: "" } }).toArray();
  const nowUTC = DateTime.utc();
  const BATCH = parseInt(process.env.BATCH_SIZE, 10) || 10;

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);
    await Promise.all(
      batch.map(u => {
        const tz = u.timezone || "UTC";
        const localNow = nowUTC.setZone(tz);
        let sinceMs, untilMs;
        if (localNow.hour === 0 && localNow.minute < 5) {
          sinceMs = localNow.minus({ days: 1 }).startOf("day").toMillis();
          untilMs = localNow.minus({ days: 1 }).endOf("day").toMillis();
        } else {
          sinceMs = localNow.startOf("day").toMillis();
          untilMs = localNow.toMillis();
        }
        return processUser(
          u,
          sinceMs,
          untilMs,
          usersColl,
          listeningColl
        );
      })
    );
  }

  console.log("Worker complete");
  return { statusCode: 200 };
};
