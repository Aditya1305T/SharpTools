const router = require('express').Router();
const { getCustomRequests, createCustomRequest, updateRequestStatus } = require('../controllers/customRequestController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/',       authMiddleware, getCustomRequests);
router.post('/',      authMiddleware, createCustomRequest);
router.patch('/:id',  authMiddleware, adminOnly, updateRequestStatus);

module.exports = router;
