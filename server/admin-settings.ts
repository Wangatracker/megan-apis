import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const SETTINGS_FILE = path.resolve(process.cwd(), "admin-settings.json");

export interface RepoCard {
  id: string;
  name: string;
  url: string;
  description: string;
  badge: string;
  display: string;
  icon: "github" | "cpu" | "globe" | "server" | "zap" | "code";
}

export interface AdminSettings {
  password: string;
  githubUrl: string;
  repoCards: RepoCard[];
  ipBlocklist: string[];
}

const DEFAULT_SETTINGS: AdminSettings = {
  password: "wolfadmin2026",
  githubUrl: "https://github.com/TrackerWanga",
  ipBlocklist: [],
  repoCards: [
    {
      id: "wolfxcore",
      name: "meganapis",
      url: "https://github.com/TrackerWanga/meganapis",
      description: "Free REST API hub — 800+ endpoints. AI chat, social media downloads, image effects, OSINT tools.",
      badge: "Node.js + Express",
      display: "github.com/TrackerWanga/meganapis",
      icon: "github",
    },
    {
      id: "panel",
      name: "panel.example.com",
      url: "https://panel.example.com",
      description: "Host, manage and provision game servers with automated billing",
      badge: "GAME SERVER",
      display: "panel.example.com",
      icon: "cpu",
    },
    {
      id: "host",
      name: "host.example.com",
      url: "https://host.example.com",
      description: "One-click deployment platform for chatbots and automation scripts",
      badge: "BOT HOSTING",
      display: "host.example.com",
      icon: "globe",
    },
  ],
};

let _settings: AdminSettings | null = null;

export function loadSettings(): AdminSettings {
  if (_settings) return _settings;
  try {
    if (existsSync(SETTINGS_FILE)) {
      const raw = readFileSync(SETTINGS_FILE, "utf-8");
      _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } else {
      _settings = { ...DEFAULT_SETTINGS };
      saveSettings(_settings);
    }
  } catch {
    _settings = { ...DEFAULT_SETTINGS };
  }
  return _settings!;
}

export function saveSettings(settings: AdminSettings): void {
  _settings = settings;
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
    console.error("[admin] Failed to save settings:", e);
  }
}

export function getSettings(): AdminSettings {
  return loadSettings();
}
