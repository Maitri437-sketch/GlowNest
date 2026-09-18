// ─────────────────────────────────────
//  routes/chatRoutes.js
// ─────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversation,
  getAllConversations,
  deleteMessage
} = require('../controllers/chatController');

router.post('/send',             protect, sendMessage);
router.get ('/conversations',   protect, getAllConversations);
router.get ('/:userId',         protect, getConversation);
router.delete('/:messageId',    protect, deleteMessage);

module.exports = router;
