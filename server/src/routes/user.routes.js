
const express = require("express");

const {
  getMyProfile,
  getUsers,
  searchUsers,
  getUserById
} = require("../controllers/user.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/me", getMyProfile);
router.get("/search", searchUsers);
router.get("/", getUsers);
router.get("/:id", getUserById);

module.exports = router;