const crypto = require("crypto");
const ApiError = require("../Utils/apiError");
const generateReference = require("../Utils/reference");

const baseUrl = () => process.env.NIBSS_BASE_URL;
const clientId = () => process.env.NIBSS_CLIENT_ID;
const clientKey = () => process.env.NIBSS_CLIENT_KEY;
const mockMode = () => process.env.NIBSS_MOCK_MODE;
const bvnEndpoint = () => process.env.NIBSS_BVN_ONBOARDING_PATH;
const ninEndpoint = () => process.env.NIBSS_NIN_ONBOARDING_PATH;

const toMoneyString = (amount) => Number(amount || 0).toFixed(2);

const buildSignature = (nonce, body = "") => {
  const key = clientKey();

  if (!key) {
    throw new ApiError("NIBSS_CLIENT_KEY is required", 500);
  }

  const signaturePayload = `${nonce}${body}`;
  const decodedKey = Buffer.from(key, "base64");
  const signingKey = decodedKey.length ? decodedKey : Buffer.from(key);

  return crypto.createHmac("sha256", signingKey).update(signaturePayload).digest("base64");
};

const buildHeaders = (body) => {
  if (!clientId()) {
    throw new ApiError("NIBSS_CLIENT_ID is required", 500);
  }

  const nonce = `${Date.now()}${crypto.randomBytes(8).toString("hex")}`;

  return {
    ClientId: clientId(),
    Nonce: nonce,
    Signature: buildSignature(nonce, body),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const request = async (path, options = {}) => {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : "";
  const headers = buildHeaders(method === "POST" ? body : "");
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: method === "POST" ? body : undefined,
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError("NibssByPhoenix request failed", response.status, responseBody);
  }

  return responseBody;
};

const plainRequest = async (path, options = {}) => {
  const method = options.method || "GET";
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(options.body || {}),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError("NibssByPhoenix request failed", response.status, responseBody);
  }

  return responseBody;
};

const mockAccount = ({ phone, first_name, last_name }) => ({
  id: `mock_${crypto.createHash("sha1").update(phone).digest("hex").slice(0, 24)}`,
  account_name: `${first_name} ${last_name}`.trim().toUpperCase(),
  account_number: phone,
  account_balance: "0.00",
  kyc: "1",
});

const generateAuthToken = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     token: `mock_token_${crypto.randomBytes(16).toString("hex")}`,
  //     tokenType: "Bearer",
  //     expiresIn: 3600,
  //   };
  // }

  return plainRequest("/api/auth/token", {
    method: "POST",
    body: payload,
  });
};

const onboardFintech = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     status: "active",
  //     clientId: `mock_fintech_${crypto.randomBytes(8).toString("hex")}`,
  //     message: "Fintech onboarded",
  //   };
  // }

  return request("/api/fintech/onboard", {
    method: "POST",
    body: payload,
  });
};

const insertBvn = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     status: "inserted",
  //     verified: true,
  //     reference: `mock_bvn_insert_${crypto.randomBytes(8).toString("hex")}`,
  //   };
  // }

  return request("/api/insertBvn", {
    method: "POST",
    body: payload,
  });
};

const insertNin = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     status: "inserted",
  //     verified: true,
  //     reference: `mock_nin_insert_${crypto.randomBytes(8).toString("hex")}`,
  //   };
  // }

  return request("/api/insertNin", {
    method: "POST",
    body: payload,
  });
};

const validateBvn = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     status: "verified",
  //     verified: true,
  //     reference: `mock_bvn_validate_${crypto.randomBytes(8).toString("hex")}`,
  //   };
  // }

  return request("/api/validateBvn", {
    method: "POST",
    body: payload,
  });
};

const validateNin = async (payload) => {
  // if (mockMode()) {
  //   return {
  //     status: "verified",
  //     verified: true,
  //     reference: `mock_nin_validate_${crypto.randomBytes(8).toString("hex")}`,
  //   };
  // }

  return request("/api/validateNin", {
    method: "POST",
    body: payload,
  });
};

