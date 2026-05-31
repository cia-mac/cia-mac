import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import { requireAdmin } from '@/lib/auth';
import { getDrop, getOrdersForDrop, getDropTally } from '@/lib/queries';
import { setDropStatusAction, deleteDropAction } from '@/app/actions/drops';

export const dynamic = 'force-dynamic';

export default async function AdminDropPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const { id } = await params;
  const dropId = Number(id);
  if (!Number.isFinite(dropId)) notFound();

  const drop = await getDrop(dropId);
  if (!drop) notFound();

  const [orders, tally] = await Promise.all([getOrdersForDrop(dropId), getDropTally(dropId)]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-ink/50 hover:text-ink">← Back to kitchen</Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{drop.title}</h1>
            <p className="text-sm text-ink/60">
              {tally.orderCount} order{tally.orderCount === 1 ? '' : 's'} ·{' '}
              <span className="font-semibold text-ink">{tally.totalMeals}</span> meal{tally.totalMeals === 1 ? '' : 's'} to make
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/drops/${drop.id}/edit`} className="btn-ghost px-3 py-1.5 text-xs">Edit / swap photo</Link>
            <Link href={`/drops/${drop.id}`} className="btn-ghost px-3 py-1.5 text-xs">View as crew</Link>
            <form action={setDropStatusAction}>
              <input type="hidden" name="drop_id" value={drop.id} />
              <input type="hidden" name="status" value={drop.status === 'open' ? 'closed' : 'open'} />
              <button className="btn-dark px-3 py-1.5 text-xs">
                {drop.status === 'open' ? 'Close ordering' : 'Reopen'}
              </button>
            </form>
          </div>
        </div>

        {/* Tally — the whole point: how many of each to make */}
        <div className="card mt-5 p-5">
          <h2 className="font-bold tracking-tight">Shopping / cook list</h2>
          {tally.byOption.length === 0 ? (
            <p className="mt-2 text-sm text-ink/50">No options ordered yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {Object.entries(
                tally.byOption.reduce<Record<string, { option: string; qty: number }[]>>((acc, row) => {
                  (acc[row.group] ||= []).push({ option: row.option, qty: row.qty });
                  return acc;
                }, {})
              ).map(([group, items]) => (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{group}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {items.map((it) => (
                      <span key={it.option} className="rounded-full bg-olive/10 px-3 py-1 text-sm font-medium text-olive">
                        {it.option} <span className="font-bold">×{it.qty}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-order detail incl. special requests */}
        <h2 className="mb-3 mt-8 text-lg font-bold tracking-tight">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-ink/50">No orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{o.user_name}</span>
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">×{o.quantity}</span>
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {o.options.length > 0 ? o.options.join(', ') : 'plain'}
                </p>
                {o.special_requests && (
                  <p className="mt-1 rounded-lg bg-tomato/5 px-2 py-1 text-sm text-tomato">⚠ {o.special_requests}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Danger zone */}
        <form action={deleteDropAction} className="mt-10 border-t border-ink/10 pt-5">
          <input type="hidden" name="drop_id" value={drop.id} />
          <button className="text-sm text-ink/40 hover:text-tomato">Delete this drop</button>
        </form>
      </main>
    </>
  );
}
