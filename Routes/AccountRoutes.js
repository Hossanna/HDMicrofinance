const express = require("express");

const router = express.Router();

const accountController =
  require("../Controllers/accountController");

router.post(
  "/create",
  accountController.createCustomerAccount
);
router.get(
  "/name-enquiry/:accountNumber",
  accountController.getNameEnquiry
);
router.get(
  "/balance/:accountNumber",
  accountController.getAccountBalance
);
router.post(
  "/transfer",
  accountController.transferFunds
);
router.get(
  "/",
  accountController.getFintechAccounts
);
router.get(
  "/customer/:customerId",
  accountController.getCustomerAccounts
);
router.get(
  "/:accountId",
  accountController.getAccount
);
router.get(
  "/transaction/:reference",
  accountController.getTransactionByReference
);  

module.exports = router;