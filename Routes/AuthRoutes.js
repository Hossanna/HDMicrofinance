const express = require("express");
const { generateToken } = require("../Controllers/AuthController");

const router = express.Router();

router.post("/token", generateToken);

module.exports = router;
