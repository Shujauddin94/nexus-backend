const ErrorResponse = require('../middleware/error');
const asyncHandler = require('../middleware/async');
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// @desc    Upload a new document
// @route   POST /api/v1/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const { title } = req.body;

    const document = await Document.create({
        title: title || req.file.originalname,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname),
        size: req.file.size,
        owner: req.user.id,
        status: 'Draft'
    });

    console.log(`Document uploaded: ${document.title} by user ${req.user.id}`);
    res.status(201).json({
        success: true,
        data: document
    });
});

// @desc    Get all documents for current user
// @route   GET /api/v1/documents
// @access  Private
exports.getDocuments = asyncHandler(async (req, res, next) => {
    const documents = await Document.find({
        $or: [
            { owner: req.user.id },
            { sharedWith: req.user.id }
        ]
    }).populate('owner', 'name email').sort('-createdAt');

    res.status(200).json({
        success: true,
        count: documents.length,
        data: documents
    });
});

// @desc    Get single document
// @route   GET /api/v1/documents/:id
// @access  Private
exports.getDocument = asyncHandler(async (req, res, next) => {
    const document = await Document.findById(req.params.id).populate('owner', 'name email').populate('sharedWith', 'name email');

    if (!document) {
        return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
    }

    // Check access
    const isOwner = document.owner._id.toString() === req.user.id;
    const isShared = document.sharedWith.some(u => u._id.toString() === req.user.id);

    if (!isOwner && !isShared) {
        return next(new ErrorResponse(`User not authorized to access this document`, 401));
    }

    res.status(200).json({
        success: true,
        data: document
    });
});

// @desc    Sign a document
// @route   PUT /api/v1/documents/:id/sign
// @access  Private
exports.signDocument = asyncHandler(async (req, res, next) => {
    let document = await Document.findById(req.params.id);

    if (!document) {
        return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
    }

    // Check access
    const isOwner = document.owner.toString() === req.user.id;
    const isShared = document.sharedWith.some(id => id.toString() === req.user.id);

    if (!isOwner && !isShared) {
        console.warn(`User ${req.user.id} unauthorized to sign document ${req.params.id}`);
        return next(new ErrorResponse(`User not authorized to sign this document`, 401));
    }

    const { signature } = req.body; // Base64 signature string

    if (!signature) {
        return next(new ErrorResponse('Please provide a signature', 400));
    }

    try {
        // Only process PDF files for actual embedding
        if (document.fileType.toLowerCase() === '.pdf') {
            const existingPdfBytes = fs.readFileSync(document.filePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            // Create a new page
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();

            // Embed signature image
            const signatureImage = await pdfDoc.embedPng(signature);
            const sigDims = signatureImage.scale(0.5);

            // Draw signature
            page.drawText('Signed by Nexus E-Signature', {
                x: 50,
                y: height - 50,
                size: 20
            });

            page.drawImage(signatureImage, {
                x: 50,
                y: height - 150,
                width: sigDims.width,
                height: sigDims.height,
            });

            page.drawText(`Date: ${new Date().toLocaleString()}`, {
                x: 50,
                y: height - 180,
                size: 12
            });

            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(document.filePath, pdfBytes);
        }
    } catch (pdfErr) {
        console.error('Error modifying PDF:', pdfErr);
        // Continue but log error - the database will still be updated
    }

    document = await Document.findByIdAndUpdate(req.params.id, {
        status: 'Signed',
        signature,
        signedAt: Date.now()
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: document
    });
});

// @desc    Delete document
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
    const document = await Document.findById(req.params.id);

    if (!document) {
        return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is document owner
    if (document.owner.toString() !== req.user.id) {
        return next(new ErrorResponse(`User not authorized to delete this document`, 401));
    }

    // Remove file from filesystem
    if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
