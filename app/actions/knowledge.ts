'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireApproved } from '@/lib/auth';
import { embed } from '@/lib/embeddings';
import { inspectLink, normalizeUrl, type LinkKind } from '@/lib/link';

const KINDS: LinkKind[] = ['video', 'goal', 'link'];

/**
 * Throw a link into the Knowledge Case. We fetch the page for a title and some
 * text, build an embedding so it's searchable by meaning, and save it. The link
 * is always stored even if fetching or embedding fails.
 */
export async function addKnowledgeAction(formData: FormData) {
  const user = await requireApproved();
  if (!user) redirect('/login');

  const url = normalizeUrl(String(formData.get('url') || ''));
  if (!url || !/^https?:\/\/.+\..+/i.test(url)) {
    redirect('/knowledge?error=url');
  }

  const note = String(formData.get('note') || '').trim().slice(0, 2000);
  const requestedKind = String(formData.get('kind') || '').trim() as LinkKind;

  const meta = await inspectLink(url);
  // Respect an explicit kind choice; otherwise use what we detected (video/link).
  const kind: LinkKind = KINDS.includes(requestedKind) ? requestedKind : meta.kind;

  // Embed the richest text we have so search matches on meaning. Fold in the
  // user's note and the chosen kind so e.g. a "goal" is findable as one.
  const embedInput = [kind, meta.title, meta.description, note, meta.text]
    .filter(Boolean)
    .join('\n');
  const vector = await embed(embedInput);

  await sql`
    INSERT INTO knowledge_items (user_id, url, kind, title, description, content, note, embedding)
    VALUES (
      ${user.id}, ${url}, ${kind}, ${meta.title}, ${meta.description},
      ${meta.text}, ${note}, ${vector ? JSON.stringify(vector) : null}
    )
  `;

  revalidatePath('/knowledge');
  redirect('/knowledge?ok=1');
}

export async function deleteKnowledgeAction(formData: FormData) {
  const user = await requireApproved();
  if (!user) redirect('/login');

  const id = Number(formData.get('id'));
  if (!id) redirect('/knowledge');

  // Scope to the owner so members can only delete their own items.
  await sql`DELETE FROM knowledge_items WHERE id = ${id} AND user_id = ${user.id}`;

  revalidatePath('/knowledge');
  redirect('/knowledge');
}
