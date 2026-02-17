const http = require('http');

const data = JSON.stringify({
    name: "Backend Test",
    email: `backend_${Date.now()}@test.com`,
    password: "password123",
    role: "Entrepreneur"
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();
