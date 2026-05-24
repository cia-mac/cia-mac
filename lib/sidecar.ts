import fs from 'node:fs/promises';
import path from 'node:path';
import type { Artifact } from './types';
import { validateSidecar, type ValidationResult } from './validate';

export async function readSidecar(filePath: string): Promise<ValidationResult | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: { path: filePath, errors: [`JSON parse error: ${(e as Error).message}`] } };
  }
  return validateSidecar(parsed, filePath);
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
  const result = await readSidecar(filePath);
  if (!result || !result.ok) return null;
  const merged: Artifact = { ...result.artifact, ...patch, __sidecar_path: filePath };
  await writeSidecar(filePath, merged);
  return merged;
}
