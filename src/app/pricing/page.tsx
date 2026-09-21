import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';
import PlanCards from '@/components/pricing/PlanCards';
import { FREE_COVER_LETTER_LIMIT, FREE_RESUME_LIMIT } from '@/lib/subscription';
import { PRO_ACCESS_DAYS, PRO_PRICE_PESOS } from '@/lib/plans';

export const metadata = {
  title: 'Pricing — Verse',
  description: `Free plan for the board, tracker and rate check. Pro is ₱${PRO_PRICE_PESOS} for 30 days, prepaid — unlimited letters, exports and premium courses.`,
};

const FAQ = [
  {
    q: 'Does Pro renew automatically?',
    a: `No. One payment buys ${PRO_ACCESS_DAYS} days. When it runs out your account drops back to Free and everything you have written stays where it is. Pay again whenever you are applying properly.`,
  },
  {
    q: 'What happens to my letters and exports if I stop paying?',
    a: 'Nothing is deleted. You keep your tracker, your saved jobs and every letter you already wrote. The free counters just start applying again to new ones.',
  },
  {
    q: `Why ${FREE_COVER_LETTER_LIMIT} letters and ${FREE_RESUME_LIMIT} exports?`,
    a: 'It is enough to run a real application round and decide whether Verse is worth paying for. It is not a trial that ends on a date, so an account you opened last year still has its allowance today.',
  },
  {
    q: 'Do the AI features need anything extra?',
    a: 'The AI-written letters and interview feedback run on your own OpenAI or Anthropic API key, pasted once in the tool settings. It stays in your browser and is only relayed to your provider when you generate — Verse never stores it. The template letter writer, and everything else in Pro, needs no key at all.',
  },
  {
    q: 'Can I get paid to teach here?',
    a: 'That is the Creator plan. If you already run a skill for clients, apply and we will talk. You keep 90% of what your course earns.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Pricing</p>
          <h1 className="display-lg mt-4 max-w-3xl">
            Free until it is worth paying for<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            The board, the tracker and the rate calculator never cost anything. Pro is for the month you are
            applying hard enough to hit a counter.
          </p>
        </div>
      </section>

      <section className="px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-5xl">
          <PlanCards />
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-md">
            The awkward questions<span className="dot">.</span>
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="panel p-6">
                <h3 className="font-display text-lg font-extrabold leading-snug tracking-tight">{item.q}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm" style={{ color: 'var(--color-faint)' }}>
            Already paid?{' '}
            <Link
              href="/settings"
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-accent-deep)' }}
            >
              Your plan lives in Settings
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer tagline="Pay for the month you are hunting" />
    </div>
  );
}
