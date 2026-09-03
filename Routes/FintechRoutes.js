const express = require("express");
const { onboardFintech } = require("../Controllers/FintechController");

const router = express.Router();

router.post("/onboard", onboardFintech);

module.exports = router;
