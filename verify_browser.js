const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    // Attempt to find Chrome or Edge
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    if (!executablePath) {
        console.error('Browser executable not found. Cannot run verification.');
        process.exit(1);
    }

    console.log(`Using browser at: ${executablePath}`);

    try {
        const browser = await puppeteer.launch({
            executablePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        console.log('Navigating to Swagger UI...');
        const response = await page.goto('http://localhost:5001/api-docs', { waitUntil: 'domcontentloaded' });

        // Wait for potential client-side rendering
        await new Promise(r => setTimeout(r, 3000));

        console.log(`Response Status: ${response.status()}`);
        console.log(`Page Title: ${await page.title()}`);

        const content = await page.content();
        if (content.includes('Nexus API')) {
            console.log('VERIFICATION SUCCESS: Swagger UI Loaded');
        } else {
            console.log('VERIFICATION FAILURE: "Nexus API" not found on page');
        }

        await browser.close();
    } catch (e) {
        console.error('Browser Test Failed:', e);
    }
})();
