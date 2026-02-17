const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Mock signature (small 1x1 base64 png)
const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function verifySigning() {
    console.log('Testing PDF signing logic...');

    const testPdfPath = path.join(__dirname, '../uploads/test_sign.pdf');

    // 1. Create a dummy PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(testPdfPath, pdfBytes);

    const initialSize = fs.statSync(testPdfPath).size;
    console.log(`Initial PDF size: ${initialSize} bytes`);

    // 2. Simulate the signing logic from the controller
    try {
        const existingPdfBytes = fs.readFileSync(testPdfPath);
        const docToSign = await PDFDocument.load(existingPdfBytes);
        const page = docToSign.addPage();
        const { height } = page.getSize();
        const signatureImage = await docToSign.embedPng(mockSignature);
        const sigDims = signatureImage.scale(0.5);

        page.drawText('Signed by Nexus E-Signature (Test)', {
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

        const signedBytes = await docToSign.save();
        fs.writeFileSync(testPdfPath, signedBytes);

        const finalSize = fs.statSync(testPdfPath).size;
        console.log(`Final PDF size: ${finalSize} bytes`);

        if (finalSize > initialSize) {
            console.log('✅ SUCCESS: PDF file grew after signing.');
        } else {
            console.error('❌ FAILURE: PDF file did not grow.');
        }
    } catch (err) {
        console.error('❌ ERROR during signing process:', err);
    } finally {
        // Cleanup
        // if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
    }
}

verifySigning();
