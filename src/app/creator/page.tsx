import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import GradientBg from '@/components/GradientBg';

export const metadata: Metadata = {
  title: 'Teach on Verse — coming soon',
  description:
    'The Creator plan — host your own VA courses and keep 90% of sales — is not open yet. Here is what it will look like.',
};

// Applications are paused for now: the form (CreatorApplyForm) still exists in
// the codebase and comes straight back when there is time to run the program.
export default function CreatorApplyPage() {
  return (
    <div className="min-h-screen">
      <GradientBg position="right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Creator</p>
          <h1 className="display-lg mt-4">
            Teach what you already do<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Bring a skill Filipino VAs actually get hired for. We host the course and take payments; you keep the
            rights and 90% of sales.
          </p>
        </div>
      </section>

      <section className="px-5 pb-24 pt-10 md:px-8 md:pt-12">
        <div className="mx-auto max-w-2xl">
          <div className="card p-6 md:p-8">
            <p className="eyebrow" style={{ color: 'var(--color-accent-deep)' }}>
              Not open yet
            </p>
            <h2 className="font-display mt-2 text-xl font-extrabold tracking-tight">
              Applications open soon
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              We&rsquo;re getting the course hosting and payouts right before taking anyone&rsquo;s
              application. When it opens, the deal stays the same: we host the course and take
              payments, you keep the rights and 90% of sales. In the meantime, Pro has everything
              else.
            </p>
            <Link href="/pricing" className="btn btn-ghost mt-5">
              See the plans
            </Link>
          </div>
        </div>
      </section>

      <Footer tagline="Teach the skill. Keep the rights." />
    </div>
  );
}
