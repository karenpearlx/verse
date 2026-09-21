import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Lessons from "@/components/Lessons";
import Quiz from "@/components/Quiz";
import CourseProgress from "@/components/CourseProgress";
import CourseDone from "@/components/CourseDone";
import Download from "@/components/Download";
import UpgradeGate from "@/components/UpgradeGate";
import { BASIC_COURSES, OPEN_COURSES, courseBySlug, courseLength } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";
import { hasPaidAccess, readSubscription } from "@/lib/subscription";
import { getDeepCourse } from "@/lib/deep-courses";
import { COURSES_INDEX } from "@/lib/deep-courses/index-meta";
import {
  courseUnlockCookieName,
  hasCourseUnlockCookie,
  isValidCourseUnlockAccess,
} from "@/lib/course-unlock";
import DeepCourseView from "./DeepCourseView";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string; unlock?: string }>;
};

/**
 * Premium lesson bodies must not reach a free browser, so the whole page is
 * rendered per request against the session. That rules out static params.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deep = await getDeepCourse(slug);
  if (deep) {
    const card = COURSES_INDEX.cards.find((c) => c.slug === slug);
    return {
      title: `${deep.title} — Verse`,
      description: card?.blurb,
    };
  }
  const course = courseBySlug(slug);
  if (!course) return { title: "Course not found — Verse" };
  return {
    title: `${course.title} — Verse`,
    description: course.blurb,
  };
}

/** Section heading used by everything below the lessons. */
function Head({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[1.75rem]">
        {title}
      </h2>
      {note && (
        <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {note}
        </p>
      )}
    </div>
  );
}

