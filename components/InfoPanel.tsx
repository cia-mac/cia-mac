'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Artifact, EditableField } from '@/lib/types';
import type { SessionFile } from '@/lib/sessions';

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="info-field">
      <div className="kicker">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  );
}

function EditableFieldRow({
  label,
  field,
  value,
  artifactId,
  onSaved,
}: {
  label: string;
  field: EditableField;
  value: string | undefined;
  artifactId: string;
  onSaved: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'patch', artifact_id: artifactId, patch: { [field]: draft } }),
      });
      if (res.ok) {
        onSaved(draft);
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="info-field">
        <div className="kicker info-field-head">
          <span>{label}</span>
          <button className="info-edit" onClick={() => { setDraft(value ?? ''); setEditing(true); }}>
            {value ? 'edit' : 'add'}
          </button>
        </div>
        {value
          ? <div className="info-value">{value}</div>
          : <div className="info-value info-value-empty">—</div>}
      </div>
    );
  }
  return (
    <div className="info-field">
      <div className="kicker info-field-head">
        <span>{label}</span>
      </div>
      <textarea
        className="info-edit-area"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        autoFocus
      />
      <div className="info-edit-actions">
        <button className="info-edit" onClick={() => setEditing(false)} disabled={busy}>cancel</button>
        <button className="info-edit info-edit-save" onClick={save} disabled={busy}>
          {busy ? 'saving' : 'save'}
        </button>
      </div>
    </div>
  );
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return iso; }
}

const KIND_LABEL: Record<SessionFile['kind'], string> = {
  resume: 'resume',
  audit: 'audit',
  exit: 'exit',
  save: 'save',
};

export function InfoPanel({ artifact, sessions }: { artifact: Artifact; sessions: SessionFile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState({
    next_action: artifact.next_action,
    re_entry_summary: artifact.re_entry_summary,
    last_session_summary: artifact.last_session_summary,
    notes: artifact.notes,
  });
  const refreshAfterSave = (field: EditableField, v: string) => {
    setLocal((s) => ({ ...s, [field]: v }));
    router.refresh();
  };

  const openFile = async (filePath: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'open-file', artifact_id: artifact.id, file_path: filePath }),
      });
    } finally {
      setBusy(false);
    }
  };

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
            <EditableFieldRow label="next action" field="next_action"
              value={local.next_action} artifactId={artifact.id}
              onSaved={(v) => refreshAfterSave('next_action', v)} />
            <EditableFieldRow label="re-entry summary" field="re_entry_summary"
              value={local.re_entry_summary} artifactId={artifact.id}
              onSaved={(v) => refreshAfterSave('re_entry_summary', v)} />
            <EditableFieldRow label="last session summary" field="last_session_summary"
              value={local.last_session_summary} artifactId={artifact.id}
              onSaved={(v) => refreshAfterSave('last_session_summary', v)} />
            <EditableFieldRow label="notes" field="notes"
              value={local.notes} artifactId={artifact.id}
              onSaved={(v) => refreshAfterSave('notes', v)} />
            <Field label="last touched" value={artifact.last_touched} />
            <Field label="repo" value={artifact.repo_path} />
            <Field label="folder" value={artifact.folder_path} />
            <Field label="source" value={artifact.source_url} />

            {sessions.length > 0 && (
              <div className="info-field">
                <div className="kicker">prior sessions · {sessions.length}</div>
                <ul className="info-sessions">
                  {sessions.map((s) => (
                    <li key={s.filename}>
                      <button onClick={() => openFile(s.full_path)} disabled={busy}>
                        <span className={`session-kind session-${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                        <span className="session-when">{formatWhen(s.when_iso)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="info-hint kicker">press i or esc to close</div>
          </aside>
        </>
      )}
    </>
  );
}
