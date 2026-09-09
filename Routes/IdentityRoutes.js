const express = require("express");
const router = express.Router();

const identityController = require("../Controllers/IdentityController");

router.post(
  "/insert-nin",
  identityController.insertNin
);

router.post(
  "/validate-nin",
  identityController.validateNin
);

module.exports = router;