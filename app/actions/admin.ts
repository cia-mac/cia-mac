'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notifyMemberApproved } from '@/lib/email';

export async function setUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const userId = Number(formData.get('user_id'));
  const status = String(formData.get('status') || '');
  if (!userId || !['approved', 'rejected', 'pending'].includes(status)) return;

  // Don't let an admin lock themselves out.
  if (userId === admin.id) return;

  // Read the prior state so we only welcome someone on the transition INTO approved.
  const before = await sql`SELECT name, email, status FROM users WHERE id = ${userId} LIMIT 1`;
  const prior = before.rows[0];

  await sql`UPDATE users SET status = ${status} WHERE id = ${userId}`;
  revalidatePath('/admin/members');

  if (status === 'approved' && prior && prior.status !== 'approved') {
    await notifyMemberApproved(prior.name as string, prior.email as string);
  }
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const userId = Number(formData.get('user_id'));
  const role = String(formData.get('role') || '');
  if (!userId || !['admin', 'member'].includes(role)) return;
  if (userId === admin.id) return;

  await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
  revalidatePath('/admin/members');
}
