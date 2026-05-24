import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { findArtifact } from '@/lib/artifacts';
import { patchSidecar } from '@/lib/sidecar';
import { writeSession } from '@/lib/sessionWriter';
import { IS_MAC } from '@/lib/config';
import type { ActionRequest, ActionResult, Artifact } from '@/lib/types';

function openOnMac(target: string): void {
  spawn('open', [target], { detached: true, stdio: 'ignore' }).unref();
}

async function openFolder(a: Artifact): Promise<ActionResult> {
  const target = a.folder_path ?? a.repo_path;
  if (!target) return { ok: false, message: 'No folder_path or repo_path on sidecar.' };
  if (IS_MAC) {
    openOnMac(target);
    return { ok: true, message: `Opened ${target} in Finder.` };
  }
  return { ok: true, message: 'Not on macOS — copy this:', command: `open "${target}"` };
}

async function openPreview(a: Artifact): Promise<ActionResult> {
  const target = a.preview_url ?? a.source_url;
  if (!target) return { ok: false, message: 'No preview_url or source_url on sidecar.' };
  if (IS_MAC) {
    openOnMac(target);
    return { ok: true, message: `Opened ${target} in browser.` };
  }
  return { ok: true, message: 'Not on macOS — copy this:', command: `open "${target}"` };
}

export async function POST(req: Request): Promise<NextResponse<ActionResult>> {
  let body: ActionRequest;
  try {
    body = (await req.json()) as ActionRequest;
  } catch {
    return NextResponse.json({ ok: false, message: 'Bad JSON body.' }, { status: 400 });
  }

  const a = await findArtifact(body.artifact_id);
  if (!a) return NextResponse.json({ ok: false, message: 'Artifact not found.' }, { status: 404 });

  if (body.kind === 'open-folder') return NextResponse.json(await openFolder(a));
  if (body.kind === 'open-preview') return NextResponse.json(await openPreview(a));

  if (body.kind === 'resume' || body.kind === 'audit' || body.kind === 'exit' || body.kind === 'save') {
    const { filePath, when } = await writeSession(body.kind, a, body.body);
    let updated = a;
    if (body.kind === 'exit' || body.kind === 'save') {
      if (a.__sidecar_path) {
        const patched = await patchSidecar(a.__sidecar_path, {
          last_touched: when,
        });
        if (patched) updated = patched;
      }
    }
    if (IS_MAC) openOnMac(filePath);
    return NextResponse.json({
      ok: true,
      message: IS_MAC ? `Wrote ${filePath} and opened it.` : `Wrote ${filePath}.`,
      file_path: filePath,
      artifact: updated,
    });
  }

  return NextResponse.json({ ok: false, message: 'Unknown action kind.' }, { status: 400 });
}
