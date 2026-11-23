const express = require('express');
const router = express.Router();
const { createPayment, capturePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/paypal/create-order', protect, createPayment);
router.post('/paypal/capture-order', protect, capturePayment);

module.exports = router;
