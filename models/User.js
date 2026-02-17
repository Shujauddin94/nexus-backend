const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['Investor', 'Entrepreneur'],
        default: 'Entrepreneur'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    bio: {
        type: String,
        maxlength: 500
    },
    startupHistory: {
        type: Array, // Array of objects or strings describing history
        default: []
    },
    investmentHistory: {
        type: Array, // Array of objects or strings
        default: []
    },
    preferences: {
        type: Object, // Structured preferences
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    twoFactorCode: String,
    twoFactorCodeExpire: Date,
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    refreshToken: String,
    refreshTokenExpire: Date
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
