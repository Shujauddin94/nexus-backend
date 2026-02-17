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

        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
        await page.type('input[type="text"]', 'Success screenshot');
        await page.type('input[type="email"]', 'success@nexus.com');
        const pwr = await page.$$('input[type="password"]');
        await pwr[0].type('password123');
        await pwr[1].type('password123');
        await page.click('input[type="checkbox"]');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'dashboard_final.png' });
        console.log('Done');
        await browser.close();
    } catch (e) { console.error(e); }
})();
