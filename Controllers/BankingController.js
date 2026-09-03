const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");
const generateReference = require("../Utils/reference");
const mapProviderStatus = require("../Utils/transactionStatus");
const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const nameEnquiry = asyncHandler(async (req, res) => {
  const { bankCode, accountNumber } = req.body;

  if (!bankCode || !accountNumber) {
    throw new ApiError("bankCode and accountNumber are required", 400);
  }

  const providerResponse = await nibssByPhoenix.nameEnquiry({ bankCode, accountNumber });

  res.json({
    success: true,
    data: providerResponse,
    responseBody: providerResponse,
  });
});

const transfer = asyncHandler(async (req, res) => {
  const { accountId, bankCode, accountNumber, accountName, amount, narration } = req.body;

  if (!accountId || !bankCode || !accountNumber || !amount) {
    throw new ApiError("accountId, bankCode, accountNumber and amount are required", 400);
  }

  const sourceAccount = await Account.findById(accountId);
  if (!sourceAccount) {
    throw new ApiError("Source account not found", 404);
  }

  if (!sourceAccount.providerAccountId) {
    throw new ApiError("Source account does not have a provider account id", 400);
  }

  const reference = generateReference("TRF");

  const transaction = await Transaction.create({
    account: sourceAccount._id,
    customer: sourceAccount.customer,
    reference,
    amount: Number(amount),
    narration,
    destinationBankCode: bankCode,
    destinationAccountNumber: accountNumber,
    destinationAccountName: accountName,
    status: "pending",
  });

  const providerResponse = await nibssByPhoenix.transfer({
    providerAccountId: sourceAccount.providerAccountId,
    bankCode,
    accountNumber,
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

const transactionNotification = asyncHandler(async (req, res) => {
  const payload = req.body;
  const reference = payload.xref || payload.reference || payload.id;

  if (reference) {
    await Transaction.findOneAndUpdate(
      { reference },
      {
        providerTransactionId: payload.id,
        status: mapProviderStatus(payload.status),
        providerMessage: payload.message,
        providerPayload: payload,
      },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    message: "Notification received",
  });
});

module.exports = {
  nameEnquiry,
  transfer,
  transactionNotification,
};
