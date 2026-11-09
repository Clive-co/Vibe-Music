// dispatch.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const ddbClient = new DynamoDBClient({}); // Configure region via environment if needed.
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const sqsClient = new SQSClient({}); // Region can be set via environment

const LEAGUE_MEMBERSHIPS_TABLE = "LeagueMemberships";
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL; // Set this in your Lambda environment

/**
 * Retrieves all distinct league IDs from the LeagueMemberships table.
 * Uses a Scan with ProjectionExpression "leagueId" and paginates using lastEvaluatedKey.
 */
const getDistinctLeagueIds = async () => {
  const distinctLeagueIds = new Set();
  let params = {
    TableName: LEAGUE_MEMBERSHIPS_TABLE,
    ProjectionExpression: "leagueId"
  };
  let lastEvaluatedKey;
  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    const result = await ddbDocClient.send(new ScanCommand(params));
    if (result.Items) {
      for (const item of result.Items) {
        if (item.leagueId) {
          distinctLeagueIds.add(item.leagueId);
        }
      }
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return Array.from(distinctLeagueIds);
};

/**
 * Dispatches an SQS message for each league ID.
 */
const dispatchMessages = async (leagueIds) => {
  for (const leagueId of leagueIds) {
    const messageBody = JSON.stringify({ leagueId });
    const params = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: messageBody
    };
    try {
      await sqsClient.send(new SendMessageCommand(params));
      console.log(`Dispatched message for leagueId: ${leagueId}`);
    } catch (error) {
      console.error(`Error dispatching message for leagueId ${leagueId}:`, error);
    }
  }
};

exports.handler = async (event) => {
  try {
    console.log("Dispatch: Starting to retrieve distinct league IDs.");
    const leagueIds = await getDistinctLeagueIds();
    console.log(`Dispatch: Found ${leagueIds.length} distinct league IDs.`);
    await dispatchMessages(leagueIds);
    console.log("Dispatch: Successfully enqueued all update messages.");
  } catch (error) {
    console.error("Dispatch: Error processing weekly leaderboard precomputation:", error);
  }
};
