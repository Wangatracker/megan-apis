"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const BASE = "https://notrack.ai";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const JAR = path.join(os.tmpdir(), "notrack_cookies_" + os.userInfo().username + ".txt");
const PERSONAS = ["normal", "concise", "detailed", "creative"];

let cookieCache = null;

function saveCookie(cookieHeader) {
  cookieCache = cookieHeader || cookieCache;
  if (cookieCache) {
    try { fs.writeFileSync(JAR, cookieCache, "utf8"); } catch (e) {}
  }
}

function loadCookie() {
  if (cookieCache) return cookieCache;
  try { cookieCache = fs.readFileSync(JAR, "utf8").trim() || null; } catch (e) { cookieCache = null; }
  return cookieCache;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ensureSession() {
  if (loadCookie()) return;
  const r = await fetch(BASE + "/chat", { 
    headers: { "User-Agent": UA, "Cache-Control": "no-cache" }, 
    redirect: "follow" 
  });
  const sc = (r.headers.get("set-cookie") || "").split(",").map(s => s.split(";")[0].trim()).filter(Boolean).join("; ");
  saveCookie(sc);
  if (!sc) throw new Error("Failed to get cookie from " + BASE + "/chat");
}

async function request(pathname, opts = {}) {
  await ensureSession();
  const headers = Object.assign({ "User-Agent": UA }, opts.headers || {});
  if (loadCookie()) headers.Cookie = loadCookie();
  const r = await fetch(BASE + pathname, Object.assign({}, opts, { headers }));
  const sc = (r.headers.get("set-cookie") || "").split(",").map(s => s.split(";")[0].trim()).filter(Boolean).join("; ");
  if (sc) saveCookie(sc);
  return r;
}

async function dispatch({ user_input, persona = "normal", chat_id = null, onDelta = null }) {
  const body = {
    user_input, 
    mode: "usual", 
    model: "C", 
    persona,
    max_turns: 6, 
    chat_id, 
    attachments: [],
    regenerate: false, 
    edit: false, 
    edit_mid: null,
  };
  
  const r = await request("/api/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (r.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error("HTTP " + r.status + " " + txt.slice(0, 300));
  }
  
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let fullText = "";
  let chatId = chat_id;
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let ev;
        try { ev = JSON.parse(payload); } catch (e) { continue; }
        
        if (ev.type === "chat_meta") { 
          chatId = ev.chat_id; 
        }
        if (ev.type === "delta" && ev.chunk) {
          fullText += ev.chunk;
          if (onDelta) onDelta(ev.chunk);
          else process.stdout.write(ev.chunk);
        }
        if (ev.type === "message") { 
          fullText = ev.content; 
        }
        if (ev.type === "error" && ev.code === "ratelimit") {
          throw new Error("RATE_LIMIT");
        }
      }
    }
  }
  
  return { chat_id: chatId, response: fullText };
}

async function askWithRetry(prompt, persona = "normal", maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await dispatch({ user_input: prompt, persona });
    } catch (e) {
      if (e.message === "RATE_LIMIT" && i < maxRetries - 1) {
        const waitTime = 5000 * (i + 1);
        console.log(`\n\x1b[33m[WAIT]\x1b[0m Rate limited, waiting ${waitTime/1000}s...`);
        await sleep(waitTime);
        continue;
      }
      throw e;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           NOTRACK.AI CHAT CLIENT                    ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  if (cmd === "--help" || cmd === "-h" || !cmd) {
    console.log(`
Usage:
  node notrack-final.cjs ask "Your question" [--persona normal|concise|detailed|creative]
  node notrack-final.cjs chat [--persona normal]
  node notrack-final.cjs test

Examples:
  node notrack-final.cjs ask "What is the capital of France?" --persona concise
  node notrack-final.cjs chat --persona normal
  node notrack-final.cjs test
`);
    return;
  }

  if (cmd === "test") {
    console.log('\n\x1b[36m[TEST]\x1b[0m Running API test...\n');
    const result = await askWithRetry("Hello! Please introduce yourself in one sentence.", "normal");
    console.log('\n\x1b[32m✅ API WORKING!\x1b[0m');
    console.log(`\x1b[36m[INFO]\x1b[0m Chat ID: ${result.chat_id}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Response: ${result.response}`);
    return;
  }

  if (cmd === "ask") {
    let prompt = "";
    let persona = "normal";
    
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--persona" && args[i+1]) {
        persona = args[++i];
      } else {
        prompt += (prompt ? " " : "") + args[i];
      }
    }
    
    if (!prompt) {
      console.log('\x1b[31m[ERROR]\x1b[0m Please provide a question');
      return;
    }
    
    if (!PERSONAS.includes(persona)) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Invalid persona. Use: ${PERSONAS.join(", ")}`);
      return;
    }
    
    console.log(`\n\x1b[33m[QUESTION]\x1b[0m ${prompt}`);
    console.log(`\x1b[36m[PERSONA]\x1b[0m ${persona}`);
    console.log(`\x1b[32m[ANSWER]\x1b[0m `);
    
    const result = await askWithRetry(prompt, persona);
    console.log('\n');
    return;
  }

  if (cmd === "chat") {
    let persona = "normal";
    const personaIdx = args.indexOf("--persona");
    if (personaIdx !== -1 && args[personaIdx + 1]) {
      persona = args[personaIdx + 1];
    }
    
    if (!PERSONAS.includes(persona)) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Invalid persona. Use: ${PERSONAS.join(", ")}`);
      return;
    }
    
    console.log(`\n\x1b[36m[INFO]\x1b[0m Interactive chat mode (persona: ${persona})`);
    console.log('\x1b[36m[INFO]\x1b[0m Type "exit" to quit\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    let chatId = null;
    
    const askQuestion = () => {
      rl.question('\x1b[33mYou > \x1b[0m', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          rl.close();
          return;
        }
        
        if (!input.trim()) {
          askQuestion();
          return;
        }
        
        process.stdout.write('\x1b[32mAI  > \x1b[0m');
        try {
          const result = await dispatch({
            user_input: input,
            persona,
            chat_id: chatId,
            onDelta: (chunk) => process.stdout.write(chunk)
          });
          chatId = result.chat_id;
          console.log('\n');
        } catch (e) {
          if (e.message === "RATE_LIMIT") {
            console.log('\n\x1b[33m[WAIT]\x1b[0m Rate limited, wait 5 seconds...');
            await sleep(5000);
          } else {
            console.log(`\n\x1b[31m[ERROR]\x1b[0m ${e.message}`);
          }
        }
        
        askQuestion();
      });
    };
    
    askQuestion();
  }
}

main().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
  process.exit(1);
});
