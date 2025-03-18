const express = require("express");
const { createOrUpdateProfile, getProfile } = require("../controllers/profileController");

const router = express.Router();

router.post("/save", createOrUpdateProfile); // Save or update profile
router.get("/:userId", getProfile); // Get user profile

module.exports = router;
