const fs = require("fs");
const https = require("https");

const BINARY_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
const OUTPUT = "./yt-dlp";

if (fs.existsSync(OUTPUT)) {
  console.log("[yt-dlp] Binary already exists, skipping download");
  process.exit(0);
}

console.log("[yt-dlp] Downloading from GitHub releases...");

function download(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error("Too many redirects"));
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest, { mode: 0o755 });
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          fs.chmodSync(dest, 0o755);
          resolve();
        });
      });
      file.on("error", reject);
    }).on("error", reject);
  });
}

download(BINARY_URL, OUTPUT)
  .then(() => {
    const size = fs.statSync(OUTPUT).size;
    console.log(`[yt-dlp] Installed successfully (${Math.round(size / 1024 / 1024)} MB)`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(`[yt-dlp] Download failed: ${e.message}`);
    console.error("[yt-dlp] Will fall back to Node.js scrapers where possible");
    process.exit(0); // don't fail the build
  });
