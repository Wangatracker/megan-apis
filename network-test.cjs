const dns = require('dns');
const https = require('https');
const http = require('http');

// Test DNS resolution
function testDNS(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        resolve({ hostname, resolved: false, error: err.message });
      } else {
        resolve({ hostname, resolved: true, address });
      }
    });
  });
}

// Test HTTP connection
function testHTTP(url, options = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          time: Date.now() - startTime,
          size: data.length,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        ok: false,
        time: Date.now() - startTime,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        ok: false,
        time: Date.now() - startTime,
        error: 'Timeout'
      });
    });
  });
}

// Test with curl (bypasses Node.js fetch issues)
function testWithCurl(url) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{size_download}" --max-time 10 "${url}"`, 
      (error, stdout, stderr) => {
        if (error) {
          resolve({ url, curl: false, error: error.message });
        } else {
          const [status, time, size] = stdout.split('|');
          resolve({ 
            url, 
            curl: true, 
            status: parseInt(status), 
            time: parseFloat(time), 
            size: parseInt(size) 
          });
        }
      });
  });
}

async function runNetworkTest() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           NETWORK CONNECTIVITY DIAGNOSTIC           ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  const services = [
    { name: 'Pollinations Image', url: 'https://image.pollinations.ai/prompt/test?width=10&height=10' },
    { name: 'Pollinations Text', url: 'https://text.pollinations.ai/test' },
    { name: 'NoTrack.ai', url: 'https://notrack.ai/chat' },
    { name: 'JollyAI', url: 'https://jollygenapi.space/ai' },
    { name: 'TXT2VI', url: 'https://t2v.aritek.app/api/v1/user/info' },
    { name: 'HuggingFace', url: 'https://huggingface.co/api/whoami-v2' },
    { name: 'Temp Email', url: 'https://creatett-seven.vercel.app/api/tempmail/create' },
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'Cloudflare', url: 'https://1.1.1.1' }
  ];

  console.log('\n\x1b[36m[TEST 1]\x1b[0m DNS Resolution:\n');
  const hostnames = [...new Set(services.map(s => new URL(s.url).hostname))];
  
  for (const hostname of hostnames) {
    const result = await testDNS(hostname);
    if (result.resolved) {
      console.log(`  \x1b[32m✓\x1b[0m ${hostname} → ${result.address}`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${hostname} → ${result.error}`);
    }
  }

  console.log('\n\x1b[36m[TEST 2]\x1b[0m HTTP Connections (Node.js):\n');
  for (const service of services) {
    process.stdout.write(`  Testing ${service.name}... `);
    const result = await testHTTP(service.url);
    
    if (result.ok) {
      console.log(`\x1b[32m✓\x1b[0m ${result.status} (${result.time}ms, ${result.size} bytes)`);
    } else if (result.status === 0) {
      console.log(`\x1b[31m✗\x1b[0m ${result.error || 'Failed'}`);
    } else {
      console.log(`\x1b[33m⚠\x1b[0m ${result.status} (${result.time}ms)`);
    }
  }

  console.log('\n\x1b[36m[TEST 3]\x1b[0m HTTP Connections (curl):\n');
  for (const service of services.slice(0, 5)) {
    process.stdout.write(`  Testing ${service.name}... `);
    const result = await testWithCurl(service.url);
    
    if (result.curl && result.status === 200) {
      console.log(`\x1b[32m✓\x1b[0m ${result.status} (${result.time}s, ${result.size} bytes)`);
    } else if (result.curl) {
      console.log(`\x1b[33m⚠\x1b[0m ${result.status} (${result.time}s)`);
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${result.error}`);
    }
  }

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  DIAGNOSTIC COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');

  // Summary
  console.log('\n\x1b[36m[ANALYSIS]\x1b[0m');
  console.log('If Google works but other services fail:');
  console.log('  → Services are blocking your IP/requests');
  console.log('  → Wait 10-30 minutes and try again');
  console.log('  → Use a VPN or different network');
  console.log('');
  console.log('If Google also fails:');
  console.log('  → Check your internet connection');
  console.log('  → DNS issues - try: echo "nameserver 8.8.8.8" > /etc/resolv.conf');
  console.log('  → Restart your network');
}

runNetworkTest();
