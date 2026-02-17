const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const { validationResult } = require('express-validator');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new ErrorResponse(errors.array()[0].msg, 400));
    }

    const { name, email, password, role } = req.body;

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        console.log('Login request body:', req.body);
        const { email, password } = req.body;

        // Validate emil & password
        if (!email || !password) {
            return next(new ErrorResponse('Please provide an email and password', 400));
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        await sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Enable 2FA (Mock)
// @route   POST /api/v1/auth/2fa/enable
// @access  Private
exports.enableTwoFactor = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    user.isTwoFactorEnabled = true;
    await user.save();

    res.status(200).json({
        success: true,
        data: '2FA Enabled'
    });
});

// @desc    Verify 2FA Code (Mock with real logic structure)
// @route   POST /api/v1/auth/2fa/verify
// @access  Public
exports.verifyTwoFactor = asyncHandler(async (req, res, next) => {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select('+twoFactorCode +twoFactorCodeExpire');

    if (!user || user.twoFactorCode !== code || user.twoFactorCodeExpire < Date.now()) {
        return next(new ErrorResponse('Invalid or expired 2FA code', 400));
    }

    // Clear 2FA code
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpire = undefined;
    await user.save();

    await sendTokenResponse(user, 200, res);
});

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
exports.refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new ErrorResponse('Please provide a refresh token', 400));
    }

    const user = await User.findOne({
        refreshToken,
        refreshTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid or expired refresh token', 401));
    }

    await sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    // Create Refresh Token
    const crypto = require('crypto');
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.refreshToken = refreshToken;
    user.refreshTokenExpire = refreshTokenExpire;
    await user.save({ validateBeforeSave: false });

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};
