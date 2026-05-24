import path from 'node:path';
import os from 'node:os';

const cwd = process.cwd();

const expandHome = (p: string) =>
  p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;

export const PORTAL_ROOTS: string[] = (process.env.PORTAL_ROOTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(expandHome);

export const FIXTURE_DIR = path.join(cwd, 'artifacts', 'fixtures');

export const SESSION_DIR = process.env.PORTAL_SESSION_DIR
  ? expandHome(process.env.PORTAL_SESSION_DIR)
  : path.join(cwd, '.portal', 'sessions');

export const IS_MAC = os.platform() === 'darwin';
