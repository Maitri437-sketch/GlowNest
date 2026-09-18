// ─────────────────────────────────────
//  controllers/userController.js
//  Search users · Friends · Profile
// ─────────────────────────────────────

const User = require('../models/User');

// ──────────────────────────────────────
//  @route  GET /api/users/search?q=sneha
//  @desc   Search users by name or username
//  @access Private
// ──────────────────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },          // exclude self
        {
          $or: [
            { name:     { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('name username avatar isOnline lastSeen skinType').limit(20);

    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/users/:id
//  @desc   Get public profile by ID
//  @access Private
// ──────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'name username avatar isOnline');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  POST /api/users/:id/add-friend
//  @desc   Add a friend
//  @access Private
// ──────────────────────────────────────
exports.addFriend = async (req, res) => {
  try {
    const friendId = req.params.id;

    if (friendId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as friend' });
    }

    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ success: false, message: 'User not found' });

    const user = await User.findById(req.user._id);

    if (user.friends.includes(friendId)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    // Add each other as friends
    await User.findByIdAndUpdate(req.user._id, { $push: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $push: { friends: req.user._id } });

    res.status(200).json({ success: true, message: `${friend.name} added as friend` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  DELETE /api/users/:id/remove-friend
//  @desc   Remove a friend
//  @access Private
// ──────────────────────────────────────
exports.removeFriend = async (req, res) => {
  try {
    const friendId = req.params.id;

    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });

    res.status(200).json({ success: true, message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/users/friends
//  @desc   Get my friends list
//  @access Private
// ──────────────────────────────────────
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name username avatar isOnline lastSeen skinType bio');

    res.status(200).json({ success: true, friends: user.friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
