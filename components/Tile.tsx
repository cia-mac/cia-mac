import Link from 'next/link';
import type { Artifact } from '@/lib/types';

const LOCAL_IFRAME_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function isLocalUrl(u: string): boolean {
  try { return LOCAL_IFRAME_HOSTS.has(new URL(u).hostname); } catch { return false; }
}

function previewNode(a: Artifact) {
  if (a.preview_image) {
    return <img className="tile-preview" src={a.preview_image} alt="" />;
  }
  if (a.preview_url && isLocalUrl(a.preview_url)) {
    return (
      <iframe
        className="tile-preview-iframe"
        src={a.preview_url}
        loading="lazy"
        sandbox="allow-same-origin allow-scripts"
        title=""
      />
    );
  }
  const isTextShaped = a.kind === 'markdown' || a.kind === 'study' || a.kind === 'session';
  if (isTextShaped && a.notes) {
    return <div className="tile-md">{a.notes.slice(0, 320)}</div>;
  }
  return null;
}

export function Tile({ artifact }: { artifact: Artifact }) {
  const node = previewNode(artifact);
  if (!node) return null;

  return (
    <Link href={`/workbench/${artifact.id}`} className="tile">
      {node}
      <div className="tile-overlay">
        <div>
          <div className="tile-arc">
            <span className={`stage-dot stage-${artifact.stage}`} />
            {artifact.arc} · {artifact.kind} · {artifact.stage}
          </div>
          <div className="tile-title">{artifact.title}</div>
        </div>
      </div>
    </Link>
  );
}
