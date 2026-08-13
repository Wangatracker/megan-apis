"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const BASE = "https://notrack.ai";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const JAR = path.join(os.tmpdir(), "notrack_cookies_" + os.userInfo().username + ".txt");
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

async function dispatch({ user_input, persona = "normal", chat_id = null, attachments = [], max_turns = 6 }) {
  const body = {
    user_input, 
    mode: "usual", 
    model: "C", 
    persona,
    max_turns, 
    chat_id, 
    attachments,
    regenerate: false, 
    edit: false, 
    edit_mid: null,
  };
  
  const r = await request("/api/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error("HTTP " + r.status + " " + txt.slice(0, 300));
  }
  
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const result = { 
    chat_id: null, 
    events: [], 
    deltas: [], 
    messages: [], 
    full: "", 
    done: false, 
    error: null 
  };
  
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
        result.events.push(ev);
        if (ev.type === "chat_meta") { 
          result.chat_id = ev.chat_id; 
        }
        if (ev.type === "delta") {
          result.deltas.push(ev.chunk);
          process.stdout.write(ev.chunk);
        }
        if (ev.type === "message") { 
          result.messages.push(ev); 
          result.full = ev.content; 
        }
        if (ev.type === "done") result.done = true;
      }
    }
  }
  return result;
}

async function testNoTrack() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║           TESTING NOTRACK.AI API                    ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // Test 1: Get session
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Getting session cookie...');
  try {
    await ensureSession();
    const cookie = loadCookie();
    if (cookie) {
      console.log(`\x1b[32m[OK]\x1b[0m Session established`);
      console.log(`\x1b[36m[INFO]\x1b[0m Cookie: ${cookie.substring(0, 50)}...`);
    } else {
      console.log('\x1b[31m[FAIL]\x1b[0m No cookie received');
    }
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return;
  }

  // Test 2: Send a message
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Sending test message...');
  console.log('\x1b[33m[PROMPT]\x1b[0m "Hello! Are you working? Please respond briefly."\n');
  
  try {
    console.log('\x1b[32m[RESPONSE]\x1b[0m ');
    const result = await dispatch({
      user_input: "Hello! Are you working? Please respond briefly.",
      persona: "normal"
    });
    
    console.log('\n');
    
    if (result.full) {
      console.log('\n\x1b[32m✅ SUCCESS!\x1b[0m NoTrack.ai API is working!');
      console.log(`\x1b[36m[INFO]\x1b[0m Chat ID: ${result.chat_id}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Response length: ${result.full.length} characters`);
      console.log(`\x1b[36m[INFO]\x1b[0m Events received: ${result.events.length}`);
      console.log(`\x1b[36m[INFO]\x1b[0m Deltas received: ${result.deltas.length}`);
    } else {
      console.log('\n\x1b[33m[WARN]\x1b[0m No response content received');
      console.log(`\x1b[36m[INFO]\x1b[0m Events:`, JSON.stringify(result.events, null, 2));
    }
  } catch (e) {
    console.log(`\n\x1b[31m[FAIL]\x1b[0m ${e.message}`);
  }

  // Test 3: Try different personas
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Testing different personas...');
  const personas = ["concise", "detailed", "creative"];
  
  for (const persona of personas) {
    console.log(`\n\x1b[33m[${persona.toUpperCase()}]\x1b[0m "Say hello in one word"`);
    try {
      console.log('\x1b[32m[RESPONSE]\x1b[0m ');
      const result = await dispatch({
        user_input: "Say hello in one word",
        persona
      });
      console.log('\n');
      if (result.full) {
        console.log(`\x1b[32m[OK]\x1b[0m ${persona}: ${result.full.substring(0, 50)}`);
      }
    } catch (e) {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${persona}: ${e.message}`);
    }
  }

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Run test
testNoTrack().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
  process.exit(1);
});
