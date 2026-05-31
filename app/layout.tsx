import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Starving Artist',
  description: 'Home-cooked food drops for the Wonzimer crew. Invite only.',
  appleWebApp: { capable: true, title: 'Starving Artist', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#e2553b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
