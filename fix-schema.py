import re

# Read schema.ts
with open('shared/schema.ts', 'r') as f:
    content = f.read()

# Check what's already there
has_felo = 'felo' in content.lower()
has_magicstudio = 'magicstudio' in content.lower()

print(f"Felo present: {has_felo}")
print(f"MagicStudio present: {has_magicstudio}")

# Remove any corrupted/partial entries first
# Look for any broken text
content = re.sub(r'MEOFnt\("✅ schema\.ts updated!"\)\'w\'\)', '', content)
content = re.sub(r'EOFnt\("✅ routes\.ts updated!"\)\'w\'\)', '', content)

# Add new AI models if missing
if not has_felo:
    new_ai_endpoints = '''
const newWorkingAIModels: ApiEndpoint[] = [
  { path: "/api/ai/felo", method: "GET", description: "Search AI with sources and citations", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "What is AI?" }], format: "json", category: "ai-chat", provider: "Felo.ai" },
  { path: "/api/ai/bibleai", method: "GET", description: "AI-powered Bible search with 23 translations", params: [{ name: "q", type: "string", required: true, description: "Bible question", default: "What is faith?" }, { name: "translation", type: "string", required: false, description: "Translation (default: ESV)", default: "ESV" }], format: "json", category: "ai-chat", provider: "BibleAI" },
  { path: "/api/ai/gita", method: "GET", description: "Spiritual AI based on Bhagavad Gita", params: [{ name: "q", type: "string", required: true, description: "Question", default: "What is karma?" }], format: "json", category: "ai-chat", provider: "GitaGPT" },
  { path: "/api/ai/muslimai", method: "GET", description: "Islamic AI with Quran references", params: [{ name: "q", type: "string", required: true, description: "Question", default: "What is prayer?" }], format: "json", category: "ai-chat", provider: "MuslimAI" },
  { path: "/api/ai/powerbrainai", method: "GET", description: "PowerBrain AI chat assistant", params: [{ name: "q", type: "string", required: true, description: "Message", default: "Hello" }], format: "json", category: "ai-chat", provider: "PowerBrain AI" },
  { path: "/api/ai/gemini-lite", method: "GET", description: "Gemini 2.0 Flash Lite AI", params: [{ name: "q", type: "string", required: true, description: "Prompt", default: "Say hello" }, { name: "system", type: "string", required: false, description: "Optional system prompt", default: "" }], format: "json", category: "ai-chat", provider: "Gemini" },
  { path: "/api/ai/gandalf", method: "GET", description: "Security AI for prompt testing (Lakera)", params: [{ name: "q", type: "string", required: true, description: "Prompt", default: "Hello" }, { name: "system", type: "string", required: false, description: "Optional system prompt", default: "" }], format: "json", category: "ai-chat", provider: "Lakera" },
];
'''

    # Insert before mediaStreamingEndpoints
    content = content.replace(
        'const mediaStreamingEndpoints: ApiEndpoint[] = [',
        new_ai_endpoints + '\nconst mediaStreamingEndpoints: ApiEndpoint[] = ['
    )
    print("Added newWorkingAIModels array")

# Add MagicStudio if missing
if not has_magicstudio:
    magicstudio_endpoint = '''  { path: "/v1/ai/image/magicstudio", method: "GET", description: "Generate AI art using MagicStudio (no key required)", params: [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "a cute cat" }], format: "json", category: "ai-image", provider: "MagicStudio" },'''
    
    # Add to newWorkingAIModels array (before closing bracket)
    content = content.replace(
        '];\n\nconst mediaStreamingEndpoints',
        magicstudio_endpoint + '\n];\n\nconst mediaStreamingEndpoints'
    )
    print("Added MagicStudio endpoint")

# Add to allEndpoints array if not already there
if '...newWorkingAIModels' not in content:
    content = content.replace(
        '  ...mediaStreamingEndpoints,\n  ...workingAIEndpoints,\n  ...aiChatEndpoints,',
        '  ...mediaStreamingEndpoints,\n  ...workingAIEndpoints,\n  ...newWorkingAIModels,\n  ...aiChatEndpoints,'
    )
    print("Added to allEndpoints")

# Write back
with open('shared/schema.ts', 'w') as f:
    f.write(content)

print("\n✅ Schema fixed!")
