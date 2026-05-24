import fs from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from './types';
import { readSidecar } from './sidecar';
import { FIXTURE_DIR, PORTAL_ROOTS } from './config';

async function listDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function discoverFixtures(): Promise<Artifact[]> {
  const entries = await listDir(FIXTURE_DIR);
  const sidecars = entries.filter((f) => f.endsWith('.portal.json'));
  const reads = await Promise.all(
    sidecars.map((f) => readSidecar(path.join(FIXTURE_DIR, f))),
  );
  return reads.filter((a): a is Artifact => a !== null);
}

async function discoverRoot(root: string, depth = 2): Promise<Artifact[]> {
  if (depth < 0) return [];
  const found: Artifact[] = [];
  const entries = await listDir(root);

  await Promise.all(
    entries.map(async (name) => {
      if (name.startsWith('.') || name === 'node_modules') return;
      const full = path.join(root, name);
      let stat;
      try {
        stat = await fs.stat(full);
      } catch {
        return;
      }
      if (!stat.isDirectory()) return;
      const sidecarPath = path.join(full, '.portal.json');
      const sidecar = await readSidecar(sidecarPath);
      if (sidecar) found.push(sidecar);
      else if (depth > 0) {
        const nested = await discoverRoot(full, depth - 1);
        found.push(...nested);
      }
    }),
  );

  return found;
}

export async function discoverArtifacts(): Promise<Artifact[]> {
  const fixtures = await discoverFixtures();
  const rooted = (
    await Promise.all(PORTAL_ROOTS.map((r) => discoverRoot(r)))
  ).flat();

  const merged = new Map<string, Artifact>();
  for (const a of [...fixtures, ...rooted]) merged.set(a.id, a);
  return [...merged.values()].sort((a, b) => {
    const at = a.last_touched ?? '';
    const bt = b.last_touched ?? '';
    return bt.localeCompare(at);
  });
}

export async function findArtifact(id: string): Promise<Artifact | undefined> {
  const all = await discoverArtifacts();
  return all.find((a) => a.id === id);
}
