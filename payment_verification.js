const API_URL = 'http://localhost:5002/api/v1';

async function verifyPaymentSystem() {
    console.log('--- Verifying Full Payment System lifecycle ---');

    const api = async (endpoint, method = 'GET', body = null, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const data = await res.json();
        if (!res.ok) {
            const err = new Error(data.error || res.statusText);
            err.status = res.status;
            err.data = data;
            err.endpoint = endpoint;
            throw err;
        }
        return data;
    };

    try {
        // 1. Recipient (Thomas)
        console.log('1. Setting up recipient (thomas@nexus.com)...');
        let recipient;
        try {
            recipient = await api('/auth/login', 'POST', {
                email: 'thomas@nexus.com',
                password: 'password123'
            });
        } catch (e) {
            recipient = await api('/auth/register', 'POST', {
                name: 'Thomas Jones',
                email: 'thomas@nexus.com',
                password: 'password123',
                role: 'Investor'
            });
        }
        console.log('Recipient ready.');

        // 2. Main User (Sarah)
        console.log('2. Setting up main user (sarah@techwave.io)...');
        let sarah;
        try {
            sarah = await api('/auth/login', 'POST', {
                email: 'sarah@techwave.io',
                password: 'password123'
            });
        } catch (e) {
            sarah = await api('/auth/register', 'POST', {
                name: 'Sarah Chen',
                email: 'sarah@techwave.io',
                password: 'password123',
                role: 'Entrepreneur'
            });
        }
        const token = sarah.token;
        console.log('Main user ready. Token acquired.');

        // 3. Deposit
        console.log('3. Testing Deposit ($1000)...');
        const depositRes = await api('/payments/deposit', 'POST', { amount: 1000 }, token);
        const transactionId = depositRes.transactionId;
        console.log('Deposit intent created. Confirming...');
        await api('/payments/confirm', 'POST', { transactionId }, token);

        const meRes = await api('/auth/me', 'GET', null, token);
        console.log('Balance after deposit:', meRes.data.walletBalance);

        // 4. Transfer
        console.log('4. Transferring $200 to thomas@nexus.com...');
        await api('/payments/transfer', 'POST', {
            recipientEmail: 'thomas@nexus.com',
            amount: 200
        }, token);

        const meAfterTransfer = await api('/auth/me', 'GET', null, token);
        console.log('Balance after transfer:', meAfterTransfer.data.walletBalance);

        // 5. Withdraw
        console.log('5. Withdrawing $300...');
        await api('/payments/withdraw', 'POST', { amount: 300 }, token);

        const meAfterWithdraw = await api('/auth/me', 'GET', null, token);
        console.log('Final Balance:', meAfterWithdraw.data.walletBalance);

        // 6. History
        console.log('6. Checking Transaction History...');
        const historyRes = await api('/payments/history', 'GET', null, token);
        console.log('Total transactions:', historyRes.count);
        historyRes.data.slice(0, 5).forEach(tx => {
            console.log(`- [${tx.type}] $${tx.amount} status: ${tx.status} at ${tx.createdAt}`);
        });

        console.log('\n--- ALL VERIFICATIONS PASSED ---');
    } catch (error) {
        console.error('--- VERIFICATION FAILED ---');
        console.error('Endpoint:', error.endpoint);
        console.error('Status:', error.status);
        console.error('Error:', error.message);
    }
}

verifyPaymentSystem();
