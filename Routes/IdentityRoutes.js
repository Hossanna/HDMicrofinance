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

router.post(
  "/insert-bvn",
  identityController.insertBvn
);

router.post(
  "/validate-bvn",
  identityController.validateBvn
);

module.exports = router;