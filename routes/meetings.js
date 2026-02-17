const express = require('express');
const {
    scheduleMeeting,
    getMeetings,
    updateMeeting
} = require('../controllers/meetingController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .post(scheduleMeeting)
    .get(getMeetings);

router.route('/:id')
    .put(updateMeeting);

module.exports = router;
