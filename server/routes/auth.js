const router = require('express').Router();
const { register, login, getMe, verifyOtp } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login',    login);
router.get('/me',        authMiddleware, getMe);

module.exports = router;
