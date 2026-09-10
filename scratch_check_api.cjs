const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

https.get('https://localhost:7201/swagger/v1/swagger.json', { agent }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      console.log('PUT /api/Tickets/{id}/completed:');
      console.log(JSON.stringify(swagger.paths['/api/Tickets/{id}/completed'], null, 2));

      console.log('GET /api/Tickets/completed:');
      console.log(JSON.stringify(swagger.paths['/api/Tickets/completed'], null, 2));

      console.log('GET /api/Tickets/rejected:');
      console.log(JSON.stringify(swagger.paths['/api/Tickets/rejected'], null, 2));
    } catch(e) {
      console.log(e);
    }
  });
});
