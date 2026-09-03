const IdentityRecord = require("../Models/IdentityRecord");
const asyncHandler = require("../Middleware/asyncHandler");
const {
  assertSandboxIdentity,
  identityVerified,
  maskIdentityValue,
} = require("../Utils/identity");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const buildHolderName = (body) => {
  return [body.firstName, body.middleName, body.lastName].filter(Boolean).join(" ");
};

const insertIdentity = (type) =>
  asyncHandler(async (req, res) => {
    const identityValue = req.body[type] || req.body[`${type}Number`] || req.body.identityValue;
    const safeIdentityValue = assertSandboxIdentity(type, identityValue);
    const providerResponse =
      type === "bvn"
        ? await nibssByPhoenix.insertBvn({ ...req.body, bvn: safeIdentityValue })
        : await nibssByPhoenix.insertNin({ ...req.body, nin: safeIdentityValue });

    const identityRecord = await IdentityRecord.create({
      type,
      valueMasked: maskIdentityValue(safeIdentityValue),
      holderName: req.body.holderName || buildHolderName(req.body),
      phone: req.body.phone,
      status: "inserted",
      providerReference: providerResponse.reference || providerResponse.id,
      providerPayload: providerResponse,
      metadata: req.body.metadata,
    });

    res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} inserted successfully`,
      data: identityRecord,
      provider: providerResponse,
      responseBody: providerResponse,
    });
  });

const validateIdentity = (type) =>
  asyncHandler(async (req, res) => {
    const identityValue = req.body[type] || req.body[`${type}Number`] || req.body.identityValue;
    const safeIdentityValue = assertSandboxIdentity(type, identityValue);
    const providerResponse =
      type === "bvn"
        ? await nibssByPhoenix.validateBvn({ ...req.body, bvn: safeIdentityValue })
        : await nibssByPhoenix.validateNin({ ...req.body, nin: safeIdentityValue });

    if (!identityVerified(providerResponse)) {
      throw new ApiError(`${type.toUpperCase()} validation failed`, 422, providerResponse);
    }

    const identityRecord = await IdentityRecord.findOneAndUpdate(
      { type, valueMasked: maskIdentityValue(safeIdentityValue) },
      {
        type,
        valueMasked: maskIdentityValue(safeIdentityValue),
        holderName: req.body.holderName || buildHolderName(req.body),
        phone: req.body.phone,
        status: "validated",
        providerReference: providerResponse.reference || providerResponse.id,
        providerPayload: providerResponse,
        metadata: req.body.metadata,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `${type.toUpperCase()} validated successfully`,
      data: identityRecord,
      provider: providerResponse,
      responseBody: providerResponse,
    });
  });

module.exports = {
  insertBvn: insertIdentity("bvn"),
  insertNin: insertIdentity("nin"),
  validateBvn: validateIdentity("bvn"),
  validateNin: validateIdentity("nin"),
};
