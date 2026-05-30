'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({
  children,
  className = 'btn-primary w-full',
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingText || 'Working…' : children}
    </button>
  );
}
