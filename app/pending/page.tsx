import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.status === 'approved') redirect('/');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl">🧑‍🍳</div>
        {user.status === 'rejected' ? (
          <>
            <h1 className="mt-4 text-2xl font-bold">This one’s not on the menu</h1>
            <p className="mt-2 text-ink/60">
              Your access request wasn’t approved. If you think that’s a mistake, reach out to Ciamac directly.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold">You’re on the list</h1>
            <p className="mt-2 text-ink/60">
              Thanks, {user.name.split(' ')[0]}. Your request is in. Ciamac handpicks everyone, so hang tight —
              you’ll be able to order once you’re approved.
            </p>
          </>
        )}
        <form action={logoutAction} className="mt-8">
          <button className="btn-ghost">Sign out</button>
        </form>
      </main>
    </>
  );
}
