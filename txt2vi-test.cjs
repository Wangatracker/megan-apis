const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const crypto = require('crypto');

const API = "https://t2v.aritek.app";
const SIGN = "68d6165b72a7f2d8d17b0dc6fe9691abdf77c583"; // SHA1 cert APK
const VERSION_CODE = 85;
const UA = "okhttp/4.12.0";
const DEVICE_FILE = path.join(__dirname, ".device_id");
const TOKEN_FILE = path.join(__dirname, ".token_cache");

// ---------- Device ID persistent ----------
function getDeviceId() {
    if (fs.existsSync(DEVICE_FILE)) {
        return fs.readFileSync(DEVICE_FILE, 'utf8').trim();
    }
    const id = "test_" + crypto.randomBytes(8).toString('hex');
    fs.writeFileSync(DEVICE_FILE, id);
    return id;
}

// ---------- Get token ----------
async function getToken(deviceId) {
    if (fs.existsSync(TOKEN_FILE)) {
        const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
        if (cached.expires > Date.now() && cached.deviceId === deviceId) {
            return cached.token;
        }
    }
    const data = await apiFetch(`${API}/api/v1/user/info`, { method: 'GET' }, deviceId, null);
    const token = data.data.token;
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({
        token,
        deviceId,
        expires: Date.now() + (data.ttl || 3600) * 900
    }));
    return token;
}

// ---------- Generic fetch ----------
async function apiFetch(url, options = {}, deviceId, token, timeoutMs = 30000, retries = 3) {
    for (let attempt = 0; ; attempt++) {
        const headers = {
            'User-Agent': UA,
            'versionCode': String(VERSION_CODE),
            'Ctry-Target': 'others',
            'Device-Id': deviceId,
            'Sign': SIGN,
            ...(options.headers || {})
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeoutMs);
        let resp;
        try {
            resp = await fetch(url, { ...options, headers, signal: ac.signal });
        } catch (e) {
            clearTimeout(timer);
            throw new Error(`Connection failed: ${e.message}`);
        }
        clearTimeout(timer);
        const text = await resp.text();
        
        console.log(`\n\x1b[36m[DEBUG]\x1b[0m Status: ${resp.status}`);
        console.log(`\x1b[36m[DEBUG]\x1b[0m Response: ${text.substring(0, 300)}`);
        
        if (resp.status === 429 && attempt < retries) {
            console.log(`\x1b[33m[WARN]\x1b[0m Rate limited, waiting ${30 * (attempt + 1)}s...`);
            await sleep(30000 * (attempt + 1));
            continue;
        }
        let json;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }
        return json;
    }
}

async function apiJson(url, options, deviceId, token) {
    return apiFetch(url, options, deviceId, token);
}

async function download(url, dest) {
    const resp = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!resp.ok) throw new Error(`Download failed: HTTP ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return buf;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Test functions ----------
async function testAPI() {
    console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[35m║           TESTING TXT2VI VIDEO GENERATOR             ║\x1b[0m');
    console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

    const deviceId = getDeviceId();
    console.log(`\n\x1b[36m[INFO]\x1b[0m Device ID: ${deviceId}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Sign: ${SIGN}`);
    console.log(`\x1b[36m[INFO]\x1b[0m API Base: ${API}`);

    // Test 1: Get token
    console.log('\n\x1b[36m[TEST 1]\x1b[0m Getting authentication token...');
    try {
        const token = await getToken(deviceId);
        console.log(`\x1b[32m[OK]\x1b[0m Token obtained: ${token.substring(0, 20)}...`);
        
        // Test 2: Check quota
        console.log('\n\x1b[36m[TEST 2]\x1b[0m Checking video quota...');
        try {
            const quota = await apiJson(`${API}/api/v1/user/check-limit?type=t2v`, {}, deviceId, token);
            if (quota.data) {
                console.log(`\x1b[32m[OK]\x1b[0m Quota: ${quota.data.remaining}/${quota.data.total_limit}`);
            }
        } catch (e) {
            console.log(`\x1b[31m[FAIL]\x1b[0m Quota check failed: ${e.message}`);
        }

        // Test 3: Generate video
        console.log('\n\x1b[36m[TEST 3]\x1b[0m Generating test video...');
        console.log(`\x1b[33m[PROMPT]\x1b[0m "A cat walking in the garden"`);
        
        const body = {
            prompt: "A cat walking in the garden",
            versionCode: VERSION_CODE,
            deviceID: deviceId,
            isPremium: 1,
            ctry_target: "others",
            used: [],
            aspect_ratio: "auto",
            ai_sound: 1
        };

        try {
            const res = await apiFetch(`${API}/api/v3/video/t2v`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }, deviceId, token, 60000);

            if (res.data && res.data.url) {
                console.log(`\x1b[32m[SUCCESS]\x1b[0m Video URL: ${res.data.url}`);
                
                // Download video
                console.log(`\x1b[36m[INFO]\x1b[0m Downloading video...`);
                const filename = `test_video_${Date.now()}.mp4`;
                await download(res.data.url, filename);
                console.log(`\x1b[32m[OK]\x1b[0m Video saved: ${filename}`);
            } else {
                console.log(`\x1b[33m[WARN]\x1b[0m No video URL in response`);
                console.log(`\x1b[36m[INFO]\x1b[0m Full response:`, JSON.stringify(res, null, 2));
            }
        } catch (e) {
            console.log(`\x1b[31m[FAIL]\x1b[0m Video generation failed: ${e.message}`);
        }

    } catch (e) {
        console.log(`\x1b[31m[FAIL]\x1b[0m Token retrieval failed: ${e.message}`);
    }

    console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
    console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Run test
testAPI().catch(e => {
    console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
    process.exit(1);
});
