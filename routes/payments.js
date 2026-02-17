const express = require('express');
const {
    createPaymentIntent,
    confirmPayment,
    getHistory,
    transferFunds,
    withdrawFunds
} = require('../controllers/paymentController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/deposit', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getHistory);
router.post('/transfer', transferFunds);
router.post('/withdraw', withdrawFunds);

module.exports = router;
