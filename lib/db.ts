import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

function connectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error(
      'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) — these are injected automatically when you connect a Neon/Postgres store in Vercel.'
    );
  }
  return url;
}

// Lazily create the client so importing this module never throws at build time.
let _client: NeonQueryFunction<false, false> | null = null;
function client(): NeonQueryFunction<false, false> {
  if (!_client) _client = neon(connectionString());
  return _client;
}

/**
 * Tagged-template query helper that mirrors the `{ rows }` shape the rest of the
 * app expects:  const { rows } = await sql`SELECT ...`
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<{ rows: any[] }> {
  const rows = (await client()(strings, ...values)) as any[];
  return { rows };
}

/**
 * Creates every table the portal needs. Safe to run repeatedly (idempotent).
 * Invoked from /api/setup.
 */
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'member',   -- 'admin' | 'member'
      status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS drops (
      id              SERIAL PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      image_url       TEXT,
      delivery_date   DATE,
      window_start    TEXT,    -- free text, e.g. "12:30 PM"
      window_end      TEXT,    -- free text, e.g. "1:30 PM"
      status          TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // An option group belongs to a drop, e.g. "Protein" or "Egg".
  await sql`
    CREATE TABLE IF NOT EXISTS option_groups (
      id          SERIAL PRIMARY KEY,
      drop_id     INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      required    BOOLEAN NOT NULL DEFAULT true,
      multi       BOOLEAN NOT NULL DEFAULT false,  -- false = pick one, true = pick many (e.g. "hold the onion")
      sort        INTEGER NOT NULL DEFAULT 0
    );
  `;

  // A choice within a group, e.g. "Chicken", "Shrimp", "No onion".
  await sql`
    CREATE TABLE IF NOT EXISTS options (
      id          SERIAL PRIMARY KEY,
      group_id    INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      sort        INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id                SERIAL PRIMARY KEY,
      drop_id           INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quantity          INTEGER NOT NULL DEFAULT 1,
      special_requests  TEXT NOT NULL DEFAULT '',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // The specific options chosen for an order.
  await sql`
    CREATE TABLE IF NOT EXISTS order_selections (
      id          SERIAL PRIMARY KEY,
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      option_id   INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      drop_id     INTEGER REFERENCES drops(id) ON DELETE SET NULL,
      rating      INTEGER,   -- 1..5, optional
      comment     TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}
