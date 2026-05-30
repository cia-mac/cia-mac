import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { requireAdmin } from '@/lib/auth';
import { listDropsWithStats, countPendingMembers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const [drops, pending] = await Promise.all([listDropsWithStats(), countPendingMembers()]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">The Kitchen</h1>
            <p className="text-sm text-ink/60">Post drops, see orders, run the list.</p>
          </div>
          <Link href="/admin/drops/new" className="btn-primary">+ New drop</Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/members" className="card flex items-center justify-between p-4 hover:shadow-md">
            <div>
              <p className="font-semibold">Members</p>
              <p className="text-sm text-ink/60">Approve who gets in.</p>
            </div>
            {pending > 0 && (
              <span className="rounded-full bg-tomato px-2.5 py-1 text-xs font-bold text-white">
                {pending} pending
              </span>
            )}
          </Link>
          <Link href="/feedback" className="card flex items-center justify-between p-4 hover:shadow-md">
            <div>
              <p className="font-semibold">Feedback</p>
              <p className="text-sm text-ink/60">See what the crew thinks.</p>
            </div>
            <span className="text-2xl">💬</span>
          </Link>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold tracking-tight">Drops</h2>
        {drops.length === 0 ? (
          <div className="card p-8 text-center text-ink/60">
            <p>No drops yet. <Link href="/admin/drops/new" className="font-semibold text-tomato">Post your first one →</Link></p>
          </div>
        ) : (
          <ul className="space-y-3">
            {drops.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/drops/${d.id}`} className="card flex items-center gap-4 p-3 hover:shadow-md">
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-olive/10 text-2xl">🍱</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{d.title}</p>
                      <span className={'chip ' + (d.status === 'open' ? '' : 'bg-ink/10 text-ink/50')}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-sm text-ink/60">
                      {d.order_count} order{d.order_count === 1 ? '' : 's'} · {d.total_meals} meal{d.total_meals === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-ink/30">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
