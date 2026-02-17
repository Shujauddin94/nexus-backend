const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    const pagesToCheck = [
        { name: 'Landing', url: 'http://localhost:5173/' },
        { name: 'Login', url: 'http://localhost:5173/login' },
        { name: 'Register', url: 'http://localhost:5173/register' }
    ];

    try {
        const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });

        for (const target of pagesToCheck) {
            console.log(`Checking ${target.name} Page...`);
            const page = await browser.newPage();

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log(`[${target.name}] CONSOLE ERROR:`, msg.text());
                }
            });

            await page.goto(target.url, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: `${target.name.toLowerCase()}_check.png` });
            console.log(`[${target.name}] Page loaded and screenshot captured.`);
            await page.close();
        }

        await browser.close();
        console.log('All checks complete.');
    } catch (e) {
        console.error('System check failed:', e);
    }
})();
