import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import GradientBg from '@/components/GradientBg';
import Footer from '@/components/Footer';
import SettingsForm from '@/components/settings/SettingsForm';
import PlanPanel from '@/components/settings/PlanPanel';
import { createClient } from '@/lib/supabase/server';
import { fromRow } from '@/lib/preferences';
import { readUserSettings } from '@/lib/settings';
import { readSubscription } from '@/lib/subscription';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Follow-up reminders, default templates and notifications.',
  robots: { index: false, follow: false },
};

/** Preferences are per-session, so this page can never be statically served. */
export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/settings');

  // Independent reads, so they should not queue behind each other.
  const [row, account, query] = await Promise.all([
    readUserSettings(supabase, user.id),
    readSubscription(supabase, user.id),
    searchParams,
  ]);

  return (
    <div className="min-h-screen">
      <GradientBg position="bottom-left" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Settings</p>
          <h1 className="display-lg mt-4">
            How Verse behaves for you<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
Saved to your account, not this browser. They follow you to whichever device you
            job hunt from at 2am.
          </p>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-faint)' }}>
            Signed in as {user.email}
          </p>
        </div>
      </section>

      <PlanPanel account={account} justPaid={query.checkout === 'success'} />

      <SettingsForm initial={fromRow(row)} />

      <Footer />
    </div>
  );
}
