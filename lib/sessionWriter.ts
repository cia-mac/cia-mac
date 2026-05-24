import fs from 'node:fs/promises';
import path from 'node:path';
import type { Artifact, SessionKind } from './types';
import { SESSION_DIR } from './config';
import { snapshotRepo, type GitSnapshot } from './git';

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function header(kind: SessionKind, artifact: Artifact, when: string): string {
  const label =
    kind === 'resume' ? 'Resume Claude'
    : kind === 'audit' ? 'Audit Build'
    : kind === 'exit'  ? 'Exit Ritual'
    : 'Save for Later';
  return `# ${label} · ${artifact.title} · ${when}\n\n`
    + `- artifact id: \`${artifact.id}\`\n`
    + `- arc: ${artifact.arc}\n`
    + `- kind: ${artifact.kind}\n`
    + `- stage: ${artifact.stage}\n`
    + (artifact.repo_path ? `- repo: \`${artifact.repo_path}\`\n` : '')
    + (artifact.source_url ? `- source: ${artifact.source_url}\n` : '')
    + (artifact.preview_url ? `- preview: ${artifact.preview_url}\n` : '')
    + `\n`;
}

function auditBody(a: Artifact, snap: GitSnapshot): string {
  const head = snap.available
    ? `### Repo snapshot\n- branch: \`${snap.branch}\`  · head: \`${snap.head}\`\n\n`
      + `### Working tree\n\`\`\`\n${snap.status}\n\`\`\`\n\n`
      + (snap.log ? `### Recent commits\n\`\`\`\n${snap.log}\n\`\`\`\n\n` : '')
      + (snap.diffstat ? `### Diff stat (HEAD~10..HEAD)\n\`\`\`\n${snap.diffstat}\n\`\`\`\n\n` : '')
    : `### Repo snapshot\n_${snap.reason ?? 'unavailable'}_\n\n`;
  return `## Audit Build · ${a.title}\n\n`
    + head
    + `### What works\nTODO\n\n`
    + `### What is stubbed or fake\nTODO\n\n`
    + `### What is broken\nTODO\n\n`
    + `### Rating\nTODO/10\n\n`
    + `### Top fixes\n1. TODO\n2. TODO\n3. TODO\n\n`
    + `### Next action\nTODO\n`;
}

const templates: Record<SessionKind, (a: Artifact) => string> = {
  resume: (a) =>
    `## Resume context for Claude\n\n`
    + `You're resuming work on **${a.title}** (${a.arc} · ${a.kind} · stage ${a.stage}).\n\n`
    + `### Last session summary\n${a.last_session_summary ?? 'TODO'}\n\n`
    + `### Next action\n${a.next_action ?? 'TODO'}\n\n`
    + `### Re-entry summary\n${a.re_entry_summary ?? 'TODO'}\n\n`
    + `### Notes\n${a.notes ?? '—'}\n\n`
    + `### Paths\n`
    + (a.repo_path ? `- repo: \`${a.repo_path}\`\n` : '')
    + (a.folder_path ? `- folder: \`${a.folder_path}\`\n` : '')
    + (a.source_path ? `- source: \`${a.source_path}\`\n` : '')
    + `\n---\n\nPaste this into Claude to resume. Do not edit Portal-managed metadata at the top of this file.\n`,

  audit: () => '__audit_placeholder__',

  exit: (a) =>
    `## Exit Ritual · ${a.title}\n\n`
    + `### What changed this session\nTODO\n\n`
    + `### Files touched\nTODO\n\n`
    + `### Decisions made\nTODO\n\n`
    + `### Unresolved issues\nTODO\n\n`
    + `### Next re-entry point\nTODO\n\n`
    + `### What to open next time\nTODO\n\n`
    + `> Closing artifact. Portal will set \`last_touched\` to now and copy "Next re-entry point" → \`re_entry_summary\` on the sidecar.\n`,

  save: (a) =>
    `## Save for Later · ${a.title}\n\n`
    + `### Where I am\nTODO\n\n`
    + `### Why I'm pausing\nTODO\n\n`
    + `### Next action when I return\nTODO\n\n`
    + `> Portal will copy "Next action" → \`next_action\` and "Where I am" → \`re_entry_summary\` on the sidecar.\n`,
};

export async function writeSession(
  kind: SessionKind,
  artifact: Artifact,
  bodyOverride?: string,
): Promise<{ filePath: string; when: string }> {
  const when = ts();
  const dir = path.join(SESSION_DIR, artifact.id);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${kind}-${when}.md`);
  let body: string;
  if (bodyOverride) body = bodyOverride;
  else if (kind === 'audit') {
    const snap = await snapshotRepo(artifact.repo_path);
    body = header(kind, artifact, when) + auditBody(artifact, snap);
  } else {
    body = header(kind, artifact, when) + templates[kind](artifact);
  }
  await fs.writeFile(filePath, body, 'utf8');
  return { filePath, when };
}
