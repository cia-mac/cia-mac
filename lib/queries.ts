import { sql } from './db';

export type Drop = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  delivery_date: string | null;
  window_start: string | null;
  window_end: string | null;
  status: 'open' | 'closed';
  created_at: string;
};

export type OptionGroup = {
  id: number;
  name: string;
  required: boolean;
  multi: boolean;
  options: { id: number; name: string }[];
};

export async function listDrops(): Promise<Drop[]> {
  const { rows } = await sql`SELECT * FROM drops ORDER BY created_at DESC`;
  return rows as Drop[];
}

export async function getDrop(id: number): Promise<Drop | null> {
  const { rows } = await sql`SELECT * FROM drops WHERE id = ${id} LIMIT 1`;
  return (rows[0] as Drop) || null;
}

export async function getDropOptionGroups(dropId: number): Promise<OptionGroup[]> {
  const { rows } = await sql`
    SELECT g.id AS group_id, g.name AS group_name, g.required, g.multi, g.sort AS group_sort,
           o.id AS option_id, o.name AS option_name, o.sort AS option_sort
    FROM option_groups g
    LEFT JOIN options o ON o.group_id = g.id
    WHERE g.drop_id = ${dropId}
    ORDER BY g.sort, o.sort
  `;

  const map = new Map<number, OptionGroup>();
  for (const r of rows as any[]) {
    if (!map.has(r.group_id)) {
      map.set(r.group_id, {
        id: r.group_id,
        name: r.group_name,
        required: r.required,
        multi: r.multi,
        options: [],
      });
    }
    if (r.option_id) {
      map.get(r.group_id)!.options.push({ id: r.option_id, name: r.option_name });
    }
  }
  return [...map.values()];
}

export type OrderRow = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  quantity: number;
  special_requests: string;
  created_at: string;
  options: string[];
};

export async function getOrdersForDrop(dropId: number): Promise<OrderRow[]> {
  const { rows } = await sql`
    SELECT ord.id, ord.user_id, u.name AS user_name, u.email AS user_email,
           ord.quantity, ord.special_requests, ord.created_at,
           COALESCE(
             ARRAY_AGG(opt.name ORDER BY g.sort, opt.sort)
               FILTER (WHERE opt.id IS NOT NULL),
             '{}'
           ) AS options
    FROM orders ord
    JOIN users u ON u.id = ord.user_id
    LEFT JOIN order_selections osel ON osel.order_id = ord.id
    LEFT JOIN options opt ON opt.id = osel.option_id
    LEFT JOIN option_groups g ON g.id = opt.group_id
    WHERE ord.drop_id = ${dropId}
    GROUP BY ord.id, u.name, u.email
    ORDER BY ord.created_at ASC
  `;
  return rows as OrderRow[];
}

export async function getMyOrders(dropId: number, userId: number): Promise<OrderRow[]> {
  const all = await getOrdersForDrop(dropId);
  return all.filter((o) => o.user_id === userId);
}

/** A per-option tally so the cook knows exactly how many of each to make. */
export async function getDropTally(dropId: number) {
  const totalRes = await sql`
    SELECT COALESCE(SUM(quantity), 0) AS total, COUNT(*) AS order_count
    FROM orders WHERE drop_id = ${dropId}
  `;

  const optionRes = await sql`
    SELECT g.name AS group_name, opt.name AS option_name, g.sort AS gsort, opt.sort AS osort,
           SUM(ord.quantity) AS qty
    FROM order_selections osel
    JOIN orders ord ON ord.id = osel.order_id
    JOIN options opt ON opt.id = osel.option_id
    JOIN option_groups g ON g.id = opt.group_id
    WHERE ord.drop_id = ${dropId}
    GROUP BY g.name, opt.name, g.sort, opt.sort
    ORDER BY g.sort, opt.sort
  `;

  return {
    totalMeals: Number(totalRes.rows[0].total),
    orderCount: Number(totalRes.rows[0].order_count),
    byOption: optionRes.rows.map((r: any) => ({
      group: r.group_name as string,
      option: r.option_name as string,
      qty: Number(r.qty),
    })),
  };
}

export type DropWithStats = Drop & { order_count: number; total_meals: number };

export async function listDropsWithStats(): Promise<DropWithStats[]> {
  const { rows } = await sql`
    SELECT d.*,
           COUNT(o.id)::int AS order_count,
           COALESCE(SUM(o.quantity), 0)::int AS total_meals
    FROM drops d
    LEFT JOIN orders o ON o.drop_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;
  return rows as DropWithStats[];
}

export async function countPendingMembers(): Promise<number> {
  const { rows } = await sql`SELECT COUNT(*)::int AS n FROM users WHERE status = 'pending'`;
  return rows[0].n as number;
}

export type FeedbackRow = {
  id: number;
  user_name: string;
  drop_title: string | null;
  rating: number | null;
  comment: string;
  created_at: string;
};

export async function listFeedback(): Promise<FeedbackRow[]> {
  const { rows } = await sql`
    SELECT f.id, u.name AS user_name, d.title AS drop_title, f.rating, f.comment, f.created_at
    FROM feedback f
    JOIN users u ON u.id = f.user_id
    LEFT JOIN drops d ON d.id = f.drop_id
    ORDER BY f.created_at DESC
    LIMIT 200
  `;
  return rows as FeedbackRow[];
}

export type MemberRow = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export async function listMembers(): Promise<MemberRow[]> {
  const { rows } = await sql`
    SELECT id, name, email, role, status, created_at
    FROM users
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC
  `;
  return rows as MemberRow[];
}
