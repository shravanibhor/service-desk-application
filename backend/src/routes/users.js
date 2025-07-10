const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getSupportStaff,
  getDashboardData
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('department')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Routes
router.get('/dashboard', authenticateToken, getDashboardData);
router.get('/support-staff', authenticateToken, getSupportStaff);
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.get('/:id', authenticateToken, requireAdmin, getUserById);
router.put('/:id', authenticateToken, requireAdmin, updateUserValidation, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

module.exports = router;
