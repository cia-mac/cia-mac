'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { uploadImage } from '@/lib/blob';

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

  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin/drops/${dropId}`);
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
