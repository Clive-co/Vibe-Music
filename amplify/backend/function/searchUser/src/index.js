// searchFriends.js
const { MongoClient } = require("mongodb");

const uri      = process.env.MONGODB_URI;
const dbName   = "vibeDB";
const usersCol = "user";
const friendsCol = "friends";
const indexName = "usernameIndex";

let cachedClient = null;
async function getDb() {
  if (cachedClient?.isConnected?.()) {
    return cachedClient.db(dbName);
  }
  cachedClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await cachedClient.connect();
  return cachedClient.db(dbName);
}

exports.handler = async (event) => {
  const q = event.queryStringParameters?.q;
  if (!q) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing query `q`" }) };
  }

  const userSub = event.requestContext?.authorizer?.claims?.sub;
  if (!userSub) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  try {
    const db = await getDb();
    const results = await db
      .collection(usersCol)
      .aggregate([
        // 1) Atlas Search autocomplete
        {
          $search: {
            index: indexName,
            autocomplete: {
              query: q,
              path: "username",
              fuzzy: { maxEdits: 1 }
            }
          }
        },
        // 2) Exclude yourself
        { $match: { userId: { $ne: userSub } } },

        // 3) Lookup into the friends collection (both directions)
        {
          $lookup: {
            from: friendsCol,
            let: { candidateId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      // you -> them
                      { $and: [ { $eq: ["$userId", userSub] },       { $eq: ["$friendId", "$$candidateId"] } ] },
                      // them -> you
                      { $and: [ { $eq: ["$userId", "$$candidateId"] }, { $eq: ["$friendId", userSub]       } ] }
                    ]
                  }
                }
              },
              { $project: { _id: 0, relationshipStatus: 1 } }
            ],
            as: "friendRecord"
          }
        },
        // 4) Pull out the first (or nothing)
        { $addFields: { friendRecord: { $arrayElemAt: ["$friendRecord", 0] } } },

        // 5) Map relationshipStatus → friendshipStatus
        {
          $addFields: {
            friendshipStatus: {
              $switch: {
                branches: [
                  { case: { $eq: ["$friendRecord.relationshipStatus", "accepted"] }, then: "friends" },
                  { case: { $eq: ["$friendRecord.relationshipStatus", "pending"]  }, then: "pending" }
                ],
                default: null
              }
            }
          }
        },

        // 6) Project final shape
        {
          $project: {
            _id:              0,
            userId:           1,
            username:         1,
            profileImg:       1,
            friendshipStatus: 1
          }
        }
      ])
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error("searchFriends error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
