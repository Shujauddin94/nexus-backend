const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    const testCases = [
        { name: 'Entrepreneur Demo', email: 'sarah@techwave.io', buttonIndex: 0, expectedUrl: '/dashboard/entrepreneur' },
        { name: 'Investor Demo', email: 'michael@vcinnovate.com', buttonIndex: 1, expectedUrl: '/dashboard/investor' }
    ];

    try {
        const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });

        for (const test of testCases) {
            console.log(`Testing ${test.name}...`);
            const page = await browser.newPage();
            await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

            // Click the demo button to fill credentials
            const demoButtons = await page.$$('div.mt-4.grid.grid-cols-2.gap-3 button');
            if (demoButtons[test.buttonIndex]) {
                await demoButtons[test.buttonIndex].click();
            } else {
                console.error(`Demo button ${test.buttonIndex} not found`);
            }

            console.log('Submitting...');
            await page.click('button[type="submit"]');

            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            } catch (e) {
                console.log('Navigation timeout, checking URL...');
            }

            const finalUrl = page.url();
            console.log(`Final URL: ${finalUrl}`);

            if (finalUrl.includes(test.expectedUrl)) {
                console.log(`SUCCESS: ${test.name} logged in correctly.`);
            } else {
                console.log(`FAILURE: ${test.name} failed to log in.`);
                const err = await page.evaluate(() => document.body.innerText.substring(0, 200));
                console.log('Page State:', err);
                await page.screenshot({ path: `${test.name.replace(' ', '_')}_fail.png` });
            }
            await page.close();
        }

        await browser.close();
    } catch (e) {
        console.error('Check failed:', e);
    }
})();
