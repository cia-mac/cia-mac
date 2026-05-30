import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-ink/10 bg-cream/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🍳</span>
          <span>Starving Artist</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {user?.status === 'approved' && (
            <>
              <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-ink/5">Menu</Link>
              <Link href="/feedback" className="rounded-full px-3 py-1.5 hover:bg-ink/5">Feedback</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="rounded-full px-3 py-1.5 font-semibold text-tomato hover:bg-tomato/10">
                  Kitchen
                </Link>
              )}
              <form action={logoutAction}>
                <button className="rounded-full px-3 py-1.5 text-ink/60 hover:bg-ink/5">Sign out</button>
              </form>
            </>
          )}
          {!user && (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-ink/5">Log in</Link>
              <Link href="/signup" className="btn-dark px-4 py-1.5">Request access</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
