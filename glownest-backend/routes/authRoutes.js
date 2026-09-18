// ─────────────────────────────────────
//  routes/authRoutes.js
// ─────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword
} = require('../controllers/authController');

router.post('/register',         register);
router.post('/login',            login);
router.get ('/me',    protect,   getMe);
router.post('/logout', protect,  logout);
router.put ('/update-profile', protect, updateProfile);
router.put ('/change-password', protect, changePassword);

module.exports = router;
