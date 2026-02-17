const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const executablePath = possiblePaths.find(p => fs.existsSync(p));

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    console.log('--- Checking Landing/Login ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const content = await page.content();
    console.log('Login Page Title:', await page.title());
    if (content.includes('Sarah Johnson')) console.log('Demo accounts visible.');

    console.log('--- Logging in as Sarah ---');
    const demoButtons = await page.$$('div.mt-4.grid.grid-cols-2.gap-3 button');
    await demoButtons[0].click();
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Current URL after login:', page.url());

    console.log('--- Checking Messaging ---');
    await page.goto('http://localhost:5173/chat', { waitUntil: 'networkidle0' });

    // Check API response via page evaluation
    const conversations = await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        if (!token) return 'No token';
        const res = await fetch('http://localhost:5001/api/v1/messages/conversations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    });
    console.log('API Conversations Response:', JSON.stringify(conversations, null, 2));

    const messagesVisible = await page.evaluate(() => document.body.innerText.includes('Hello Michael') || document.body.innerText.includes('Michael Rodriguez'));
    console.log('Messages seeded and visible:', messagesVisible);

    console.log('--- Checking Console Errors ---');
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERR:', err.message));

    await page.screenshot({ path: 'final_system_check.png', fullPage: true });
    console.log('Screenshot saved to final_system_check.png');

    await browser.close();
})();
