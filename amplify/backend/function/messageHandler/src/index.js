// Updated messageHandler.js

const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

// Cache the MongoDB client across Lambda invocations
let cachedClient = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  // 1. Parse & validate
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  const { 
    action, 
    chatId, 
    content, 
    clientTempId, 
    type, 
    mediaUrl, 
    fileName, 
    fileSize,
    // New fields for reactions
    trackData,
    emoji,
    reactorUsername
  } = payload;
  
  if (action !== "sendMessage" || !chatId || !type) {
    return { statusCode: 400, body: "Bad request" };
  }

  // Validate message content - either text content, media, or reaction
  if (!content && !mediaUrl && type !== 'reaction') {
    return { statusCode: 400, body: "Message must have either content or media" };
  }

  // Validate message type
  const validTypes = ['text', 'image', 'document', 'reaction'];
  if (!validTypes.includes(type)) {
    return { statusCode: 400, body: "Invalid message type" };
  }

  // Additional validation for reaction messages
  if (type === 'reaction') {
    if (!trackData || !emoji || !reactorUsername) {
      return { statusCode: 400, body: "Reaction messages must include trackData, emoji, and reactorUsername" };
    }
    if (!trackData.trackName || !trackData.artistName) {
      return { statusCode: 400, body: "Track data must include trackName and artistName" };
    }
  }

  // 2. Auth
  const auth = event.requestContext.authorizer;
  const senderId = auth.sub || auth.jwt?.claims?.sub || auth.claims?.sub;
  if (!senderId) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // 3. Generate IDs & timestamps
  const messageId = uuidv4();
  const timestamp = Date.now();

  // 4. Connect to Mongo
  let client;
  try {
    client = await connectToDatabase();
  } catch (err) {
    console.error("DB connect error:", err);
    return { statusCode: 500, body: "DB connection failed" };
  }
  const db = client.db("vibeDB");
  const messages = db.collection("messages");
  const chats = db.collection("chats");
  const connectionsCol = db.collection("connections");

  // 5. Get sender info and validate chat
  const userDoc = await db.collection("user").findOne({ userId: senderId });
  if (!userDoc) {
    return { statusCode: 404, body: "Sender not found in user collection" };
  }
  const senderName = userDoc.username;
  const senderImg = userDoc.profileImg;

  const chatDoc = await chats.findOne({ chatId });
  if (!chatDoc) {
    return { statusCode: 404, body: "Chat not found" };
  }

  // 6. Prepare message document
  const messageDoc = {
    chatId,
    messageId,
    senderId,
    senderName,
    senderImg,
    content: content || '',
    type,
    timestamp,
  };

  // Add media fields if present
  if (mediaUrl) {
    messageDoc.mediaUrl = mediaUrl;
  }
  if (fileName) {
    messageDoc.fileName = fileName;
  }
  if (fileSize) {
    messageDoc.fileSize = fileSize;
  }

  // Add reaction-specific fields
  if (type === 'reaction' && trackData) {
    messageDoc.trackData = {
      trackName: trackData.trackName,
      artistName: trackData.artistName,
      trackImageUrl: trackData.trackImageUrl || '',
      trackId: trackData.trackId || ''
    };
    messageDoc.emoji = emoji;
    messageDoc.reactorUsername = reactorUsername;
  }

  // 7. Persist message
  await messages.insertOne(messageDoc);

  // 8. Update chat's lastMessage
  let lastMessageContent;
  if (type === 'reaction') {
    lastMessageContent = `${reactorUsername} reacted ${emoji} to a track`;
  } else {
    lastMessageContent = content || (fileName ? `📎 ${fileName}` : getMessagePreview(type));
  }
  
  await chats.updateOne(
    { chatId },
    {
      $set: {
        lastMessage: {
          content: lastMessageContent,
          senderId,
          senderName,
          senderImg,
          timestamp,
          type,
        },
      },
    }
  );

  // 9. Bump unread counts
  const incOps = {};
  (chatDoc.participants || [])
    .filter((uid) => uid !== senderId)
    .forEach((uid) => {
      incOps[`unreadCounts.${uid}`] = 1;
    });
  const setOps = { [`unreadCounts.${senderId}`]: 0 };

  await chats.updateOne(
    { chatId },
    {
      $inc: incOps,
      $set: setOps,
    }
  );

  // 10. Real-time fan‑out
  const domain = event.requestContext.domainName; 
  const stage = event.requestContext.stage; 
  const gateway = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: `${domain}/${stage}`,
  });

  const recipients = chatDoc.participants || [];
  const activeConnections = await connectionsCol
    .find({ userId: { $in: recipients } })
    .toArray();

  // Prepare WebSocket message data
  const wsMessageData = {
    chatId,
    messageId,
    clientTempId: clientTempId || null,
    senderId,
    senderName,
    senderImg,
    content: content || '',
    type,
    timestamp,
  };

  // Add media fields to WebSocket message if present
  if (mediaUrl) {
    wsMessageData.mediaUrl = mediaUrl;
  }
  if (fileName) {
    wsMessageData.fileName = fileName;
  }
  if (fileSize) {
    wsMessageData.fileSize = fileSize;
  }

  // Add reaction fields to WebSocket message if present
  if (type === 'reaction' && trackData) {
    wsMessageData.trackData = trackData;
    wsMessageData.emoji = emoji;
    wsMessageData.reactorUsername = reactorUsername;
  }

  const messageFrame = JSON.stringify({
    action: "newMessage",
    data: wsMessageData,
  });

  await Promise.all(
    activeConnections.map((conn) =>
      gateway
        .postToConnection({ ConnectionId: conn.connectionId, Data: messageFrame })
        .promise()
        .catch((err) => {
          if (err.statusCode === 410) {
            return connectionsCol.deleteOne({ connectionId: conn.connectionId });
          }
          console.error("postToConnection error:", err);
        })
    )
  );

  // 11. Done
  return { 
    statusCode: 200, 
    body: JSON.stringify({ 
      messageId, 
      timestamp,
      message: "Message sent successfully" 
    })
  };
};

// Helper function to get message preview based on type
function getMessagePreview(type) {
  switch (type) {
    case 'image':
      return '📷 Image';
    case 'document':
      return '📄 Document';
    case 'reaction':
      return '❤️ Reaction';
    default:
      return 'Message';
  }
}