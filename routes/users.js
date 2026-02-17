const express = require('express');
const {
    getUsers,
    getUser,
    updateDetails,
    getInvestors,
    getEntrepreneurs
} = require('../controllers/userController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/investors', getInvestors);
router.get('/entrepreneurs', getEntrepreneurs);
router.put('/updatedetails', updateDetails);
router.get('/:id', getUser);
router.get('/', authorize('Admin'), getUsers);

module.exports = router;
