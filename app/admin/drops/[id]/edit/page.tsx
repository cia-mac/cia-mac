import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import DropEditor from '@/components/DropEditor';
import { requireAdmin } from '@/lib/auth';
import { getDrop } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditDropPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const { id } = await params;
  const dropId = Number(id);
  if (!Number.isFinite(dropId)) notFound();

  const drop = await getDrop(dropId);
  if (!drop) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/admin/drops/${drop.id}`} className="text-sm text-ink/50 hover:text-ink">← Back to drop</Link>
        <h1 className="mb-1 mt-3 text-2xl font-bold tracking-tight">Edit drop</h1>
        <p className="mb-6 text-sm text-ink/60">
          Update the details — or swap the photo to show the finished plate.
        </p>
        <div className="card p-5 sm:p-6">
          <DropEditor drop={drop} />
        </div>
        <p className="mt-4 text-xs text-ink/40">
          Note: this edits the drop’s details and photo. To change the options/choices, post a new drop.
        </p>
      </main>
    </>
  );
}
