'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl">🍳💥</div>
      <h1 className="mt-4 text-2xl font-bold">Something didn’t plate right</h1>
      <p className="mt-2 text-ink/60">A little kitchen mishap. Give it another go.</p>
      <button onClick={reset} className="btn-primary mt-6">Try again</button>
    </main>
  );
}
