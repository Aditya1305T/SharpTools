const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/productController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/',         getAll);
router.get('/:id',      getOne);
router.post('/',        authMiddleware, adminOnly, create);
router.put('/:id',      authMiddleware, adminOnly, update);
router.delete('/:id',   authMiddleware, adminOnly, remove);

module.exports = router;
