import { d1Query, d1Execute } from "./d1-client";

// ─── DETECTOR ──────────────────────────────────────────────────────────────
// Scans recent api_usage and inserts key_flags + notifications for anomalies.
// Never blocks — only warns.

interface DetectorResult {
  scanned: number;
  flagged: number;
  flags_created: number;
  notifications_created: number;
  duration_ms: number;
}

// Config — tweak these thresholds
const CONFIG = {
  WINDOW_MINUTES: 5,               // Look at last N minutes of usage
  DEDUPE_MINUTES: 30,              // Don't re-fire same (key, type) within N minutes

  HIGH_FREQ_PER_MIN: 2,          // > 500 req/min → flag
  HIGH_FREQ_SEVERITY: "medium",

  ERROR_RATE_PCT: 40,              // > 40% errors → flag
  ERROR_MIN_REQUESTS: 1,          // Only if at least N requests in window
  ERROR_SEVERITY: "medium",

  MULTI_IP_COUNT: 3,               // 3+ distinct IPs in window → flag
  MULTI_IP_MIN_REQUESTS: 2,
  MULTI_IP_SEVERITY: "high",

  SCAN_ENDPOINTS_PER_MIN: 1,      // 20+ distinct endpoints in 1 min → flag
  SCAN_SEVERITY: "high",
};

interface UsageGroup {
  api_key: string;
  total: number;
  errors: number;
  distinct_ips: number;
  distinct_endpoints: number;
  distinct_endpoints_per_min: number;
  ips_sample: string[];       // first 5 distinct IPs for metadata
  top_endpoints: string[];    // first 5 endpoints for metadata
}

async function getRecentGroups(): Promise<UsageGroup[]> {
  const since = `-${CONFIG.WINDOW_MINUTES} minutes`;

  // Main group query
  const rows = await d1Query(
    `SELECT
       api_key,
       COUNT(*) as total,
       SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors,
       COUNT(DISTINCT requested_ip) as distinct_ips,
       COUNT(DISTINCT endpoint) as distinct_endpoints,
       CAST(COUNT(DISTINCT endpoint) AS FLOAT) / ? as distinct_endpoints_per_min
     FROM api_usage
     WHERE created_at > datetime('now', ?)
       AND api_key IS NOT NULL
       AND api_key != ''
       AND api_key != 'anonymous'
     GROUP BY api_key`,
    [CONFIG.WINDOW_MINUTES, since]
  );

  const groups: UsageGroup[] = [];

  for (const r of rows as any[]) {
    // Sample IPs (for metadata)
    const ipSample = await d1Query(
      `SELECT DISTINCT requested_ip FROM api_usage
       WHERE api_key = ? AND created_at > datetime('now', ?) AND requested_ip IS NOT NULL
       LIMIT 5`,
      [r.api_key, since]
    );

    // Sample endpoints (for metadata)
    const epSample = await d1Query(
      `SELECT endpoint, COUNT(*) as cnt FROM api_usage
       WHERE api_key = ? AND created_at > datetime('now', ?)
       GROUP BY endpoint ORDER BY cnt DESC LIMIT 5`,
      [r.api_key, since]
    );

    groups.push({
      api_key: r.api_key,
      total: r.total,
      errors: r.errors,
      distinct_ips: r.distinct_ips,
      distinct_endpoints: r.distinct_endpoints,
      distinct_endpoints_per_min: r.distinct_endpoints_per_min,
      ips_sample: ipSample.map((x: any) => x.requested_ip),
      top_endpoints: epSample.map((x: any) => x.endpoint),
    });
  }

  return groups;
}

interface FlagCandidate {
  type: string;
  severity: string;
  description: string;
  metadata: Record<string, any>;
}

function evaluateGroup(g: UsageGroup): FlagCandidate[] {
  const flags: FlagCandidate[] = [];

  // Rule 1: high frequency
  const reqPerMin = g.total / CONFIG.WINDOW_MINUTES;
  if (reqPerMin > CONFIG.HIGH_FREQ_PER_MIN) {
    flags.push({
      type: "high_frequency",
      severity: CONFIG.HIGH_FREQ_SEVERITY,
      description: `High request rate detected: ${Math.round(reqPerMin)} req/min over ${CONFIG.WINDOW_MINUTES} min window`,
      metadata: { req_per_min: Math.round(reqPerMin), total: g.total, window_min: CONFIG.WINDOW_MINUTES },
    });
  }

  // Rule 2: error spike
  if (g.total >= CONFIG.ERROR_MIN_REQUESTS) {
    const errRate = (g.errors / g.total) * 100;
    if (errRate > CONFIG.ERROR_RATE_PCT) {
      flags.push({
        type: "error_spike",
        severity: CONFIG.ERROR_SEVERITY,
        description: `Error spike detected: ${errRate.toFixed(1)}% errors in last ${CONFIG.WINDOW_MINUTES} min`,
        metadata: { error_rate_pct: Math.round(errRate * 10) / 10, total: g.total, errors: g.errors, top_endpoints: g.top_endpoints },
      });
    }
  }

  // Rule 3: multiple IPs (possible leaked/shared key)
  if (g.total >= CONFIG.MULTI_IP_MIN_REQUESTS && g.distinct_ips >= CONFIG.MULTI_IP_COUNT) {
    flags.push({
      type: "multi_ip",
      severity: CONFIG.MULTI_IP_SEVERITY,
      description: `Multiple IPs detected on same key: ${g.distinct_ips} distinct IPs in ${CONFIG.WINDOW_MINUTES} min`,
      metadata: { distinct_ips: g.distinct_ips, sample_ips: g.ips_sample, total: g.total },
    });
  }

  // Rule 4: endpoint scanning
  if (g.distinct_endpoints_per_min >= CONFIG.SCAN_ENDPOINTS_PER_MIN) {
    flags.push({
      type: "endpoint_scan",
      severity: CONFIG.SCAN_SEVERITY,
      description: `Broad endpoint scanning detected: ${g.distinct_endpoints} distinct endpoints in ${CONFIG.WINDOW_MINUTES} min`,
      metadata: { distinct_endpoints: g.distinct_endpoints, per_min: Math.round(g.distinct_endpoints_per_min), sample: g.top_endpoints },
    });
  }

  return flags;
}

