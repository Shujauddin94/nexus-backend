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
        const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();

        page.on('console', msg => console.log(`CONSOLE [${msg.type()}]:`, msg.text()));

        page.on('request', request => {
            if (request.url().includes('/api/v1/')) {
                console.log(`REQ: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/v1/')) {
                console.log(`RES: ${response.status()} ${response.url()}`);
            }
        });

        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });

        console.log('Filling form...');
        await page.type('input[type="text"]', 'E2E Test Account');
        await page.type('input[type="email"]', `e2e_${Date.now()}@example.com`);
        const pw = await page.$$('input[type="password"]');
        await pw[0].type('password123');
        await pw[1].type('password123');
        await page.click('input[type="checkbox"]');

        console.log('Clicking Register...');
        await page.click('button[type="submit"]');

        await new Promise(r => setTimeout(r, 5000));

        console.log('Final URL:', page.url());
        const html = await page.content();
        fs.writeFileSync('final_state.html', html);

        await browser.close();
    } catch (e) { console.error(e); }
})();
