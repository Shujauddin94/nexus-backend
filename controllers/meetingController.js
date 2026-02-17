const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

// @desc    Schedule a meeting
// @route   POST /api/v1/meetings
// @access  Private
exports.scheduleMeeting = asyncHandler(async (req, res, next) => {
    const { investorId, entrepreneurId, date, time } = req.body;

    // Basic validation that user is scheduling for themselves or is admin
    // For simplicity, let's assume the logged in user is one of the participants
    // or checks are done in the frontend to pass correct IDs.

    // Actually, better logic: 
    // If Entrepreneur requests, they pass investorId.
    // If Investor requests, they pass entrepreneurId.

    let investor, entrepreneur;

    if (req.user.role === 'Entrepreneur') {
        entrepreneur = req.user.id;
        investor = investorId;
    } else if (req.user.role === 'Investor') {
        investor = req.user.id;
        entrepreneur = entrepreneurId;
    } else {
        // Admin
        investor = investorId;
        entrepreneur = entrepreneurId;
    }

    // Check for existing meeting at same time
    const existingMeetingInvestor = await Meeting.findOne({ investor, date, time, status: 'Accepted' });
    const existingMeetingEntrepreneur = await Meeting.findOne({ entrepreneur, date, time, status: 'Accepted' });

    if (existingMeetingInvestor || existingMeetingEntrepreneur) {
        return next(new ErrorResponse('Time slot not available', 400));
    }

    const meeting = await Meeting.create({
        investor,
        entrepreneur,
        date,
        time,
        status: 'Pending',
        createdBy: req.user.role.toLowerCase()
    });

    res.status(201).json({
        success: true,
        data: meeting
    });
});

// @desc    Get meetings for user
// @route   GET /api/v1/meetings
// @access  Private
exports.getMeetings = asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'Investor') {
        query = { investor: req.user.id };
    } else if (req.user.role === 'Entrepreneur') {
        query = { entrepreneur: req.user.id };
    } else {
        query = {}; // Admin sees all
    }

    const meetings = await Meeting.find(query)
        .populate('investor', 'name email')
        .populate('entrepreneur', 'name email');

    res.status(200).json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

// @desc    Update meeting status (Accept/Reject/Cancel)
// @route   PUT /api/v1/meetings/:id
// @access  Private
exports.updateMeeting = asyncHandler(async (req, res, next) => {
    let meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
        return next(
            new ErrorResponse(`Meeting not found with id of ${req.params.id}`, 404)
        );
    }

    // Verify user is part of meeting
    if (meeting.investor.toString() !== req.user.id && meeting.entrepreneur.toString() !== req.user.id && req.user.role !== 'Admin') {
        return next(new ErrorResponse('Not authorized to update this meeting', 401));
    }

    // Logic: Only recipient can Accept/Reject. Creator can Cancel? 
    // For simplicity, allow participants to update status.

    meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: meeting
    });
});
