const express = require("express");
const {
  nameEnquiry,
  transfer,
  transactionNotification,
} = require("../Controllers/BankingController");

const router = express.Router();

router.post("/name-enquiry", nameEnquiry);
router.post("/transfer", transfer);
router.post("/notifications", transactionNotification);

module.exports = router;
