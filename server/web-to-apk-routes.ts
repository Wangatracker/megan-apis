import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";

const GH_API = "https://api.github.com";

interface BuildRecord {
  id: string;
  url: string;
  appName: string;
  packageId: string;
  workflowRunId?: number;
  status: string;
  artifactUrl?: string;
  createdAt: number;
}

const builds = new Map<string, BuildRecord>();

export function registerWebToApkRoutes(app: Express): void {
  const GH_TOKEN = process.env.GH_APK_TOKEN;
  const GH_OWNER = process.env.GH_APK_OWNER;
  const GH_REPO = process.env.GH_APK_REPO;

  app.get("/api/tools/web-to-apk/build", async (req: Request, res: Response) => {
    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({
        success: false,
        error: "APK builder not configured. Admin must set GH_APK_TOKEN, GH_APK_OWNER, GH_APK_REPO env vars.",
      });
    }

    const {
      url,
      appName,
      packageId,
      logoText = "M",
      logoColor = "#FF6B35",
      splashColor = "#111111",
    } = req.query;

    if (!url || !appName || !packageId) {
      return res.status(400).json({
        success: false,
        error: "Parameters required: url, appName, packageId",
        example: "/api/tools/web-to-apk/build?url=https://example.com&appName=MyApp&packageId=com.example.myapp",
        optional: ["logoText", "logoColor", "splashColor"],
      });
    }

    try {
      const u = new URL(url as string);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL" });
    }

    if (!/^[a-z][a-z0-9_.]{2,50}$/i.test(packageId as string)) {
      return res.status(400).json({ success: false, error: "Invalid packageId. Example: com.megan.myapp" });
    }

    const buildId = randomUUID();
    console.log(`[apk] Starting build ${buildId}: ${url} -> ${packageId} (logo: ${logoText})`);

    try {
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
            },
          }),
        }
      );

      if (ghRes.status !== 204) {
        const errBody = await ghRes.text();
        throw new Error(`GitHub HTTP ${ghRes.status}: ${errBody.substring(0, 300)}`);
      }

      builds.set(buildId, {
        id: buildId,
        url: url as string,
        appName: appName as string,
        packageId: packageId as string,
        status: "queued",
        createdAt: Date.now(),
      });

      setTimeout(() => builds.delete(buildId), 60 * 60 * 1000);

      return res.json({
        success: true,
        buildId,
        status: "queued",
        estimatedTime: "2-4 minutes",
        message: "APK build started on GitHub Actions.",
        config: { url, appName, packageId, logoText, logoColor, splashColor },
        checkUrl: `https://apis.megan.qzz.io/api/tools/web-to-apk/status/${buildId}`,
        githubActionsUrl: `https://github.com/${GH_OWNER}/${GH_REPO}/actions`,
      });
    } catch (err: any) {
      console.error(`[apk] ERROR:`, err.message);
      return res.status(500).json({ success: false, error: "Failed to start APK build", details: err.message });
    }
  });

  app.get("/api/tools/web-to-apk/status/:buildId", async (req: Request, res: Response) => {
    const { buildId } = req.params;
    const build = builds.get(buildId);

    if (!build) {
      return res.status(404).json({ success: false, error: "Build not found (expired or server restarted)" });
    }

    if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
      return res.status(500).json({ success: false, error: "APK builder not configured" });
    }

    try {
      const runsRes = await fetch(
        `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=20`,
        {
          headers: {
            "Authorization": `Bearer ${GH_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!runsRes.ok) {
        return res.json({ success: true, buildId, status: build.status, note: "Could not fetch live status" });
      }

      const data: any = await runsRes.json();
      const latestRun = data.workflow_runs?.[0];

      if (!latestRun) {
        return res.json({ success: true, buildId, status: "queued" });
      }

      let status = "building";
      let artifactUrl: string | undefined;

      if (latestRun.status === "completed") {
        status = latestRun.conclusion === "success" ? "success" : "failed";

        if (status === "success") {
          const artifactsRes = await fetch(
            `${GH_API}/repos/${GH_OWNER}/${GH_REPO}/actions/runs/${latestRun.id}/artifacts`,
            {
              headers: {
                "Authorization": `Bearer ${GH_TOKEN}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );
          if (artifactsRes.ok) {
            const artData: any = await artifactsRes.json();
            const artifact = artData.artifacts?.[0];
            if (artifact) {
              artifactUrl = artifact.archive_download_url;
            }
          }
        }
      } else if (latestRun.status === "queued") {
        status = "queued";
      }

      return res.json({
        success: true,
        buildId,
        status,
        githubRunId: latestRun.id,
        githubRunUrl: latestRun.html_url,
        artifactDownloadUrl: artifactUrl,
        note: status === "success"
          ? "APK ready. Download from artifactDownloadUrl (requires GitHub auth) or from githubRunUrl"
          : status === "failed"
          ? "Build failed. Check githubRunUrl for logs."
          : "Build in progress...",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  console.log("✅ Web-to-APK Routes Registered:");
  console.log("  GET /api/tools/web-to-apk/build?url=...&appName=...&packageId=...");
  console.log("  GET /api/tools/web-to-apk/status/:buildId");
}
