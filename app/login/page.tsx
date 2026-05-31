import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import AuthForm from '@/components/AuthForm';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.status === 'approved') redirect('/');
  if (user) redirect('/pending');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-ink/60">Log in to see what’s cooking.</p>
          <AuthForm mode="login" />
        </div>
      </main>
    </>
  );
}
