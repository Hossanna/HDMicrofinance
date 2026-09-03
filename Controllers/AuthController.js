const jwt = require("jsonwebtoken");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const generateToken = asyncHandler(async (req, res) => {
  const { apiKey, apiSecret } = req.body;

  if (!apiKey || !apiSecret) {
    throw new ApiError("apiKey and apiSecret are required", 400);
  }

  if (process.env.NIBSS_CLIENT_ID && apiKey !== process.env.NIBSS_CLIENT_ID) {
    throw new ApiError("Invalid client credentials", 401);
  }

  if (process.env.NIBSS_CLIENT_SECRET && apiSecret !== process.env.NIBSS_CLIENT_SECRET) {
    throw new ApiError("Invalid client credentials", 401);
  }

  const providerToken = await nibssByPhoenix.generateAuthToken({ apiKey, apiSecret });
  

  const token = jwt.sign(
    {
      apiKey,
      providerToken: providerToken.token || providerToken.access_token,
      type: "fintech",
    },
    process.env.JWT_SECRET || "hdmicrofinance-dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "6h" }
  );

  res.json({
    success: true,
    message: "Token generated successfully",
    data: {
      token,
      provider: providerToken,
    },
    // responseBody: providerToken,
  });
});

module.exports = {
  generateToken,
};
