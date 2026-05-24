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
