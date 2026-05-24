import type { Arc, ArtifactKind } from './types';

export const ARC_HUE: Record<Arc, number> = {
  imaging: 32,
  eranshahr: 220,
  films: 340,
  writing: 180,
  system: 210,
};

export const KIND_GLYPH: Record<ArtifactKind, string> = {
  page: '◧',
  app: '▷',
  markdown: '¶',
  image: '◨',
  session: '⊙',
  study: '⋮',
  writing: '✍',
};

export function arcAccent(arc: Arc, sat = 55, light = 65, alpha = 1): string {
  return `hsla(${ARC_HUE[arc] ?? 210}, ${sat}%, ${light}%, ${alpha})`;
}

export function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h >>> 0;
}

export function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  // sessionWriter writes timestamps as 2026-05-24T17-25-13-864Z; un-munge.
  const cleaned = iso.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, 'T$1:$2:$3.$4Z');
  const t = new Date(cleaned).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Date.now() - t;
  const min = 60_000, hr = 60 * min, day = 24 * hr, week = 7 * day;
  if (diff < min) return 'just now';
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  if (diff < 30 * day) return `${Math.floor(diff / week)}w ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}
