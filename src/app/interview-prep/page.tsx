import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import GradientBg from '@/components/GradientBg';
import InterviewPrep from '@/components/InterviewPrep';
import UpgradeGate from '@/components/UpgradeGate';
import { INTERVIEW_TYPES, ROLES, TOTAL_QUESTIONS } from '@/lib/interview';
import { createClient } from '@/lib/supabase/server';
import { hasPaidAccess, readSubscription } from '@/lib/subscription';

export const metadata = {
  title: 'Interview prep — Verse',
  description:
    'Practise real remote interview questions, out loud, and get written feedback on your answer. Included with Verse Pro.',
};

/** The tool is gated on the session, so this page can never be cached. */
export const dynamic = 'force-dynamic';

const NEXT = '/interview-prep';

const HABITS = [
  {
    n: '01',
    title: 'Answer out loud first',
    body: 'Reading a good answer does nothing. The gap is between knowing it and saying it without stumbling. Use the dictation button so the words you practise are the words you would actually say.',
  },
  {
    n: '02',
    title: 'Watch the clock, not the word count',
    body: 'Ninety seconds is the ceiling for almost every answer. Past that, the interviewer stops listening and starts waiting. The timer runs from the moment you start.',
  },
  {
    n: '03',
    title: 'Put one number in every answer',
    body: 'Twelve clients, four hours saved, a 40% drop in response time. A number is the only thing in your answer they cannot get from anyone else, and it is the part they repeat to their co-founder.',
  },
  {
    n: '04',
    title: 'Redo the ones that scored badly',
    body: 'One pass through fourteen questions is worth less than three passes through the four you fumbled. The rail at the bottom keeps your place.',
  },
];

export default async function InterviewPrepPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const account = user ? await readSubscription(supabase, user.id) : null;
  const paid = Boolean(account && hasPaidAccess(account));

  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Interview prep</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            Practise the answer before it costs you the job<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            {TOTAL_QUESTIONS} real questions across {ROLES.length} VA niches. Answer by typing or by speaking, and get
            written feedback on structure, specifics, and the bits you waffled through.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: '#6b6863' }}>
            <span
              className="rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em]"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              Pro
            </span>
            <span>{paid ? 'Included in your plan' : 'Included with Verse Pro'}</span>
            <span>Practice answers stay on your device; grading sends that answer to your AI provider</span>
          </div>
        </div>
      </section>

      {paid ? (
        <InterviewPrep />
      ) : (
        <section className="px-5 pt-12 md:px-8 md:pt-16">
          <div className="mx-auto max-w-5xl">
            <UpgradeGate
              eyebrow="Pro tool"
              title="Practice runs are part of Pro"
              description={`All ${TOTAL_QUESTIONS} questions across ${ROLES.length} niches, answered out loud or in writing, with written feedback on structure, specifics and filler.`}
              bullets={[
                'Speak your answer and see it transcribed',
                'A timer that shows when you have gone past ninety seconds',
                'Written feedback on every answer',
                'The follow-up email writer for after the call',
              ]}
              signedIn={Boolean(user)}
              next={NEXT}
            />
          </div>
        </section>
      )}

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="display-md">
            How to get something out of this<span className="dot">.</span>
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {HABITS.map((h, i) => (
              <Reveal key={h.n} delay={(i % 2) * 70}>
                <div className="panel h-full p-6">
                  <span className="font-display card-index text-sm font-extrabold" style={{ color: 'var(--color-accent)' }}>
                    {h.n}
                  </span>
                  <h3 className="font-display mt-2 text-lg font-extrabold leading-snug tracking-tight">{h.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed" style={{ color: '#6b6863' }}>
                    {h.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="display-md">
            What is in the bank<span className="dot">.</span>
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {INTERVIEW_TYPES.map((t, i) => (
              <Reveal key={t.id} delay={i * 70}>
                <div className="panel h-full p-6">
                  <h3 className="font-display text-lg font-extrabold tracking-tight">{t.label}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed" style={{ color: '#6b6863' }}>
                    {t.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] px-7 py-12 text-center md:px-14" style={{ background: 'var(--color-ink)' }}>
            <h2 className="display-md" style={{ color: '#fff' }}>
              Got the interview
              <span style={{ color: '#5fd0bf' }}>?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed" style={{ color: '#a9a6a1' }}>
              Log it in the tracker so the follow-up does not slip, then write the follow-up itself before you talk
              yourself out of sending one.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/tracker" className="btn btn-primary">
                Open the tracker
              </Link>
              <Link href="/follow-up-email" className="btn btn-ghost">
                Write the follow-up
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer tagline="Practise it once. Say it right" />
    </div>
  );
}
