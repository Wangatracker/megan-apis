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

export function registerWebToApkRoutes(app: Express): void {
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;

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

    const buildId = randomUUID();
    console.log(`[apk] Starting build ${buildId} for ${appName}`);

    try {
      // 1. Trigger GitHub Action
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

      // 2. Wait 3 seconds for the run to appear
      await new Promise(r => setTimeout(r, 3000));

      // 3. Get the run ID
      const runsRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=1`, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });
      const runsData: any = await runsRes.json();
      const runId = runsData.workflow_runs?.[0]?.id;
      const runUrl = runsData.workflow_runs?.[0]?.html_url;

      builds.set(buildId, { id: buildId, url: url as string, appName: appName as string, packageId: packageId as string, createdAt: Date.now() });
      setTimeout(() => builds.delete(buildId), 60 * 60 * 1000);

      // 4. Fetch the artifact URL directly
      let githubArtifactUrl = null;
      try {
        // Wait a moment for the run to initialize
        await new Promise(r => setTimeout(r, 1000));
        const artRes = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${runId}/artifacts`, {
          headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
        });
        const artData: any = await artRes.json();
        if (artData.artifacts && artData.artifacts.length > 0) {
          githubArtifactUrl = artData.artifacts[0].archive_download_url;
        }
      } catch (e) {
        console.log(`[apk] Could not fetch artifact URL yet.`);
      }

      // 4. Return the instant response with OUR download URL
      return res.json({
        success: true,
        status: "building",
        message: `Your app is being built. It takes about 3-5 minutes. Wait a few minutes, then click the downloadUrl below.`,
        downloadUrl: `https://apis.megan.qzz.io/api/tools/web-to-apk/download/${buildId}`,
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

      const zipRes = await fetch(artifact.archive_download_url, {
        headers: { "Authorization": `Bearer ${GH_TOKEN}`, "Accept": "application/vnd.github+json" },
      });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${build.appName.replace(/[^a-z0-9]/gi, '_')}_apk.zip"`);
      
      if (zipRes.body) {
        // @ts-ignore
        Readable.fromWeb(zipRes.body).pipe(res);
      } else {
        res.send(Buffer.from(await zipRes.arrayBuffer()));
      }
    } catch (err: any) {
      return res.status(500).send("Failed to prepare download.");
    }
  });

  console.log("✅ Web-to-APK Routes Registered (Honest API mode)");
}
