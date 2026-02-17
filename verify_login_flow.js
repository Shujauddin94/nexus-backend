const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    try {
        const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();

        console.log('Registering user...');
        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
        await page.type('input[type="text"]', 'Login Tester');
        await page.type('input[type="email"]', 'tester@nexus.com');
        const pwr = await page.$$('input[type="password"]');
        await pwr[0].type('password123');
        await pwr[1].type('password123');
        await page.click('input[type="checkbox"]');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log('Logging out (clearing storage)...');
        await page.evaluate(() => localStorage.clear());

        console.log('Navigating to Login Page...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

        console.log('Filling login form...');
        await page.type('input[type="email"]', 'tester@nexus.com');
        await page.type('input[type="password"]', 'password123');

        // Use index for the Entrepreneur button (first in the grid)
        const buttons = await page.$$('button[type="button"]');
        if (buttons.length > 0) {
            await buttons[0].click(); // Select Entrepreneur
        }

        console.log('Submitting login...');
        await page.click('button[type="submit"]');

        await new Promise(r => setTimeout(r, 5000));

        const finalUrl = page.url();
        console.log('Final URL after login:', finalUrl);

        if (finalUrl.includes('/dashboard')) {
            console.log('SUCCESS: Login works.');
            await page.screenshot({ path: 'login_success.png' });
        } else {
            console.log('FAILURE: Login stayed on same page.');
            const error = await page.evaluate(() => document.body.innerText.substring(0, 200));
            console.log('Error on Page:', error);
            await page.screenshot({ path: 'login_failure.png' });
        }

        await browser.close();
    } catch (e) { console.error('Test script crashed:', e); }
})();
