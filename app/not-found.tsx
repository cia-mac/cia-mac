import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

export default function NotFound() {
  return (
    <>
      <Wordmark />
      <main className="grid-shell">
        <div className="empty portal-pulse-soft">
          Artifact not found.<br />
          <Link href="/" style={{ borderBottom: '1px solid currentColor' }}>← back to grid</Link>
        </div>
      </main>
    </>
  );
}
