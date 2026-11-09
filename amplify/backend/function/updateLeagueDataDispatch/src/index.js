const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize DynamoDB and SQS clients
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const sqsClient = new SQSClient({}); // Region can be set via environment variables

const WEEKLY_RECAPS_TABLE = "weeklyRecaps";
const LEAGUE_MEMBERSHIPS_TABLE = "LeagueMemberships";
// SQS queue URL; set via environment variable
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

/**
 * Get the most recent Monday's date in YYYY-MM-DD format.
 */
const getPreviousMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Calculate diff: if Sunday (0), treat as 6 days since Monday; otherwise, dayOfWeek - 1.
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const previousMonday = new Date(today);
  previousMonday.setUTCDate(today.getUTCDate() - diff);
  return previousMonday.toISOString().split("T")[0]; // Format: YYYY-MM-DD
};

/**
 * Retrieves all league membership records that need updating.
 * This uses a Scan (without a GSI) and a FilterExpression that returns records where 
 * the 'lastUpdatedWeek' attribute does not exist or does not match the current weekStart.
 * 
 * Note on lastEvaluatedKey: DynamoDB Scan requests return up to 1 MB of data. If your table 
 * is larger than that, DynamoDB returns a LastEvaluatedKey. You then pass that key in ExclusiveStartKey
 * to retrieve the next batch. The code below loops until all records are scanned.
 */
const getMembershipsToUpdate = async (weekStart) => {
  let memberships = [];
  const params = {
    TableName: LEAGUE_MEMBERSHIPS_TABLE,
    FilterExpression: "attribute_not_exists(lastUpdatedWeek) OR lastUpdatedWeek <> :weekStart",
    ExpressionAttributeValues: {
      ":weekStart": weekStart
    }
  };

  let lastEvaluatedKey;
  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    const result = await ddbDocClient.send(new ScanCommand(params));
    memberships = memberships.concat(result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return memberships;
};

/**
 * Dispatches an SQS message for each membership record that needs updating.
 */
const dispatchMessages = async (memberships, weekStart) => {
  for (const membership of memberships) {
    const { leagueId, userId } = membership;
    const messageBody = JSON.stringify({ leagueId, userId, weekStart });
    const params = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: messageBody,
    };
    try {
      await sqsClient.send(new SendMessageCommand(params));
      console.log(`Dispatched SQS message for user ${userId} in league ${leagueId}.`);
    } catch (error) {
      console.error(`Error sending SQS message for user ${userId}:`, error);
    }
  }
};

/**
 * Lambda Handler for Dispatch Function.
 * This function should be scheduled (e.g., via EventBridge) to run weekly.
 */
exports.handler = async (event) => {
  try {
    const weekStart = getPreviousMonday();
    console.log(`Dispatch: Processing updates for week starting: ${weekStart}`);

    // Get all membership records that haven't been updated for the current week.
    const memberships = await getMembershipsToUpdate(weekStart);
    console.log(`Dispatch: Found ${memberships.length} membership records to update.`);

    // Enqueue each record as an SQS message.
    await dispatchMessages(memberships, weekStart);

    console.log("Dispatch: Successfully enqueued all update messages.");
  } catch (error) {
    console.error("Dispatch: Error processing weekly recap updates:", error);
  }
};
