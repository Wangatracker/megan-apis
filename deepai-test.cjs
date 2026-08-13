const crypto = require("crypto");
const readline = require("readline");
const fs = require("fs");

const PAGE = "https://deepai.org/chat/ai-code";
const API = "https://api.deepai.org/hacking_is_a_serious_crime";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const myhash = (s) => crypto.createHash("md5").update(s).digest("hex");

function generateIslandKey() {
  const r = Math.round(Math.random() * 100000000000) + "";
  const inner =
    UA + myhash(UA + myhash(UA + r + "hackers_become_a_little_stinkier_every_time_they_hack"));
  return "tryit-" + r + "-" + myhash(inner);
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function extractArray(html, name) {
  const m = html.match(new RegExp("const\\s+" + name + "=\\[([^\\]]*)\\]"));
  if (!m) return null;
  try {
    return JSON.parse("[" + m[1] + "]");
  } catch {
    return null;
  }
}

async function getUsableModels() {
  console.log('\n\x1b[36m[INFO]\x1b[0m Fetching available models...');
  const res = await fetch(PAGE, {
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) throw new Error("Failed to fetch page (HTTP " + res.status + ")");
  const html = await res.text();
  const base = extractArray(html, "baseChatModes");
  const extra = extractArray(html, "additionalModels");
  const all = [...(base || []), ...(extra || [])].map((m) => ({
    id: m.value,
    name: m.label,
  }));
  return all.filter((m, i) => {
    const raw = m.id;
    const locked =
      (base || []).concat(extra || []).find((x) => x.value === raw)?.locked || false;
    return !locked;
  });
}

async function testDeepAI() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           TESTING DEEPAI CHAT API                   ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  try {
    // Test 1: Get models
    console.log('\n\x1b[36m[TEST 1]\x1b[0m Getting available models...');
    const models = await getUsableModels();
    if (models.length > 0) {
      console.log(`\x1b[32m[OK]\x1b[0m Found ${models.length} usable models:`);
      models.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} (${m.id})`);
      });
      if (models.length > 5) {
        console.log(`  ... and ${models.length - 5} more`);
      }
    } else {
      console.log('\x1b[31m[FAIL]\x1b[0m No usable models found');
      return;
    }

    // Test 2: Generate API key
    console.log('\n\x1b[36m[TEST 2]\x1b[0m Testing API key generation...');
    const apiKey = generateIslandKey();
    console.log(`\x1b[36m[INFO]\x1b[0m Generated key: ${apiKey.substring(0, 30)}...`);

    // Test 3: Send a message
    console.log('\n\x1b[36m[TEST 3]\x1b[0m Sending test message...');
    console.log('\x1b[33m[PROMPT]\x1b[0m "Hello! Are you working? Please respond briefly."\n');
    
    const model = models[0]; // Use first available model
    
    const fd = new FormData();
    fd.append("model", model.id);
    fd.append("chatHistory", JSON.stringify([{ role: "user", content: "Hello! Are you working? Please respond briefly." }]));
    fd.append("chat_style", "ai-code");
    fd.append("enabled_tools", JSON.stringify(["image_generator", "image_editor"]));
    fd.append("hacker_is_stinky", "very_stinky");
    fd.append("memory_enabled", "false");
    fd.append("sensitivity_request_id", uuidv4());
    fd.append("session_uuid", uuidv4());
    fd.append("thinking_support", "1");
    fd.append("attachment_uuids", "[]");

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "user-agent": UA,
          origin: "https://deepai.org",
          referer: "https://deepai.org/chat/ai-code",
          accept: "*/*",
        },
        body: fd,
        signal: AbortSignal.timeout(30000)
      });

      console.log(`\x1b[36m[INFO]\x1b[0m Response status: ${res.status}`);
      
      if (res.ok) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let receivedData = false;

        process.stdout.write('\x1b[32m[RESPONSE]\x1b[0m ');

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = dec.decode(value, { stream: true });
          buf += chunk;
          receivedData = true;
          
          if (buf.includes("\u001C")) {
            const parts = buf.split("\u001C");
            process.stdout.write(parts[0]);
            break;
          } else {
            process.stdout.write(chunk);
          }
        }
        
        process.stdout.write("\n");
        
        if (receivedData) {
          console.log('\n\x1b[32m✅ SUCCESS!\x1b[0m DeepAI API is working!');
          
          // Save models list
          await fs.promises.writeFile(
            "deepai-models.json", 
            JSON.stringify({ total: models.length, usable: models }, null, 2)
          );
          console.log('\x1b[36m[INFO]\x1b[0m Models saved to deepai-models.json');
        }
      } else {
        const errorText = await res.text();
        console.log(`\x1b[31m[FAIL]\x1b[0m Server returned ${res.status}`);
        console.log(`\x1b[36m[INFO]\x1b[0m Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`\x1b[31m[FAIL]\x1b[0m Request error: ${error.message}`);
    }

    console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
    console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');

  } catch (error) {
    console.error('\n\x1b[31m[FATAL]\x1b[0m', error.message);
  }
}

// Run test
testDeepAI();
