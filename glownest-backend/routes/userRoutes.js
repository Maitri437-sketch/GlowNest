// ─────────────────────────────────────
//  routes/userRoutes.js
// ─────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  searchUsers,
  getUserById,
  addFriend,
  removeFriend,
  getFriends
} = require('../controllers/userController');

router.get('/search',               protect, searchUsers);
router.get('/friends',              protect, getFriends);
router.get('/:id',                  protect, getUserById);
router.post('/:id/add-friend',      protect, addFriend);
router.delete('/:id/remove-friend', protect, removeFriend);

module.exports = router;
