import Link from 'next/link';
import type { Artifact } from '@/lib/types';
import { ARC_HUE, KIND_GLYPH, hashId, relativeTime } from '@/lib/visual';

const LOCAL_IFRAME_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function isLocalUrl(u: string): boolean {
  try { return LOCAL_IFRAME_HOSTS.has(new URL(u).hostname); } catch { return false; }
}

type Shape = 'image' | 'iframe' | 'text';

function shapeOf(a: Artifact): Shape | null {
  if (a.preview_image) return 'image';
  if (a.preview_url && isLocalUrl(a.preview_url)) return 'iframe';
  if ((a.kind === 'markdown' || a.kind === 'study' || a.kind === 'session' || a.kind === 'writing') && a.notes) return 'text';
  return null;
}

function Body({ artifact, shape }: { artifact: Artifact; shape: Shape }) {
  if (shape === 'image') {
    return <img className="tile-img" src={artifact.preview_image} alt="" />;
  }
  if (shape === 'iframe') {
    const host = (() => { try { return new URL(artifact.preview_url!).host; } catch { return artifact.preview_url; } })();
    const h = hashId(artifact.id);
    const hue = ARC_HUE[artifact.arc] ?? 210;
    const tiltX = 30 + (h % 40);
    const tiltY = 30 + ((h >> 4) % 40);
    const bg = {
      backgroundImage: `radial-gradient(at ${tiltX}% ${tiltY}%, hsla(${hue},45%,55%,0.32), transparent 60%)`,
    };
    return (
      <div className="tile-iframe-wrap" style={bg}>
        <div className="tile-iframe-fallback">
          <span className="tile-iframe-host">{host}</span>
          <span className="tile-iframe-hint">live preview when running</span>
        </div>
        <iframe
          className="tile-iframe"
          src={artifact.preview_url}
          loading="lazy"
          sandbox="allow-same-origin allow-scripts"
          title=""
        />
      </div>
    );
  }
  const h = hashId(artifact.id);
  const hue = ARC_HUE[artifact.arc] ?? 210;
  const tiltX = 30 + (h % 40);
  const tiltY = 30 + ((h >> 4) % 40);
  const bg = {
    backgroundImage: `radial-gradient(at ${tiltX}% ${tiltY}%, hsla(${hue},45%,60%,0.10), transparent 60%)`,
  };
  return (
    <div className="tile-text" style={bg}>
      <p>{artifact.notes?.slice(0, 240)}{artifact.notes && artifact.notes.length > 240 ? '…' : ''}</p>
    </div>
  );
}

export function Tile({ artifact }: { artifact: Artifact }) {
  const shape = shapeOf(artifact);
  if (!shape) return null;
  const hue = ARC_HUE[artifact.arc] ?? 210;

  return (
    <Link href={`/workbench/${artifact.id}`} className={`tile tile-${shape}`}>
      <div className="tile-head">
        <span className="tile-arc-badge" style={{ color: `hsl(${hue}, 55%, 70%)` }}>
          {artifact.arc}
        </span>
        <span className="tile-kind-glyph" aria-hidden>{KIND_GLYPH[artifact.kind] ?? '·'}</span>
      </div>

      <Body artifact={artifact} shape={shape} />

      <div className="tile-foot">
        <div className="tile-title">{artifact.title}</div>
        <div className="tile-meta">
          <span className="tile-meta-left">
            <span className={`stage-dot stage-${artifact.stage}`} />
            <span className="tile-meta-text">{artifact.kind} · {artifact.stage}</span>
          </span>
          {relativeTime(artifact.last_touched) && (
            <span className="tile-meta-when">{relativeTime(artifact.last_touched)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
