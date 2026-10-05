'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MODULE_COUNTS } from '@/lib/deep-courses/module-counts';
import { COURSES_INDEX } from '@/lib/deep-courses/index-meta';
import { readQuickChecks } from '@/components/deep/ModuleQuickCheck';
import {
  ACCENT_SWATCHES,
  DEFAULT_SECTIONS,
  DEFAULT_THEME,
  FONT_PAIRS,
  PORTFOLIO_LIMITS,
  SECTION_META,
  THEME_PRESETS,
  USERNAME_RE,
  isDefaultTheme,
  vibeToTheme,
  type CourseProof,
  type PortfolioSample,
  type PortfolioTheme,
  type SectionId,
} from '@/lib/portfolio';

const SAMPLE_BUCKET = 'portfolio';
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Completed-course proof from this browser's saved progress. */
function readCourseProof(): CourseProof[] {
  const out: CourseProof[] = [];
  for (const [slug, total] of Object.entries(MODULE_COUNTS)) {
    try {
      const raw = window.localStorage.getItem(`vrsfd:course-progress:${slug}`);
      const done: unknown = raw ? JSON.parse(raw) : [];
      const doneCount = Array.isArray(done) ? done.length : 0;
      if (doneCount < total) continue; // only finished courses are proof
      const card = COURSES_INDEX.cards.find((c) => c.slug === slug);
      if (!card) continue;
      let quizScore = 0;
      let quizTotal = 0;
      for (const result of Object.values(readQuickChecks(slug))) {
        quizScore += result.score;
        quizTotal += result.total;
      }
      out.push({ slug, title: card.title, done: doneCount, total, quizScore, quizTotal });
    } catch {
      /* one bad key should not sink the sync */
    }
  }
  return out.slice(0, PORTFOLIO_LIMITS.maxCourses);
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; url: string } | { kind: 'error'; message: string };

