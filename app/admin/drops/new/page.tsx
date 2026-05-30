import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import DropBuilder from '@/components/DropBuilder';
import { requireAdmin } from '@/lib/auth';

export default async function NewDropPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/admin" className="text-sm text-ink/50 hover:text-ink">← Back to kitchen</Link>
        <h1 className="mb-1 mt-3 text-2xl font-bold tracking-tight">Post a drop</h1>
        <p className="mb-6 text-sm text-ink/60">Photo, options, delivery window. The crew takes it from there.</p>
        <div className="card p-5 sm:p-6">
          <DropBuilder />
        </div>
      </main>
    </>
  );
}
