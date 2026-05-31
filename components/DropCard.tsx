import Link from 'next/link';
import type { Drop } from '@/lib/queries';

function windowLabel(d: Drop) {
  const parts: string[] = [];
  if (d.delivery_date) {
    parts.push(
      new Date(d.delivery_date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    );
  }
  if (d.window_start || d.window_end) {
    parts.push([d.window_start, d.window_end].filter(Boolean).join('–'));
  }
  return parts.join(' · ');
}

export default function DropCard({ drop, href }: { drop: Drop; href: string }) {
  const label = windowLabel(drop);
  return (
    <Link href={href} className="card group block overflow-hidden transition hover:shadow-md">
      {drop.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={drop.image_url} alt={drop.title} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-olive/10 text-5xl">🍱</div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold tracking-tight">{drop.title}</h3>
          {drop.status === 'closed' ? (
            <span className="chip bg-ink/10 text-ink/50">Closed</span>
          ) : (
            <span className="chip">Open</span>
          )}
        </div>
        {drop.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">{drop.description}</p>
        )}
        {label && <p className="mt-2 text-xs font-medium text-ink/50">🚲 {label}</p>}
      </div>
    </Link>
  );
}