export default async function CoursePage({ params, searchParams }: Params) {
  const { slug } = await params;
  const query = await searchParams;

  // Marketplace secret link: /courses/seo-specialist?access=SECRET → set cookie, open forever.
  if (query.access && isValidCourseUnlockAccess(slug, query.access)) {
    redirect(`/api/course-unlock?slug=${encodeURIComponent(slug)}&access=${encodeURIComponent(query.access)}`);
  }

  const deep = await getDeepCourse(slug);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const account = user ? await readSubscription(supabase, user.id) : null;
  const pro = Boolean(account && hasPaidAccess(account));
  const jar = await cookies();
  const unlocked = hasCourseUnlockCookie(slug, jar.get(courseUnlockCookieName(slug))?.value);
  const paid = pro || unlocked;

  // The written tracks are the main course library. Everything below is the
  // older niche-track renderer, kept so those slugs still resolve.
  if (deep) return <DeepCourseView course={deep} paid={paid} />;

  const course = courseBySlug(slug);
  if (!course) notFound();
  const locked = Boolean(course.premium) && !paid;

  const soon = course.status === "soon";
  // Suggest something they can actually open.
  const others = (locked ? BASIC_COURSES : OPEN_COURSES).filter((c) => c.slug !== course.slug);
  const lessons = course.lessons ?? [];
  const project = course.practiceProject;
  const templates = course.templates ?? [];
  const walkthroughs = course.walkthroughs ?? [];
  const posts = course.clientLooksFor ?? [];

  return (
    <div className="min-h-screen">
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/courses"
            className="tap inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            <span aria-hidden>←</span> All courses
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span
              className="font-display rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em]"
              style={{ background: course.tint, color: course.fg }}
            >
              {course.tag}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
              style={
                soon
                  ? { background: "var(--color-paper-2)", color: "var(--color-muted)" }
                  : course.premium
                    ? { background: "var(--color-ink)", color: "#5fd0bf" }
                    : { background: "var(--color-accent)", color: "#fff" }
              }
            >
              {soon ? "Coming soon" : course.premium ? (paid ? "Premium · unlocked" : "Premium") : "Basic · free"}
            </span>
            {!soon && !locked && <CourseDone slug={course.slug} lessonCount={lessons.length} />}
          </div>

          <h1 className="display-lg mt-5">
            {course.title}
            <span className="dot">.</span>
          </h1>
          <p className="lede mt-5">{course.blurb}</p>

          <p className="mt-6 text-sm" style={{ color: "var(--color-faint)" }}>
            {course.author} · {courseLength(course)}
            {course.quiz ? ` · ${course.quiz.length}-question check` : ""}
            {templates.length ? ` · ${templates.length} templates` : ""}
          </p>
        </div>
      </section>

      {locked ? (
        <section className="px-5 pt-12 md:px-8 md:pt-16">
          <div className="mx-auto max-w-3xl">
            <div className="card p-7 md:p-9">
              <h2 className="font-display text-xl font-extrabold tracking-tight">What is inside</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                {soon
                  ? "This track is still being written. Here is the lesson plan it ships with."
                  : `${lessons.length} lessons, written and finished. Here is every one of them, so you know exactly what you are paying for.`}
              </p>

              <ol className="mt-7 space-y-4">
                {(soon ? course.outline ?? [] : lessons.map((l) => l.title)).map((title, i) => (
                  <li key={title} className="flex gap-4">
                    <span
                      className="font-display mt-px w-6 flex-none text-sm font-extrabold tabular-nums"
                      style={{ color: "var(--color-faint)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                      {title}
                    </span>
                  </li>
                ))}
              </ol>

              {(templates.length > 0 || project || walkthroughs.length > 0 || posts.length > 0) && (
                <p
                  className="mt-8 border-t pt-6 text-[0.9375rem] leading-relaxed"
                  style={{ borderColor: "var(--color-line)", color: "var(--color-muted)" }}
                >
                  Also included:{" "}
                  {[
                    walkthroughs.length ? `${walkthroughs.length} tool walkthroughs` : null,
                    templates.length ? `${templates.length} editable templates` : null,
                    project ? "a practice project you can show a client" : null,
                    posts.length ? `${posts.length} real listings pulled apart` : null,
                    course.quiz?.length ? `a ${course.quiz.length}-question check` : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  .
                </p>
              )}
            </div>

            <div className="mt-6">
              <UpgradeGate
                eyebrow="Premium track"
                title="Open this one with Pro"
                description="Every premium track, unlimited cover letters and resume exports, AI interview prep, the follow-up writer, and new jobs a day before free accounts."
                bullets={[
                  `All ${lessons.length || course.outline?.length || 0} lessons in this track`,
                  "Editable templates you can send to a client",
                  "Every other premium niche track",
                  "Unlimited letters and exports",
                ]}
                signedIn={Boolean(user)}
                next={`/courses/${course.slug}`}
              />
            </div>
          </div>
        </section>
      ) : soon ? (
        <section className="px-5 pt-12 md:px-8 md:pt-16">
          <div className="mx-auto max-w-3xl">
            <div className="card p-7 md:p-9">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                This one isn&rsquo;t written yet
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                We&rsquo;d rather show you the real lesson plan than fake a preview. Here is what the
                track covers when it ships.
              </p>

              <ol className="mt-7 space-y-4">
                {(course.outline ?? []).map((l, i) => (
                  <li key={l} className="flex gap-4">
                    <span
                      className="font-display mt-px w-6 flex-none text-sm font-extrabold tabular-nums"
                      style={{ color: "var(--color-faint)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                      {l}
                    </span>
                  </li>
                ))}
              </ol>

              <div
                className="mt-8 flex flex-wrap gap-3 border-t pt-7"
                style={{ borderColor: "var(--color-line)" }}
              >
                <Link href="/courses/complete-va-starter" className="btn btn-primary">
                  Read a course that is finished
                </Link>
                <Link href="/jobs" className="btn btn-ghost">
                  Browse jobs in this niche
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="px-5 pt-10 md:px-8 md:pt-12">
            <div className="mx-auto max-w-3xl">
              <CourseProgress slug={course.slug} lessonCount={lessons.length} />
            </div>
          </section>

          <section className="px-5 pt-6 md:px-8 md:pt-8">
            <div className="mx-auto max-w-3xl">
              <Lessons lessons={lessons} slug={course.slug} templates={templates} />
            </div>
          </section>

          {walkthroughs.length > 0 && (
            <section className="px-5 pt-20 md:px-8 md:pt-28">
              <div className="mx-auto max-w-3xl">
                <Head
                  eyebrow="Tool walkthrough"
                  title="Click by click, in the tool"
                  note="The setup steps clients assume you already know. Follow them in a free trial account before you claim the tool on an application."
                />

                <div className="mt-8 space-y-5">
                  {walkthroughs.map((w) => (
                    <div key={w.tool} className="card p-6 md:p-8">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-lg font-extrabold tracking-tight md:text-xl">
                          {w.tool}
                        </h3>
                        <p className="text-sm" style={{ color: "var(--color-faint)" }}>
                          {w.goal}
                        </p>
                      </div>

                      <ol className="steps mt-6 space-y-3.5">
                        {w.steps.map((s, i) => (
                          <li
                            key={i}
                            className="text-[0.9375rem] leading-relaxed"
                            style={{ color: "var(--color-ink-2)" }}
                          >
                            {s}
                          </li>
                        ))}
                      </ol>

                      {w.screenshot && (
                        <div
                          className="mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
                          style={{ background: "var(--color-paper-2)", color: "var(--color-faint)" }}
                        >
                          <span aria-hidden>▢</span>
                          Screenshot to come: {w.screenshot}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {templates.length > 0 && (
            <section className="px-5 pt-20 md:px-8 md:pt-28">
              <div className="mx-auto max-w-3xl">
                <Head
                  eyebrow="Downloads"
                  title="Take the files with you"
                  note="Editable, not locked PDFs. Put your own name in them and send them to a client today."
                />
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {templates.map((t) => (
                    <Download key={t.path} template={t} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {project && (
            <section className="px-5 pt-20 md:px-8 md:pt-28">
              <div className="mx-auto max-w-3xl">
                <Head
                  eyebrow="Practice project"
                  title={project.title}
                  note="Nobody marks this. Do it anyway — it is the thing you show when someone asks for proof."
                />

                <div className="card mt-8 p-7 md:p-9">
                  <p className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
                    {project.brief}
                  </p>

                  <ol className="steps mt-7 space-y-3.5">
                    {project.steps.map((s, i) => (
                      <li
                        key={i}
                        className="text-[0.9375rem] leading-relaxed"
                        style={{ color: "var(--color-ink-2)" }}
                      >
                        {s}
                      </li>
                    ))}
                  </ol>

                  {project.sampleData && (
                    <div className="mt-7 rounded-2xl p-5" style={{ background: "var(--color-paper-2)" }}>
                      <p
                        className="font-display text-xs font-extrabold uppercase tracking-[0.12em]"
                        style={{ color: "var(--color-muted)" }}
                      >
                        Sample data
                      </p>
                      <p
                        className="mt-2.5 text-[0.9375rem] leading-relaxed"
                        style={{ color: "var(--color-ink-2)" }}
                      >
                        {project.sampleData}
                      </p>
                    </div>
                  )}

                  {project.template && (
                    <div className="mt-7">
                      <Download template={project.template} compact />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="px-5 pt-20 md:px-8 md:pt-28">
              <div className="mx-auto max-w-3xl">
                <Head
                  eyebrow="What clients look for"
                  title="Real posts, read properly"
                  note="Anonymised listings from the board, with what each line is actually asking for underneath."
                />

                <div className="mt-8 space-y-5">
                  {posts.map((p) => (
                    <div key={p.title} className="card p-6 md:p-8">
                      <h3 className="font-display text-lg font-extrabold leading-snug tracking-tight md:text-xl">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: "var(--color-faint)" }}>
                        {p.source}
                      </p>

                      <ul
                        className="mt-5 space-y-2 rounded-2xl px-5 py-4"
                        style={{ background: "var(--color-paper-2)" }}
                      >
                        {p.post.map((line, i) => (
                          <li
                            key={i}
                            className="text-[0.9375rem] leading-relaxed italic"
                            style={{ color: "var(--color-ink-2)" }}
                          >
                            &ldquo;{line}&rdquo;
                          </li>
                        ))}
                      </ul>

                      <p
                        className="font-display mt-6 text-xs font-extrabold uppercase tracking-[0.12em]"
                        style={{ color: "var(--color-accent-deep)" }}
                      >
                        What that means
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {p.reads.map((line, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-[0.9375rem] leading-relaxed"
                            style={{ color: "var(--color-ink-2)" }}
                          >
                            <span aria-hidden style={{ color: "var(--color-accent)" }}>
                              →
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {course.quiz && course.quiz.length > 0 && (
            <section className="px-5 pt-20 md:px-8 md:pt-28">
              <div className="mx-auto max-w-3xl">
                <Quiz slug={course.slug} questions={course.quiz} />
              </div>
            </section>
          )}

          <section className="px-5 pt-16 md:px-8 md:pt-20">
            <div className="mx-auto max-w-3xl">
              <div
                className="rounded-[28px] px-7 py-11 md:px-12"
                style={{ background: "var(--color-ink)" }}
              >
                <h2 className="display-md" style={{ color: "#fff" }}>
                  Now go use it<span style={{ color: "#5fd0bf" }}>.</span>
                </h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed" style={{ color: "#a9a6a1" }}>
                  Reading is the easy half. Open the board, pick three listings that actually fit, and
                  write to them today.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/jobs" className="btn btn-primary">
                    Find a job
                  </Link>
                  <Link href="/cover-letter" className="btn btn-ghost">
                    Write the letter
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="px-5 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Keep going</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {others.map((c) => (
              <Link key={c.slug} href={`/courses/${c.slug}`} className="lift card p-6">
                <span
                  className="font-display text-xs font-extrabold uppercase tracking-[0.12em]"
                  style={{ color: c.fg }}
                >
                  {c.tag}
                </span>
                <span className="font-display mt-2 block text-lg font-extrabold leading-snug tracking-tight">
                  {c.title}
                </span>
                <span
                  className="mt-2 flex flex-wrap items-center gap-x-2 text-sm"
                  style={{ color: "var(--color-faint)" }}
                >
                  {courseLength(c)}
                  <CourseDone slug={c.slug} lessonCount={c.lessons?.length ?? 0} variant="line" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
