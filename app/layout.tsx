import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Starving Artist',
  description: 'Home-cooked food drops for the Wonzimer crew. Invite only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
