import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const USER_TABLE = "user"; // Use your correct table name

export const dispatcherHandler = async (event, context) => {
  try {
    // Scan the user table for all items
    const { Items: users } = await dynamoDB.scan({ TableName: USER_TABLE }).promise();

    // For each user with a linked account, push a message to the SQS queue
    for (const user of users) {
      if (user.linkedAccount === "none") continue;

      const messageBody = JSON.stringify({
        userId: user.id,
        linkedAccount: user.linkedAccount,
        spotifyAccessToken: user.spotifyAccessToken,
        spotifyRefreshToken: user.spotifyRefreshToken,
        spotifyTokenExpiration: user.spotifyTokenExpiration,
        appleMusicAccessToken: user.appleMusicAccessToken,
      });

      await sqs.sendMessage({
        QueueUrl: process.env.USER_QUEUE_URL, // Set this in Lambda environment variables
        MessageBody: messageBody,
      }).promise();
    }

    return { statusCode: 200, body: "Dispatched user messages to SQS." };
  } catch (error) {
    console.error("Error dispatching messages:", error);
    return { statusCode: 500, body: "Error dispatching user messages to SQS." };
  }
};
