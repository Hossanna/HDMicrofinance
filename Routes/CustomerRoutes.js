const express = require("express");
const {
  onboardCustomer,
  verifyCustomerIdentity,
  getCustomers,
  getCustomer,
  updateCustomerKyc,
} = require("../Controllers/CustomerController");

const router = express.Router();

router.post("/onboard", onboardCustomer);
router.post("/:id/verify-identity", verifyCustomerIdentity);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.patch("/:id/kyc", updateCustomerKyc);

module.exports = router;
