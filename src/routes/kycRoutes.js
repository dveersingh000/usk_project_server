const express = require("express");
const { submitKyc } = require("../controllers/kycController");

const router = express.Router();

router.post("/submit", submitKyc);

module.exports = router;
