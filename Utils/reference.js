const crypto = require("crypto");

const generateReference = (prefix = "HDMFB") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString("hex").toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
};

module.exports = generateReference;