export default function PortfolioEditor() {
  const { status, user, ready } = useAuth();
  const signedIn = ready && status === 'in' && Boolean(user);

  const [loaded, setLoaded] = useState(false);
  const [paid, setPaid] = useState(false);
  const [username, setUsername] = useState('');
  const [published, setPublished] = useState(false);
  const [sections, setSections] = useState({ ...DEFAULT_SECTIONS });
  const [samples, setSamples] = useState<PortfolioSample[]>([]);
  const [courses, setCourses] = useState<CourseProof[]>([]);
  const [theme, setTheme] = useState<PortfolioTheme>({ ...DEFAULT_THEME, order: [...DEFAULT_THEME.order] });
  const [vibe, setVibe] = useState('');
  const [vibeHeard, setVibeHeard] = useState<string[] | null>(null);
  const [saveState, setSaveState] = useState<Status>({ kind: 'idle' });
  const [nameState, setNameState] = useState<'unknown' | 'checking' | 'free' | 'taken' | 'invalid'>('unknown');
  const [uploadBusy, setUploadBusy] = useState<number | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------ load own data */
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    void (async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch('/api/portfolio', { credentials: 'same-origin' }),
          fetch('/api/subscription', { credentials: 'same-origin' }),
        ]);
        if (!alive) return;
        if (sRes.ok) {
          const sub = (await sRes.json()) as { has_paid_access?: boolean };
          setPaid(Boolean(sub.has_paid_access));
        }
        if (pRes.ok) {
          const body = (await pRes.json()) as {
            portfolio: {
              username: string;
              published: boolean;
              config: { sections: Record<SectionId, boolean>; samples: PortfolioSample[]; courses: CourseProof[] };
              theme: PortfolioTheme;
            } | null;
          };
          if (body.portfolio) {
            setUsername(body.portfolio.username);
            setPublished(body.portfolio.published);
            setSections(body.portfolio.config.sections);
            setSamples(body.portfolio.config.samples);
            setCourses(body.portfolio.config.courses);
            setTheme(body.portfolio.theme);
            setNameState('free');
          }
        }
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [signedIn]);

  /* ------------------------------------------------ username check */
  const checkName = useCallback((value: string) => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const clean = value.trim().toLowerCase();
    if (!clean) return setNameState('unknown');
    if (!USERNAME_RE.test(clean)) return setNameState('invalid');
    setNameState('checking');
    checkTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/portfolio?check=${encodeURIComponent(clean)}`, { credentials: 'same-origin' });
          const body = (await res.json()) as { available?: boolean };
          setNameState(body.available ? 'free' : 'taken');
        } catch {
          setNameState('unknown');
        }
      })();
    }, 400);
  }, []);

  /* ------------------------------------------------ save */
  const save = async (publish: boolean) => {
    setSaveState({ kind: 'saving' });
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          published: publish,
          config: { sections, samples, courses },
          theme,
        }),
      });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? `Save failed (${res.status}).`);
      setPublished(publish);
      setSaveState({ kind: 'saved', url: body?.url ?? `https://vrsfd.com/p/${username.trim().toLowerCase()}` });
    } catch (cause) {
      setSaveState({ kind: 'error', message: cause instanceof Error ? cause.message : 'Save failed.' });
    }
  };

  /* ------------------------------------------------ sample image upload */
  const uploadImage = async (index: number, file: File) => {
    if (!user) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      setSaveState({ kind: 'error', message: 'Images: png/jpg/webp/gif up to 3 MB.' });
      return;
    }
    setUploadBusy(index);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(SAMPLE_BUCKET)
        .upload(path, file, { cacheControl: '3600', contentType: file.type });
      if (error) throw new Error(/bucket/i.test(error.message) ? 'Run the portfolios migration in Supabase first.' : error.message);
      const { data } = supabase.storage.from(SAMPLE_BUCKET).getPublicUrl(path);
      setSamples((prev) => prev.map((s, i) => (i === index ? { ...s, imageUrl: data.publicUrl } : s)));
    } catch (cause) {
      setSaveState({ kind: 'error', message: cause instanceof Error ? cause.message : 'Upload failed.' });
    } finally {
      setUploadBusy(null);
    }
  };

  const setSample = (index: number, patch: Partial<PortfolioSample>) =>
    setSamples((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const moveSection = (id: SectionId, dir: -1 | 1) =>
    setTheme((prev) => {
      const order = [...prev.order];
      const i = order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, order };
    });

  const applyVibe = () => {
    const { theme: next, heard } = vibeToTheme(vibe, theme);
    setTheme(next);
    setVibeHeard(heard);
  };

  const customTheme = !isDefaultTheme(theme);
  const canSave = username.trim().length >= 3 && nameState !== 'taken' && nameState !== 'invalid' && saveState.kind !== 'saving';

  /* ------------------------------------------------ render */

  if (!ready) return null;

  if (!signedIn) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your public portfolio</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          One link that shows clients who you are, what you can do, and the training you finished. Sign in to build
          yours — it reuses your Verse profile, so it takes minutes.
        </p>
        <Link href="/login?next=/portfolio" className="btn btn-primary mt-6">
          Sign in to start
        </Link>
      </main>
    );
  }

  const liveUrl = `vrsfd.com/p/${username.trim().toLowerCase() || 'your-name'}`;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8">
      <p className="eyebrow" style={{ color: 'var(--color-accent-deep)' }}>
        Portfolio builder
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        One link for every application<span className="dot">.</span>
      </h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        Built from your <Link href="/profile" className="underline underline-offset-2">Verse profile</Link>, finished
        courses and work samples. Publish it and paste <span className="font-semibold">{liveUrl}</span> into every
        application.
      </p>

      {!loaded ? (
        <p className="mt-10 text-sm" style={{ color: 'var(--color-muted)' }}>
          Loading…
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {/* ------------------------------------------------ username */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">1 · Pick your link</h2>
            <div className="mt-3 flex items-center gap-0 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--color-line-input)' }}>
              <span className="text-[0.9375rem]" style={{ color: 'var(--color-muted)' }}>
                vrsfd.com/p/
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent text-[0.9375rem] font-semibold outline-none"
                value={username}
                maxLength={30}
                placeholder="maria"
                onChange={(e) => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setUsername(v);
                  checkName(v);
                }}
                aria-label="Username"
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: nameState === 'taken' || nameState === 'invalid' ? 'var(--color-clay)' : 'var(--color-muted)' }}>
              {nameState === 'checking' && 'Checking…'}
              {nameState === 'free' && '✓ Available'}
              {nameState === 'taken' && 'Taken — try another.'}
              {nameState === 'invalid' && '3-30 characters: lowercase letters, numbers, hyphens.'}
              {nameState === 'unknown' && 'Lowercase letters, numbers and hyphens.'}
            </p>
          </section>

          {/* ------------------------------------------------ sections */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">2 · Choose what shows</h2>
            <p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
              Name, headline, photo and availability come from your profile automatically.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SECTION_META.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
                  style={{ borderColor: sections[s.id] ? 'var(--color-accent)' : 'var(--color-line-2)' }}
                >
                  <input
                    type="checkbox"
                    checked={sections[s.id]}
                    onChange={(e) => setSections((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                    className="mt-0.5 accent-[var(--color-accent)]"
                  />
                  <span>
                    <span className="block text-[0.875rem] font-semibold">{s.label}</span>
                    <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                      {s.note}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* ------------------------------------------------ courses */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">3 · Course proof</h2>
            <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Course progress lives in your browser, so tap sync on the device where you studied. Only finished
              courses count — they carry your quiz scores as proof.
            </p>
            <button
              type="button"
              className="btn btn-ghost mt-3 !py-2 text-sm"
              onClick={() => setCourses(readCourseProof())}
            >
              Sync finished courses from this browser
            </button>
            {courses.length ? (
              <ul className="mt-3 space-y-1.5">
                {courses.map((c) => (
                  <li key={c.slug} className="flex items-baseline justify-between gap-3 text-[0.875rem]">
                    <span className="font-semibold">{c.title}</span>
                    <span style={{ color: 'var(--color-muted)' }}>
                      {c.done}/{c.total} modules{c.quizTotal ? ` · quizzes ${Math.round((c.quizScore / c.quizTotal) * 100)}%` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
                No finished courses found in this browser yet.
              </p>
            )}
          </section>

          {/* ------------------------------------------------ samples */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">4 · Work samples</h2>
            <p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
              Up to {PORTFOLIO_LIMITS.maxSamples}. A screenshot plus two honest sentences beats a long list.
            </p>
            <div className="mt-4 space-y-4">
              {samples.map((s, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-line-2)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.8125rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                      Sample {i + 1}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold underline underline-offset-2"
                      style={{ color: 'var(--color-clay)' }}
                      onClick={() => setSamples((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className="mt-3 w-full rounded-lg border px-3 py-2 text-[0.9375rem]"
                    style={{ borderColor: 'var(--color-line-input)' }}
                    placeholder="Title — e.g. Instagram grid for a bakery"
                    value={s.title}
                    maxLength={PORTFOLIO_LIMITS.maxSampleTitle}
                    onChange={(e) => setSample(i, { title: e.target.value })}
                  />
                  <textarea
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-[0.9375rem]"
                    style={{ borderColor: 'var(--color-line-input)' }}
                    placeholder="What you did and what happened. Two sentences."
                    rows={2}
                    value={s.blurb}
                    maxLength={PORTFOLIO_LIMITS.maxSampleBlurb}
                    onChange={(e) => setSample(i, { blurb: e.target.value })}
                  />
                  <input
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-[0.9375rem]"
                    style={{ borderColor: 'var(--color-line-input)' }}
                    placeholder="https:// link to the live work (optional)"
                    value={s.url}
                    onChange={(e) => setSample(i, { url: e.target.value })}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="btn btn-ghost cursor-pointer !py-1.5 text-xs">
                      {uploadBusy === i ? 'Uploading…' : s.imageUrl ? 'Replace image' : 'Add image'}
                      <input
                        type="file"
                        accept={IMAGE_TYPES.join(',')}
                        className="hidden"
                        disabled={uploadBusy !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(i, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- preview of user upload
                      <img src={s.imageUrl} alt="" className="h-12 w-20 rounded-md object-cover" />
                    ) : null}
                  </div>
                </div>
              ))}
              {samples.length < PORTFOLIO_LIMITS.maxSamples ? (
                <button
                  type="button"
                  className="btn btn-ghost !py-2 text-sm"
                  onClick={() => setSamples((prev) => [...prev, { title: '', blurb: '', url: '', imageUrl: '' }])}
                >
                  + Add a sample
                </button>
              ) : null}
            </div>
          </section>

          {/* ------------------------------------------------ theme */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold">5 · Make it yours</h2>
              {!paid ? (
                <Link
                  href="/pricing"
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }}
                >
                  Pro feature
                </Link>
              ) : null}
            </div>
            <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              The default Paper look is free. Themes, accents, fonts and section order are part of Pro
              {paid ? '' : ' — you can try them here, but saving needs Pro'}.
            </p>

            <p className="mt-4 text-[0.8125rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Theme
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={`${p.label} — ${p.note}`}
                  onClick={() => setTheme((prev) => ({ ...prev, preset: p.id }))}
                  className="rounded-xl border-2 p-2 text-left"
                  style={{ borderColor: theme.preset === p.id ? 'var(--color-accent)' : 'var(--color-line-2)', background: p.vars.bg }}
                >
                  <span className="block h-5 rounded-md" style={{ background: p.vars.accent }} />
                  <span className="mt-1.5 block text-[0.6875rem] font-bold" style={{ color: p.vars.ink }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-[0.8125rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Accent
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: theme.accent === null ? 'var(--color-accent)' : 'var(--color-line-2)' }}
                onClick={() => setTheme((prev) => ({ ...prev, accent: null }))}
              >
                Theme default
              </button>
              {ACCENT_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Accent ${hex}`}
                  className="h-8 w-8 rounded-full border-2"
                  style={{ background: hex, borderColor: theme.accent === hex ? 'var(--color-ink)' : 'transparent' }}
                  onClick={() => setTheme((prev) => ({ ...prev, accent: hex }))}
                />
              ))}
            </div>

            <p className="mt-4 text-[0.8125rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FONT_PAIRS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  title={f.note}
                  className="rounded-xl border px-4 py-2 text-[0.875rem] font-semibold"
                  style={{
                    borderColor: theme.font === f.id ? 'var(--color-accent)' : 'var(--color-line-2)',
                    background: theme.font === f.id ? 'var(--color-accent-soft)' : 'transparent',
                  }}
                  onClick={() => setTheme((prev) => ({ ...prev, font: f.id }))}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[0.8125rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Section order
            </p>
            <ul className="mt-2 space-y-1">
              {theme.order.map((id, i) => {
                const meta = SECTION_META.find((s) => s.id === id)!;
                return (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[0.875rem]" style={{ borderColor: 'var(--color-line-2)' }}>
                    <span className={sections[id] ? 'font-semibold' : 'line-through opacity-50'}>{meta.label}</span>
                    <span className="flex gap-1">
                      <button type="button" className="ad-btn px-2 py-0.5 text-xs" disabled={i === 0} onClick={() => moveSection(id, -1)} aria-label={`Move ${meta.label} up`}>
                        ↑
                      </button>
                      <button type="button" className="ad-btn px-2 py-0.5 text-xs" disabled={i === theme.order.length - 1} onClick={() => moveSection(id, 1)} aria-label={`Move ${meta.label} down`}>
                        ↓
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* vibe */}
            <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--color-paper-2)' }}>
              <p className="text-[0.875rem] font-bold">Describe the vibe instead</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Say it in plain words — “dark and editorial with gold accents”, “clean, modern, blue” — and the
                matching theme, accent and type are set for you.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-[0.9375rem]"
                  style={{ borderColor: 'var(--color-line-input)' }}
                  value={vibe}
                  maxLength={PORTFOLIO_LIMITS.maxVibe}
                  placeholder="dark, editorial, gold accents, work first"
                  onChange={(e) => setVibe(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyVibe();
                  }}
                />
                <button type="button" className="btn btn-primary !py-2 text-sm" onClick={applyVibe} disabled={!vibe.trim()}>
                  Style it
                </button>
              </div>
              {vibeHeard ? (
                <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                  {vibeHeard.length ? `Heard: ${vibeHeard.join(', ')}.` : 'No style words recognised — try colours, “dark”, “minimal”, “editorial”, “bold”…'}
                </p>
              ) : null}
            </div>

            {customTheme && !paid ? (
              <p className="mt-3 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold" style={{ background: 'var(--color-clay-wash)', color: 'var(--color-clay-deep)' }}>
                This look needs Pro to save. <Link href="/pricing" className="underline underline-offset-2">Get Pro</Link> or
                switch back to the Paper default.
              </p>
            ) : null}
          </section>

          {/* ------------------------------------------------ publish */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">6 · Publish</h2>
            <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {published ? 'Your page is live. Save to update it, or unpublish to take it down.' : 'Save a draft first if you like — nothing is public until you publish.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => void save(true)}>
                {saveState.kind === 'saving' ? 'Saving…' : published ? 'Save & keep live' : 'Publish'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={!canSave} onClick={() => void save(false)}>
                {published ? 'Unpublish' : 'Save draft'}
              </button>
              {published && username ? (
                <a href={`/p/${username}`} target="_blank" rel="noopener" className="text-[0.875rem] font-semibold underline underline-offset-2">
                  View live page ↗
                </a>
              ) : null}
            </div>
            {saveState.kind === 'saved' ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--color-leaf-wash)' }}>
                <p className="text-[0.875rem] font-semibold" style={{ color: 'var(--color-leaf)' }}>
                  Saved{published ? ' and live' : ''}: {saveState.url.replace('https://', '')}
                </p>
                <button
                  type="button"
                  className="text-xs font-bold underline underline-offset-2"
                  onClick={() => void navigator.clipboard.writeText(saveState.url).catch(() => undefined)}
                >
                  Copy link
                </button>
              </div>
            ) : null}
            {saveState.kind === 'error' ? (
              <p className="mt-3 text-[0.875rem] font-semibold" role="alert" style={{ color: 'var(--color-clay)' }}>
                {saveState.message}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
