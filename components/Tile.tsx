import Link from 'next/link';
import type { Artifact } from '@/lib/types';

function previewNode(a: Artifact) {
  if (a.preview_image) {
    return <img className="tile-preview" src={a.preview_image} alt="" />;
  }
  if (a.preview_url) {
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
  if (a.kind === 'markdown' && a.notes) {
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
            <span className="stage-dot" />
            {artifact.arc} · {artifact.kind} · {artifact.stage}
          </div>
          <div className="tile-title">{artifact.title}</div>
        </div>
      </div>
    </Link>
  );
}
