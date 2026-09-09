const ApiError = require("../Utils/apiError");

const baseUrl = () => {
  if (!process.env.NIBSS_BASE_URL) {
    throw new ApiError("NIBSS_BASE_URL is required", 500);
  }

  return process.env.NIBSS_BASE_URL;
};

let phoenixToken = null;
let phoenixTokenExpiresAt = 0;

const plainRequest = async (path, options = {}) => {
  const method = options.method || "GET";

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body:
      method === "GET"
        ? undefined
        : JSON.stringify(options.body || {}),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      "NibssByPhoenix request failed",
      response.status,
      responseBody
    );
  }

  return responseBody;
};

const getPhoenixToken = async () => {
  if (
    phoenixToken &&
    Date.now() < phoenixTokenExpiresAt
  ) {
    return phoenixToken;
  }

  const apiKey = process.env.NIBSS_CLIENT_ID;
  const apiSecret = process.env.NIBSS_CLIENT_SECRET;

  if (!apiKey || !apiSecret) {
    throw new ApiError(
      "NIBSS_CLIENT_ID and NIBSS_CLIENT_SECRET are required",
      500
    );
  }

  const response = await plainRequest("/api/auth/token", {
    method: "POST",
    body: {
      apiKey,
      apiSecret,
    },
  });

  if (!response.token) {
    throw new ApiError(
      "Phoenix authentication succeeded but no token was returned",
      500,
      response
    );
  }

  phoenixToken = response.token;

  // Phoenix documentation says token expires after 1 hour.
  // Refresh 30 seconds early.
  phoenixTokenExpiresAt =
    Date.now() + (60 * 60 - 30) * 1000;

  return phoenixToken;
};

const request = async (path, options = {}) => {
  const method = options.method || "GET";
  const token = await getPhoenixToken();

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body:
      method === "GET"
        ? undefined
        : JSON.stringify(options.body || {}),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      "NibssByPhoenix request failed",
      response.status,
      responseBody
    );
  }

  return responseBody;
};

const onboardFintech = async ({ name, email }) => {
  return plainRequest("/api/fintech/onboard", {
    method: "POST",
    body: {
      name,
      email,
    },
  });
};

const generateAuthToken = async () => {
  return plainRequest("/api/auth/token", {
    method: "POST",
    body: {
      apiKey: process.env.NIBSS_CLIENT_ID,
      apiSecret: process.env.NIBSS_CLIENT_SECRET,
    },
  });
};

const createAccount = async ({
  kycType,
  kycID,
  dob,
}) => {
  return request("/api/account/create", {
    method: "POST",
    body: {
      kycType,
      kycID,
      dob,
    },
  });
};

const insertNin = async ({
  nin,
  firstName,
  lastName,
  dob,
}) => {
  return request("/api/insertNin", {
    method: "POST",
    body: {
      nin,
      firstName,
      lastName,
      dob,
    },
  });
};

const insertBvn = async ({
  bvn,
  firstName,
  lastName,
  dob,
  phone,
}) => {
  return request("/api/insertBvn", {
    method: "POST",
    body: {
      bvn,
      firstName,
      lastName,
      dob,
      phone,
    },
  });
};

const validateNin = async (nin) => {
  return request("/api/validateNin", {
    method: "POST",
    body: {
      nin,
    },
  });
};

const validateBvn = async (bvn) => {
  return request("/api/validateBvn", {
    method: "POST",
    body: {
      bvn,
    },
  });
};

const getFintechAccounts = async () => {
  return request("/api/accounts");
};

const getAccountBalance = async (accountNumber) => {
  return request(
    `/api/account/balance/${accountNumber}`
  );
};

const nameEnquiry = async (accountNumber) => {
  return request(
    `/api/account/name-enquiry/${accountNumber}`
  );
};

const transfer = async ({
  from,
  to,
  amount,
}) => {
  return request("/api/transfer", {
    method: "POST",
    body: {
      from,
      to,
      amount: String(amount),
    },
  });
};

const checkTransaction = async (transactionId) => {
  return request(
    `/api/transaction/${transactionId}`
  );
};

module.exports = {
  onboardFintech,
  generateAuthToken,
  createAccount,
  insertNin,
  insertBvn,
  validateNin,
  validateBvn,
  getFintechAccounts,
  getAccountBalance,
  nameEnquiry,
  transfer,
  checkTransaction,
};