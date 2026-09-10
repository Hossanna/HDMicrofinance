const Account = require("../Models/Account");
const Customer = require("../Models/Customer");
const Transaction = require("../Models/Transaction");
const generateReference = require("../Utils/reference");

const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");

const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const formatDob = (dob) => {
  return new Date(dob).toISOString().slice(0, 10);
};

const mapProviderStatus = (status) => {
  if (!status) {
    return "pending";
  }

  const normalizedStatus = String(status).toLowerCase();

  if (
    normalizedStatus === "success" ||
    normalizedStatus === "successful" ||
    normalizedStatus === "completed"
  ) {
    return "successful";
  }

  if (
    normalizedStatus === "failed" ||
    normalizedStatus === "failure"
  ) {
    return "failed";
  }

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "processing"
  ) {
    return "pending";
  }

  return "pending";
};


const createCustomerAccount = asyncHandler(async (req, res) => {
  const { customerId, accountType = "savings" } = req.body;

  if (!customerId) {
    throw new ApiError("customerId is required", 400);
  }

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  if (!customer.kycType || !customer.kycID) {
    throw new ApiError("Customer KYC information is required", 400);
  }

  if (!customer.dob) {
    throw new ApiError("Customer date of birth is required", 400);
  }

  const dob = formatDob(customer.dob);

  const providerAccount = await nibssByPhoenix.createAccount({
    kycType: customer.kycType,
    kycID: customer.kycID,
    dob,
  });

  console.log("Phoenix account response:", providerAccount);

  const account = await Account.create({
    customer: customer._id,

    accountName: `${customer.firstName} ${customer.lastName}`,

    accountNumber: providerAccount.account.accountNumber,

    bankCode: providerAccount.account.bankCode,

    kycType: providerAccount.account.kycType,

    accountType,

    balance: Number(providerAccount.account.balance || 0),

    kycLevel: "1",

    providerPayload: providerAccount,
  });

  customer.onboardingStatus = "account_created";

  await customer.save();

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: account,
    provider: providerAccount,
  });
});

const getCustomerAccounts = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  if (!customerId) {
    throw new ApiError("customerId is required", 400);
  }

  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  const accounts = await Account.find({ customer: customerId });

  res.json({
    success: true,
    count: accounts.length,
    data: accounts,
  });
});

const getAccount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;

  if (!accountId) {
    throw new ApiError("accountId is required", 400);
  }

  const account = await Account.findById(accountId);

  if (!account) {
    throw new ApiError("Account not found", 404);
  }

  res.json({
    success: true,
    data: account,
  });
});


const getFintechAccounts = asyncHandler(async (req, res) => {
  
    const providerResponse = await nibssByPhoenix.getFintechAccounts();
  
    return res.json({
      success: true,
      data: providerResponse,
      responseBody: providerResponse,
      count: providerResponse.length,
    });


  
});

const getAccountBalance = asyncHandler(async (req, res) => {
  const { accountNumber } = req.params;
  const account = await Account.findOne({ accountNumber });
  const providerResponse = await nibssByPhoenix.getAccountBalance(accountNumber);

  if (account) {
    account.balance = Number(providerResponse.balance || providerResponse.account_balance || account.balance);
    account.providerPayload = providerResponse;
    await account.save();
  }

  res.json({
    success: true,
    data: {
      provider: providerResponse,
      account,
    },
    responseBody: providerResponse,
  });
});

const getNameEnquiry = asyncHandler(async (req, res) => {
  const { accountNumber } = req.params;
  // const { bankCode } = req.query;

  const providerResponse = await nibssByPhoenix.nameEnquiry(accountNumber);

  res.json({
    success: true,
    data: providerResponse,
    responseBody: providerResponse,
  });
});

const transferFunds = asyncHandler(async (req, res) => {
  const {
    accountId,
    sourceAccountNumber,
    destinationAccountNumber,
    accountNumber,
    destinationAccountName,
    accountName,
    amount,
    narration,
    reference: requestReference,
    ref,
  } = req.body;

  const beneficiaryAccountNumber =
    destinationAccountNumber || accountNumber;

  if ((!accountId && !sourceAccountNumber) ||
      !beneficiaryAccountNumber ||
      !amount) {
    throw new ApiError(
      "accountId or sourceAccountNumber, destination account number and amount are required",
      400
    );
  }

  const sourceAccount = accountId
    ? await Account.findById(accountId)
    : await Account.findOne({
        accountNumber: sourceAccountNumber,
      });

  if (!sourceAccount) {
    throw new ApiError("Source account not found", 404);
  }

  if (!sourceAccount.accountNumber) {
    throw new ApiError(
      "Source account does not have an account number",
      400
    );
  }

  const reference =
    requestReference ||
    ref ||
    generateReference("TRF");

  // Create our local transaction first
  const transaction = await Transaction.create({
    account: sourceAccount._id,
    customer: sourceAccount.customer,
    reference,
    amount: Number(amount),
    narration,
    destinationAccountNumber: beneficiaryAccountNumber,
    destinationAccountName:
      destinationAccountName || accountName,
    status: "pending",
  });

  // Phoenix transfer
  const providerResponse = await nibssByPhoenix.transfer({
    from: sourceAccount.accountNumber,
    to: beneficiaryAccountNumber,
    amount: String(amount),
  });

  console.log("Phoenix transfer response:", providerResponse);

  // Save provider response
  transaction.providerPayload = providerResponse;

  if (providerResponse.transactionId) {
    transaction.providerTransactionId =
      providerResponse.transactionId;
  }

  if (providerResponse._id) {
    transaction.providerTransactionId =
      providerResponse.id;
  }

  if (providerResponse.status) {
    transaction.status =
      mapProviderStatus(providerResponse.status);
  }

  if (providerResponse.message) {
    transaction.providerMessage =
      providerResponse.message;
  }

  await transaction.save();

  res.status(201).json({
    success: true,
    message: "Transfer submitted successfully",
    data: transaction,
    provider: providerResponse,
  });
});


const getTransactionByReference = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  if (!reference) {
    throw new ApiError("reference is required", 400);
  }

  const transaction = await Transaction.findOne({
    reference: reference.trim(),
  });

  if (!transaction) {
    throw new ApiError("Transaction not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Transaction retrieved successfully",
    data: transaction,
  });
});


module.exports = {
  createCustomerAccount,
  getCustomerAccounts,
  getAccount,
  getFintechAccounts,
  getAccountBalance,
  getNameEnquiry,
  transferFunds,
  getTransactionByReference,
};

