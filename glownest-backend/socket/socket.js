// ─────────────────────────────────────
//  socket/socket.js – Real-time Chat (Socket.io)
// ─────────────────────────────────────

const { Server } = require('socket.io');
const User       = require('../models/User');
const Message    = require('../models/Message');

// Map: userId → socketId
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── User comes online ──
    socket.on('user:online', async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // Update DB
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: Date.now()
      });

      // Notify all users of updated online list
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`✅ ${userId} is online`);
    });

    // ── Send message ──
    socket.on('message:send', async (data) => {
      try {
        const { senderId, receiverId, content, messageType = 'text' } = data;

        // Save to DB
        const message = await Message.create({
          sender:      senderId,
          receiver:    receiverId,
          content,
          messageType
        });

        await message.populate('sender',   'name username avatar');
        await message.populate('receiver', 'name username avatar');

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', message);
        }

        // Confirm to sender
        socket.emit('message:sent', message);

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicator ──
    socket.on('typing:start', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:show', { userId: senderId });
      }
    });

    socket.on('typing:stop', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:hide', { userId: senderId });
      }
    });

    // ── Message seen ──
    socket.on('message:seen', async ({ messageId, senderId }) => {
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: Date.now()
      });

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read', { messageId });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', async () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: Date.now()
        });

        io.emit('users:online', Array.from(onlineUsers.keys()));
        console.log(`❌ ${userId} went offline`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
