import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { sql } from './db';

const scryptAsync = promisify(scrypt);

const COOKIE = 'sa_session';

// The JWT signing secret. Prefers an explicit SESSION_SECRET env var, but if
// none is set it auto-generates one and stores it in the DB — so the app needs
// zero configuration to run. Cached per instance; stable across instances
// because it's read from the shared database.
let cachedKey: Uint8Array | null = null;
async function secretKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  if (process.env.SESSION_SECRET) {
    cachedKey = new TextEncoder().encode(process.env.SESSION_SECRET);
    return cachedKey;
  }

  // Insert a fresh secret only if one doesn't exist yet; ON CONFLICT makes this
  // race-safe across concurrent cold starts, so every instance ends up reading
  // the same stored value.
  const candidate = randomBytes(48).toString('hex');
  await sql`
    INSERT INTO config (key, value) VALUES ('session_secret', ${candidate})
    ON CONFLICT (key) DO NOTHING
  `;
  const { rows } = await sql`SELECT value FROM config WHERE key = 'session_secret' LIMIT 1`;
  cachedKey = new TextEncoder().encode(rows[0].value as string);
  return cachedKey;
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
    .sign(await secretKey());

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
    const { payload } = await jwtVerify(token, await secretKey());
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
