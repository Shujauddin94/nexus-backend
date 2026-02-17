const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    try {
        const browser = await puppeteer.launch({ executablePath, headless: 'new' });
        const page = await browser.newPage();
        console.log('Navigating...');
        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });

        const html = await page.content();
        fs.writeFileSync('register_dump.html', html);
        console.log('HTML dumped to register_dump.html');

        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
