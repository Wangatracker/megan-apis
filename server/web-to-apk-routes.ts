import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const GH_API = "https://api.github.com";

interface BuildRecord {
  id: string;
  url: string;
  appName: string;
  packageId: string;
  createdAt: number;
}

const builds = new Map<string, BuildRecord>();

// Helper to wait for a build to finish
async function waitForBuild(runId: number, maxWaitMs = 45000): Promise<{ success: boolean, artifactId?: number, htmlUrl: string }> {
  const start = Date.now();
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;
  
  const headers = {
    "Authorization": `Bearer ${GH_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}`, { headers });
    const data: any = await res.json();

    if (data.status === "completed") {
      if (data.conclusion === "success") {
        // Get the artifact
        const artRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}/artifacts`, { headers });
        const artData: any = await artRes.json();
        const artifact = artData.artifacts?.[0];
        return { success: true, artifactId: artifact?.id, htmlUrl: data.html_url };
      }
      return { success: false, htmlUrl: data.html_url };
    }

    // Wait 3 seconds before checking again
    await new Promise(r => setTimeout(r, 3000));
  }

  // Timeout reached
  return { success: false, htmlUrl: `https://github.com/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}` };
}

// Helper to stream the APK directly
async function streamApk(res: Response, artifactId: number, appName: string) {
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;

  const zipRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/artifacts/${artifactId}/zip`, {
    headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
  });

  if (!zipRes.ok) throw new Error("Failed to fetch artifact from GitHub");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${appName.replace(/[^a-z0-9]/gi, '_')}_apk.zip"`);
  
  if (zipRes.body) {
    // @ts-ignore
    Readable.fromWeb(zipRes.body).pipe(res);
  } else {
    res.send(Buffer.from(await zipRes.arrayBuffer()));
  }
}

export function registerWebToApkRoutes(app: Express): void {
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;

  // 1. Trigger build AND hold the request
  app.get("/api/tools/web-to-apk/build", async (req: Request, res: Response) => {
    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({ success: false, error: "APK builder not configured." });
    }

    const { url, appName, packageId, logoText = "M", logoColor = "#FF6B35", splashColor = "#111111" } = req.query;

    if (!url || !appName || !packageId) {
      return res.status(400).json({ success: false, error: "Parameters required: url, appName, packageId" });
    }

    try { new URL(url as string); } catch { return res.status(400).json({ success: false, error: "Invalid URL" }); }
    if (!/^[a-z][a-z0-9_.]{2,50}$/i.test(packageId as string)) {
      return res.status(400).json({ success: false, error: "Invalid packageId." });
    }

    const buildId = randomUUID();
    console.log(`[apk] Starting build ${buildId} for ${appName}`);

    try {
      // Trigger GitHub Action
      const ghRes = await fetch(
        `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/build-apk.yml/dispatches`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GH_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: { website_url: url, app_name: appName, package_id: packageId, logo_text: logoText, logo_color: logoColor, splash_color: splashColor },
          }),
        }
      );

      if (ghRes.status !== 204) throw new Error(`GitHub dispatch failed: ${ghRes.status}`);

      // Wait 2 seconds for GitHub to register the run
      await new Promise(r => setTimeout(r, 2000));

      // Find the run ID that was just created
      const runsRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=1`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const runsData: any = await runsRes.json();
      const runId = runsData.workflow_runs?.[0]?.id;

      if (!runId) throw new Error("Could not find the triggered workflow run.");

      builds.set(buildId, { id: buildId, url: url as string, appName: appName as string, packageId: packageId as string, createdAt: Date.now() });
      setTimeout(() => builds.delete(buildId), 60 * 60 * 1000);

      // 🟢 HOLD THE REQUEST: Wait up to 45 seconds for it to finish
      console.log(`[apk] Waiting for build to complete (max 45s)...`);
      const result = await waitForBuild(runId, 45000);

      if (result.success && result.artifactId) {
        // It finished within 45 seconds! Send the APK directly.
        console.log(`[apk] ✅ Build finished fast. Streaming APK...`);
        return await streamApk(res, result.artifactId, appName as string);
      } else {
        // It took too long. Tell the user to wait.
        console.log(`[apk] ⏳ Build still running. Returning 202 Accepted.`);
        return res.status(202).json({
          success: true,
          status: "building",
          message: "Your app is still building. It takes about 2-3 minutes. Click the download link in a moment.",
          downloadUrl: `https://apis.megan.qzz.io/api/tools/web-to-apk/download/${buildId}`,
        });
      }
    } catch (err: any) {
      console.error(`[apk] ERROR:`, err.message);
      return res.status(500).json({ success: false, error: "Failed to build APK", details: err.message });
    }
  });

  // 2. Fallback download URL (in case the 45s wait wasn't enough)
  app.get("/api/tools/web-to-apk/download/:buildId", async (req: Request, res: Response) => {
    const { buildId } = req.params;
    const build = builds.get(buildId);

    if (!build) return res.status(404).send("Build link expired or invalid.");

    try {
      const runsRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=1`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const runsData: any = await runsRes.json();
      const latestRun = runsData.workflow_runs?.[0];

      if (!latestRun || latestRun.status !== "completed" || latestRun.conclusion !== "success") {
        return res.status(425).send("Build is still in progress. Please try again in a minute.");
      }

      const artRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${latestRun.id}/artifacts`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const artData: any = await artRes.json();
      const artifact = artData.artifacts?.[0];

      if (!artifact) return res.status(404).send("APK not found.");

      return await streamApk(res, artifact.id, build.appName);
    } catch (err: any) {
      return res.status(500).send("Failed to prepare download.");
    }
  });

  console.log("✅ Web-to-APK Routes Registered (Long Polling Enabled):");
}
