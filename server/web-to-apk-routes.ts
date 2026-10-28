import type { Express, Request, Response } from "express";
import { Readable } from "stream";

const GH_API = "https://api.github.com";

export function registerWebToApkRoutes(app: Express): void {
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;

  // ─── 1. TRIGGER BUILD ───
  app.get("/api/tools/web-to-apk/build", async (req: Request, res: Response) => {
    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({ success: false, error: "APK builder not configured." });
    }

    const { 
      url, appName, packageId, 
      logoText = "M", logoColor = "#FF6B35", splashColor = "#111111",
      storage = "false", notifications = "false"
    } = req.query;

    if (!url || !appName || !packageId) {
      return res.status(400).json({ success: false, error: "Parameters required: url, appName, packageId" });
    }

    try { new URL(url as string); } catch { return res.status(400).json({ success: false, error: "Invalid URL" }); }
    if (!/^[a-z][a-z0-9_.]{2,50}$/i.test(packageId as string)) {
      return res.status(400).json({ success: false, error: "Invalid packageId." });
    }

    try {
      // 1. Trigger the workflow
      const ghRes = await fetch(
        `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/build-apk.yml/dispatches`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GH_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: { 
              website_url: url, 
              app_name: appName, 
              package_id: packageId, 
              logo_text: logoText, 
              logo_color: logoColor, 
              splash_color: splashColor,
              allow_storage: storage,
              allow_notifications: notifications
            },
          }),
        }
      );

      if (ghRes.status !== 204) {
        const errBody = await ghRes.text();
        throw new Error(`GitHub HTTP ${ghRes.status}: ${errBody.substring(0, 300)}`);
      }

      // 2. Wait 3 seconds for the run to be created
      await new Promise(r => setTimeout(r, 3000));

      // 3. Get the run ID (this is permanent and survives restarts)
      const runsRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=1`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const runsData: any = await runsRes.json();
      const latestRun = runsData.workflow_runs?.[0];

      if (!latestRun) {
        throw new Error("Could not find the triggered workflow run.");
      }

      const runId = latestRun.id;
      const runUrl = latestRun.html_url;

      // 4. Return the STATELESS download URL using the runId
      return res.json({
        success: true,
        status: "building",
        instructions: "1. Wait 3-5 minutes. 2. Open the downloadUrl below. 3. Append your API key: ?apikey=YOUR_KEY. 4. It downloads the APK ZIP.",
        downloadUrl: `https://apis.megan.qzz.io/api/tools/web-to-apk/download/${runId}?apikey=YOUR_KEY`,
        github_actions_url: runUrl,
        app_details: {
          name: appName,
          package: packageId,
          url: url,
          logo_text: logoText,
          logo_color: logoColor,
          splash_color: splashColor,
          permissions: {
            storage: storage === "true",
            notifications: notifications === "true"
          }
        }
      });

    } catch (err: any) {
      console.error(`[apk] ERROR:`, err.message);
      return res.status(500).json({ success: false, error: "Failed to start APK build", details: err.message });
    }
  });

  // ─── 2. STATELESS DOWNLOAD (uses GitHub runId, no memory needed) ───
  app.get("/api/tools/web-to-apk/download/:runId", async (req: Request, res: Response) => {
    const { runId } = req.params;
    console.log(`[apk] Download requested for run ${runId}`);

    if (!/^\d+$/.test(runId)) {
      return res.status(400).json({ success: false, error: "Invalid runId. Must be a number." });
    }

    try {
      // 1. Check the run status on GitHub
      const runRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      
      if (!runRes.ok) {
        return res.status(404).json({ success: false, error: `Run ${runId} not found on GitHub.` });
      }
      
      const runData: any = await runRes.json();
      console.log(`[apk] Run ${runId}: status=${runData.status} conclusion=${runData.conclusion}`);

      if (runData.status !== "completed" || runData.conclusion !== "success") {
        return res.status(425).json({
          success: false,
          error: "Build still in progress",
          status: runData.status,
          conclusion: runData.conclusion,
          message: "Wait 2-3 minutes and try again.",
          githubUrl: runData.html_url,
        });
      }

      // 2. Get the artifact
      const artRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}/artifacts`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const artData: any = await artRes.json();
      const artifact = artData.artifacts?.[0];

      if (!artifact) {
        return res.status(404).json({ success: false, error: "APK artifact not found on this run." });
      }

      console.log(`[apk] Downloading artifact ${artifact.id} (${artifact.size_in_bytes} bytes)`);

      // 3. Download the ZIP from GitHub
      const zipRes = await fetch(artifact.archive_download_url, {
        headers: { 
          "Authorization": `Bearer ${GH_TOKEN}`, 
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        redirect: "follow",
      });

      if (!zipRes.ok) {
        return res.status(500).json({ success: false, error: `GitHub returned ${zipRes.status}` });
      }

      const buf = Buffer.from(await zipRes.arrayBuffer());
      const isZip = buf[0] === 0x50 && buf[1] === 0x4B;
      
      if (!isZip) {
        console.error(`[apk] Not a ZIP! First bytes:`, buf.slice(0, 100).toString("utf-8"));
        return res.status(500).json({ success: false, error: "GitHub returned non-ZIP content" });
      }

      // 4. Stream the ZIP to the user
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="MeganApp_${runId}_apk.zip"`);
      res.setHeader("Content-Length", buf.length.toString());
      res.setHeader("Access-Control-Allow-Origin", "*");
      console.log(`[apk] ✅ Streaming ${buf.length} bytes`);
      res.end(buf);

    } catch (err: any) {
      console.error(`[apk] Error:`, err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  console.log("✅ Web-to-APK Routes Registered (stateless runId-based):");
  console.log("  GET /api/tools/web-to-apk/build?url=...");
  console.log("  GET /api/tools/web-to-apk/download/:runId");
}
