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

const insertBvn = asyncHandler(async (req, res) => {
  const {
    bvn,
    firstName,
    lastName,
    dob,
    phone,
  } = req.body;

  if (!bvn || !firstName || !lastName || !dob || !phone) {
    throw new ApiError(
      "bvn, firstName, lastName, dob and phone are required",
      400
    );
  }

  const response = await nibssByPhoenix.insertBvn({
    bvn,
    firstName,
    lastName,
    dob,
    phone,
  });

  res.status(201).json({
    success: true,
    message: "BVN inserted successfully",
    data: response,
  });
});

const validateBvn = asyncHandler(async (req, res) => {
  const { bvn } = req.body;

  if (!bvn) {
    throw new ApiError("bvn is required", 400);
  }

  const response =
    await nibssByPhoenix.validateBvn(bvn);

  res.json({
    success: true,
    message: "BVN validated successfully",
    data: response,
  });
});

module.exports = {
  insertNin,
  validateNin,
  insertBvn,
  validateBvn,
};