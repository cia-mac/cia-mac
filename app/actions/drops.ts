'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { uploadImage } from '@/lib/blob';
import { notifyNewDrop } from '@/lib/email';

type IncomingGroup = {
  name: string;
  required: boolean;
  multi: boolean;
  options: string[];
};

export async function createDropAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const deliveryDate = String(formData.get('delivery_date') || '').trim() || null;
  const windowStart = String(formData.get('window_start') || '').trim() || null;
  const windowEnd = String(formData.get('window_end') || '').trim() || null;

  if (!title) throw new Error('A title is required.');

  let groups: IncomingGroup[] = [];
  try {
    groups = JSON.parse(String(formData.get('groups') || '[]'));
  } catch {
    groups = [];
  }

  const imageUrl = await uploadImage(formData.get('image') as File | null);

  const dropRes = await sql`
    INSERT INTO drops (title, description, image_url, delivery_date, window_start, window_end, status)
    VALUES (${title}, ${description}, ${imageUrl}, ${deliveryDate}, ${windowStart}, ${windowEnd}, 'open')
    RETURNING id
  `;
  const dropId = dropRes.rows[0].id as number;

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const gname = (group.name || '').trim();
    const cleanOptions = (group.options || []).map((o) => o.trim()).filter(Boolean);
    if (!gname || cleanOptions.length === 0) continue;

    const groupRes = await sql`
      INSERT INTO option_groups (drop_id, name, required, multi, sort)
      VALUES (${dropId}, ${gname}, ${!!group.required}, ${!!group.multi}, ${g})
      RETURNING id
    `;
    const groupId = groupRes.rows[0].id as number;

    for (let o = 0; o < cleanOptions.length; o++) {
      await sql`
        INSERT INTO options (group_id, name, sort)
        VALUES (${groupId}, ${cleanOptions[o]}, ${o})
      `;
    }
  }

  // Tell the crew a fresh drop is live. Safe no-op without a key.
  await notifyNewDrop(title, dropId);

  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin/drops/${dropId}`);
}

export async function updateDropAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const dropId = Number(formData.get('drop_id'));
  if (!dropId) throw new Error('Missing drop.');

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const deliveryDate = String(formData.get('delivery_date') || '').trim() || null;
  const windowStart = String(formData.get('window_start') || '').trim() || null;
  const windowEnd = String(formData.get('window_end') || '').trim() || null;
  if (!title) throw new Error('A title is required.');

  // Only replace the photo if a new one was actually uploaded.
  const newImageUrl = await uploadImage(formData.get('image') as File | null);

  if (newImageUrl) {
    await sql`
      UPDATE drops
      SET title = ${title}, description = ${description}, image_url = ${newImageUrl},
          delivery_date = ${deliveryDate}, window_start = ${windowStart}, window_end = ${windowEnd}
      WHERE id = ${dropId}
    `;
  } else {
    await sql`
      UPDATE drops
      SET title = ${title}, description = ${description},
          delivery_date = ${deliveryDate}, window_start = ${windowStart}, window_end = ${windowEnd}
      WHERE id = ${dropId}
    `;
  }

  revalidatePath('/');
  revalidatePath(`/drops/${dropId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/drops/${dropId}`);
  redirect(`/admin/drops/${dropId}`);
}

/**
 * Clones an existing drop — title, description, photo, and all option groups —
 * into a brand-new OPEN drop dated today. Lets you re-post your regulars
 * (fried rice, pasta, the sandwich) every other day in one tap.
 */
export async function repostDropAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const sourceId = Number(formData.get('drop_id'));
  if (!sourceId) redirect('/admin');

  const src = await sql`SELECT * FROM drops WHERE id = ${sourceId} LIMIT 1`;
  if (src.rows.length === 0) redirect('/admin');
  const d = src.rows[0];

  const today = new Date().toISOString().slice(0, 10);
  const newDrop = await sql`
    INSERT INTO drops (title, description, image_url, delivery_date, window_start, window_end, status)
    VALUES (${d.title}, ${d.description}, ${d.image_url}, ${today}, ${d.window_start}, ${d.window_end}, 'open')
    RETURNING id
  `;
  const newId = newDrop.rows[0].id as number;

  const groups = await sql`SELECT * FROM option_groups WHERE drop_id = ${sourceId} ORDER BY sort`;
  for (const g of groups.rows) {
    const ng = await sql`
      INSERT INTO option_groups (drop_id, name, required, multi, sort)
      VALUES (${newId}, ${g.name}, ${g.required}, ${g.multi}, ${g.sort})
      RETURNING id
    `;
    const opts = await sql`SELECT * FROM options WHERE group_id = ${g.id} ORDER BY sort`;
    for (const o of opts.rows) {
      await sql`INSERT INTO options (group_id, name, sort) VALUES (${ng.rows[0].id}, ${o.name}, ${o.sort})`;
    }
  }

  // A repost is "today's drop", so notify the crew here too.
  await notifyNewDrop(d.title as string, newId);

  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin/drops/${newId}`);
}

export async function setDropStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const dropId = Number(formData.get('drop_id'));
  const status = String(formData.get('status') || '');
  if (!dropId || !['open', 'closed'].includes(status)) return;

  await sql`UPDATE drops SET status = ${status} WHERE id = ${dropId}`;
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/admin/drops/${dropId}`);
}

export async function deleteDropAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const dropId = Number(formData.get('drop_id'));
  if (!dropId) return;

  await sql`DELETE FROM drops WHERE id = ${dropId}`;
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin');
}
