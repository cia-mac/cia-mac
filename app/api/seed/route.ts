import { NextResponse } from 'next/server';
import { sql, initSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

type SeedGroup = { name: string; required: boolean; multi: boolean; options: string[] };
type SeedDrop = {
  title: string;
  description: string;
  status: 'open' | 'closed';
  deliveryDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  groups: SeedGroup[];
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function insertDrop(d: SeedDrop) {
  const dropRes = await sql`
    INSERT INTO drops (title, description, image_url, delivery_date, window_start, window_end, status)
    VALUES (${d.title}, ${d.description}, ${null}, ${d.deliveryDate}, ${d.windowStart}, ${d.windowEnd}, ${d.status})
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
  return dropId;
}

/**
 * Seeds example drops so the portal isn't empty on first launch.
 *
 *   GET /api/seed?secret=YOUR_SETUP_SECRET
 *
 * Idempotent: only runs if there are no drops yet. Today's Chicken Pesto
 * Sandwich is left OPEN (taking orders); the fried rice + pasta are CLOSED
 * past drops. Upload the real photo to today's drop from
 * The Kitchen → the drop → "Edit / swap photo".
 */
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initSchema();

  const existing = await sql`SELECT COUNT(*)::int AS n FROM drops`;
  if ((existing.rows[0].n as number) > 0) {
    return NextResponse.json({ ok: true, seeded: false, message: 'Drops already exist — left untouched.' });
  }

  const drops: SeedDrop[] = [
    {
      title: 'Chicken Pesto Sandwich',
      description:
        'Toasted baguette, basil pesto, melty cheese, sliced chicken, avocado, cherry tomato and a squeeze of lime.',
      status: 'open',
      deliveryDate: todayISO(),
      windowStart: '12:30 PM',
      windowEnd: '1:30 PM',
      groups: [
        { name: 'Cheese', required: true, multi: false, options: ['With cheese', 'No cheese'] },
        { name: 'Extras', required: false, multi: true, options: ['Avocado', 'Cherry tomato', 'Green onion', 'Extra pesto'] },
      ],
    },
    {
      title: 'Fried Rice',
      description: 'Wok-tossed fried rice in the little takeout boxes.',
      status: 'closed',
      deliveryDate: null,
      windowStart: null,
      windowEnd: null,
      groups: [
        { name: 'Protein', required: true, multi: false, options: ['Chicken', 'Shrimp', 'Mix'] },
        { name: 'Egg', required: true, multi: false, options: ['With egg', 'No egg'] },
      ],
    },
    {
      title: 'Pasta with Chicken',
      description: 'Fresh pasta with chicken — pick your sauce.',
      status: 'closed',
      deliveryDate: null,
      windowStart: null,
      windowEnd: null,
      groups: [
        { name: 'Sauce', required: true, multi: false, options: ['Bolognese', 'Pesto', 'Butter & Parmesan'] },
      ],
    },
  ];

  const ids: number[] = [];
  for (const d of drops) ids.push(await insertDrop(d));

  return NextResponse.json({
    ok: true,
    seeded: true,
    created: ids.length,
    message:
      'Seeded today’s Chicken Pesto Sandwich (open) plus Fried Rice and Pasta (closed). Upload the photo via The Kitchen → the drop → Edit / swap photo.',
  });
}
