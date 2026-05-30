'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireApproved } from '@/lib/auth';

export async function submitFeedbackAction(formData: FormData) {
  const user = await requireApproved();
  if (!user) redirect('/login');

  const comment = String(formData.get('comment') || '').trim();
  const ratingRaw = Number(formData.get('rating') || 0);
  const rating = ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const dropIdRaw = Number(formData.get('drop_id') || 0);
  const dropId = dropIdRaw > 0 ? dropIdRaw : null;

  if (!comment && !rating) {
    redirect('/feedback?error=empty');
  }

  await sql`
    INSERT INTO feedback (user_id, drop_id, rating, comment)
    VALUES (${user.id}, ${dropId}, ${rating}, ${comment})
  `;

  revalidatePath('/feedback');
  revalidatePath('/admin');
  redirect('/feedback?ok=1');
}
