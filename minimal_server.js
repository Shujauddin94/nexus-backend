const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[MINIMAL DEBUG] ${req.method} ${req.url} - next type: ${typeof next}`);
    next();
});

app.post('/api/v1/auth/register', (req, res) => {
    console.log('Register hit');
    res.json({ success: true, message: 'Minimal works' });
});

app.use((err, req, res, next) => {
    console.error('ERROR HANDLER:', err);
    res.status(500).json({ success: false, error: err.message });
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Minimal server on port ${PORT}`);
});
