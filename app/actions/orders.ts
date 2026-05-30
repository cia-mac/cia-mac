'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function placeOrderAction(formData: FormData) {
  const user = await requireApproved();
  if (!user) redirect('/login');

  const dropId = Number(formData.get('drop_id'));
  if (!dropId) throw new Error('Missing drop.');

  // Make sure the drop is still open.
  const dropRes = await sql`SELECT status FROM drops WHERE id = ${dropId} LIMIT 1`;
  if (dropRes.rows.length === 0) throw new Error('That drop no longer exists.');
  if (dropRes.rows[0].status !== 'open') throw new Error('Ordering for this drop is closed.');

  const quantity = Math.max(1, Math.min(50, Number(formData.get('quantity') || 1)));
  const specialRequests = String(formData.get('special_requests') || '').trim();

  // The option ids the member picked.
  const selectedOptionIds = new Set(
    formData
      .getAll('option')
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  // Pull every option for this drop so we can validate ownership + required groups
  // in plain JS (no array-binding gymnastics).
  const optionRows = (
    await sql`
      SELECT o.id AS option_id, g.id AS group_id, g.required AS required
      FROM options o
      JOIN option_groups g ON g.id = o.group_id
      WHERE g.drop_id = ${dropId}
    `
  ).rows as { option_id: number; group_id: number; required: boolean }[];

  const validIds = optionRows
    .filter((r) => selectedOptionIds.has(r.option_id))
    .map((r) => r.option_id);

  // Every required group must have at least one of its options selected.
  const requiredGroups = new Map<number, boolean>(); // group_id -> satisfied
  for (const r of optionRows) {
    if (r.required && !requiredGroups.has(r.group_id)) requiredGroups.set(r.group_id, false);
    if (r.required && validIds.includes(r.option_id)) requiredGroups.set(r.group_id, true);
  }
  for (const satisfied of requiredGroups.values()) {
    if (!satisfied) throw new Error('Please make a selection for every required option.');
  }

  const orderRes = await sql`
    INSERT INTO orders (drop_id, user_id, quantity, special_requests)
    VALUES (${dropId}, ${user.id}, ${quantity}, ${specialRequests})
    RETURNING id
  `;
  const orderId = orderRes.rows[0].id as number;

  for (const optionId of validIds) {
    await sql`INSERT INTO order_selections (order_id, option_id) VALUES (${orderId}, ${optionId})`;
  }

  revalidatePath(`/drops/${dropId}`);
  revalidatePath(`/admin/drops/${dropId}`);
  redirect(`/drops/${dropId}?ordered=1`);
}

export async function cancelOrderAction(formData: FormData) {
  const user = await requireApproved();
  if (!user) redirect('/login');

  const orderId = Number(formData.get('order_id'));
  const dropId = Number(formData.get('drop_id'));
  if (!orderId) return;

  // Only let a member delete their own order.
  await sql`DELETE FROM orders WHERE id = ${orderId} AND user_id = ${user.id}`;
  revalidatePath(`/drops/${dropId}`);
  revalidatePath(`/admin/drops/${dropId}`);
}
