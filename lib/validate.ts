import type { Artifact } from './types';

const ARCS = new Set(['imaging', 'iranshahr', 'films', 'writing', 'system']);
const KINDS = new Set(['page', 'app', 'markdown', 'image', 'session', 'study', 'writing']);

export type SidecarError = {
  path: string;
  errors: string[];
};

export type ValidationResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; error: SidecarError };

export function validateSidecar(raw: unknown, path: string): ValidationResult {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: { path, errors: ['not a JSON object'] } };
  }
  const o = raw as Record<string, unknown>;

  const must = (field: string, type: 'string' | 'number') => {
    const v = o[field];
    if (v === undefined || v === null) errors.push(`missing required field: ${field}`);
    else if (typeof v !== type) errors.push(`${field} must be ${type}, got ${typeof v}`);
  };

  must('id', 'string');
  must('title', 'string');
  must('arc', 'string');
  must('kind', 'string');
  must('stage', 'number');

  if (typeof o.arc === 'string' && !ARCS.has(o.arc)) {
    errors.push(`invalid arc "${o.arc}" — must be one of: ${[...ARCS].join(', ')}`);
  }
  if (typeof o.kind === 'string' && !KINDS.has(o.kind)) {
    errors.push(`invalid kind "${o.kind}" — must be one of: ${[...KINDS].join(', ')}`);
  }
  if (typeof o.stage === 'number' && (o.stage < 0 || o.stage > 6 || !Number.isInteger(o.stage))) {
    errors.push(`stage must be an integer 0–6, got ${o.stage}`);
  }
  if (typeof o.id === 'string' && !/^[a-z0-9-]+$/.test(o.id)) {
    errors.push(`id "${o.id}" must be lowercase letters, digits, and hyphens only`);
  }

  if (errors.length > 0) return { ok: false, error: { path, errors } };
  return { ok: true, artifact: { ...(o as unknown as Artifact), __sidecar_path: path } };
}