async function alreadyFiredRecently(api_key: string, type: string): Promise<boolean> {
  const rows = await d1Query(
    `SELECT id FROM key_flags
     WHERE api_key = ? AND type = ?
       AND detected_at > datetime('now', ?)
     LIMIT 1`,
    [api_key, type, `-${CONFIG.DEDUPE_MINUTES} minutes`]
  );
  return rows.length > 0;
}

async function getKeyOwner(api_key: string): Promise<string | null> {
  try {
    const rows = await d1Query(
      "SELECT user_id FROM api_keys WHERE key = ? LIMIT 1",
      [api_key]
    );
    return rows[0]?.user_id || null;
  } catch {
    return null;
  }
}

async function createNotification(api_key: string, flag: FlagCandidate, owner_uid: string | null): Promise<void> {
  const keyName = await d1Query("SELECT name FROM api_keys WHERE key = ? LIMIT 1", [api_key]);
  const name = keyName[0]?.name || "your key";

  const severityEmoji =
    flag.severity === "high" ? "🚨" :
    flag.severity === "medium" ? "⚠️" : "ℹ️";

  const title = `${severityEmoji} ${flag.description.split(":")[0]} on "${name}"`;
  const message = flag.description;

  try {
    await d1Execute(
      `INSERT INTO notifications (type, title, message, priority, target_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        "key_warning",
        title,
        message,
        flag.severity === "high" ? "high" : "normal",
        owner_uid,
      ]
    );
  } catch (e: any) {
    // Notifications table may not have target_user_id column yet — fall back
    try {
      await d1Execute(
        `INSERT INTO notifications (type, title, message, priority, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        ["key_warning", title, message, flag.severity === "high" ? "high" : "normal"]
      );
    } catch (e2: any) {
      console.error("Failed to create notification:", e2.message);
    }
  }
}

export async function runDetector(): Promise<DetectorResult> {
  const start = Date.now();
  const result: DetectorResult = {
    scanned: 0,
    flagged: 0,
    flags_created: 0,
    notifications_created: 0,
    duration_ms: 0,
  };

  try {
    const groups = await getRecentGroups();
    result.scanned = groups.length;

    for (const g of groups) {
      const candidates = evaluateGroup(g);
      if (candidates.length === 0) continue;

      let anyNew = false;

      for (const flag of candidates) {
        // Dedupe check
        if (await alreadyFiredRecently(g.api_key, flag.type)) {
          continue;
        }

        // Insert flag
        try {
          await d1Execute(
            `INSERT INTO key_flags (api_key, type, severity, description, metadata, detected_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            [g.api_key, flag.type, flag.severity, flag.description, JSON.stringify(flag.metadata)]
          );
          result.flags_created++;
          anyNew = true;
        } catch (e: any) {
          console.error(`Flag insert failed for ${g.api_key}/${flag.type}:`, e.message);
          continue;
        }

        // Send notification to owner
        const owner = await getKeyOwner(g.api_key);
        await createNotification(g.api_key, flag, owner);
        result.notifications_created++;
      }

      if (anyNew) result.flagged++;
    }
  } catch (e: any) {
    console.error("Detector error:", e.message);
  }

  result.duration_ms = Date.now() - start;
  return result;
}

export function registerDetectorRoutes(app: any): void {
  // POST /api/admin/detector/run - Manually trigger the detector
  app.post("/api/admin/detector/run", async (req: any, res: any) => {
    const adminPwd = req.headers["x-admin-password"];
    if (adminPwd !== "meganadmin2026") {
      return res.status(403).json({ success: false, error: "Admin required" });
    }

    try {
      const result = await runDetector();
      return res.json({ success: true, ...result });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Detector Routes Registered:");
  console.log("  POST /api/admin/detector/run");
}
