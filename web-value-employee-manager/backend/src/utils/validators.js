const { body, param, query, validationResult } = require('express-validator');

// Helper function to validate email format
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to check company domain
exports.isCompanyEmail = (email) => {
  return email.endsWith('@thewebvalue.com');
};

// Validation middleware to check for validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Login validation rules
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      if (!value.endsWith('@thewebvalue.com')) {
        throw new Error('Email must be from @thewebvalue.com domain');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Create user validation rules
exports.createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      if (!value.endsWith('@thewebvalue.com')) {
        throw new Error('Email must be from @thewebvalue.com domain');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Invalid role specified')
];

// Update user validation rules
exports.updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      if (!value.endsWith('@thewebvalue.com')) {
        throw new Error('Email must be from @thewebvalue.com domain');
      }
      return true;
    }),
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Invalid role specified'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Create task validation rules
exports.createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('assigneeId')
    .notEmpty()
    .withMessage('Assignee is required')
    .isUUID()
    .withMessage('Invalid assignee ID'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid priority level'),
  body('note')
    .optional()
    .trim()
];

// Update task status validation rules
exports.updateTaskStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Not Started', 'In Progress', 'Completed', 'Needs Feedback'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
];

// Task filter validation rules
exports.taskFilterValidation = [
  query('status')
    .optional()
    .isIn(['Not Started', 'In Progress', 'Completed', 'Needs Feedback'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid priority filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Password update validation rules
exports.updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

// ID parameter validation
exports.validateIdParam = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Date range validation helper
exports.validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(endDate) > new Date(startDate);
};
