import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const USER_TABLE = "user"; 

// Helper: Compute the previous week's Monday and Sunday dates as YYYY-MM-DD strings
// Week definition: Monday (start) through Sunday (end)
function computeWeekBoundaries() {
  const now = new Date(); // Assume this runs on Monday early morning
  // Move back 7 days to get a reference for the previous week
  const ref = new Date(now);
  ref.setDate(now.getDate() - 7);

  // Calculate previous Monday:
  const dayOfWeek = ref.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  // If ref is not Monday, shift back to Monday (day 1). For Sunday, treat as day 0 so we subtract 6.
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - diffToMonday);

  // Calculate Sunday by adding 6 days to Monday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Helper to format a Date as YYYY-MM-DD
  const formatDate = date => date.toISOString().split("T")[0];

  return { weekStart: formatDate(monday), weekEnd: formatDate(sunday) };
}

export const dispatchHandler = async (event, context) => {
  try {
    const { weekStart, weekEnd } = computeWeekBoundaries();
    
    // Scan the user table but only include users with a connected music provider.
    // Filter out records where linkedAccount is "none".
    const { Items: users } = await dynamoDB.scan({
      TableName: USER_TABLE,
      ProjectionExpression: "id, linkedAccount",
      FilterExpression: "linkedAccount <> :none",
      ExpressionAttributeValues: {
         ":none": "none"
      }
    }).promise();
    
    // For each eligible user, push a message with the userId and week boundaries
    for (const user of users) {
      const messageBody = JSON.stringify({
        userId: user.id,
        weekStart,  // e.g., "2023-03-13"
        weekEnd     // e.g., "2023-03-19"
      });
      
      await sqs.sendMessage({
        QueueUrl: process.env.WEEKLY_RECAP_QUEUE_URL, 
        MessageBody: messageBody
      }).promise();
    }
    
    return { statusCode: 200, body: "Dispatched weekly recap messages for eligible users." };
  } catch (error) {
    console.error("Error dispatching weekly recap messages:", error);
    return { statusCode: 500, body: "Error dispatching messages" };
  }
};
