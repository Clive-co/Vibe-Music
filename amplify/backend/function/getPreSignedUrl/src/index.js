const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl }             = require("@aws-sdk/s3-request-presigner");

const BUCKET = process.env.BUCKET_NAME;
const REGION = process.env.REGION;

const s3 = new S3Client({ region: REGION });
const CORS = {
  "Content-Type":                "application/json",
  "Access-Control-Allow-Origin": "*",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    // Handle preflight
    return { statusCode: 204, headers: { 
      ...CORS,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }};
  }

  const claims = event.requestContext.authorizer?.claims || {};
  const userId = claims.sub;
  if (!userId) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ message: "Invalid JSON" }) };
  }

  const { fileName, fileType } = body;
  if (!fileName || !fileType) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ message: "Missing fileName or fileType" }) };
  }
  // simple whitelist validation
  if (!/^[\w\-]+\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ message: "Invalid fileName" }) };
  }

  const key = `profile-images/${fileName}`;
  const cmd = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    const fileUrl   = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ uploadUrl, fileUrl }),
    };
  } catch (err) {
    console.error("Presign error:", err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ message: "Could not generate presigned URL" }),
    };
  }
};
