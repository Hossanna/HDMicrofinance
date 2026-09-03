const express = require("express");
const {
  createCustomerAccount,
  getAccounts,
  getAccount,
  refreshAccountFromProvider,
} = require("../Controllers/AccountController");

const router = express.Router();

router.post("/", createCustomerAccount);
router.get("/", getAccounts);
router.get("/:id", getAccount);
router.post("/:id/refresh", refreshAccountFromProvider);

module.exports = router;
