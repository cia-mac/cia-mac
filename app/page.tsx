import { discoverArtifacts } from '@/lib/artifacts';
import { Tile } from '@/components/Tile';
import { Wordmark } from '@/components/Wordmark';
import { PORTAL_ROOTS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const artifacts = await discoverArtifacts();
  const visible = artifacts.filter((a) => a.preview_image || a.preview_url || (a.kind === 'markdown' && a.notes));
  const hidden = artifacts.length - visible.length;

  return (
    <>
      <Wordmark />
      <main className="grid-shell">
        <div className="grid-meta">
          <div className="kicker">workbench</div>
          <div className="grid-meta-count">
            {visible.length} artifact{visible.length === 1 ? '' : 's'}
            {hidden > 0 && ` · ${hidden} hidden (no preview yet)`}
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
      </main>
    </>
  );
}
