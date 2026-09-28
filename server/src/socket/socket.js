const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { verifyToken } = require("../utils/jwt");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:4200",
      methods: ["GET", "POST"]
    }
  });

 
  // SOCKET AUTHENTICATION
 

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token);

      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.join(`user:${socket.user._id}`);

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);

      next(new Error("Invalid or expired token"));
    }
  });

 
  // CONNECTION
 

  io.on("connection",async (socket) => {
    console.log(
      `User connected: ${socket.user.name} (${socket.id})`
    );

     // Mark user online
  try {
    await User.findByIdAndUpdate(
      socket.user._id,
      { status: "online" }
    );

    socket.user.status = "online";
    console.log(
  "USER SET ONLINE:",
  socket.user.name,
  socket.user._id.toString()
);
  } catch (error) {
    console.error("Failed to update online status:", error);
  }

    
    io.emit("user_online", {
      userId: socket.user._id,
      status: "online"
    });

    
    // JOIN CONVERSATION
   

    socket.on("join_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });

        if (!conversation) {
          socket.emit("socket_error", {
            message: "Conversation not found"
          });

          return;
        }

        socket.join(`conversation:${conversationId}`);

        console.log(
          `${socket.user.name} joined conversation ${conversationId}`
        );
      } catch (error) {
        console.error("Join conversation error:", error);

        socket.emit("socket_error", {
          message: "Failed to join conversation"
        });
      }
    });

  
    // LEAVE CONVERSATION
    

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);

      console.log(
        `${socket.user.name} left conversation ${conversationId}`
      );
    });

  
    // SEND MESSAGE
   

    socket.on("send_message", async (data) => {
      try {
        const {
          conversationId,
          content,
          type = "text",
          attachment
        } = data;

        // Validate
        if (!conversationId) {
          socket.emit("socket_error", {
            message: "conversationId is required"
          });

          return;
        }

        if (
          type === "text" &&
          (!content || !content.trim())
        ) {
          socket.emit("socket_error", {
            message: "Message content is required"
          });

          return;
        }

       
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });

        if (!conversation) {
          socket.emit("socket_error", {
            message: "Conversation not found"
          });

          return;
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content: content ? content.trim() : "",
          type,
          attachment: attachment || {},
          readBy: [socket.user._id]
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;

        await conversation.save();

        // Populate sender
        await message.populate(
          "sender",
          "name email avatar status"
        );

     
        io.to(`conversation:${conversationId}`).emit(
          "new_message",
          message
        );

       
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.user._id.toString()) {
            io.to(`user:${participantId.toString()}`).emit('unread_update', {
              conversationId: conversationId,
              content: message.content,
              createdAt: message.createdAt,
              senderId: socket.user._id,
              senderName: socket.user.name
            });
          }
        });
      } catch (error) {
        console.error("Socket send message error:", error);

        socket.emit("socket_error", {
          message: "Failed to send message"
        });
      }
    });

    
    // TYPING
   

    socket.on("typing", async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });

        if (!conversation) {
          return;
        }

        socket
          .to(`conversation:${conversationId}`)
          .emit("user_typing", {
            userId: socket.user._id,
            name: socket.user.name
          });
      } catch (error) {
        console.error("Typing error:", error);
      }
    });

 
    // STOP TYPING


    socket.on("stop_typing", async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id
        });

        if (!conversation) {
          return;
        }

        socket
          .to(`conversation:${conversationId}`)
          .emit("user_stop_typing", {
            userId: socket.user._id
          });
      } catch (error) {
        console.error("Stop typing error:", error);
      }
    });


// MARK MESSAGE AS READ


socket.on("mark_read", async (data) => {
  try {
    const { messageId, conversationId } = data;

    if (!messageId || !conversationId) {
      return;
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: socket.user._id
    });

    if (!conversation) {
      return;
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return;
    }

  
    if (message.readBy.includes(socket.user._id)) {
      return;
    }

    message.readBy.push(socket.user._id);
    await message.save();

  
    io.to(`conversation:${conversationId}`).emit("message_read", {
      messageId: message._id,
      userId: socket.user._id,
      conversationId
    });
  } catch (error) {
    console.error("Mark read error:", error);
  }
});



  
    // DISCONNECT
  

    socket.on("disconnect",async () => {
      console.log(
        `User disconnected: ${socket.user.name} (${socket.id})`
      );

      // Check if user has other active socket connections (multi-tab)
      const userRoom = io.sockets.adapter.rooms.get(`user:${socket.user._id}`);
      const remaining = userRoom ? userRoom.size : 0;

      if (remaining > 0) {
        console.log(
          `User ${socket.user.name} still has ${remaining} active connection(s), keeping online`
        );
        return;
      }

       try {
    await User.findByIdAndUpdate(
      socket.user._id,
      {
        status: "offline",
        lastSeen: new Date()
      }
    );
    console.log(
    "USER SET OFFLINE:",
    socket.user.name,
     socket.user._id.toString()
   );

   
     io.emit("user_offline", {
       userId: socket.user._id,
       status: "offline",
       lastSeen: new Date().toISOString()
     });

   } catch (error) {
     console.error("Failed to update offline status:", error);
   }

     });
  });

  return io;
};

const getIO = () => io;

module.exports = initializeSocket;
module.exports.getIO = getIO;