const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/export-expiry',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('expiry_reference.json', data);
    console.log('Saved to expiry_reference.json');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
