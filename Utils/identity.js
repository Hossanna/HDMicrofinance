const ApiError = require("./apiError");

const DEFAULT_TEST_IDENTITIES = {
  bvn: ["22222222281"],
  nin: ["12345678901"],
};

const normalizeIdentityType = (identityType) => String(identityType || "").trim().toLowerCase();

const validateIdentityType = (identityType) => {
  const normalized = normalizeIdentityType(identityType);

  if (!["bvn", "nin"].includes(normalized)) {
    throw new ApiError("identityType must be either bvn or nin", 400);
  }

  return normalized;
};

const assertSandboxIdentity = (identityType, identityValue) => {
  const normalizedType = validateIdentityType(identityType);
  const value = String(identityValue || "").trim();

  if (!/^\d{11}$/.test(value)) {
    throw new ApiError(`${normalizedType.toUpperCase()} must be 11 digits`, 400);
  }

  const envKey = normalizedType === "bvn" ? "NIBSS_TEST_BVNS" : "NIBSS_TEST_NINS";
  const configuredValues = String(process.env[envKey] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedValues = configuredValues.length ? configuredValues : DEFAULT_TEST_IDENTITIES[normalizedType];

  if (!allowedValues.includes(value)) {
    throw new ApiError(
      `Real ${normalizedType.toUpperCase()} values are not allowed. Use configured sandbox test values only.`,
      400
    );
  }

  return value;
};

const maskIdentityValue = (identityValue) => {
  const value = String(identityValue || "").trim();
  if (value.length <= 4) return "****";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
};

const identityVerified = (providerResponse) => {
  const status = String(
    providerResponse.status ||
      providerResponse.verificationStatus ||
      providerResponse.verification_status ||
      providerResponse.message ||
      ""
  ).toLowerCase();

  return (
    providerResponse.verified === true ||
    providerResponse.isVerified === true ||
    ["verified", "successful", "success", "ok", "valid"].includes(status)
  );
};

module.exports = {
  assertSandboxIdentity,
  maskIdentityValue,
  validateIdentityType,
  identityVerified,
};
