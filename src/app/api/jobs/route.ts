import { NextResponse } from 'next/server';
import { fetchJobsPage, type JobSort } from '@/lib/jobs';
import { JOB_BOARD_SOURCES } from '@/lib/jobs-meta';
import { createClient } from '@/lib/supabase/server';
import { hasPaidAccess, readSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

const SORTS = new Set<JobSort>(['newest', 'oldest', 'paid']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';
  const sourceRaw = url.searchParams.get('source') ?? 'all';
  const sortRaw = (url.searchParams.get('sort') ?? 'newest') as JobSort;
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '24', 10);

  const source =
    sourceRaw === 'all' || (JOB_BOARD_SOURCES as readonly string[]).includes(sourceRaw)
      ? sourceRaw
      : 'all';
  const sort = SORTS.has(sortRaw) ? sortRaw : 'newest';

  // Pro accounts see listings the moment they are scraped; everyone else gets
  // them after the 24-hour early-access window. Auth failures degrade to the
  // free view rather than an error — the board must never go down over this.
  let earlyAccess = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const account = await readSubscription(supabase, user.id);
      earlyAccess = Boolean(account && hasPaidAccess(account));
    }
  } catch {
    earlyAccess = false;
  }

  try {
    const result = await fetchJobsPage({
      q: q.slice(0, 120),
      source,
      sort,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 24,
      earlyAccess,
    });
    return NextResponse.json(
      { ...result, earlyAccess },
      {
        headers: {
          // Pro responses contain early listings and must never be shared.
          'Cache-Control': earlyAccess
            ? 'private, no-store'
            : 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not load jobs.' }, { status: 500 });
  }
}
