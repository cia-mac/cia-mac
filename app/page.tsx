import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Logo from '@/components/Logo';
import DropCard from '@/components/DropCard';
import { getCurrentUser } from '@/lib/auth';
import { adminExists } from '@/lib/db';
import { listDrops } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  // Brand-new deployment with no owner yet → first-run setup.
  if (!user && !(await adminExists())) redirect('/welcome');

  // Logged out → landing page.
  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-4">
          <section className="py-16 text-center sm:py-24">
            <Logo className="mx-auto h-20 w-20" />
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Starving Artist</h1>
            <p className="mt-2 text-lg font-semibold italic text-tomato">Feeding the artist.</p>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink/60">
              Home-cooked food drops for the Wonzimer crew. Every other day I make something good,
              post it here, and you tell me how many you want and how you want it.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/signup" className="btn-primary">Request access</Link>
              <Link href="/login" className="btn-ghost">Log in</Link>
            </div>
            <p className="mt-6 text-sm text-ink/40">Invite only · handpicked · no payment, just food.</p>
          </section>
        </main>
      </>
    );
  }

  if (user.status !== 'approved') {
    // Pending/rejected members get the holding page.
    redirect('/pending');
  }

  const drops = await listDrops();
  const open = drops.filter((d) => d.status === 'open');
  const past = drops.filter((d) => d.status === 'closed');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">On the menu</h1>
          <p className="text-sm text-ink/60">Hey {user!.name.split(' ')[0]} — here’s what’s cooking.</p>
        </div>

        {open.length === 0 ? (
          <div className="card p-10 text-center text-ink/60">
            <div className="text-4xl">🥢</div>
            <p className="mt-3">Nothing on the menu right now. Check back soon — a new drop is never far off.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {open.map((d) => (
              <DropCard key={d.id} drop={d} href={`/drops/${d.id}`} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-lg font-bold tracking-tight text-ink/70">Past drops</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {past.map((d) => (
                <DropCard key={d.id} drop={d} href={`/drops/${d.id}`} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
