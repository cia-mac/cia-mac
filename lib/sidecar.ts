import fs from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from './types';

export async function readSidecar(filePath: string): Promise<Artifact | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Artifact;
    if (!parsed.id || !parsed.title || !parsed.arc || !parsed.kind) return null;
    return { ...parsed, __sidecar_path: filePath };
  } catch {
    return null;
  }
}

export async function writeSidecar(filePath: string, artifact: Artifact): Promise<void> {
  const { __sidecar_path, ...persisted } = artifact;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(persisted, null, 2) + '\n', 'utf8');
}

export async function patchSidecar(
  filePath: string,
  patch: Partial<Artifact>,
): Promise<Artifact | null> {
  const current = await readSidecar(filePath);
  if (!current) return null;
  const merged: Artifact = { ...current, ...patch, __sidecar_path: filePath };
  await writeSidecar(filePath, merged);
  return merged;
}
