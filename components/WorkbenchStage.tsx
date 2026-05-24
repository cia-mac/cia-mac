import type { Artifact } from '@/lib/types';
import fs from 'node:fs/promises';

async function readMarkdownPreview(p: string): Promise<string | null> {
  try { return await fs.readFile(p, 'utf8'); } catch { return null; }
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
  if (artifact.preview_image && artifact.kind === 'image') {
    return <img className="workbench-image" src={artifact.preview_image} alt={artifact.title} />;
  }
  if (artifact.kind === 'markdown' && artifact.source_path) {
    const text = await readMarkdownPreview(artifact.source_path);
    if (text) return <pre className="workbench-md">{text.slice(0, 4000)}</pre>;
  }
  if (artifact.notes) {
    return <pre className="workbench-md">{artifact.notes}</pre>;
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
