const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    investor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    entrepreneur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: [true, 'Please add a date']
    },
    time: {
        type: String, // e.g., "14:00"
        required: [true, 'Please add a time']
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    googleMeetLink: {
        type: String
    },
    createdBy: {
        type: String,
        enum: ['entrepreneur', 'investor', 'admin'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent double booking for the same person at the same time
// This is a simple check, more complex logic might be needed for duration
MeetingSchema.index({ investor: 1, date: 1, time: 1 }, { unique: true });
MeetingSchema.index({ entrepreneur: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Meeting', MeetingSchema);
