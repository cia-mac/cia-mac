'use client';

import { useState } from 'react';
import type { ActionResult, Artifact, SessionKind } from '@/lib/types';

type ActionKind = SessionKind | 'open-folder' | 'open-preview';

type Btn = { kind: ActionKind; label: string; stub?: false } | { stub: true; label: string; cmd: string };

type ActionBtn = { kind: ActionKind; label: string; requires?: (a: Artifact) => boolean; missingHint?: string };

const buttons: ActionBtn[] = [
  { kind: 'open-preview', label: 'Open Preview',
    requires: (a) => !!(a.preview_url || a.source_url),
    missingHint: 'No preview_url or source_url on this sidecar.' },
  { kind: 'open-folder', label: 'Open Folder',
    requires: (a) => !!(a.folder_path || a.repo_path),
    missingHint: 'No folder_path or repo_path on this sidecar.' },
  { kind: 'resume', label: 'Resume Claude' },
  { kind: 'audit', label: 'Audit Build' },
  { kind: 'exit', label: 'Exit Ritual' },
  { kind: 'save', label: 'Save for Later' },
];

const stubs: Btn[] = [
  { stub: true, label: 'Open App', cmd: '(stub) open the running app — wire this up when an artifact actually has one' },
  { stub: true, label: 'Show Diff', cmd: 'git diff HEAD' },
  { stub: true, label: 'Consult ChatGPT', cmd: '(stub) write child page under <Artifact> · Review Room · 02 · ChatGPT review' },
  { stub: true, label: 'Consult Gemini', cmd: '(stub) Gemini bridge not built. Use Notion review page.' },
  { stub: true, label: 'Create PR', cmd: 'gh pr create --draft' },
];

export function CommandBar({ artifact }: { artifact: Artifact }) {
  const [toast, setToast] = useState<string | null>(null);
  const [cmd, setCmd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (msg: string, command?: string) => {
    setToast(msg);
    setCmd(command ?? null);
    setTimeout(() => { setToast(null); setCmd(null); }, 6000);
  };

  const fire = async (kind: ActionKind) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, artifact_id: artifact.id }),
      });
      const data = (await res.json()) as ActionResult;
      flash(data.message, data.command);
    } catch (e) {
      flash(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="toast">
          {toast}
          {cmd && <code>{cmd}</code>}
        </div>
      )}
      <div className="cmdbar">
        <div className="cmdbar-inner">
          {buttons.map((b) => {
            const enabled = !b.requires || b.requires(artifact);
            return (
              <button
                key={b.label}
                onClick={() => enabled ? fire(b.kind) : flash(b.missingHint ?? 'Unavailable.')}
                disabled={busy}
                aria-disabled={!enabled}
                title={enabled ? '' : b.missingHint}
                className={enabled ? '' : 'unmet'}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="stub-strip" aria-label="Stubs (not promoted)">
        {stubs.map((b) => (
          <button
            key={b.label}
            className="stub"
            onClick={() => 'cmd' in b && flash('Stub. Copy this for now:', b.cmd)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </>
  );
}
