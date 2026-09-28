
const express = require("express");

const {
  sendMessage,
  getMessages,
  markMessageAsRead
} = require("../controllers/message.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/", sendMessage);
router.get("/:conversationId", getMessages);
router.put("/:id/read", markMessageAsRead);

module.exports = router;