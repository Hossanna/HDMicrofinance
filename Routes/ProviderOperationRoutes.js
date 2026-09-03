const express = require("express");
const { createCustomerAccount } = require("../Controllers/AccountController");
const {
  insertBvn,
  insertNin,
  validateBvn,
  validateNin,
} = require("../Controllers/IdentityController");
const {
  getNameEnquiry,
  transferFunds,
  getTransactionByReference,
  getAllFintechAccounts,
  getAccountBalance,
} = require("../Controllers/CoreOperationController");

const router = express.Router();

router.post("/insertBvn", insertBvn);
router.post("/insertNin", insertNin);
router.post("/validateBvn", validateBvn);
router.post("/validateNin", validateNin);
router.post("/account/create", createCustomerAccount);
router.get("/account/name-enquiry/:accountNumber", getNameEnquiry);
router.get("/account/balance/:accountNumber", getAccountBalance);
router.post("/transfer", transferFunds);
router.get("/transaction/:ref", getTransactionByReference);
router.get("/accounts", getAllFintechAccounts);

module.exports = router;
