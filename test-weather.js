const https = require('https');

const API_KEY = process.env.WEATHER_API_KEY || 'your-api-key';
const CITY = 'Bantwal taluk';

const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CITY)}&units=metric&appid=${API_KEY}`;

console.log('Fetching:', url);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
