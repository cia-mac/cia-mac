import { discoverArtifacts } from '@/lib/artifacts';
import { Tile } from '@/components/Tile';
import { Wordmark } from '@/components/Wordmark';
import { PORTAL_ROOTS } from '@/lib/config';
import { ARC_HUE } from '@/lib/visual';
import type { Arc } from '@/lib/types';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const ARCS_ORDER: Arc[] = ['imaging', 'iranshahr', 'films', 'writing', 'system'];

export default async function Page() {
  const { artifacts, errors } = await discoverArtifacts();
  const isTextShaped = (k: string) => k === 'markdown' || k === 'study' || k === 'session' || k === 'writing';
  const isLocalUrl = (u?: string) => {
    if (!u) return false;
    try {
      const h = new URL(u).hostname;
      return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
    } catch { return false; }
  };
  const visible = artifacts.filter((a) =>
    a.preview_image
    || isLocalUrl(a.preview_url)
    || (isTextShaped(a.kind) && a.notes)
  );
  const hidden = artifacts.length - visible.length;

  const arcCounts: Record<string, number> = {};
  for (const a of visible) arcCounts[a.arc] = (arcCounts[a.arc] ?? 0) + 1;

  return (
    <>
      <Wordmark />
      <main className="grid-shell">
        <div className="grid-meta">
          <div className="kicker">workbench</div>
          <div className="grid-arc-strip">
            {ARCS_ORDER.filter((a) => arcCounts[a]).map((arc) => (
              <span key={arc} className="grid-arc-pip">
                <span className="grid-arc-dot" style={{ background: `hsl(${ARC_HUE[arc]},55%,65%)` }} />
                <span className="grid-arc-name">{arc}</span>
                <span className="grid-arc-count">{arcCounts[arc]}</span>
              </span>
            ))}
          </div>
          <div className="grid-meta-count">
            {visible.length} artifact{visible.length === 1 ? '' : 's'}
            {hidden > 0 && ` · ${hidden} hidden`}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            No artifacts with previews.<br />
            Drop a <code>.portal.json</code> sidecar into a directory under{' '}
            <code>{PORTAL_ROOTS.length ? PORTAL_ROOTS.join(', ') : '$PORTAL_ROOTS'}</code>,{' '}
            or add a fixture under <code>artifacts/fixtures/</code>.
          </div>
        ) : (
          <div className="tile-grid">
            {visible.map((a) => <Tile key={a.id} artifact={a} />)}
          </div>
        )}

        {errors.length > 0 && (
          <div className="validation-strip">
            <div className="kicker">sidecars with errors · {errors.length}</div>
            <ul>
              {errors.map((e) => (
                <li key={e.path}>
                  <code>{path.basename(e.path)}</code>
                  <ul>{e.errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
