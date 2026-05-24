'use client';

import { useEffect, useState } from 'react';
import type { Artifact } from '@/lib/types';

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="info-field">
      <div className="kicker">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  );
}

export function InfoPanel({ artifact }: { artifact: Artifact }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'i' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        className="info-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle artifact info"
        aria-expanded={open}
      >
        {open ? 'CLOSE' : 'INFO'}
      </button>
      {open && (
        <>
          <div className="info-scrim" onClick={() => setOpen(false)} />
          <aside className="info-panel" role="dialog" aria-label="Artifact info">
            <div className="info-header">
              <div className="info-title">{artifact.title}</div>
              <div className="kicker">{artifact.arc} · {artifact.kind} · stage {artifact.stage}</div>
            </div>
            <Field label="next action" value={artifact.next_action} />
            <Field label="re-entry summary" value={artifact.re_entry_summary} />
            <Field label="last session summary" value={artifact.last_session_summary} />
            <Field label="notes" value={artifact.notes} />
            <Field label="last touched" value={artifact.last_touched} />
            <Field label="repo" value={artifact.repo_path} />
            <Field label="folder" value={artifact.folder_path} />
            <Field label="source" value={artifact.source_url} />
            <div className="info-hint kicker">press i or esc to close</div>
          </aside>
        </>
      )}
    </>
  );
}
