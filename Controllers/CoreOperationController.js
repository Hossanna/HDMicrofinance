const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const generateReference = require("../Utils/reference");
const mapProviderStatus = require("../Utils/transactionStatus");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const getNameEnquiry = asyncHandler(async (req, res) => {
  const { accountNumber } = req.params;
  const { bankCode } = req.query;

  const providerResponse = await nibssByPhoenix.nameEnquiry({ bankCode, accountNumber });

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
    bankCode,
    destinationBankCode,
    accountNumber,
    destinationAccountNumber,
    accountName,
    destinationAccountName,
    amount,
    narration,
  } = req.body;

  const beneficiaryAccountNumber = destinationAccountNumber || accountNumber;
  const beneficiaryBankCode = destinationBankCode || bankCode;

  if ((!accountId && !sourceAccountNumber) || !beneficiaryBankCode || !beneficiaryAccountNumber || !amount) {
    throw new ApiError(
      "accountId or sourceAccountNumber, destination bank code, destination account number and amount are required",
      400
    );
  }

  const sourceAccount = accountId
    ? await Account.findById(accountId)
    : await Account.findOne({ accountNumber: sourceAccountNumber });

  if (!sourceAccount) {
    throw new ApiError("Source account not found", 404);
  }

  if (!sourceAccount.providerAccountId) {
    throw new ApiError("Source account does not have a provider account id", 400);
  }

  const reference = req.body.reference || req.body.ref || generateReference("TRF");
  const transaction = await Transaction.create({
    account: sourceAccount._id,
    customer: sourceAccount.customer,
    reference,
    amount: Number(amount),
    narration,
    destinationBankCode: beneficiaryBankCode,
    destinationAccountNumber: beneficiaryAccountNumber,
    destinationAccountName: destinationAccountName || accountName,
    status: "pending",
  });

  const providerResponse = await nibssByPhoenix.transfer({
    providerAccountId: sourceAccount.providerAccountId,
    bankCode: beneficiaryBankCode,
    accountNumber: beneficiaryAccountNumber,
    amount,
    narration,
    reference,
  });

  transaction.providerTransactionId = providerResponse.id;
  transaction.status = mapProviderStatus(providerResponse.status);
  transaction.fee = Number(providerResponse.fee || 0);
  transaction.providerMessage = providerResponse.message;
  transaction.providerPayload = providerResponse;
  await transaction.save();

  if (providerResponse.account_balance !== undefined) {
    sourceAccount.balance = Number(providerResponse.account_balance || sourceAccount.balance);
    await sourceAccount.save();
  }

  res.status(201).json({
    success: true,
    message: "Transfer submitted successfully",
    data: transaction,
    provider: providerResponse,
    responseBody: providerResponse,
  });
});

const getTransactionByReference = asyncHandler(async (req, res) => {
  const providerResponse = await nibssByPhoenix.checkTransaction(req.params.ref);
  const transaction = await Transaction.findOne({ reference: req.params.ref });

  if (transaction) {
    transaction.providerTransactionId = providerResponse.id || transaction.providerTransactionId;
    transaction.status = mapProviderStatus(providerResponse.status);
    transaction.providerMessage = providerResponse.message;
    transaction.providerPayload = providerResponse;
    await transaction.save();
  }

  res.json({
    success: true,
    data: {
      provider: providerResponse,
      transaction,
    },
    responseBody: providerResponse,
  });
});

const getAllFintechAccounts = asyncHandler(async (req, res) => {
  if (req.query.source === "provider") {
    const providerResponse = await nibssByPhoenix.getFintechAccounts();

    return res.json({
      success: true,
      data: providerResponse,
      responseBody: providerResponse,
    });
  }

  const accounts = await Account.find().populate("customer", "firstName lastName phone email");

  return res.json({
    success: true,
    count: accounts.length,
    data: accounts,
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

module.exports = {
  getNameEnquiry,
  transferFunds,
  getTransactionByReference,
  getAllFintechAccounts,
  getAccountBalance,
};
