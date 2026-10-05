import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AnalyticsView from '@/components/analytics/AnalyticsView';
import { createClient } from '@/lib/supabase/server';
import { buildInsights, readApplicationRows } from '@/lib/insights';

export const metadata: Metadata = {
  title: 'Insights',
  description: 'Reply rates, interview rates and where your applications actually land.',
  robots: { index: false, follow: false },
};

/** One person's private numbers — never statically served, never cached. */
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/analytics');

  const { rows, ready } = await readApplicationRows(supabase, user.id);

  return <AnalyticsView data={buildInsights(rows)} ready={ready} />;
}
