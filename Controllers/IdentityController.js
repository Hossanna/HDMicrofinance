const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const insertNin = asyncHandler(async (req, res) => {
  const {
    nin,
    firstName,
    lastName,
    dob,
  } = req.body;

  if (!nin || !firstName || !lastName || !dob) {
    throw new ApiError(
      "nin, firstName, lastName and dob are required",
      400
    );
  }

  const response = await nibssByPhoenix.insertNin({
    nin,
    firstName,
    lastName,
    dob,
  });

  res.status(201).json({
    success: true,
    message: "NIN inserted successfully",
    data: response,
  });
});

const validateNin = asyncHandler(async (req, res) => {
  const { nin } = req.body;

  if (!nin) {
    throw new ApiError("nin is required", 400);
  }

  const response =
    await nibssByPhoenix.validateNin(nin);

  res.json({
    success: true,
    message: "NIN validated successfully",
    data: response,
  });
});

module.exports = {
  insertNin,
  validateNin,
};