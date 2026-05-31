import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import AuthForm from '@/components/AuthForm';
import { adminExists } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  // Once the kitchen owner exists, first-run setup is closed.
  if (await adminExists()) redirect('/login');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="card p-6 sm:p-8">
          <div className="text-4xl">🍳</div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Set up your kitchen</h1>
          <p className="mt-1 mb-6 text-sm text-ink/60">
            Welcome to Starving Artist. Create your owner account — this is the admin
            that posts food drops and approves who gets in. (You can do this once.)
          </p>
          <AuthForm mode="welcome" />
        </div>
      </main>
    </>
  );
}
