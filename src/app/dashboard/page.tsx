import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import DashboardView from '@/components/dashboard/DashboardView';
import { createClient } from '@/lib/supabase/server';
import { readProfile } from '@/lib/profile-store';
import { readApplications, suggestJobs } from '@/lib/dashboard';
import type { Profile } from '@/lib/profile';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your applications, profile, courses and matching jobs in one place.',
  robots: { index: false, follow: false },
};

/** One person's private page — never statically served, never cached. */
export const dynamic = 'force-dynamic';

function firstName(profile: Profile, email: string): string {
  const named = profile.fullName.trim().split(/\s+/)[0];
  if (named) return named;
  const local = email.split('@')[0] ?? '';
  const guess = local.split(/[._-]/)[0] ?? '';
  return guess ? guess.charAt(0).toUpperCase() + guess.slice(1) : 'there';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/dashboard');

  // One round trip's worth of waiting instead of two.
  const [{ profile, ready: profileReady }, { apps, ready: appsReady }] = await Promise.all([
    readProfile(supabase, user.id),
    readApplications(supabase, user.id),
  ]);
  // Needs the niches, so it cannot join the pair above.
  const jobs = await suggestJobs(supabase, profile.niches);

  const metaAvatar = user.user_metadata?.avatar_url;
  const avatar =
    profile.avatarUrl ??
    (typeof metaAvatar === 'string' && metaAvatar.startsWith('https://') ? metaAvatar : null);

  return (
    <DashboardView
      name={firstName(profile, user.email ?? '')}
      profile={profile}
      profileReady={profileReady}
      apps={apps}
      appsReady={appsReady}
      jobs={jobs}
      avatar={avatar}
    />
  );
}
