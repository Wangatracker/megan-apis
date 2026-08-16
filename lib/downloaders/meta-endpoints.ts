import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { allEndpointsComplete as allEndpoints, apiCategories } from "../../shared/schema";

const execAsync = promisify(exec);
const startTime = Date.now();

// ─── SERVER STATUS ─────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(" ");
}

export function getServerStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  return {
    status: "online",
    
    // Uptime
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime),
      started_at: new Date(startTime).toISOString(),
    },
    
    // Platform
    platform: {
      os: os.platform(),
      arch: os.arch(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      node_version: process.version,
      node_env: process.env.NODE_ENV || "development",
      pid: process.pid,
    },
    
    // Memory
    memory: {
      process: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        external_mb: Math.round(mem.external / 1024 / 1024),
        array_buffers_mb: Math.round(mem.arrayBuffers / 1024 / 1024),
      },
      system: {
        total_mb: Math.round(totalMem / 1024 / 1024),
        free_mb: Math.round(freeMem / 1024 / 1024),
        used_mb: Math.round(usedMem / 1024 / 1024),
        used_percent: Math.round((usedMem / totalMem) * 100),
      },
    },
    
    // CPU
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
      speed_mhz: cpus[0]?.speed || 0,
      load_avg_1min: Math.round(loadAvg[0] * 100) / 100,
      load_avg_5min: Math.round(loadAvg[1] * 100) / 100,
      load_avg_15min: Math.round(loadAvg[2] * 100) / 100,
      load_percent: Math.round((loadAvg[0] / cpus.length) * 100),
    },
  };
}

// ─── DISK STATS ───────────────────────────────────────────────────────────

export async function getDiskStats(): Promise<any> {
  try {
    const { stdout } = await execAsync("df -k / | tail -1", { timeout: 5000 });
    const parts = stdout.trim().split(/\s+/);
    
    if (parts.length >= 6) {
      const totalKb = parseInt(parts[1]);
      const usedKb = parseInt(parts[2]);
      const freeKb = parseInt(parts[3]);
      const usedPercent = parseInt(parts[4]);
      
      return {
        filesystem: parts[0],
        total_gb: Math.round((totalKb / 1024 / 1024) * 100) / 100,
        used_gb: Math.round((usedKb / 1024 / 1024) * 100) / 100,
        free_gb: Math.round((freeKb / 1024 / 1024) * 100) / 100,
        used_percent: usedPercent,
        free_percent: 100 - usedPercent,
        mount: parts[5],
      };
    }
  } catch {}
  
  // Fallback: try to get project size
  try {
    const { stdout } = await execAsync("du -sh . 2>/dev/null | cut -f1", { timeout: 5000 });
    return { project_size: stdout.trim() };
  } catch {}
  
  return null;
}

// ─── NETWORK STATS ────────────────────────────────────────────────────────

export async function getNetworkStats(): Promise<any> {
  try {
    const { stdout } = await execAsync("cat /proc/net/dev | tail -n +3", { timeout: 5000 });
    const lines = stdout.trim().split("\n");
    const interfaces: any[] = [];
    let totalRxBytes = 0;
    let totalTxBytes = 0;
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 10) {
        const name = parts[0].replace(":", "");
        const rxBytes = parseInt(parts[1]);
        const txBytes = parseInt(parts[9]);
        
        if (!isNaN(rxBytes) && !isNaN(txBytes) && rxBytes > 0) {
          interfaces.push({
            name,
            rx_mb: Math.round((rxBytes / 1024 / 1024) * 100) / 100,
            tx_mb: Math.round((txBytes / 1024 / 1024) * 100) / 100,
          });
          totalRxBytes += rxBytes;
          totalTxBytes += txBytes;
        }
      }
    }
    
    return {
      interfaces: interfaces.slice(0, 5), // Top 5 active interfaces
      total_rx_mb: Math.round((totalRxBytes / 1024 / 1024) * 100) / 100,
      total_tx_mb: Math.round((totalTxBytes / 1024 / 1024) * 100) / 100,
      total_mb: Math.round(((totalRxBytes + totalTxBytes) / 1024 / 1024) * 100) / 100,
    };
  } catch {}
  
  return null;
}

// ─── FULL SERVER STATS ─────────────────────────────────────────────────────

export async function getFullServerStats() {
  const [disk, network] = await Promise.all([
    getDiskStats(),
    getNetworkStats(),
  ]);
  
  const status = getServerStatus();
  
  return {
    ...status,
    disk,
    network,
    timestamp: new Date().toISOString(),
  };
}

// ─── ENDPOINTS CATALOG ─────────────────────────────────────────────────────

export function getAllEndpoints() {
  return {
    total: allEndpoints.length,
    categories: apiCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      count: allEndpoints.filter(e => e.category === cat.id).length,
      subcategories: cat.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        count: allEndpoints.filter(e => e.subcategoryId === sub.id).length,
      })),
    })),
    endpoints: allEndpoints.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      category: ep.category,
      categoryId: ep.categoryId,
      subcategory: ep.subcategory || null,
      subcategoryId: ep.subcategoryId || null,
      provider: ep.provider || null,
      version: ep.version,
      createdAt: ep.createdAt,
      rateLimit: ep.rateLimit || null,
      params: ep.params.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        description: p.description,
        default: p.default || null,
        options: p.options || null,
      })),
    })),
  };
}

export function searchEndpoints(query: string) {
  const q = query.toLowerCase();
  const results = allEndpoints.filter(ep =>
    ep.path.toLowerCase().includes(q) ||
    ep.description.toLowerCase().includes(q) ||
    ep.category.toLowerCase().includes(q) ||
    ep.categoryId.toLowerCase().includes(q) ||
    (ep.provider || "").toLowerCase().includes(q)
  );
  
  return {
    query,
    totalResults: results.length,
    results: results.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      category: ep.category,
      categoryId: ep.categoryId,
      provider: ep.provider || null,
      version: ep.version,
    })),
  };
}

export function getEndpointsByCategory(categoryName: string) {
  const cat = apiCategories.find(c =>
    c.id === categoryName ||
    c.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (!cat) return null;
  
  const eps = allEndpoints.filter(e => e.category === cat.id);
  
  return {
    category: cat.name,
    categoryId: cat.id,
    description: cat.description,
    icon: cat.icon,
    totalEndpoints: eps.length,
    subcategories: cat.subcategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      count: eps.filter(e => e.subcategoryId === sub.id).length,
    })),
    endpoints: eps.map(ep => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      subcategory: ep.subcategory || null,
      provider: ep.provider || null,
      version: ep.version,
      createdAt: ep.createdAt,
      params: ep.params.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        description: p.description,
      })),
    })),
  };
}

export function getCategories() {
  return {
    total: apiCategories.length,
    categories: apiCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      endpointCount: allEndpoints.filter(e => e.category === cat.id).length,
      subcategoryCount: cat.subcategories.length,
    })),
  };
}

export function getMethodStats() {
  const methods: Record<string, number> = {};
  allEndpoints.forEach(ep => {
    methods[ep.method] = (methods[ep.method] || 0) + 1;
  });
  
  return {
    total: allEndpoints.length,
    byMethod: Object.entries(methods).map(([method, count]) => ({ method, count })),
    byCategory: apiCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: allEndpoints.filter(e => e.category === cat.id).length,
    })),
    byVersion: {
      v0: allEndpoints.filter(e => e.version === "v0").length,
      v1: allEndpoints.filter(e => e.version === "v1").length,
      v2: allEndpoints.filter(e => e.version === "v2").length,
    },
  };
}
