const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse:   "id",
  clientId:   process.env.USER_POOL_CLIENT_ID,
});

/**
 * Build an IAM policy that grants or denies
 * execute-api:Invoke on the exact route ARN.
 */
function buildPolicy(principalId, effect, methodArn, context = {}) {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [{
        Action:   "execute-api:Invoke",
        Effect:   effect,
        Resource: methodArn,    // ← GRANT exactly this route
      }],
    },
    context,
  };
}

exports.handler = async (event) => {
  console.log("=== AUTHORIZER DEBUG START ===");
  console.log("Full event:", JSON.stringify(event, null, 2));
  console.log("USER_POOL_ID:", process.env.USER_POOL_ID);
  console.log("USER_POOL_CLIENT_ID:", process.env.USER_POOL_CLIENT_ID);

  // Extract token from header or querystring
  let token = Array.isArray(event.identitySource)
    ? event.identitySource[0]
    : event.identitySource;
  if (!token && event.queryStringParameters?.token) {
    token = event.queryStringParameters.token;
  }
  console.log("Token extracted:", token ? "Yes" : "No");

  if (!token) {
    return buildPolicy("anonymous", "Deny", event.methodArn);
  }

  try {
    console.log("🔍 Verifying token…");
    const payload = await verifier.verify(token);
    console.log("✅ Token payload:", payload);

    // Allow this exact route
    return buildPolicy(
      payload.sub,
      "Allow",
      event.methodArn,
      { sub: payload.sub, username: payload["cognito:username"] }
    );
  } catch (err) {
    console.log("❌ Verification failed:", err);
    return buildPolicy("unauthorized", "Deny", event.methodArn);
  } finally {
    console.log("=== AUTHORIZER DEBUG END ===");
  }
};
