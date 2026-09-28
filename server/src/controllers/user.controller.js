
const User = require("../models/User");

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    status: user.status,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  };
};

// GET /api/users/me
const getMyProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user)
  });
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    })
      .select("-password")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// GET /api/users/search?q=john
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        {
          name: {
            $regex: query,
            $options: "i"
          }
        },
        {
          email: {
            $regex: query,
            $options: "i"
          }
        }
      ]
    })
      .select("-password")
      .limit(20);

    return res.status(200).json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users"
    });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    });
  }
};

module.exports = {
  getMyProfile,
  getUsers,
  searchUsers,
  getUserById
};