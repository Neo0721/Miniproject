const http = require('http');

const data = JSON.stringify({
  title: "Test Issue 12345",
  category: "IT",
  department: "IT",
  subCategory: "WiFi",
  description: "Test description for issue upload",
  location: "Building A, Floor 1, Room 101",
  priority: "medium",
  tags: ["urgent"],
  timetableImpact: false,
  attachments: [{
    name: "test.png",
    type: "image/png",
    size: 1024,
    dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    uploadedAt: new Date().toISOString()
  }]
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/issues',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-user-role': 'student',
    'x-user-email': 'student@example.com' // Ensure this exists or test dev bypass
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', e => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
