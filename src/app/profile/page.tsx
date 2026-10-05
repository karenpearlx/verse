import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';
import ProfileForm from '@/components/profile/ProfileForm';
import AccountLinks from '@/components/profile/AccountLinks';
import { createClient } from '@/lib/supabase/server';
import { readProfile } from '@/lib/profile-store';
import { readSubscription } from '@/lib/subscription';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your VA profile: rates, specialities, portfolio links and availability.',
  robots: { index: false, follow: false },
};

/** One person's private row, so this can never be statically served. */
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/profile');

  // Independent reads, so they should not queue behind each other.
  const [{ profile, ready }, account] = await Promise.all([
    readProfile(supabase, user.id),
    readSubscription(supabase, user.id),
  ]);

  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Profile</p>
          <h1 className="display-lg mt-4">
            The version of you a client meets first<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Fill this in once and it stops being something you retype into every application. Rates,
            specialities, links, hours you actually overlap with.
          </p>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-faint)' }}>
            Signed in as {user.email}
          </p>
        </div>
      </section>

      <ProfileForm userId={user.id} authEmail={user.email ?? ''} initial={profile} ready={ready} />

      <AccountLinks account={account} />

      <Footer />
    </div>
  );
}
