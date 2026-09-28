
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    avatar: {
      type: String,
      default: ""
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },

    lastMessageAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({
  participants: 1
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);