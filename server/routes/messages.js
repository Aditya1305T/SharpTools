const router = require('express').Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

router.get('/',   authMiddleware, getMessages);
router.post('/',  authMiddleware, sendMessage);

module.exports = router;
