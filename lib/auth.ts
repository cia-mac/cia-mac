import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { sql } from './db';

const scryptAsync = promisify(scrypt);

const COOKIE = 'sa_session';

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

// ---- Passwords (scrypt, no native deps) -----------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return keyBuffer.length === derived.length && timingSafeEqual(keyBuffer, derived);
}

// ---- Sessions (signed JWT cookie) -----------------------------------------

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
};

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the logged-in user (fresh from DB) or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.uid as number;
    const { rows } = await sql`
      SELECT id, email, name, role, status FROM users WHERE id = ${uid} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rows[0] as SessionUser;
  } catch {
    return null;
  }
}

/** Throws-via-redirect helpers are done in pages; these are simple guards. */
export async function requireApproved(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') return null;
  return user;
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin' || user.status !== 'approved') return null;
  return user;
}
