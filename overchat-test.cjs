const crypto = require("crypto");

const API = "https://api.overchat.ai/v1/chat/completions";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const PRESETS = {
  haiku: {
    name: "Claude Haiku 4.5",
    model: "claude-haiku-4-5-20251001",
    personaId: "claude-haiku-4-5-landing",
  },
  gpt5: {
    name: "GPT-4.1 Nano (GPT 5)",
    model: "openai/gpt-4.1-nano-2025-04-14",
    personaId: "gpt-4o-landing",
  },
  deepseek: {
    name: "DeepSeek V3.2",
    model: "deepseek/deepseek-non-thinking-v3.2-exp",
    personaId: "deepseek-v-3-2-landing",
  },
};

async function askOverchat(prompt, options = {}) {
  let modelName = options.model;
  let personaId = options.personaId;

  if (options.preset && PRESETS[options.preset]) {
    const preset = PRESETS[options.preset];
    modelName = modelName || preset.model;
    personaId = personaId || preset.personaId;
  }

  modelName = modelName || PRESETS.gpt5.model;
  personaId = personaId || PRESETS.gpt5.personaId;

  const chatId = options.chatId || crypto.randomUUID();
  const deviceId = options.deviceId || crypto.randomUUID();
  const stream = options.stream !== false;

  const messages = [
    ...(options.history || []).map((item) => ({
      id: crypto.randomUUID(),
      role: item.role,
      content: item.content,
    })),
    {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    },
  ];

  if (!options.history) {
    messages.push({
      id: crypto.randomUUID(),
      role: "system",
      content: "Ikuti bahasa user dan jawab dengan gaya natural, singkat, dan jelas.",
    });
  }

  const body = {
    chatId,
    model: modelName,
    messages,
    personaId,
    frequency_penalty: 0,
    max_tokens: 4000,
    presence_penalty: 0,
    stream,
    temperature: options.temperature || 0.5,
    top_p: 0.95,
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid": deviceId,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    "x-device-language": "id-ID",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent": UA,
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "id-ID,id;q=0.9",
  };

  const response = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      status: false,
      code: response.status,
      error: text.substring(0, 300),
      model: modelName,
      personaId,
    };
  }

  let answer = "";
  let responseId = null;
  let responseModel = null;

  if (stream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          if (json.id) responseId = json.id;
          if (json.model) responseModel = json.model;

          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string") {
            answer += content;
            process.stdout.write(content);
          }
        } catch {}
      }
    }
  } else {
    const json = await response.json();
    responseId = json.id;
    responseModel = json.model;
    answer = json.choices?.[0]?.message?.content || "";
  }

  return {
    status: true,
    code: response.status,
    chatId,
    deviceId,
    responseId,
    model: responseModel || modelName,
    personaId,
    answer,
  };
}

async function testOverchat() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING OVERCHAT.AI FREE MODELS             ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // Test each preset
  for (const [presetName, preset] of Object.entries(PRESETS)) {
    console.log(`\n\x1b[36m════════════════════════════════════════════\x1b[0m`);
    console.log(`\x1b[36m Testing: ${preset.name}\x1b[0m`);
    console.log(`\x1b[36m Model: ${preset.model}\x1b[0m`);
    console.log(`\x1b[36m════════════════════════════════════════════\x1b[0m`);
    console.log('\x1b[33m[PROMPT]\x1b[0m "Hello! Are you working? Please respond briefly."\n');
    
    try {
      console.log('\x1b[32m[RESPONSE]\x1b[0m ');
      const result = await askOverchat(
        "Hello! Are you working? Please respond briefly.",
        { preset: presetName }
      );
      console.log('\n');
      
      if (result.status) {
        console.log(`\x1b[32m✅ SUCCESS!\x1b[0m ${preset.name} is working!`);
        console.log(`\x1b[36m[INFO]\x1b[0m Response length: ${result.answer.length} characters`);
        console.log(`\x1b[36m[INFO]\x1b[0m Model: ${result.model}`);
      } else {
        console.log(`\x1b[31m❌ FAILED!\x1b[0m Status: ${result.code}`);
        console.log(`\x1b[36m[INFO]\x1b[0m Error: ${result.error}`);
      }
    } catch (e) {
      console.log(`\n\x1b[31m[ERROR]\x1b[0m ${e.message}`);
    }
    
    // Wait between requests to avoid rate limiting
    if (presetName !== Object.keys(PRESETS).pop()) {
      console.log('\n\x1b[33m[WAIT]\x1b[0m Waiting 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Run test
testOverchat().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
  process.exit(1);
});
