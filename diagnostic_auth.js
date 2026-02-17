const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const User = require('./models/User');
const { register } = require('./controllers/authController');

const test = async () => {
    console.log('Starting diagnostic test...');
    await connectDB();

    const req = {
        body: {
            name: "Diagnostic Test",
            email: `diag_${Date.now()}@test.com`,
            password: "password123",
            role: "Investor"
        }
    };

    const res = {
        status: function (code) {
            console.log('Status set to:', code);
            this.statusCode = code;
            return this;
        },
        cookie: function (name, val, opt) {
            console.log('Cookie set:', name);
            return this;
        },
        json: function (data) {
            console.log('JSON Response:', JSON.stringify(data, null, 2));
            return this;
        }
    };

    const next = (err) => {
        if (err) {
            console.error('Next called with error:', err.stack);
        } else {
            console.log('Next called without error');
        }
    };

    try {
        console.log('Calling register controller...');
        await register(req, res, next);
        console.log('Register call completed.');
    } catch (err) {
        console.error('Caught error during register:', err);
    }

    process.exit(0);
};

test();
