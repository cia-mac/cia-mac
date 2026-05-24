import fs from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from './types';
import { readSidecar } from './sidecar';
import type { SidecarError } from './validate';
import { FIXTURE_DIR, PORTAL_ROOTS } from './config';

export type Discovery = { artifacts: Artifact[]; errors: SidecarError[] };

async function listDir(dir: string): Promise<string[]> {
  try { return await fs.readdir(dir); } catch { return []; }
}

async function discoverFixtures(): Promise<Discovery> {
  const entries = await listDir(FIXTURE_DIR);
  const sidecars = entries.filter((f) => f.endsWith('.portal.json'));
  const results = await Promise.all(
    sidecars.map((f) => readSidecar(path.join(FIXTURE_DIR, f))),
  );
  const artifacts: Artifact[] = [];
  const errors: SidecarError[] = [];
  for (const r of results) {
    if (!r) continue;
    if (r.ok) artifacts.push(r.artifact);
    else errors.push(r.error);
  }
  return { artifacts, errors };
}

async function discoverRoot(root: string, depth = 2): Promise<Discovery> {
  if (depth < 0) return { artifacts: [], errors: [] };
  const out: Discovery = { artifacts: [], errors: [] };
  const entries = await listDir(root);

  await Promise.all(
    entries.map(async (name) => {
      if (name.startsWith('.') || name === 'node_modules') return;
      const full = path.join(root, name);
      let stat;
      try { stat = await fs.stat(full); } catch { return; }
      if (!stat.isDirectory()) return;
      const sidecarPath = path.join(full, '.portal.json');
      const result = await readSidecar(sidecarPath);
      if (result) {
        if (result.ok) out.artifacts.push(result.artifact);
        else out.errors.push(result.error);
      } else if (depth > 0) {
        const nested = await discoverRoot(full, depth - 1);
        out.artifacts.push(...nested.artifacts);
        out.errors.push(...nested.errors);
      }
    }),
  );

  return out;
}

export async function discoverArtifacts(): Promise<Discovery> {
  const fixtures = await discoverFixtures();
  const rooted = await Promise.all(PORTAL_ROOTS.map((r) => discoverRoot(r)));

  const merged = new Map<string, Artifact>();
  const errors: SidecarError[] = [...fixtures.errors];
  for (const a of fixtures.artifacts) merged.set(a.id, a);
  for (const r of rooted) {
    for (const a of r.artifacts) merged.set(a.id, a);
    errors.push(...r.errors);
  }
  const artifacts = [...merged.values()].sort((a, b) => {
    const at = a.last_touched ?? '';
    const bt = b.last_touched ?? '';
    return bt.localeCompare(at);
  });
  return { artifacts, errors };
}

export async function findArtifact(id: string): Promise<Artifact | undefined> {
  const { artifacts } = await discoverArtifacts();
  return artifacts.find((a) => a.id === id);
}
