import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Lessons from "@/components/Lessons";
import GradientBg from "@/components/GradientBg";
import { TRACK_ONE } from "@/lib/courses";

export const metadata = {
  title: "Before You Apply — Free VA Starter Track",
  description:
    "The four lessons to do before you send a single application: the work, the niche, the setup, the desk.",
};

const MINUTES = TRACK_ONE.reduce((n, l) => n + l.minutes, 0);

export default function LearnStart() {
  return (
    <div className="min-h-screen">
      <GradientBg position="bottom" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/learn"
            className="tap inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            <span aria-hidden>←</span> All tracks
          </Link>

          <p className="eyebrow mt-6">Track 01</p>
          <h1 className="display-lg mt-4">
            Before you apply<span className="dot">.</span>
          </h1>
          <p className="lede mt-5">
            Four lessons, {MINUTES} minutes. Do these before you send anything, because the decisions
            here are what your rate is built on.
          </p>
        </div>
      </section>

      <section className="px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-3xl">
          {/* Same progress bucket as the starter course: these are its first four lessons. */}
          <Lessons lessons={TRACK_ONE} slug="complete-va-starter" />
        </div>
      </section>

      <section className="px-5 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="card flex flex-col gap-5 p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div>
              <p className="eyebrow">Next</p>
              <h2 className="font-display mt-2 text-xl font-extrabold tracking-tight">
                The Complete VA Starter
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                These four lessons open that course. It carries on through time zones, contracts, BIR
                registration, and your first thirty days.
              </p>
            </div>
            <Link href="/courses/complete-va-starter" className="btn btn-primary shrink-0">
              Keep reading
            </Link>
          </div>
        </div>
      </section>

      <Footer tagline="Start from zero, get hired anyway" />
    </div>
  );
}
