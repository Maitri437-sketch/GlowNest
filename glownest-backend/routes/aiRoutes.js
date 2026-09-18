// ─────────────────────────────────────
//  routes/aiRoutes.js
// ─────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  chat,
  getHistory,
  getRoutine
} = require('../controllers/aiController');

router.post('/chat',      protect, chat);
router.get ('/history',   protect, getHistory);
router.get ('/routine',   protect, getRoutine);

module.exports = router;
