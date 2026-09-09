const Account = require("../Models/Account");
const Customer = require("../Models/Customer");

const asyncHandler = require("../Middleware/asyncHandler");
const ApiError = require("../Utils/apiError");

const nibssByPhoenix = require("../Services/nibssByPhoenixService");

const formatDob = (dob) => {
  return new Date(dob).toISOString().slice(0, 10);
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

  // const account = await Account.create({
  //   customer: customer._id,

  //   accountName: `${customer.firstName} ${customer.lastName}`,

  //   accountNumber: providerAccount?.accountNumber,

  //   bankCode: providerAccount?.bankCode,

  //   bankName: providerAccount?.bankName,

  //   accountType,

  //   balance: Number(providerAccount?.balance || 0),

  //   kycLevel: "1",

  //   providerPayload: providerAccount,
  // });

  // customer.onboardingStatus = "account_created";

  // await customer.save();

  // res.status(201).json({
  //   success: true,
  //   message: "Account created successfully",
  //   data: account,
  //   provider: providerAccount,
  // });
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


module.exports = {
  createCustomerAccount,
  getCustomerAccounts,
  getAccount,
  getFintechAccounts,
  getAccountBalance,
  getNameEnquiry,
  transferFunds,

};

