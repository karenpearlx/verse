import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GradientBg from "@/components/GradientBg";
import { TOTAL_QUESTIONS } from "@/lib/interview";
import { createClient } from "@/lib/supabase/server";
import { hasPaidAccess, readSubscription } from "@/lib/subscription";
import DeepCourseIndex from "@/components/deep/DeepCourseIndex";

export const metadata = {
  title: "Courses — Verse",
  description:
    "Twenty-one written VA tracks with worked examples, exercises, rate benchmarks, videos and a glossary — free foundations plus premium tracks for every specialism on the job board.",
};

/** The lock state depends on the session, so this page is never cached. */
export const dynamic = "force-dynamic";

export default async function Courses() {
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

      <DeepCourseIndex paid={paid} />

      <section className="px-5 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="grid md:grid-cols-[1.15fr_1fr]">
                <div className="p-7 md:p-10">
                  <p className="eyebrow">Practice, not reading</p>
                  <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem]">
                    Interview prep<span className="dot">.</span>
                  </h2>
                  <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    {TOTAL_QUESTIONS} questions clients actually ask, sorted by niche. Answer out loud or in writing,
                    watch your own timing and filler words, and get the answer graded before someone who can hire you
                    hears it.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Link href="/interview-prep" className="btn btn-primary">
                      {paid ? "Start practising" : "See interview prep"}
                    </Link>
                    <span className="text-sm" style={{ color: "#6b6863" }}>
                      {paid ? "Included in your plan" : "Included with Pro"}
                    </span>
                  </div>
                </div>

                <div
                  className="flex flex-col justify-center gap-3 p-7 md:p-10"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  {[
                    "Tell me about yourself.",
                    "How do you handle multiple clients at once?",
                    "Describe your internet and backup setup.",
                  ].map((q) => (
                    <p
                      key={q}
                      className="rounded-2xl bg-white/80 px-4 py-3 text-[0.9375rem] font-medium leading-snug"
                      style={{ color: "var(--color-ink-2)" }}
                    >
                      {q}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pt-20 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] px-7 py-12 text-center md:px-14" style={{ background: "var(--color-ink)" }}>
            <h2 className="display-md" style={{ color: "#fff" }}>
              Taught a VA skill before
              <span style={{ color: "#5fd0bf" }}>?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed" style={{ color: "#a9a6a1" }}>
              We&rsquo;re looking for Filipino VAs to teach what they know. You keep the rights and 90% of the
              sales, we handle the hosting.
            </p>
            <Link href="/creator" className="btn btn-primary mt-8">
              Apply to become a Creator
            </Link>
          </div>
        </div>
      </section>

      <Footer tagline="Real skills. No fluff" />
    </div>
  );
}
