import Link from 'next/link';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';
import FollowUpWriter from '@/components/FollowUpWriter';
import UpgradeGate from '@/components/UpgradeGate';
import { createClient } from '@/lib/supabase/server';
import { hasPaidAccess, readSubscription } from '@/lib/subscription';

export const metadata = {
  title: 'Follow-Up Email Writer for Job Applications',
  description: 'Write the follow-up that gets answered instead of ignored. Included with Verse Pro.',
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

const NEXT = '/follow-up-email';

export default async function FollowUpEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(NEXT)}`);

  const account = await readSubscription(supabase, user.id);
  const paid = hasPaidAccess(account);
  const name = (user.user_metadata?.full_name as string | undefined)?.trim() ?? '';

  return (
    <div className="min-h-screen">
      <GradientBg position="bottom-right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Follow-up writer</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            The second email is the one that works<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Most VAs send one application and wait. The people who get hired send a short, specific follow-up about
            a week later. This writes that one, in your words, without the begging.
          </p>
        </div>
      </section>

      <section className="px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-6xl">
          {paid ? (
            <FollowUpWriter defaultName={name} />
          ) : (
            <UpgradeGate
              eyebrow="Pro tool"
              title="This one is part of Pro"
              description="The follow-up writer, unlimited cover letters and exports, every premium course, and AI interview prep with written feedback."
              bullets={[
                'Timing-aware drafts, not one canned template',
                'Copy straight into your email client',
                'Unlimited cover letters and resume exports',
                'AI interview prep with written feedback',
              ]}
              signedIn
              next={NEXT}
            />
          )}
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-md">
            Before you send it<span className="dot">.</span>
          </h2>
          <ol className="steps mt-8 space-y-3.5">
            <li className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              Log the application in the{' '}
              <Link href="/tracker" className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent-deep)' }}>
                tracker
              </Link>{' '}
              so the next follow-up date is not a guess.
            </li>
            <li className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              Reply inside the original thread. It carries your first message with it.
            </li>
            <li className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              Send it in their morning, not yours.
            </li>
            <li className="text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              If they answer and it turns into a call, run the questions in{' '}
              <Link href="/interview-prep" className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent-deep)' }}>
                interview prep
              </Link>{' '}
              first.
            </li>
          </ol>
        </div>
      </section>

      <Footer tagline="Ask once, clearly" />
    </div>
  );
}
