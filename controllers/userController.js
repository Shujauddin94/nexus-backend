const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc    Get all users (Admin or for listing)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user details
// @route   PUT /api/v1/users/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        bio: req.body.bio,
        startupHistory: req.body.startupHistory,
        investmentHistory: req.body.investmentHistory,
        preferences: req.body.preferences
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Get investors
// @route   GET /api/v1/users/investors
// @access  Private
exports.getInvestors = asyncHandler(async (req, res, next) => {
    const investors = await User.find({ role: 'Investor' });
    res.status(200).json({
        success: true,
        count: investors.length,
        data: investors
    });
});

// @desc    Get entrepreneurs
// @route   GET /api/v1/users/entrepreneurs
// @access  Private
exports.getEntrepreneurs = asyncHandler(async (req, res, next) => {
    const entrepreneurs = await User.find({ role: 'Entrepreneur' });
    res.status(200).json({
        success: true,
        count: entrepreneurs.length,
        data: entrepreneurs
    });
});
