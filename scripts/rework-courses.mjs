/**
 * One-off rework of the generated deep-course files. Idempotent — safe to
 * re-run; it skips what it has already transformed.
 *
 * Does two jobs:
 *
 * 1. The three 2026-era "prose dialect" courses (bookkeeping-basics,
 *    video-editing, writing-for-clients) shipped with ~85% templated filler:
 *    8 identical "field note" sections, 14 identical "decision drill"
 *    sections and an identical closing per module, all word-for-word the same
 *    across every module of every course. This strips the filler, keeps the
 *    unique core (the job, the context, the worked example, the steps) and
 *    rebuilds it in the same styled markup the older courses use — including
 *    an interactive "Try it now" checklist the reader can tick. Module
 *    minutes are recomputed from what is actually left to read.
 *
 * 2. Every module of every course gets a generated two-question "quick check"
 *    quiz, built from the course's own module outcomes, stored on the module
 *    object and rendered by DeepCourseModules. Deterministic (seeded by
 *    slug + module number) so repeated runs produce identical files.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/lib/deep-courses';
const PROSE_SLUGS = new Set(['bookkeeping-basics', 'video-editing', 'writing-for-clients']);

/* ----------------------------- deterministic rng ------------------------- */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick(arr, rand, count) {
  return shuffle(arr, rand).slice(0, count);
}

/* ----------------------------- file round-trip --------------------------- */

function readCourse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const start = src.indexOf('{"slug"');
  const end = src.lastIndexOf('}') + 1;
  return JSON.parse(src.slice(start, end));
}

function writeCourse(file, course) {
  const body = JSON.stringify(course);
  fs.writeFileSync(
    file,
    `// Generated from the Verse deep-course source. Do not edit by hand.\n` +
      `import type { DeepCourse } from '../deep-course-types';\n\n` +
      `const course: DeepCourse = ${body};\n\nexport default course;\n`,
  );
}

/* ----------------------------- prose rebuild ----------------------------- */

const P = 'text-[0.9375rem] leading-relaxed text-ink-2';

function esc(s) {
  return s.trim();
}

