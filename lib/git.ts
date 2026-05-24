import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

function expandHome(p: string): string {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

function run(cmd: string, args: string[], cwd: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });
    child.on('error', () => resolve({ ok: false, stdout, stderr }));
    child.on('close', (code) => resolve({ ok: code === 0, stdout, stderr }));
  });
}

export type GitSnapshot = {
  available: boolean;
  branch?: string;
  head?: string;
  status?: string;
  log?: string;
  diffstat?: string;
  reason?: string;
};

export async function snapshotRepo(repoPath: string | undefined): Promise<GitSnapshot> {
  if (!repoPath) return { available: false, reason: 'No repo_path on sidecar.' };
  const abs = expandHome(repoPath);
  if (!(await exists(abs))) return { available: false, reason: `Path not found locally: ${abs}` };
  if (!(await exists(path.join(abs, '.git')))) return { available: false, reason: `Not a git repo: ${abs}` };

  const [branch, head, status, log, count] = await Promise.all([
    run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], abs),
    run('git', ['rev-parse', '--short', 'HEAD'], abs),
    run('git', ['status', '--short'], abs),
    run('git', ['log', '--oneline', '-20'], abs),
    run('git', ['rev-list', '--count', 'HEAD'], abs),
  ]);
  const total = parseInt(count.stdout.trim(), 10);
  const span = Number.isFinite(total) && total > 1 ? Math.min(10, total - 1) : 0;
  const diffstat = span > 0
    ? await run('git', ['diff', '--stat', `HEAD~${span}`, 'HEAD'], abs)
    : { ok: true, stdout: '(only one commit on this branch)', stderr: '' };

  return {
    available: true,
    branch: branch.stdout.trim() || undefined,
    head: head.stdout.trim() || undefined,
    status: status.stdout.trim() || '(clean working tree)',
    log: log.stdout.trim() || undefined,
    diffstat: diffstat.stdout.trim() || diffstat.stderr.trim() || undefined,
  };
}
