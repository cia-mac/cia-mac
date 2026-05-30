import { NextResponse } from 'next/server';
import { sql, initSchema } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * One-time (idempotent) setup endpoint.
 *
 *   GET /api/setup?secret=YOUR_SETUP_SECRET
 *
 * - Creates all tables (safe to re-run).
 * - Creates/ensures the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Required env: SETUP_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD. Optional: ADMIN_NAME.
 */
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initSchema();
  } catch (e: any) {
    return NextResponse.json({ error: 'Schema init failed', detail: String(e?.message || e) }, { status: 500 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || 'Ciamac';

  let adminMessage = 'No ADMIN_EMAIL/ADMIN_PASSWORD set — skipped admin creation.';
  if (adminEmail && adminPassword) {
    const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1`;
    if (existing.rows.length === 0) {
      const hashed = await hashPassword(adminPassword);
      await sql`
        INSERT INTO users (name, email, password, role, status)
        VALUES (${adminName}, ${adminEmail}, ${hashed}, 'admin', 'approved')
      `;
      adminMessage = `Admin account created for ${adminEmail}.`;
    } else {
      // Make sure the configured account is always a usable admin.
      await sql`UPDATE users SET role = 'admin', status = 'approved' WHERE email = ${adminEmail}`;
      adminMessage = `Admin account already existed for ${adminEmail} — ensured admin + approved.`;
    }
  }

  return NextResponse.json({ ok: true, schema: 'ready', admin: adminMessage });
}
