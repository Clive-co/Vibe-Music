// listFriendsOfFriend.js

const { MongoClient } = require("mongodb")

// Cache the MongoClient & DB across invocations
let cachedClient = null
let cachedDb = null

async function getDb() {
  if (cachedDb) return cachedDb
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("Missing MONGODB_URI environment variable")

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    await cachedClient.connect()
  }

  cachedDb = cachedClient.db("vibeDB")
  return cachedDb
}

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2))

  // 1) Authenticated user
  const userId = event.requestContext?.authorizer?.claims?.sub
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Unauthorized" }),
    }
  }

  // 2) friendId passed as ?friendId=…
  const friendId = event.queryStringParameters?.friendId
  if (!friendId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Missing friendId parameter" }),
    }
  }

  try {
    const db = await getDb()
    const friendsColl = db.collection("friends")
    const usersColl   = db.collection("user")

    // 3) Find all accepted friends of that friendId
    const secondDegree = await friendsColl
      .find({ userId: friendId, relationshipStatus: "accepted" })
      .toArray()

    const secondIds = secondDegree.map(f => f.friendId)

    // Always include yourself, even if not in secondDegree
    if (!secondIds.includes(userId)) {
      secondIds.push(userId)
    }

    // 4) Fetch their profiles
    const profiles = await usersColl
      .find({ userId: { $in: secondIds } })
      .project({ userId:1, username:1, profileImg:1, desc:1, _id:0 })
      .toArray()

    const profileMap = new Map(profiles.map(u => [u.userId, u]))

    // 5) Fetch your relationship to each of those second‑degree friends
    const relations = await friendsColl
      .find({
        userId: userId,
        friendId: { $in: secondIds }
      })
      .toArray()

    // 6) Build a quick lookup: friendId → relationshipStatus
    const relMap = new Map()
    for (let r of relations) {
      relMap.set(r.friendId, r.relationshipStatus)
    }

    // 7) Assemble response, overriding self to "accepted"
    const results = secondIds.map(fid => {
      const p = profileMap.get(fid) || {}
      let status = relMap.get(fid) || "none"
      if (fid === userId) {
        status = "accepted"
      }
      return {
        userId:          fid,
        username:        p.username   || null,
        profileImg:      p.profileImg || null,
        desc:            p.desc       || null,
        friendshipStatus: status
      }
    })

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(results),
    }
  } catch (err) {
    console.error("Error in listFriendsOfFriend:", err)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Could not load friends of friend",
        details: err.message
      }),
    }
  }
}
