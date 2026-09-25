// ─── SLUG HELPERS (stateless) ──────────────────────────────────────────────
// Slug format: {id}-{title-slug}-{year}
// Examples:    "550-fight-club-1999", "1399-game-of-thrones-2011"

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildSlug(id: number, title: string, year?: number | null): string {
  const parts = [String(id), slugify(title)];
  if (year) parts.push(String(year));
  return parts.join("-");
}

export function parseSlug(slug: string): number | null {
  if (!slug) return null;
  const match = slug.match(/^(\d+)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return isNaN(id) ? null : id;
}
