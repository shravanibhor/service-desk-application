const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { cleanupFiles } = require('../middleware/upload');

// Create new ticket
const createTicket = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) cleanupFiles(req.files);
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, priority, impact, urgency, tags } = req.body;

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Create ticket
    const ticket = new Ticket({
      title,
      description,
      category,
      priority: priority || 'Medium',
      impact: impact || 'Low',
      urgency: urgency || 'Low',
      createdBy: req.user.id,
      attachments,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await ticket.save();

    // Populate user information
    await ticket.populate('createdBy', 'username fullName email department');

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) cleanupFiles(req.files);
    
    console.error('Ticket creation error:', error);
    res.status(500).json({
      message: 'Failed to create ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all tickets (with filtering and pagination)
const getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // If user is not admin, only show their tickets or assigned tickets
    if (req.user.role !== 'admin') {
      filter.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    // Apply filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;

    // Search functionality
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { ticketNumber: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tickets with pagination
    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'username fullName email department')
      .populate('assignedTo', 'username fullName email department')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / parseInt(limit));

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTickets,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('createdBy', 'username fullName email department')
      .populate('assignedTo', 'username fullName email department')
      .populate('comments.user', 'username fullName');

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && 
        ticket.createdBy._id.toString() !== req.user.id && 
        (!ticket.assignedTo || ticket.assignedTo._id.toString() !== req.user.id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    res.json({ ticket });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      message: 'Failed to fetch ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update ticket
const updateTicket = async (req, res) => {
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
    const updates = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Check permissions
    const isOwner = ticket.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Restrict what regular users can update
    if (!isAdmin) {
      const allowedFields = ['title', 'description', 'priority'];
      Object.keys(updates).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updates[key];
        }
      });
    }

    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username fullName email department')
    .populate('assignedTo', 'username fullName email department');

    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      message: 'Failed to update ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add comment to ticket
const addComment = async (req, res) => {
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
    const { message, isInternal = false } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Check access permissions
    const isOwner = ticket.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Only admins can add internal comments
    const commentIsInternal = isAdmin && isInternal;

    // Add comment
    ticket.comments.push({
      user: req.user.id,
      message,
      isInternal: commentIsInternal
    });

    await ticket.save();

    // Populate the ticket with user information
    await ticket.populate('comments.user', 'username fullName');

    res.json({
      message: 'Comment added successfully',
      comment: ticket.comments[ticket.comments.length - 1]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign ticket (admin only)
const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Verify assignee exists and is admin or support staff
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(400).json({
          message: 'Assignee not found'
        });
      }
    }

    // Update assignment
    ticket.assignedTo = assignedTo || null;
    if (assignedTo && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    await ticket.populate('createdBy', 'username fullName email department');
    await ticket.populate('assignedTo', 'username fullName email department');

    res.json({
      message: 'Ticket assignment updated successfully',
      ticket
    });

  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({
      message: 'Failed to assign ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ticket statistics (admin only)
const getTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
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

    const priorityStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0
      },
      priorityDistribution: priorityStats,
      categoryDistribution: categoryStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  assignTicket,
  getTicketStats
};