/** Pull the unique authored core out of a prose-dialect module body. */
function parseProse(html) {
  const job = html.match(/<p><strong>The job:<\/strong>\s*([\s\S]*?)<\/p>/)?.[1];
  // Context paragraphs: the plain <p>…</p> between the job line and the first <h3>.
  const afterJob = html.split(/<p><strong>The job:<\/strong>[\s\S]*?<\/p>/)[1] ?? '';
  const beforeH3 = afterJob.split('<h3>')[0] ?? '';
  const context = [...beforeH3.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
  const ex = html.match(/<h3>Worked example — ([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/);
  const steps = [...(html.match(/<ol>([\s\S]*?)<\/ol>/)?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map(
    (m) => m[1].trim(),
  );
  return { job, context, example: ex ? { title: ex[1].trim(), body: ex[2].trim() } : null, steps };
}

function rebuildProse(html) {
  const { job, context, example, steps } = parseProse(html);
  if (!job) return null; // not the shape we expect; leave it alone

  const parts = [];

  parts.push(
    `<div class="rounded-xl border border-teal-pale bg-teal-wash/60 p-4 sm:p-5">` +
      `<p class="eyebrow mb-1.5 text-teal-deep">The job</p>` +
      `<p class="text-[0.9375rem] leading-relaxed text-ink">${esc(job)}</p></div>`,
  );

  for (const c of context) {
    parts.push(`<p class="${P}">${esc(c)}</p>`);
  }

  if (example) {
    parts.push(
      `<div class="rounded-xl border p-4 sm:p-5 border-line-2 bg-paper-2">` +
        `<p class="eyebrow mb-2.5 text-muted">Worked example — ${esc(example.title)}</p>` +
        `<p class="${P}">${esc(example.body)}</p></div>`,
    );
  }

  if (steps.length) {
    const items = steps
      .map(
        (s) =>
          `<li><label class="flex cursor-pointer items-start gap-3">` +
          `<input type="checkbox" data-check class="mt-1 h-4 w-4 shrink-0 rounded" style="accent-color: var(--color-accent)"/>` +
          `<span class="${P}">${esc(s)}</span></label></li>`,
      )
      .join('');
    parts.push(
      `<div class="rounded-xl border border-line-2 bg-card p-4 sm:p-5">` +
        `<p class="eyebrow mb-3 text-muted">Try it now — tick each step as you do it</p>` +
        `<ul class="space-y-2.5" data-checklist>${items}</ul></div>`,
    );
  }

  const rebuilt = parts.join('');
  // Honest reading time for what is actually there now, plus doing the steps.
  const words = rebuilt.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(5, Math.min(12, Math.round(words / 150) + (steps.length ? 4 : 0)));
  // The generated outcomes on these courses were templated junk ("Produce a
  // client-ready <title> workflow."). The job line is the real outcome.
  return { html: rebuilt, minutes, outcome: esc(job) };
}

/* ----------------------------- quiz generation --------------------------- */

const OUTCOME_PHRASINGS = [
  (t) => `You just finished “${t}”. What should you now be able to do?`,
  (t) => `A client asks what you got out of “${t}”. The honest answer is:`,
  (t) => `Which of these is the outcome “${t}” is building toward?`,
];

function buildModuleQuiz(course, mod, foreignPool) {
  const rand = rng(hash(`${course.slug}:${mod.n}`));
  const quiz = [];

  const siblings = course.modules.filter((m) => m.n !== mod.n && m.outcome);

  // Q1 — own outcome vs sibling outcomes.
  if (mod.outcome && siblings.length >= 3) {
    const distractors = pick(siblings, rand, 3).map((m) => m.outcome);
    const options = shuffle([mod.outcome, ...distractors], rand);
    quiz.push({
      q: OUTCOME_PHRASINGS[mod.n % OUTCOME_PHRASINGS.length](mod.title),
      options,
      answer: options.indexOf(mod.outcome),
      explain:
        'That is the outcome this module is building. If it does not feel true yet, run the exercise once more — the later modules assume it.',
    });
  }

  // Q2 — spot the outcome that belongs to a different course entirely.
  const foreign = foreignPool.filter((f) => f.slug !== course.slug);
  if (siblings.length >= 3 && foreign.length) {
    const stranger = foreign[Math.floor(rand() * foreign.length)];
    const own = pick(siblings, rand, 3).map((m) => m.outcome);
    const options = shuffle([...own, stranger.outcome], rand);
    quiz.push({
      q: 'One of these outcomes belongs to a completely different course. Which one?',
      options,
      answer: options.indexOf(stranger.outcome),
      explain: `That one is from “${stranger.title}”. The other three are all stops on this course's path — worth noticing how they stack.`,
    });
  }

  // Q3 — for modules with ordered steps: order matters.
  const steps = [...(mod.html.match(/data-checklist>([\s\S]*?)<\/ul>/)?.[1] ?? '').matchAll(
    /<span class="[^"]*">([\s\S]*?)<\/span>/g,
  )].map((m) => m[1].trim());
  if (steps.length >= 3) {
    const options = shuffle(steps.slice(0, 4), rand);
    quiz.push({
      q: `In “${mod.title}”, what do you do first?`,
      options,
      answer: options.indexOf(steps[0]),
      explain: `Order protects the outcome here: “${steps[0]}” comes before everything else, or the rest is guesswork.`,
    });
  }

  return quiz;
}

/* ----------------------------- main --------------------------------------- */

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.ts') && !f.startsWith('index') && f !== 'deep-course-types.ts');

const courses = files.map((f) => ({ file: path.join(DIR, f), course: readCourse(path.join(DIR, f)) }));

// Pass 1 — rebuild the prose-dialect modules so outcomes are clean before any
// quiz questions get generated from them.
let rebuilt = 0;
for (const { course } of courses) {
  if (!PROSE_SLUGS.has(course.slug)) continue;
  for (const mod of course.modules) {
    if (!mod.html.includes('lesson-field-note')) continue;
    const next = rebuildProse(mod.html);
    if (next) {
      mod.html = next.html;
      mod.minutes = next.minutes;
      mod.outcome = next.outcome;
      rebuilt++;
    }
  }
}

// Pool of outcomes from every course, for the "stranger" question.
const foreignPool = courses.flatMap(({ course }) =>
  course.modules
    .filter((m) => m.outcome)
    .map((m) => ({ slug: course.slug, title: course.title.replace(/\.$/, ''), outcome: m.outcome })),
);

// Pass 2 — quick checks for every module, then write.
let quizzed = 0;
for (const { file, course } of courses) {
  for (const mod of course.modules) {
    const quiz = buildModuleQuiz(course, mod, foreignPool);
    if (quiz.length) {
      mod.quiz = quiz;
      quizzed++;
    }
  }
  writeCourse(file, course);
}

// Module counts for the /courses index cards (progress bars without loading
// every multi-hundred-KB course body on the index page).
const counts = Object.fromEntries(
  courses.map(({ course }) => [course.slug, course.modules.length]).sort(([a], [b]) => a.localeCompare(b)),
);
fs.writeFileSync(
  path.join(DIR, 'module-counts.ts'),
  `// Generated by scripts/rework-courses.mjs. Do not edit by hand.\n` +
    `export const MODULE_COUNTS: Record<string, number> = ${JSON.stringify(counts, null, 2)};\n`,
);

console.log(`Rebuilt ${rebuilt} prose modules, generated quick checks for ${quizzed} of ${courses.reduce((n, c) => n + c.course.modules.length, 0)} modules across ${courses.length} courses.`);
