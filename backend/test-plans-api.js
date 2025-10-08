const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/subscriptions/plans',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Testing subscription plans API...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 API Response:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.end();
