import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

function connectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error(
      'No database connection string found. Connect a Neon/Postgres store in Vercel — it injects DATABASE_URL automatically.'
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

/** Raw query — does NOT ensure the schema (used internally by initSchema). */
async function rawSql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<{ rows: any[] }> {
  const rows = (await client()(strings, ...values)) as any[];
  return { rows };
}

// The schema is created automatically on the first query of each cold start,
// so there's no manual "setup" step to run after deploying.
let schemaPromise: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) schemaPromise = initSchema();
  return schemaPromise;
}

/**
 * Tagged-template query helper that mirrors the `{ rows }` shape the app
 * expects, and self-initializes the schema:  const { rows } = await sql`...`
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<{ rows: any[] }> {
  await ensureSchema();
  return rawSql(strings, ...values);
}

/**
 * Creates every table the portal needs. Idempotent. Runs automatically via
 * ensureSchema(); never needs to be called by hand.
 */
async function initSchema() {
  // Tiny key/value table for app config (e.g. the auto-generated session secret).
  await rawSql`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;

  await rawSql`
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

  await rawSql`
    CREATE TABLE IF NOT EXISTS drops (
      id              SERIAL PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      image_url       TEXT,
      delivery_date   DATE,
      window_start    TEXT,
      window_end      TEXT,
      status          TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // An option group belongs to a drop, e.g. "Protein" or "Egg".
  await rawSql`
    CREATE TABLE IF NOT EXISTS option_groups (
      id          SERIAL PRIMARY KEY,
      drop_id     INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      required    BOOLEAN NOT NULL DEFAULT true,
      multi       BOOLEAN NOT NULL DEFAULT false,  -- false = pick one, true = pick many
      sort        INTEGER NOT NULL DEFAULT 0
    );
  `;

  // A choice within a group, e.g. "Chicken", "Shrimp", "No onion".
  await rawSql`
    CREATE TABLE IF NOT EXISTS options (
      id          SERIAL PRIMARY KEY,
      group_id    INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      sort        INTEGER NOT NULL DEFAULT 0
    );
  `;

  await rawSql`
    CREATE TABLE IF NOT EXISTS orders (
      id                SERIAL PRIMARY KEY,
      drop_id           INTEGER NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quantity          INTEGER NOT NULL DEFAULT 1,
      special_requests  TEXT NOT NULL DEFAULT '',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await rawSql`
    CREATE TABLE IF NOT EXISTS order_selections (
      id          SERIAL PRIMARY KEY,
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      option_id   INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE
    );
  `;

  await rawSql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      drop_id     INTEGER REFERENCES drops(id) ON DELETE SET NULL,
      rating      INTEGER,
      comment     TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // Knowledge Case: links (videos, goals, articles) the user throws in. We keep
  // the fetched title/description/body text plus an embedding so they can be
  // searched by meaning, not just by keyword. The embedding is stored as a JSON
  // array of floats (JSONB) so no pgvector extension is required; similarity is
  // computed in the app. Null embedding = saved before embeddings were enabled.
  await rawSql`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url         TEXT NOT NULL,
      kind        TEXT NOT NULL DEFAULT 'link',   -- 'video' | 'goal' | 'link'
      title       TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',        -- extracted body excerpt
      note        TEXT NOT NULL DEFAULT '',        -- user's own note
      embedding   JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

/** True once the first admin (kitchen owner) account exists. */
export async function adminExists(): Promise<boolean> {
  const { rows } = await sql`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`;
  return rows.length > 0;
}

/**
 * Seeds the example menu the first time an admin is created, so the portal
 * isn't empty: today's Chicken Pesto Sandwich (open) + Fried Rice and Pasta
 * (closed past drops). No-op if any drops already exist.
 */
export async function seedExampleDrops() {
  const existing = await sql`SELECT 1 FROM drops LIMIT 1`;
  if (existing.rows.length > 0) return;

  const today = new Date().toISOString().slice(0, 10);

  const seedDrops = [
    {
      title: 'Chicken Pesto Sandwich',
      description:
        'Toasted baguette, basil pesto, melty cheese, sliced chicken & salami, green onion, cherry tomato and a drizzle of olive oil + lime.',
      status: 'open',
      delivery_date: today,
      window_start: '12:30 PM',
      window_end: '1:30 PM',
      groups: [
        { name: 'Meat', required: false, multi: true, options: ['Chicken', 'Salami'] },
        { name: 'Cheese', required: true, multi: false, options: ['With cheese', 'No cheese'] },
        { name: 'Extras', required: false, multi: true, options: ['Green onion', 'Cherry tomato', 'Avocado', 'Extra pesto'] },
      ],
    },
    {
      title: 'Fried Rice',
      description: 'Wok-tossed fried rice in the little takeout boxes.',
      status: 'closed',
      delivery_date: null,
      window_start: null,
      window_end: null,
      groups: [
        { name: 'Protein', required: true, multi: false, options: ['Chicken', 'Shrimp', 'Mix'] },
        { name: 'Egg', required: true, multi: false, options: ['With egg', 'No egg'] },
      ],
    },
    {
      title: 'Pasta with Chicken',
      description: 'Fresh pasta with chicken — pick your sauce.',
      status: 'closed',
      delivery_date: null,
      window_start: null,
      window_end: null,
      groups: [{ name: 'Sauce', required: true, multi: false, options: ['Bolognese', 'Pesto', 'Butter & Parmesan'] }],
    },
  ];

  for (const d of seedDrops) {
    const dropRes = await sql`
      INSERT INTO drops (title, description, image_url, delivery_date, window_start, window_end, status)
      VALUES (${d.title}, ${d.description}, ${null}, ${d.delivery_date}, ${d.window_start}, ${d.window_end}, ${d.status})
      RETURNING id
    `;
    const dropId = dropRes.rows[0].id as number;
    for (let g = 0; g < d.groups.length; g++) {
      const group = d.groups[g];
      const groupRes = await sql`
        INSERT INTO option_groups (drop_id, name, required, multi, sort)
        VALUES (${dropId}, ${group.name}, ${group.required}, ${group.multi}, ${g})
        RETURNING id
      `;
      const groupId = groupRes.rows[0].id as number;
      for (let o = 0; o < group.options.length; o++) {
        await sql`INSERT INTO options (group_id, name, sort) VALUES (${groupId}, ${group.options[o]}, ${o})`;
      }
    }
  }
}
