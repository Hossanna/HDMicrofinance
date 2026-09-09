const express = require("express");
const {
  onboardCustomer,
  getCustomers,
  getCustomer,
} = require("../Controllers/CustomerController");

const router = express.Router();

router.post("/onboard", onboardCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomer);

module.exports = router;
