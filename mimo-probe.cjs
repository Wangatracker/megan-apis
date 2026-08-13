const axios = require('axios');
const crypto = require('crypto');

// Try different endpoints and methods to find the working API
async function probeEndpoints() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           PROBING MIMO AI API ENDPOINTS              ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  const baseUrls = [
    'https://aiv1.clemy.top',
    'https://api.clemy.top',
    'https://apps.clemy.top'
  ];

  const endpoints = [
    '/chat-completion-stream',
    '/chat/completions',
    '/v1/chat/completions',
    '/api/chat',
    '/chat',
    '/completion',
    '/stream',
    '/mimo/chat',
    '/ai/chat'
  ];

  for (const base of baseUrls) {
    console.log(`\n\x1b[36m════════════════════════════════════════════\x1b[0m`);
    console.log(`\x1b[36m Testing base: ${base}\x1b[0m`);
    console.log(`\x1b[36m════════════════════════════════════════════\x1b[0m`);

    for (const endpoint of endpoints) {
      const url = base + endpoint;
      try {
        const response = await axios.post(url, 
          JSON.stringify({ prompt: 'test', model: 'xiaomi/mimo-v2.5' }),
          {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Neo/1.0',
              'Accept': '*/*'
            },
            validateStatus: (status) => status < 500 // Accept all statuses below 500
          }
        );
        
        if (response.status === 200) {
          console.log(`\x1b[32m[FOUND]\x1b[0m ${url} → 200 OK!`);
          console.log(`\x1b[36m[INFO]\x1b[0m Response: ${JSON.stringify(response.data).substring(0, 200)}`);
        } else if (response.status === 400) {
          console.log(`\x1b[33m[400]\x1b[0m ${url} → Bad Request (might need specific format)`);
          console.log(`\x1b[36m[INFO]\x1b[0m Response: ${JSON.stringify(response.data).substring(0, 200)}`);
        } else if (response.status === 404) {
          console.log(`\x1b[31m[404]\x1b[0m ${url} → Not Found`);
        } else if (response.status === 405) {
          console.log(`\x1b[31m[405]\x1b[0m ${url} → Method Not Allowed`);
        } else {
          console.log(`\x1b[33m[${response.status}]\x1b[0m ${url} → ${JSON.stringify(response.data).substring(0, 100)}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`\x1b[31m[DOWN]\x1b[0m ${url} → Connection refused`);
        } else if (error.code === 'ETIMEDOUT') {
          console.log(`\x1b[31m[TIMEOUT]\x1b[0m ${url} → Timeout`);
        } else if (error.response) {
          console.log(`\x1b[33m[${error.response.status}]\x1b[0m ${url} → ${error.message}`);
        } else {
          console.log(`\x1b[31m[ERROR]\x1b[0m ${url} → ${error.message}`);
        }
      }
    }
  }

  // Try to find API documentation or schema
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m Looking for API schema/docs\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');

  const docEndpoints = [
    'https://aiv1.clemy.top/docs',
    'https://aiv1.clemy.top/openapi.json',
    'https://aiv1.clemy.top/swagger',
    'https://aiv1.clemy.top/redoc',
    'https://apps.clemy.top/ai/mimo/',
    'https://apps.clemy.top/ai/mimo/config.json',
    'https://apps.clemy.top/ai/mimo/api.json'
  ];

  for (const url of docEndpoints) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Neo/1.0' },
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        console.log(`\x1b[32m[FOUND]\x1b[0m ${url} → 200 OK`);
        console.log(`\x1b[36m[INFO]\x1b[0m Content: ${JSON.stringify(response.data).substring(0, 300)}`);
      } else {
        console.log(`\x1b[31m[${response.status}]\x1b[0m ${url}`);
      }
    } catch (error) {
      console.log(`\x1b[31m[ERROR]\x1b[0m ${url} → ${error.message}`);
    }
  }
}

// Try to get the actual error from the 400 response
async function getDetailedError() {
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m Getting detailed error from 400 response\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');

  try {
    const response = await axios.post('https://aiv1.clemy.top/chat-completion-stream',
      JSON.stringify({
        prompt: 'test',
        model: 'xiaomi/mimo-v2.5'
      }),
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Neo/1.0'
        },
        validateStatus: (status) => true // Accept all statuses
      }
    );

    console.log(`\x1b[36m[INFO]\x1b[0m Status: ${response.status}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`\x1b[36m[INFO]\x1b[0m Body:`, response.data);
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[36m[INFO]\x1b[0m Status: ${error.response.status}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Data:`, error.response.data);
      console.log(`\x1b[36m[INFO]\x1b[0m Full error:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run all probes
async function runProbe() {
  await probeEndpoints();
  await getDetailedError();
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  PROBE COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

runProbe();
