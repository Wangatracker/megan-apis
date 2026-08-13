const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline/promises');

const API = "https://t2v.aritek.app";
const SIGN = "68d6165b72a7f2d8d17b0dc6fe9691abdf77c583"; // SHA1 cert APK
const VERSION_CODE = 85;
const UA = "okhttp/4.12.0";

// Device management
const DEVICE_POOL_FILE = path.join(__dirname, "device_pool.json");
const VIDEO_LOG_FILE = path.join(__dirname, "video_generation_log.json");

// Device pool management
class DevicePool {
  constructor() {
    this.devices = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DEVICE_POOL_FILE)) {
        this.devices = JSON.parse(fs.readFileSync(DEVICE_POOL_FILE, 'utf8'));
      }
    } catch (e) {
      this.devices = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(DEVICE_POOL_FILE, JSON.stringify(this.devices, null, 2));
    } catch (e) {}
  }

  createDevice() {
    const deviceId = "gen_" + crypto.randomBytes(12).toString('hex');
    const device = {
      id: deviceId,
      created: Date.now(),
      videosGenerated: 0,
      maxVideos: 10,
      token: null,
      tokenExpiry: null,
      lastUsed: null
    };
    this.devices.push(device);
    this.save();
    return device;
  }

  getAvailableDevice() {
    // Find device with remaining quota
    let device = this.devices.find(d => d.videosGenerated < d.maxVideos);
    
    if (!device) {
      // Create new device if all are exhausted
      device = this.createDevice();
      console.log(`\x1b[32m[NEW DEVICE]\x1b[0m Created: ${device.id.substring(0, 20)}...`);
    }
    
    return device;
  }

  updateDevice(deviceId, updates) {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      Object.assign(device, updates);
      this.save();
    }
  }

  getStats() {
    const totalDevices = this.devices.length;
    const totalVideos = this.devices.reduce((sum, d) => sum + d.videosGenerated, 0);
    const activeDevices = this.devices.filter(d => d.videosGenerated < d.maxVideos).length;
    
    return {
      totalDevices,
      totalVideos,
      activeDevices,
      remainingQuota: this.devices.reduce((sum, d) => sum + (d.maxVideos - d.videosGenerated), 0)
    };
  }
}

// Token management
async function getToken(deviceId) {
  const headers = {
    'User-Agent': UA,
    'versionCode': String(VERSION_CODE),
    'Ctry-Target': 'others',
    'Device-Id': deviceId,
    'Sign': SIGN
  };

  try {
    const response = await fetch(`${API}/api/v1/user/info`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Token fetch failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.token) {
      return {
        token: data.data.token,
        ttl: data.ttl || 3600
      };
    }
    throw new Error('No token in response');
  } catch (e) {
    throw new Error(`Token error: ${e.message}`);
  }
}

