
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");

const createDirectConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself"
      });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check whether a direct conversation already exists
    const existingConversation = await Conversation.findOne({
      type: "direct",
      participants: {
        $all: [req.user._id, userId]
      }
    }).populate(
      "participants",
      "name email avatar status lastSeen"
    );

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        conversation: existingConversation
      });
    }

    const conversation = await Conversation.create({
      type: "direct",
      participants: [req.user._id, userId],
      createdBy: req.user._id
    });

    await conversation.populate(
      "participants",
      "name email avatar status lastSeen"
    );

    return res.status(201).json({
      success: true,
      message: "Direct conversation created",
      conversation
    });
  } catch (error) {
    console.error("Create direct conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation"
    });
  }
};

const createGroupConversation = async (req, res) => {
  try {
    const { name, participantIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required"
      });
    }

    if (
      !Array.isArray(participantIds) ||
      participantIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one participant is required"
      });
    }

  
    const uniqueParticipantIds = [
      ...new Set([
        req.user._id.toString(),
        ...participantIds.map(String)
      ])
    ];

    const users = await User.find({
      _id: { $in: uniqueParticipantIds }
    });

    if (users.length !== uniqueParticipantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more users were not found"
      });
    }

    const conversation = await Conversation.create({
      type: "group",
      name: name.trim(),
      participants: uniqueParticipantIds,
      admins: [req.user._id],
      createdBy: req.user._id
    });

    await conversation.populate(
      "participants",
      "name email avatar status lastSeen"
    );

    await conversation.populate(
      "admins",
      "name email"
    );

    return res.status(201).json({
      success: true,
      message: "Group conversation created",
      conversation
    });
  } catch (error) {
    console.error("Create group conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create group"
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate(
        "participants",
        "name email avatar status lastSeen"
      )
      .populate(
        "lastMessage",
        "content type sender createdAt"
      )
      .sort({
        lastMessageAt: -1,
        updatedAt: -1
      });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          readBy: { $nin: [req.user._id] }
        });
        const convObj = conversation.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    return res.status(200).json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
      .populate(
        "participants",
        "name email avatar status lastSeen"
      )
      .populate(
        "admins",
        "name email"
      )
      .populate(
        "lastMessage",
        "content type sender createdAt"
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    return res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation"
    });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: conversationId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group"
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group conversation not found"
      });
    }

    // Only admin can add members
    const isAdmin = conversation.admins.some(
      adminId =>
        adminId.toString() === req.user._id.toString()
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can add members"
      });
    }

    // Check user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check already member
    const alreadyMember = conversation.participants.some(
      participantId =>
        participantId.toString() === userId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a group member"
      });
    }

    conversation.participants.push(userId);

    await conversation.save();

    await conversation.populate(
      "participants",
      "name email avatar status lastSeen"
    );

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      conversation
    });

  } catch (error) {
    console.error("Add group member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add group member"
    });
  }
};


module.exports = {
  createDirectConversation,
  createGroupConversation,
  getConversations,
  getConversationById,
   addGroupMember
};