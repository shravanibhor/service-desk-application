const express = require('express');
const { body } = require('express-validator');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  assignTicket,
  getTicketStats
} = require('../controllers/ticketController');
const { authenticateToken, requireAdmin, checkTicketAccess } = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const createTicketValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('category')
    .isIn([
      'Technical Issue',
      'Software Installation',
      'Hardware Problem',
      'Network Issue',
      'Account Access',
      'Email Problem',
      'Printer Issue',
      'Mobile Device',
      'Security Concern',
      'Training Request',
      'General Inquiry',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical'),
  body('impact')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Impact must be Low, Medium, or High'),
  body('urgency')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Urgency must be Low, Medium, or High')
];

const updateTicketValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('category')
    .optional()
    .isIn([
      'Technical Issue',
      'Software Installation',
      'Hardware Problem',
      'Network Issue',
      'Account Access',
      'Email Problem',
      'Printer Issue',
      'Mobile Device',
      'Security Concern',
      'Training Request',
      'General Inquiry',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical'),
  body('status')
    .optional()
    .isIn(['Open', 'In Progress', 'Waiting for Response', 'Resolved', 'Closed'])
    .withMessage('Invalid status'),
  body('resolution')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution cannot exceed 1000 characters')
    .trim()
];

const addCommentValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
    .trim(),
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean')
];

const assignTicketValidation = [
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Routes
router.post('/', 
  authenticateToken, 
  upload, 
  handleUploadErrors, 
  createTicketValidation, 
  createTicket
);

router.get('/', authenticateToken, getTickets);
router.get('/stats', authenticateToken, requireAdmin, getTicketStats);
router.get('/:id', authenticateToken, checkTicketAccess, getTicketById);

router.put('/:id', 
  authenticateToken, 
  checkTicketAccess, 
  updateTicketValidation, 
  updateTicket
);

router.post('/:id/comments', 
  authenticateToken, 
  checkTicketAccess, 
  addCommentValidation, 
  addComment
);

router.put('/:id/assign', 
  authenticateToken, 
  requireAdmin, 
  assignTicketValidation, 
  assignTicket
);

module.exports = router;
