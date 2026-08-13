const crypto = require('crypto');

const API = 'https://jollygenapi.space/ai';
const ORIGIN = 'https://chat.jollyai.online';
const GUEST_LIMIT = 3;

function getGuestHash() {
  return crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
}

async function getUsage(guestHash) {
  const r = await fetch(`${API}/usage-guest?guest_hash=${encodeURIComponent(guestHash)}`);
  if (!r.ok) return { used: 0, limit: GUEST_LIMIT };
  const d = await r.json();
  return { used: d.chat?.used || 0, limit: GUEST_LIMIT };
}

function stripLinks(text) {
  return String(text)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/https?:\/\/[^\s)\]]+/g, '')
    .replace(/\*{2,}/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function chat(message, guestHash) {
  const res = await fetch(API + '/chat-guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ message, stream: true, guest_hash: guestHash }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    const msg = d?.detail?.message || d?.detail || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', answer = '', streamErr = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    let sep;
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const rawEvent = buf.slice(0, sep);
      buf = buf.slice(sep + 2);

      const data = rawEvent.split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('');
      if (!data) continue;

      let obj;
      try { obj = JSON.parse(data); } catch { continue; }

      if (obj.delta) {
        answer += obj.delta;
        process.stdout.write(obj.delta);
      } else if (obj.error) {
        streamErr = obj.error;
      }
    }
  }

  if (!answer && streamErr) throw new Error(streamErr);
  return { answer: stripLinks(answer) };
}

async function testJollyAI() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           TESTING JOLLYAI CHAT API                  ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // Test 1: Create guest hash
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Creating guest hash...');
  const guestHash = getGuestHash();
  console.log(`\x1b[32m[OK]\x1b[0m Guest hash: ${guestHash.substring(0, 30)}...`);

  // Test 2: Check usage
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Checking guest quota...');
  try {
    const usage = await getUsage(guestHash);
    console.log(`\x1b[32m[OK]\x1b[0m Quota: ${usage.used}/${usage.limit} used`);
  } catch (e) {
    console.log(`\x1b[33m[WARN]\x1b[0m Could not check quota: ${e.message}`);
  }

  // Test 3: Send message
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Sending test message...');
  console.log('\x1b[33m[PROMPT]\x1b[0m "Hello! Are you working? Please respond briefly."\n');
  
  try {
    console.log('\x1b[32m[RESPONSE]\x1b[0m ');
    const result = await chat("Hello! Are you working? Please respond briefly.", guestHash);
    console.log('\n');
    
    if (result.answer) {
      console.log('\n\x1b[32m✅ SUCCESS!\x1b[0m JollyAI API is working!');
      console.log(`\x1b[36m[INFO]\x1b[0m Response length: ${result.answer.length} characters`);
    } else {
      console.log('\n\x1b[33m[WARN]\x1b[0m Empty response');
    }
  } catch (e) {
    console.log(`\n\x1b[31m[FAIL]\x1b[0m ${e.message}`);
  }

  // Test 4: Check quota after use
  console.log('\n\x1b[36m[TEST 4]\x1b[0m Checking quota after use...');
  try {
    const usage = await getUsage(guestHash);
    console.log(`\x1b[32m[OK]\x1b[0m Quota now: ${usage.used}/${usage.limit} used`);
  } catch (e) {
    console.log(`\x1b[33m[WARN]\x1b[0m ${e.message}`);
  }

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Run test
testJollyAI().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
  process.exit(1);
});