const verifyIdentity = async ({ identityType, identityValue, customer }) => {
  const payload = {
    identity_type: identityType,
    identity_value: identityValue,
    first_name: customer.firstName,
    last_name: customer.lastName,
    middle_name: customer.middleName,
    phone: customer.phone,
    date_of_birth: customer.dateOfBirth,
  };

  // if (mockMode()) {
  //   return {
  //     status: "verified",
  //     verified: true,
  //     reference: `mock_${identityType}_${crypto.randomBytes(8).toString("hex")}`,
  //     identity_type: identityType,
  //     identity_value: `${"*".repeat(identityValue.length - 4)}${identityValue.slice(-4)}`,
  //     provider: "NibssByPhoenix",
  //   };
  // }

  return request(identityType === "bvn" ? bvnEndpoint() : ninEndpoint(), {
    method: "POST",
    body: payload,
  });
};

const createAccount = async ({ phone, firstName, lastName, dob, kycType, kycId }) => {
  const payload = {
    phone,
    firstName: firstName,
    lastName: lastName,
    dob: dob,
    kycType: kycType,
    kycId: kycId
  };

  // if (mockMode()) {
  //   return mockAccount(payload);
  // }

  return request("/api/account/create", {
    method: "POST",
    body: payload,
  });
};

const getAccount = async (providerAccountId) => {
  // if (mockMode()) {
  //   return {
  //     id: providerAccountId,
  //     account_name: "MOCK CUSTOMER",
  //     account_number: "0000000000",
  //     account_balance: "0.00",
  //     kyc: "1",
  //   };
  // }

  return request(`/api/account/${providerAccountId}`);
};

const nameEnquiry = async ({ bankCode, accountNumber }) => {
  // if (mockMode()) {
  //   return {
  //     account_number: accountNumber,
  //     account_name: "MOCK BENEFICIARY",
  //   };
  // }

  const query = new URLSearchParams();
  if (bankCode) query.set("bankCode", bankCode);

  return request(`/api/account/name-enquiry/${accountNumber}${query.toString() ? `?${query.toString()}` : ""}`);
};

const transfer = async ({ providerAccountId, bankCode, accountNumber, amount, narration, reference }) => {
  const payload = {
    xref: reference || generateReference("TRF"),
    bank_code: bankCode,
    account_number: accountNumber,
    amount: toMoneyString(amount),
    narration,
  };

  // if (mockMode()) {
  //   return {
  //     timestamp: new Date().toISOString(),
  //     id: `mock_txn_${crypto.randomBytes(10).toString("hex")}`,
  //     xref: payload.xref,
  //     sequence: "1",
  //     status: "ok",
  //     message: "SENT",
  //     amount: payload.amount,
  //     fee: "0.00",
  //     account_number: accountNumber,
  //     account_balance: "0.00",
  //   };
  // }

  return request("/api/transfer", {
    method: "POST",
    body: {
      ...payload,
      source_account_id: providerAccountId,
    },
  });
};

const checkTransaction = async (reference) => {
  // if (mockMode()) {
  //   return {
  //     timestamp: new Date().toISOString(),
  //     id: `mock_txn_${reference}`,
  //     xref: reference,
  //     sequence: "1",
  //     status: "ok",
  //     message: "SENT",
  //     amount: "0.00",
  //   };
  // }

  return request(`/api/transaction/${reference}`);
};

const getTransactions = async (providerAccountId) => {
  // if (mockMode()) {
  //   return {
  //     count: 0,
  //     transactions: [],
  //   };
  // }

  return request(`/api/accounts/${providerAccountId}/transactions`);
};

const getFintechAccounts = async () => {
  // if (mockMode()) {
  //   return {
  //     count: 0,
  //     accounts: [],
  //   };
  // }

  return request("/api/accounts");
};

const getAccountBalance = async (accountNumber) => {
  // if (mockMode()) {
  //   return {
  //     account_number: accountNumber,
  //     balance: "0.00",
  //     currency: "NGN",
  //   };
  // }

  return request(`/api/account/balance/${accountNumber}`);
};

module.exports = {
  generateAuthToken,
  onboardFintech,
  insertBvn,
  insertNin,
  validateBvn,
  validateNin,
  verifyIdentity,
  createAccount,
  getAccount,
  getFintechAccounts,
  getAccountBalance,
  nameEnquiry,
  transfer,
  checkTransaction,
  getTransactions,
};
