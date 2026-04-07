const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { placeOrder, getOrders, cancelOrder } = require('../controllers/orderController');

router.post('/place', protect, placeOrder);
router.get('/history', protect, getOrders);
router.post('/:orderId/cancel', protect, cancelOrder);

module.exports = router;
