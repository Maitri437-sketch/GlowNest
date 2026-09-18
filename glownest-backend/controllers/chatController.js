// ─────────────────────────────────────
//  controllers/chatController.js
//  Send · Get messages · Conversations
// ─────────────────────────────────────

const Message = require('../models/Message');
const User    = require('../models/User');

// ──────────────────────────────────────
//  @route  POST /api/chat/send
//  @desc   Send a message to another user
//  @access Private
// ──────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required'
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    const message = await Message.create({
      sender:      req.user._id,
      receiver:    receiverId,
      content,
      messageType
    });

    // Populate sender info
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/chat/:userId
//  @desc   Get conversation with a specific user
//  @access Private
// ──────────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId,   receiver: userId },
        { sender: userId, receiver: myId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender',   'name username avatar')
      .populate('receiver', 'name username avatar');

    // Mark unread messages as read
    await Message.updateMany(
      { sender: userId, receiver: myId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/chat/conversations
//  @desc   Get all conversations (latest message per user)
//  @access Private
// ──────────────────────────────────────
exports.getAllConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    // Get all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender',   'name username avatar isOnline lastSeen')
      .populate('receiver', 'name username avatar isOnline lastSeen');

    // Build unique conversation list
    const conversationMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === myId.toString()
        ? msg.receiver
        : msg.sender;

      const key = otherUser._id.toString();

      if (!conversationMap.has(key)) {
        const unreadCount = await Message.countDocuments({
          sender:  otherUser._id,
          receiver: myId,
          isRead:   false
        });

        conversationMap.set(key, {
          user:        otherUser,
          lastMessage: msg,
          unreadCount
        });
      }
    }

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  DELETE /api/chat/:messageId
//  @desc   Delete a message (own only)
//  @access Private
// ──────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete someone else\'s message' });
    }

    await message.deleteOne();

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
