const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const mapProviderStatus = require("../Utils/transactionStatus");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const getTransactions = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.accountId) filter.account = req.query.accountId;
  if (req.query.customerId) filter.customer = req.query.customerId;
  if (req.query.status) filter.status = req.query.status;

  const transactions = await Transaction.find(filter)
    .populate("account", "accountName accountNumber accountType")
    .populate("customer", "firstName lastName phone email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: transactions.length,
    data: transactions,
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("account", "accountName accountNumber accountType")
    .populate("customer", "firstName lastName phone email");

  if (!transaction) {
    throw new ApiError("Transaction not found", 404);
  }

  res.json({
    success: true,
    data: transaction,
  });
});

const checkTransaction = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const providerResponse = await nibssByPhoenix.checkTransaction(reference);
  const transaction = await Transaction.findOne({ reference });

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

const getProviderTransactions = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.accountId);

  if (!account) {
    throw new ApiError("Account not found", 404);
  }

  if (!account.providerAccountId) {
    throw new ApiError("Account does not have a provider account id", 400);
  }

  const providerResponse = await nibssByPhoenix.getTransactions(account.providerAccountId);

  res.json({
    success: true,
    data: providerResponse,
    responseBody: providerResponse,
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  checkTransaction,
  getProviderTransactions,
};
