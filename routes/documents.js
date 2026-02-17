const express = require('express');
const {
    uploadDocument,
    getDocuments,
    getDocument,
    signDocument,
    deleteDocument
} = require('../controllers/documentController');

const router = express.Router();

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router
    .route('/')
    .get(getDocuments)
    .post(upload.single('file'), uploadDocument);

router
    .route('/:id')
    .get(getDocument)
    .delete(deleteDocument);

router.put('/:id/sign', signDocument);

module.exports = router;
