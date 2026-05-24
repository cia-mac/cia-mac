import fs from 'node:fs/promises';
import path from 'node:path';
import { SESSION_DIR } from './config';
import type { SessionKind } from './types';

export type SessionFile = {
  kind: SessionKind;
  artifact_id: string;
  filename: string;
  full_path: string;
  when_iso: string;
};

const FILENAME = /^(resume|audit|exit|save)-(.+)\.md$/;
const TS_MUNGED = /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/;

function parseWhen(stamp: string): string {
  return stamp.replace(TS_MUNGED, 'T$1:$2:$3.$4Z');
}

export async function listSessions(artifactId: string, limit = 12): Promise<SessionFile[]> {
  const dir = path.join(SESSION_DIR, artifactId);
  let entries: string[];
  try { entries = await fs.readdir(dir); } catch { return []; }
  const items: SessionFile[] = [];
  for (const f of entries) {
    const m = f.match(FILENAME);
    if (!m) continue;
    items.push({
      kind: m[1] as SessionKind,
      artifact_id: artifactId,
      filename: f,
      full_path: path.join(dir, f),
      when_iso: parseWhen(m[2]),
    });
  }
  return items.sort((a, b) => b.filename.localeCompare(a.filename)).slice(0, limit);
}
