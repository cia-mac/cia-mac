'use server';

import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';

export type ActionState = { error?: string; ok?: string } | null;

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password) return { error: 'Please fill in every field.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email doesn’t look right.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.rows.length > 0) return { error: 'An account with that email already exists.' };

  const hashed = await hashPassword(password);
  await sql`
    INSERT INTO users (name, email, password, role, status)
    VALUES (${name}, ${email}, ${hashed}, 'member', 'pending')
  `;

  redirect('/pending');
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { error: 'Enter your email and password.' };

  const { rows } = await sql`
    SELECT id, password, status FROM users WHERE email = ${email} LIMIT 1
  `;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: 'Wrong email or password.' };
  }

  await createSession(user.id);

  if (user.status === 'approved') redirect('/');
  redirect('/pending');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
