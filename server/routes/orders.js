const router = require('express').Router();
const { getOrders, createOrder, updateOrderStatus } = require('../controllers/orderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/',         authMiddleware, getOrders);
router.post('/',        authMiddleware, createOrder);
router.patch('/:id',    authMiddleware, adminOnly, updateOrderStatus);

module.exports = router;
