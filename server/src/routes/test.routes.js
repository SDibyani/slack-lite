
const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/user", async (req, res) => {
  try {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "temporary-password"
    });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;