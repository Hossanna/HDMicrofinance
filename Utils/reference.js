const crypto = require("crypto");

const generateReference = (prefix = "HDMFB") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(
    Math.random() * 100000
  ).toString(36).toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
};

module.exports = generateReference;
