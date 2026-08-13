const axios = require('axios');
const crypto = require('crypto');

// Get the full OpenAPI spec
async function getOpenAPISpec() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           GETTING MIMO API SPECIFICATION            ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  try {
    const response = await axios.get('https://aiv1.clemy.top/openapi.json', {
      timeout: 10000,
      headers: { 'User-Agent': 'Neo/1.0' }
    });

    const spec = response.data;
    console.log('\n\x1b[32m[OK]\x1b[0m Got OpenAPI spec!');
    
    // Print all paths
    console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m AVAILABLE ENDPOINTS:\x1b[0m');
    console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');
    
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        console.log(`\n\x1b[33m${method.toUpperCase()}\x1b[0m ${path}`);
        console.log(`  Summary: ${details.summary || 'N/A'}`);
        console.log(`  Operation ID: ${details.operationId || 'N/A'}`);
        
        if (details.requestBody) {
          console.log(`  Request Body:`);
          const schema = details.requestBody.content?.['application/json']?.schema;
          if (schema) {
            console.log(`    Schema: ${JSON.stringify(schema, null, 4)}`);
          }
        }
        
        if (details.parameters) {
          console.log(`  Parameters:`);
          details.parameters.forEach(param => {
            console.log(`    - ${param.name} (${param.in}): ${param.description || 'N/A'}`);
          });
        }
      }
    }

    return spec;
  } catch (error) {
    console.log(`\x1b[31m[FAIL]\x1b[0m Error getting spec: ${error.message}`);
    return null;
  }
}

// Test the correct endpoint
async function testCorrectEndpoint() {
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TESTING CORRECT ENDPOINT (/chat-completion)\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');

  const testPayloads = [
    {
      name: 'Simple payload',
      data: {
        prompt: 'Hello',
        model: 'xiaomi/mimo-v2.5'
      }
    },
    {
      name: 'With messages array',
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'xiaomi/mimo-v2.5'
      }
    },
    {
      name: 'OpenAI format',
      data: {
        model: 'xiaomi/mimo-v2.5',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        stream: false
      }
    }
  ];

  for (const test of testPayloads) {
    console.log(`\n\x1b[33m[TEST]\x1b[0m ${test.name}`);
    
    try {
      const response = await axios.post('https://aiv1.clemy.top/chat-completion',
        test.data,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Neo/1.0'
          },
          validateStatus: (status) => true
        }
      );

      console.log(`\x1b[36m[INFO]\x1b[0m Status: ${response.status}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Headers:`, JSON.stringify(response.headers, null, 2));
      console.log(`\x1b[36m[INFO]\x1b[0m Body:`, JSON.stringify(response.data, null, 2));
      
      if (response.status === 200) {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m This payload format works!`);
        break;
      }
    } catch (error) {
      if (error.response) {
        console.log(`\x1b[33m[${error.response.status}]\x1b[0m ${error.message}`);
        console.log(`\x1b[36m[INFO]\x1b[0m Response:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`\x1b[31m[ERROR]\x1b[0m ${error.message}`);
      }
    }
  }
}

// Try the greet endpoint
async function testGreetEndpoint() {
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TESTING GREET ENDPOINT\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');

  try {
    const response = await axios.get('https://aiv1.clemy.top/greet', {
      timeout: 10000,
      headers: { 'User-Agent': 'Neo/1.0' }
    });
    console.log(`\x1b[32m[OK]\x1b[0m Status: ${response.status}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log(`\x1b[33m[${error.response.status}]\x1b[0m ${error.message}`);
    } else {
      console.log(`\x1b[31m[ERROR]\x1b[0m ${error.message}`);
    }
  }
}

// Run all tests
async function runTests() {
  const spec = await getOpenAPISpec();
  await testGreetEndpoint();
  await testCorrectEndpoint();
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

runTests();
