const { validationResult, body, param } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'technician', 'employee'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .isIn(['IT', 'Network', 'Hardware', 'Software', 'Security', 'General'])
    .withMessage('Invalid department'),
  handleValidation,
];

const validateTicket = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10-5000 characters'),
  body('channel')
    .optional()
    .isIn(['web', 'chatbot', 'email'])
    .withMessage('Invalid channel'),
  handleValidation,
];

const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be 1-2000 characters'),
  body('isInternal').optional().isBoolean(),
  handleValidation,
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidation,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateTicket,
  validateComment,
  validateObjectId,
};
