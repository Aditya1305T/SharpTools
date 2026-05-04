const router = require('express').Router();
const { getAllUsers, deleteUser } = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, getAllUsers);
router.delete('/:id', authMiddleware, adminOnly, deleteUser);

module.exports = router;
