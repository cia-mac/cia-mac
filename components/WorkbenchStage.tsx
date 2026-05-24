import type { Artifact } from '@/lib/types';
import { ARC_HUE, KIND_GLYPH, hashId, relativeTime } from '@/lib/visual';
import fs from 'node:fs/promises';

async function readSource(p: string): Promise<string | null> {
  try { return await fs.readFile(p, 'utf8'); } catch { return null; }
}

function TextHero({ artifact, body }: { artifact: Artifact; body: string }) {
  const hue = ARC_HUE[artifact.arc] ?? 210;
  const h = hashId(artifact.id);
  const tiltX = 20 + (h % 60);
  const tiltY = 12 + ((h >> 4) % 30);
  const bg = {
    backgroundImage: `radial-gradient(at ${tiltX}% ${tiltY}%, hsla(${hue},55%,55%,0.10), transparent 55%)`,
  };
  return (
    <article className="stage-text" style={bg}>
      <header className="stage-head">
        <div className="stage-arc" style={{ color: `hsl(${hue}, 55%, 70%)` }}>
          {artifact.arc}
        </div>
        <div className="stage-glyph" aria-hidden>{KIND_GLYPH[artifact.kind] ?? '·'}</div>
      </header>

      <h1 className="stage-title">{artifact.title}</h1>

      <div className="stage-meta">
        <span className={`stage-dot stage-${artifact.stage}`} />
        <span>{artifact.kind} · stage {artifact.stage}</span>
        {relativeTime(artifact.last_touched) && <span className="stage-sep">·</span>}
        {relativeTime(artifact.last_touched) && <span>last touched {relativeTime(artifact.last_touched)}</span>}
      </div>

      {artifact.next_action && (
        <aside className="stage-next" style={{ borderLeftColor: `hsl(${hue}, 55%, 65%)` }}>
          <div className="kicker">next action</div>
          <div className="stage-next-body">{artifact.next_action}</div>
        </aside>
      )}

      <div className="stage-body">
        {body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}

export async function WorkbenchStage({ artifact }: { artifact: Artifact }) {
  if (artifact.preview_url && (artifact.kind === 'page' || artifact.kind === 'app')) {
    return (
      <iframe
        className="workbench-frame"
        src={artifact.preview_url}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        title={artifact.title}
      />
    );
  }
  if (artifact.preview_image && (artifact.kind === 'image' || artifact.kind === 'page')) {
    return (
      <div className="workbench-image-wrap">
        <img className="workbench-image" src={artifact.preview_image} alt={artifact.title} />
        <div className="workbench-image-caption">
          <div className="stage-title">{artifact.title}</div>
          <div className="stage-meta">
            <span className={`stage-dot stage-${artifact.stage}`} />
            <span>{artifact.arc} · {artifact.kind} · stage {artifact.stage}</span>
          </div>
        </div>
      </div>
    );
  }
  if (artifact.kind === 'markdown' && artifact.source_path) {
    const text = await readSource(artifact.source_path);
    if (text) return <TextHero artifact={artifact} body={text.slice(0, 8000)} />;
  }
  if (artifact.notes) {
    return <TextHero artifact={artifact} body={artifact.notes} />;
  }
  return (
    <div className="workbench-fallback">
      Nothing embeddable on this artifact.<br />
      {artifact.preview_url || artifact.source_url
        ? <>Use <strong>Open Preview</strong> to view it in the browser, or press <strong>i</strong> for context.</>
        : <>Add <code>preview_url</code>, <code>preview_image</code>, or <code>source_path</code> to its <code>.portal.json</code>.</>}
    </div>
  );
}
