const Account = require("../Models/Account");
const Customer = require("../Models/Customer");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const createCustomerAccount = asyncHandler(async (req, res) => {
  const { customerId, accountType = "savings" } = req.body;

  if (!customerId) {
    throw new ApiError("customerId is required", 400);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  const accountAllowedStatuses = ["identity_verified", "account_created", "completed"];

  if (customer.kycStatus !== "verified" || !accountAllowedStatuses.includes(customer.onboardingStatus)) {
    throw new ApiError("Account creation is only allowed after successful BVN or NIN onboarding verification", 403);
  }

  const providerAccount = await nibssByPhoenix.createAccount({
    phone: customer.phone,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });

  const account = await Account.create({
    customer: customer._id,
    providerAccountId: providerAccount.id,
    accountName: providerAccount.account_name,
    accountNumber: providerAccount.account_number,
    accountType,
    balance: Number(providerAccount.account_balance || 0),
    kycLevel: providerAccount.kyc || customer.kycLevel,
    providerPayload: providerAccount,
  });

  customer.onboardingStatus = "account_created";
  customer.providerCustomerId = providerAccount.id;
  await customer.save();

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: account,
    provider: providerAccount,
    responseBody: providerAccount,
  });
});

const getAccounts = asyncHandler(async (req, res) => {
  const filter = req.query.customerId ? { customer: req.query.customerId } : {};
  const accounts = await Account.find(filter).populate("customer", "firstName lastName phone email");

  res.json({
    success: true,
    count: accounts.length,
    data: accounts,
  });
});

const getAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id).populate("customer", "firstName lastName phone email");

  if (!account) {
    throw new ApiError("Account not found", 404);
  }

  res.json({
    success: true,
    data: account,
  });
});

const refreshAccountFromProvider = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new ApiError("Account not found", 404);
  }

  if (!account.providerAccountId) {
    throw new ApiError("Account does not have a provider account id", 400);
  }

  const providerAccount = await nibssByPhoenix.getAccount(account.providerAccountId);

  account.accountName = providerAccount.account_name || account.accountName;
  account.accountNumber = providerAccount.account_number || account.accountNumber;
  account.balance = Number(providerAccount.account_balance || account.balance);
  account.kycLevel = providerAccount.kyc || account.kycLevel;
  account.providerPayload = providerAccount;

  await account.save();

  res.json({
    success: true,
    message: "Account refreshed successfully",
    data: account,
    provider: providerAccount,
    responseBody: providerAccount,
  });
});

module.exports = {
  createCustomerAccount,
  getAccounts,
  getAccount,
  refreshAccountFromProvider,
};
