const Customer = require("../Models/Customer");
const Account = require("../Models/Account");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const {
  assertSandboxIdentity,
  maskkycId,
  validatekycType,
  identityVerified,
} = require("../Utils/identity");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const onboardCustomer = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    middleName,
    email,
    phone,
    kycType,
    kycId,
    dob,
    gender,
    address,
    metadata,
  } = req.body;

  if (!firstName || !lastName || !dob ) {
    throw new ApiError("firstName, lastName and DoB are required", 400);
  }

  if (!kycType || !kycId) {
    throw new ApiError("kycType and kycId are required before account creation", 400);
  }

  const verifiedKycType = validatekycType(kycType);
  const safeKycId = assertSandboxIdentity(verifiedKycType, kycId);

  const existingCustomer = await Customer.findOne({ phone });
  if (existingCustomer) {
    throw new ApiError("A customer with this phone number already exists", 409);
  }

  const customer = await Customer.create({
    firstName,
    lastName,
    middleName,
    email,
    phone,
    bvn: verifiedKycType === "bvn" ? safeKycId : undefined,
    nin: verifiedKycType === "nin" ? safeKycId : undefined,
    kycType: verifiedKycType,
    kycIdMasked: maskkycId(safeKycId),
    dob,
    gender,
    address,
    metadata,
  });

  const providerVerification = await nibssByPhoenix.verifyIdentity({
    kycType: verifiedKycType,
    kycId: safeKycId,
    customer,
  });

  if (!identityVerified(providerVerification)) {
    customer.kycStatus = "rejected";
    customer.onboardingStatus = "failed";
    customer.providerPayload = providerVerification;
    await customer.save();

    throw new ApiError("Identity verification failed. Account creation is not allowed.", 422, providerVerification);
  }

  customer.kycStatus = "verified";
  customer.onboardingStatus = "identity_verified";
  customer.identityVerificationReference = providerVerification.reference || providerVerification.id;
  customer.identityVerifiedAt = new Date();
  customer.providerPayload = providerVerification;
  await customer.save();

  res.status(201).json({
    success: true,
    message: "Customer onboarded and identity verified successfully",
    data: {
      customer,
    },
    provider: providerVerification,
    responseBody: providerVerification,
  });
});

const verifyCustomerIdentity = asyncHandler(async (req, res) => {
  const { kycType, kycId } = req.body;
  const customer = await Customer.findById(req.params.id).select("+bvn +nin");

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  const verifiedKycType = validatekycType(kycType);
  const safeKycId = assertSandboxIdentity(verifiedKycType, kycId);
  const providerVerification = await nibssByPhoenix.verifyIdentity({
    kycType: verifiedKycType,
    kycId: safeKycId,
    customer,
  });

  if (!identityVerified(providerVerification)) {
    customer.kycStatus = "rejected";
    customer.onboardingStatus = "failed";
    customer.providerPayload = providerVerification;
    await customer.save();

    throw new ApiError("Identity verification failed. Account creation is not allowed.", 422, providerVerification);
  }

  customer.kycType = verifiedKycType;
  customer.kycIdMasked = maskkycId(safeKycId);
  customer.bvn = verifiedKycType === "bvn" ? safeKycId : undefined;
  customer.nin = verifiedKycType === "nin" ? safeKycId : undefined;
  customer.kycStatus = "verified";
  customer.onboardingStatus = "identity_verified";
  customer.identityVerificationReference = providerVerification.reference || providerVerification.id;
  customer.identityVerifiedAt = new Date();
  customer.providerPayload = providerVerification;
  await customer.save();

  res.json({
    success: true,
    message: "Customer identity verified successfully",
    data: customer,
    provider: providerVerification,
    responseBody: providerVerification,
  });
});

const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  const accounts = await Account.find({ customer: customer._id });

  res.json({
    success: true,
    data: {
      customer,
      accounts,
    },
  });
});

const updateCustomerKyc = asyncHandler(async (req, res) => {
  const { kycLevel, kycStatus } = req.body;
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  if (kycLevel) customer.kycLevel = kycLevel;
  if (kycStatus) customer.kycStatus = kycStatus;
  if (kycStatus === "verified") customer.onboardingStatus = "completed";

  await customer.save();

  res.json({
    success: true,
    message: "Customer KYC updated successfully",
    data: customer,
  });
});

module.exports = {
  onboardCustomer,
  verifyCustomerIdentity,
  getCustomers,
  getCustomer,
  updateCustomerKyc,
};
