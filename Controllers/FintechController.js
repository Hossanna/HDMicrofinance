const crypto = require("crypto");
const Fintech = require("../Models/Fintech");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const onboardFintech = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email) {
    throw new ApiError("name and email are required", 400);
  }

  const providerResponse = await nibssByPhoenix?.onboardFintech(req.body);

  const fintech = await Fintech.create({
    name,
    email,
    phone,
    providerPayload: providerResponse,
  });

  res.status(201).json({
    success: true,
    message: "Fintech onboarded successfully",
    data: fintech,
    // provider: providerResponse,
    // responseBody: providerResponse,
  });
});

module.exports = {
  onboardFintech,
};
