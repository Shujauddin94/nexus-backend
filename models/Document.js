const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title can not be more than 100 characters']
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String, // 'Draft', 'Pending Signature', 'Signed'
        enum: ['Draft', 'Pending Signature', 'Signed'],
        default: 'Draft'
    },
    signature: {
        type: String, // Base64 string or path to signature image
        default: null
    },
    signedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
