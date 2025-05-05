const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { loginValidation, updatePasswordValidation, validate } = require('../utils/validators');
const {
  login,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePasswordValidation, validate, updatePassword);

module.exports = router;
