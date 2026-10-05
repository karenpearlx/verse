import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

/**
 * Served by the service worker when a navigation fails and we have nothing
 * cached for that URL. Intentionally standalone: no Nav, no Footer, no data
 * fetching, nothing that could itself need the network.
 */
export default function Offline() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="eyebrow">No connection</p>
        <h1 className="display-md mt-4">
          You&rsquo;re offline<span className="dot">.</span>
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Pages you&rsquo;ve already opened still work. Fresh job listings need a connection, so
          they&rsquo;ll be waiting when you&rsquo;re back.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/tracker" className="btn btn-primary">
            Open my tracker
          </Link>
          <Link href="/" className="btn btn-ghost">
            Try again
          </Link>
        </div>
      </div>
    </main>
  );
}
