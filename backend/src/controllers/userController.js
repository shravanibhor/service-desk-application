const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search functionality
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get user's ticket statistics
    const ticketStats = await Ticket.aggregate([
      { $match: { createdBy: user._id } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] }
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      user,
      ticketStats: ticketStats[0] || {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { fullName, email, role, department, phone, isActive } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({
          message: 'Email already in use'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullName, email, role, department, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if user has active tickets
    const activeTickets = await Ticket.countDocuments({
      $or: [
        { createdBy: id, status: { $in: ['Open', 'In Progress', 'Waiting for Response'] } },
        { assignedTo: id, status: { $in: ['Open', 'In Progress', 'Waiting for Response'] } }
      ]
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        message: `Cannot delete user with ${activeTickets} active tickets. Please resolve or reassign tickets first.`
      });
    }

    // Soft delete by deactivating the user
    await User.findByIdAndUpdate(id, { isActive: false });

    res.json({
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get support staff (for ticket assignment)
const getSupportStaff = async (req, res) => {
  try {
    const supportStaff = await User.find({
      role: 'admin',
      isActive: true
    }).select('_id username fullName email department');

    res.json({
      supportStaff
    });

  } catch (error) {
    console.error('Get support staff error:', error);
    res.status(500).json({
      message: 'Failed to fetch support staff',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user dashboard data
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let dashboardData = {};

    if (userRole === 'admin') {
      // Admin dashboard data
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalTickets = await Ticket.countDocuments();
      const openTickets = await Ticket.countDocuments({ status: 'Open' });
      const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
      
      const recentTickets = await Ticket.find()
        .populate('createdBy', 'username fullName')
        .populate('assignedTo', 'username fullName')
        .sort({ createdAt: -1 })
        .limit(10);

      dashboardData = {
        overview: {
          totalUsers,
          totalTickets,
          openTickets,
          inProgressTickets
        },
        recentTickets
      };
    } else {
      // User dashboard data
      const myTickets = await Ticket.countDocuments({ createdBy: userId });
      const openTickets = await Ticket.countDocuments({ 
        createdBy: userId, 
        status: 'Open' 
      });
      const inProgressTickets = await Ticket.countDocuments({ 
        createdBy: userId, 
        status: 'In Progress' 
      });
      const resolvedTickets = await Ticket.countDocuments({ 
        createdBy: userId, 
        status: 'Resolved' 
      });

      const recentTickets = await Ticket.find({ createdBy: userId })
        .populate('assignedTo', 'username fullName')
        .sort({ createdAt: -1 })
        .limit(10);

      dashboardData = {
        overview: {
          myTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets
        },
        recentTickets
      };
    }

    res.json(dashboardData);

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getSupportStaff,
  getDashboardData
};
