
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },

    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text"
    },

    attachment: {
      url: {
        type: String,
        default: ""
      },
      name: {
        type: String,
        default: ""
      },
      size: {
        type: Number,
        default: 0
      }
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

messageSchema.index({
  conversation: 1,
  createdAt: -1
});

module.exports = mongoose.model("Message", messageSchema);