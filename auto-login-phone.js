import fetch from 'node-fetch';

const PHONE = '254758476795';
const PASSWORD = 'Wanga@2006';

async function loginWithPhone() {
  console.log('📱 Logging in with phone number...');
  
  try {
    // Step 1: Start the login process with phone
    const initRes = await fetch('https://clerk.suno.com/v1/client/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        identifier: PHONE,
        strategy: 'phone_code'
      })
    });

    const initData = await initRes.json();
    
    if (!initRes.ok) {
      console.log('❌ Login initiation failed:', initData);
      console.log('💡 Trying alternative method...');
      return await loginWithEmail();
    }

    console.log('✅ Phone verification initiated!');
    console.log('📝 Check your phone for SMS code');
    console.log('⚠️  You need to enter the SMS code manually');
    
    // Since we can't auto-read SMS, we need to prompt
    const code = await new Promise((resolve) => {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the 6-digit SMS code: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    // Step 2: Verify the phone code
    const verifyRes = await fetch(`https://clerk.suno.com/v1/client/sign_in/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        strategy: 'phone_code',
        code: code
      })
    });

    const data = await verifyRes.json();
    
    if (!verifyRes.ok) {
      console.log('❌ Verification failed:', data);
      return null;
    }

    // Extract session info
    const session = data.client?.sessions?.[0];
    if (!session) {
      console.log('❌ No session found');
      return null;
    }

    const sessionId = session.id;
    
    // Get JWT token
    const tokenRes = await fetch(`https://clerk.suno.com/v1/client/sessions/${sessionId}/tokens?_clerk_js_version=4.70.5`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/'
      }
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.jwt) {
      console.log('❌ Failed to get JWT');
      return null;
    }

    console.log('✅ LOGIN SUCCESSFUL!');
    console.log(`📝 Session ID: ${sessionId}`);
    console.log(`🔑 JWT: ${tokenData.jwt.slice(0, 50)}...`);
    
    // Test the API
    console.log('\n🎵 Testing song generation...');
    await testGeneration(tokenData.jwt);
    
    return { sessionId, jwt: tokenData.jwt };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function loginWithEmail() {
  console.log('\n📧 Trying email login instead...');
  
  try {
    const res = await fetch('https://clerk.suno.com/v1/client/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        identifier: PHONE,
        password: PASSWORD,
        strategy: 'password'
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.log('❌ Email login failed:', data);
      return null;
    }

    const session = data.client?.sessions?.[0];
    if (!session) {
      console.log('❌ No session found');
      return null;
    }

    const sessionId = session.id;
    
    const tokenRes = await fetch(`https://clerk.suno.com/v1/client/sessions/${sessionId}/tokens?_clerk_js_version=4.70.5`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/'
      }
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.jwt) {
      console.log('❌ Failed to get JWT');
      return null;
    }

    console.log('✅ LOGIN SUCCESSFUL!');
    console.log(`📝 Session ID: ${sessionId}`);
    console.log(`🔑 JWT: ${tokenData.jwt.slice(0, 50)}...`);
    
    await testGeneration(tokenData.jwt);
    
    return { sessionId, jwt: tokenData.jwt };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testGeneration(jwt) {
  try {
    const response = await fetch('https://studio-api.suno.ai/api/generate/v2/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Origin': 'https://suno.com',
        'Referer': 'https://suno.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        gpt_description_prompt: 'A happy pop song about coding at night',
        title: 'Code Night',
        make_instrumental: false,
        mv: 'chirp-v3-0'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SONG GENERATION SUCCESSFUL!');
      console.log('📝 Response:', JSON.stringify(data, null, 2).slice(0, 400) + '...');
      console.log('\n🎵 Your song is being generated!');
      console.log('💾 Save these credentials for future use:');
      console.log(`SUNO_SESSION_ID=${data.task_id || 'check_response'}`);
      console.log(`SUNO_JWT=${jwt}`);
    } else {
      console.log('❌ Generation failed:', data);
    }
  } catch (error) {
    console.error('❌ Generation error:', error.message);
  }
}

// Run the login
loginWithPhone();
