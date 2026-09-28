
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { getIO } = require('../socket/socket');

const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      content,
      type = "text",
      attachment
    } = req.body;

    // 1. Validate conversation ID
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required"
      });
    }

    // 2. Validate text message
    if (
      type === "text" &&
      (!content || !content.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    // 3. Check conversation and membership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // 4. Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content ? content.trim() : "",
      type,
      attachment: attachment || {},
      readBy: [req.user._id]
    });

    // 5. Update conversation's latest message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    // 6. Populate sender
    await message.populate(
      "sender",
      "name email avatar status"
    );

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // 1. Verify conversation membership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // 2. Fetch messages
    const messages = await Message.find({
      conversation: conversationId
    })
      .populate(
        "sender",
        "name email avatar status"
      )
      .sort({
        createdAt: 1
      });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation"
      });
    }

   
    if (!message.readBy.some(
      (userId) => userId.toString() === req.user._id.toString()
    )) {
      message.readBy.push(req.user._id);
      await message.save();

      const io = getIO();
      if (io) {
        io.to(`conversation:${message.conversation.toString()}`).emit('message_read', {
          messageId: message._id.toString(),
          readBy: message.readBy.map(id => id.toString())
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Message marked as read"
    });
  } catch (error) {
    console.error("Mark message read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read"
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessageAsRead
};