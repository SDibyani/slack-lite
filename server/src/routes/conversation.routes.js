
const express = require("express");

const {
  createDirectConversation,
  createGroupConversation,
  getConversations,
  getConversationById,
  addGroupMember
} = require("../controllers/conversation.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/direct", createDirectConversation);
router.post("/group", createGroupConversation);

router.get("/", getConversations);
router.get("/:id", getConversationById);
router.post("/:id/members", addGroupMember);

module.exports = router;