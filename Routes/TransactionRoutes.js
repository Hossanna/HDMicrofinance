const express = require("express");
const {
  getTransactions,
  getTransaction,
  checkTransaction,
  getProviderTransactions,
} = require("../Controllers/TransactionController");

const router = express.Router();

router.get("/reference/:reference/check", checkTransaction);
router.get("/accounts/:accountId/provider", getProviderTransactions);
router.get("/", getTransactions);
router.get("/:id", getTransaction);

module.exports = router;
