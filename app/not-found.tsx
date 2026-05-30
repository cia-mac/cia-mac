import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl">🥡</div>
      <h1 className="mt-4 text-2xl font-bold">Not on the menu</h1>
      <p className="mt-2 text-ink/60">That page doesn’t exist (or the drop was cleared).</p>
      <Link href="/" className="btn-primary mt-6">Back to the menu</Link>
    </main>
  );
}
