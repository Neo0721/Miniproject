const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function verify() {
    console.log('--- Starting Backend Verification ---');

    // Note: We need a valid token or skip auth for testing
    // Since I can't easily get a token, I'll check if I can hit the endpoints and get expected errors or mock data if possible.
    // Actually, I should probably check the logs to see if the server restarted correctly without errors.

    try {
        console.log('1. Checking health endpoint...');
        const res = await axios.get(`${API_BASE}/`);
        console.log('Health check:', res.data.success ? 'PASSED' : 'FAILED');
    } catch (err) {
        console.error('Health check error:', err.message);
    }

    // I'll check the staff endpoint with a mock request if I could, 
    // but since it's protected by authMiddleware, I'll check the code logic and logs.
    console.log('Verification script created. I will now examine the logs to ensure the server is happy.');
}

verify();
