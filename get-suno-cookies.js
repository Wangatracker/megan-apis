// Script to help you get Suno cookies
import fetch from 'node-fetch';
import { exec } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Suno Cookie Helper');
console.log('=====================');
console.log('\n📋 To get your Suno cookies:');
console.log('1. Open Chrome/Firefox and login to https://suno.com');
console.log('2. Press F12 to open Developer Tools');
console.log('3. Go to Application/Storage tab');
console.log('4. Find Cookies -> https://suno.com');
console.log('5. Look for these cookies:');
console.log('   - __session (this is your session ID)');
console.log('   - __client_uat (this is your client token)');
console.log('   - OR look for "session" and "client_uat"\n');

rl.question('Paste your __session cookie value: ', (session) => {
  rl.question('Paste your __client_uat cookie value: ', (clientUat) => {
    rl.question('Paste your full cookie string (or press Enter to skip): ', (cookieString) => {
      
      // Build cookie string
      const cookie = cookieString || `__session=${session}; __client_uat=${clientUat}`;
      
      console.log('\n🔑 Testing credentials...');
      
      testCredentials(session, cookie);
      rl.close();
    });
  });
});

async function testCredentials(sessionId, cookie) {
  try {
    console.log('📡 Getting JWT token...');
    
    const response = await fetch(`https://clerk.suno.com/v1/client/sessions/${sessionId}/tokens?_clerk_js_version=4.70.5`, {
      method: 'POST',
      headers: {
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'origin': 'https://suno.com',
        'referer': 'https://suno.com/'
      }
    });

    const data = await response.json();
    
    if (response.status === 200 && data.jwt) {
      console.log('\n✅ SUCCESS! JWT token obtained!');
      console.log(`📝 Token: ${data.jwt.substring(0, 50)}...\n`);
      
      console.log('🎵 Testing song generation...');
      await testSongGeneration(data.jwt);
      
      console.log('\n✨ Add these to your .env file:');
      console.log(`SUNO_SESSION_ID=${sessionId}`);
      console.log(`SUNO_COOKIE=${cookie}`);
      console.log(`SUNO_UA=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0`);
      
    } else {
      console.log('\n❌ Failed to get JWT token.');
      console.log('Response:', data);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure you are logged into suno.com in your browser');
      console.log('2. Copy the ENTIRE cookie string, not just parts');
      console.log('3. Try using the full cookie string method');
      console.log('4. Your session might have expired - try logging out and back in');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testSongGeneration(jwt) {
  try {
    const response = await fetch('https://studio-api.suno.ai/api/generate/v2/', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${jwt}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'origin': 'https://suno.com',
        'referer': 'https://suno.com/',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        gpt_description_prompt: 'A quick test song',
        title: 'API Test',
        make_instrumental: false,
        mv: 'chirp-v3-0'
      })
    });

    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Song generation API is working!');
      console.log('📝 Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      console.log('⚠️ Song generation returned:', response.status);
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('⚠️ Song generation test failed:', error.message);
  }
}
