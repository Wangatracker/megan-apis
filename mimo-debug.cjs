const axios = require('axios');
const crypto = require('crypto');

// Test 1: Simple GET to see if server is alive
async function testServerAlive() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Checking if server is alive...');
  try {
    const response = await axios.get('https://aiv1.clemy.top/', {
      timeout: 10000,
      headers: { 'User-Agent': 'Neo/1.0' }
    });
    console.log(`\x1b[32m[OK]\x1b[0m Server responded with status ${response.status}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Response: ${JSON.stringify(response.data).substring(0, 200)}`);
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[33m[INFO]\x1b[0m Server is alive but returned ${error.response.status}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`\x1b[31m[FAIL]\x1b[0m Server is DOWN (connection refused)`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`\x1b[31m[FAIL]\x1b[0m Server TIMEOUT`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m Error: ${error.message}`);
    }
  }
}

// Test 2: Simple POST without encryption
async function testSimplePost() {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Testing simple POST request...');
  try {
    const response = await axios.post('https://aiv1.clemy.top/chat-completion-stream', 
      JSON.stringify({ test: true }),
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Neo/1.0'
        }
      }
    );
    console.log(`\x1b[32m[OK]\x1b[0m Server responded with status ${response.status}`);
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[33m[INFO]\x1b[0m Server returned ${error.response.status}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Headers:`, JSON.stringify(error.response.headers, null, 2));
      console.log(`\x1b[36m[INFO]\x1b[0m Data:`, JSON.stringify(error.response.data).substring(0, 500));
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m Error: ${error.message}`);
    }
  }
}

// Test 3: Check models endpoint
async function testModelsEndpoint() {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Checking models endpoint...');
  try {
    const response = await axios.get('https://apps.clemy.top/ai/mimo/models.json', {
      timeout: 10000,
      headers: { 'User-Agent': 'Neo/1.0' }
    });
    console.log(`\x1b[32m[OK]\x1b[0m Models endpoint works!`);
    console.log(`\x1b[36m[INFO]\x1b[0m Models data:`, JSON.stringify(response.data).substring(0, 200));
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[33m[INFO]\x1b[0m Models endpoint returned ${error.response.status}`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m Models endpoint error: ${error.message}`);
    }
  }
}

// Test 4: Try OPTIONS to see allowed methods
async function testOptions() {
  console.log('\n\x1b[36m[TEST 4]\x1b[0m Checking allowed methods...');
  try {
    const response = await axios.options('https://aiv1.clemy.top/chat-completion-stream', {
      timeout: 10000,
      headers: {
        'Origin': 'https://clemy.top',
        'Access-Control-Request-Method': 'POST',
        'User-Agent': 'Neo/1.0'
      }
    });
    console.log(`\x1b[32m[OK]\x1b[0m OPTIONS response:`, JSON.stringify(response.headers, null, 2));
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[33m[INFO]\x1b[0m OPTIONS returned ${error.response.status}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Headers:`, JSON.stringify(error.response.headers, null, 2));
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m OPTIONS error: ${error.message}`);
    }
  }
}

// Run all tests
async function runDebug() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           DEBUGGING MIMO AI API                     ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  await testServerAlive();
  await testSimplePost();
  await testModelsEndpoint();
  await testOptions();

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  DEBUG COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
  
  console.log('\n\x1b[33m[CONCLUSION]\x1b[0m');
  console.log('The 400 error suggests:');
  console.log('1. Server is alive and responding');
  console.log('2. The API endpoint exists');
  console.log('3. The request format/signature is being rejected');
  console.log('4. The encryption method may have been updated');
  console.log('5. Additional headers or parameters might be required');
}

runDebug();
