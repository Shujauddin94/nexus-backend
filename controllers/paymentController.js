const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create Payment Intent (Deposit)
// @route   POST /api/v1/payments/deposit
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { amount } = req.body;

    // Create Payment Intent
    let paymentIntent;
    console.log('DEBUG: STRIPE_SECRET_KEY is:', process.env.STRIPE_SECRET_KEY);
    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (stripeKey === 'sk_test_mock' || !stripeKey) {
        // Mock Stripe for development
        paymentIntent = {
            id: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
            client_secret: 'pi_mock_secret_' + Math.random().toString(36).substr(2, 9)
        };
    } else {
        paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects cents
            currency: 'usd',
            metadata: { integration_check: 'accept_a_payment' }
        });
    }

    // Create Transaction Record (Pending)
    const transaction = await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'Deposit',
        status: 'Pending',
        stripePaymentIntentId: paymentIntent.id
    });

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction._id
    });
});

// @desc    Confirm Payment (Mock - Real world would use Webhooks)
// @route   POST /api/v1/payments/confirm
// @access  Private
exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        return next(new ErrorResponse('Transaction not found', 404));
    }

    // In production, rely on webhook. Here we mock confirmation.
    try {
        transaction.status = 'Completed';
        await transaction.save();

        // Update user balance
        const user = await User.findById(transaction.userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.walletBalance = (user.walletBalance || 0) + transaction.amount;
        await user.save();
    } catch (err) {
        transaction.status = 'Failed';
        await transaction.save();
        return next(new ErrorResponse('Payment confirmation failed: ' + err.message, 500));
    }

    res.status(200).json({
        success: true,
        data: transaction
    });
});

// @desc    Get transaction history
// @route   GET /api/v1/payments/history
// @access  Private
exports.getHistory = asyncHandler(async (req, res, next) => {
    const history = await Transaction.find({ userId: req.user.id })
        .populate('recipientId', 'name email')
        .populate('senderId', 'name email')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: history.length,
        data: history
    });
});

// @desc    Transfer between users
// @route   POST /api/v1/payments/transfer
// @access  Private
exports.transferFunds = asyncHandler(async (req, res, next) => {
    const { recipientEmail, amount } = req.body;

    if (!recipientEmail || !amount || amount <= 0) {
        return next(new ErrorResponse('Please provide valid recipient email and positive amount', 400));
    }

    const sender = await User.findById(req.user.id);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) {
        return next(new ErrorResponse('Recipient not found', 404));
    }

    if ((sender.walletBalance || 0) < amount) {
        return next(new ErrorResponse('Insufficient funds', 400));
    }

    // Perform transfer
    sender.walletBalance -= amount;
    recipient.walletBalance = (recipient.walletBalance || 0) + amount;

    await sender.save();
    await recipient.save();

    // Create transaction records
    const transactionOut = await Transaction.create({
        userId: sender._id,
        amount,
        type: 'Transfer',
        status: 'Completed',
        recipientId: recipient._id
    });

    await Transaction.create({
        userId: recipient._id,
        amount,
        type: 'Transfer',
        status: 'Completed',
        senderId: sender._id
    });

    res.status(200).json({
        success: true,
        data: transactionOut
    });
});

// @desc    Withdraw funds
// @route   POST /api/v1/payments/withdraw
// @access  Private
exports.withdrawFunds = asyncHandler(async (req, res, next) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return next(new ErrorResponse('Please provide a positive amount', 400));
    }

    const user = await User.findById(req.user.id);

    if (user.walletBalance < amount) {
        return next(new ErrorResponse('Insufficient funds', 400));
    }

    // Process withdrawal (mocking bank transfer)
    user.walletBalance -= amount;
    await user.save();

    const transaction = await Transaction.create({
        userId: user._id,
        amount,
        type: 'Withdraw',
        status: 'Completed'
    });

    res.status(200).json({
        success: true,
        data: transaction
    });
});