// Video generation
async function generateVideo(prompt, devicePool, options = {}) {
  const device = devicePool.getAvailableDevice();
  
  console.log(`\n\x1b[36m[DEVICE]\x1b[0m Using: ${device.id.substring(0, 20)}...`);
  console.log(`\x1b[36m[QUOTA]\x1b[0m Device used: ${device.videosGenerated}/${device.maxVideos}`);
  
  // Get token if needed
  if (!device.token || !device.tokenExpiry || device.tokenExpiry < Date.now()) {
    console.log(`\x1b[36m[AUTH]\x1b[0m Getting new token...`);
    try {
      const auth = await getToken(device.id);
      device.token = auth.token;
      device.tokenExpiry = Date.now() + (auth.ttl * 900); // Cache for 90% of TTL
      devicePool.updateDevice(device.id, {
        token: device.token,
        tokenExpiry: device.tokenExpiry,
        lastUsed: Date.now()
      });
    } catch (e) {
      console.log(`\x1b[31m[ERROR]\x1b[0m ${e.message}`);
      // Try with a new device
      const newDevice = devicePool.createDevice();
      console.log(`\x1b[32m[RETRY]\x1b[0m Trying new device: ${newDevice.id.substring(0, 20)}...`);
      return generateVideo(prompt, devicePool, options);
    }
  }

  // Prepare video generation request
  const body = {
    prompt: prompt,
    versionCode: VERSION_CODE,
    deviceID: device.id,
    isPremium: 1,
    ctry_target: "others",
    used: [],
    aspect_ratio: options.aspectRatio || "auto",
    ai_sound: options.aiSound !== false ? 1 : 0
  };

  const headers = {
    'User-Agent': UA,
    'versionCode': String(VERSION_CODE),
    'Ctry-Target': 'others',
    'Device-Id': device.id,
    'Sign': SIGN,
    'Authorization': `Bearer ${device.token}`,
    'Content-Type': 'application/json'
  };

  console.log(`\x1b[36m[GENERATING]\x1b[0m Creating video...`);
  console.log(`\x1b[33m[PROMPT]\x1b[0m "${prompt}"`);
  console.log(`\x1b[36m[OPTIONS]\x1b[0m Ratio: ${options.aspectRatio || 'auto'}, Sound: ${options.aiSound !== false ? 'Yes' : 'No'}`);

  try {
    const response = await fetch(`${API}/api/v3/video/t2v`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000) // 2 minutes for generation
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited or quota exceeded
        console.log(`\x1b[33m[QUOTA]\x1b[0m Device quota exceeded, switching...`);
        devicePool.updateDevice(device.id, { videosGenerated: device.maxVideos });
        return generateVideo(prompt, devicePool, options);
      }
      throw new Error(`Generation failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 0 && data.success && data.data && data.data.url) {
      // Update device usage
      devicePool.updateDevice(device.id, {
        videosGenerated: device.videosGenerated + 1,
        lastUsed: Date.now()
      });

      const videoUrl = data.data.url;
      console.log(`\x1b[32m[SUCCESS]\x1b[0m Video URL: ${videoUrl}`);
      
      // Download video
      const filename = options.filename || `video_${Date.now()}.mp4`;
      console.log(`\x1b[36m[DOWNLOADING]\x1b[0m Saving to ${filename}...`);
      
      const videoResponse = await fetch(videoUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(60000)
      });
      
      if (videoResponse.ok) {
        const buffer = Buffer.from(await videoResponse.arrayBuffer());
        fs.writeFileSync(filename, buffer);
        console.log(`\x1b[32m[SAVED]\x1b[0m Video saved: ${filename} (${buffer.length} bytes)`);
      }

      // Log generation
      logGeneration({
        timestamp: Date.now(),
        deviceId: device.id,
        prompt,
        videoUrl,
        filename,
        aspectRatio: options.aspectRatio || 'auto',
        aiSound: options.aiSound !== false
      });

      return {
        success: true,
        videoUrl,
        filename,
        deviceId: device.id
      };
    } else {
      throw new Error(`API error: ${data.message || 'Unknown error'}`);
    }
  } catch (e) {
    if (e.message.includes('quota') || e.message.includes('limit')) {
      console.log(`\x1b[33m[SWITCHING]\x1b[0m Device exhausted, creating new one...`);
      devicePool.updateDevice(device.id, { videosGenerated: device.maxVideos });
      return generateVideo(prompt, devicePool, options);
    }
    throw e;
  }
}

// Logging
function logGeneration(entry) {
  try {
    let log = [];
    if (fs.existsSync(VIDEO_LOG_FILE)) {
      log = JSON.parse(fs.readFileSync(VIDEO_LOG_FILE, 'utf8'));
    }
    log.push(entry);
    fs.writeFileSync(VIDEO_LOG_FILE, JSON.stringify(log, null, 2));
  } catch (e) {}
}

// Batch generation
async function generateBatch(prompts, devicePool, options = {}) {
  const results = [];
  
  for (const prompt of prompts) {
    try {
      const result = await generateVideo(prompt, devicePool, options);
      results.push({ prompt, ...result });
      
      // Wait between generations to avoid rate limiting
      if (prompts.indexOf(prompt) < prompts.length - 1) {
        console.log(`\n\x1b[33m[WAIT]\x1b[0m Waiting 5 seconds before next generation...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Failed to generate "${prompt}": ${e.message}`);
      results.push({ prompt, success: false, error: e.message });
    }
  }
  
  return results;
}

// Main CLI
async function main() {
  const devicePool = new DevicePool();
  const stats = devicePool.getStats();
  
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║     UNLIMITED TXT2VI VIDEO GENERATOR                 ║\x1b[0m');
  console.log('\x1b[35m║     Auto-rotating device IDs for unlimited videos    ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  console.log(`\n\x1b[36m[STATS]\x1b[0m Devices: ${stats.totalDevices} | Videos: ${stats.totalVideos} | Active: ${stats.activeDevices} | Remaining: ${stats.remainingQuota}`);

  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === '--single' || cmd === '-s') {
    // Single video generation
    const prompt = args.slice(1).join(' ') || 'A beautiful sunset over the ocean';
    const aspectRatio = args.includes('--ratio') ? args[args.indexOf('--ratio') + 1] : 'auto';
    const aiSound = !args.includes('--no-sound');
    
    try {
      const result = await generateVideo(prompt, devicePool, { aspectRatio, aiSound });
      console.log(`\n\x1b[32m✅ DONE!\x1b[0m Video generated successfully`);
    } catch (e) {
      console.log(`\x1b[31m[FATAL]\x1b[0m ${e.message}`);
    }
    return;
  }

  if (cmd === '--batch' || cmd === '-b') {
    // Batch generation from file
    const filePath = args[1];
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Please provide a valid prompts file (one prompt per line)`);
      return;
    }
    
    const prompts = fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);
    
    console.log(`\n\x1b[36m[BATCH]\x1b[0m Processing ${prompts.length} prompts...`);
    
    const results = await generateBatch(prompts, devicePool);
    const successful = results.filter(r => r.success).length;
    
    console.log(`\n\x1b[32m✅ BATCH COMPLETE!\x1b[0m ${successful}/${prompts.length} videos generated`);
    return;
  }

  if (cmd === '--stats') {
    console.log(`\n\x1b[36m[DEVICE POOL]\x1b[0m`);
    devicePool.devices.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.id.substring(0, 20)}... | Videos: ${d.videosGenerated}/${d.maxVideos} | Last used: ${d.lastUsed ? new Date(d.lastUsed).toLocaleString() : 'Never'}`);
    });
    return;
  }

  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n\x1b[36m[MODES]\x1b[0m');
  console.log('  1. Single video');
  console.log('  2. Batch from file');
  console.log('  3. Stats');
  console.log('  4. Exit');
  
  const choice = await rl.question('\nSelect mode (1-4): ');
  
  if (choice === '1') {
    const prompt = await rl.question('Enter prompt: ');
    const ratio = await rl.question('Aspect ratio (auto/1:1/16:9/9:16) [auto]: ') || 'auto';
    const sound = (await rl.question('AI Sound? (y/n) [y]: ')).toLowerCase() !== 'n';
    
    console.log('\n\x1b[36m[GENERATING]\x1b[0m Please wait...');
    const result = await generateVideo(prompt, devicePool, { aspectRatio: ratio, aiSound: sound });
    console.log(`\n\x1b[32m✅ SUCCESS!\x1b[0m Video: ${result.filename}`);
  } else if (choice === '2') {
    const filePath = await rl.question('Enter prompts file path: ');
    if (fs.existsSync(filePath)) {
      const prompts = fs.readFileSync(filePath, 'utf8').split('\n').map(p => p.trim()).filter(Boolean);
      const results = await generateBatch(prompts, devicePool);
      console.log(`\n\x1b[32m✅ Generated ${results.filter(r => r.success).length}/${prompts.length} videos`);
    } else {
      console.log(`\x1b[31m[ERROR]\x1b[0m File not found: ${filePath}`);
    }
  } else if (choice === '3') {
    const stats = devicePool.getStats();
    console.log(`\n\x1b[36m[STATS]\x1b[0m Devices: ${stats.totalDevices} | Videos: ${stats.totalVideos} | Remaining: ${stats.remainingQuota}`);
  }
  
  rl.close();
}

// Run
main().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
  process.exit(1);
});
