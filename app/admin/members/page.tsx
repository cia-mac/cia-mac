import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { requireAdmin } from '@/lib/auth';
import { listMembers } from '@/lib/queries';
import { setUserStatusAction, setUserRoleAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-olive/15 text-olive',
  rejected: 'bg-ink/10 text-ink/50',
};

export default async function MembersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const members = await listMembers();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-ink/50 hover:text-ink">← Back to kitchen</Link>
        <h1 className="mb-1 mt-3 text-2xl font-bold tracking-tight">Members</h1>
        <p className="mb-6 text-sm text-ink/60">You handpick everyone. Approve the people you want feeding.</p>

        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{m.name}</p>
                    {m.role === 'admin' && <span className="chip bg-tomato/10 text-tomato">admin</span>}
                    <span className={'chip ' + (statusStyles[m.status] || '')}>{m.status}</span>
                  </div>
                  <p className="truncate text-sm text-ink/50">{m.email}</p>
                </div>

                {m.id === admin.id ? (
                  <span className="text-xs text-ink/40">that’s you</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {m.status !== 'approved' && (
                      <form action={setUserStatusAction}>
                        <input type="hidden" name="user_id" value={m.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="btn-primary px-3 py-1.5 text-xs">Approve</button>
                      </form>
                    )}
                    {m.status !== 'rejected' && (
                      <form action={setUserStatusAction}>
                        <input type="hidden" name="user_id" value={m.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="btn-ghost px-3 py-1.5 text-xs">Reject</button>
                      </form>
                    )}
                    {m.status === 'approved' && (
                      <form action={setUserRoleAction}>
                        <input type="hidden" name="user_id" value={m.id} />
                        <input type="hidden" name="role" value={m.role === 'admin' ? 'member' : 'admin'} />
                        <button className="btn-ghost px-3 py-1.5 text-xs">
                          {m.role === 'admin' ? 'Make member' : 'Make admin'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
