'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Nav from '@/components/Nav';
import GradientBg from '@/components/GradientBg';
import Footer from '@/components/Footer';
import { RESUME_BUILDER_TEMPLATES, type ResumeBuilderTemplateId } from '@/lib/resume-builder-templates';
import Link from 'next/link';
import { usePreferences } from '@/lib/usePreferences';
import { useAuth, displayName } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/useSubscription';
import { FREE_RESUME_LIMIT } from '@/lib/subscription';

type Job = { id: string; role: string; company: string; period: string; bullets: string };
type Data = {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  /** Optional headshot as a small data URL; empty string means none. */
  photo: string;
  jobs: Job[];
};

const TEMPLATES = RESUME_BUILDER_TEMPLATES;
type TemplateId = ResumeBuilderTemplateId;

const STORE = 'ally-resume';

/**
 * The builder opens empty: what each field wants lives in its placeholder, so
 * nobody has to delete somebody else's sample resume before typing their own.
 */
const DEFAULTS: Data = {
  name: '',
  title: '',
  location: '',
  email: '',
  phone: '',
  summary: '',
  skills: '',
  photo: '',
  jobs: [{ id: 'j1', role: '', company: '', period: '', bullets: '' }],
};

/**
 * An earlier version shipped pre-filled with a sample resume ("Maria Santos"),
 * which localStorage then faithfully preserved forever. Any stored value that
 * still exactly matches that sample is the sample, not the user, so it gets
 * dropped on load.
 */
const OLD_SAMPLE: Record<string, string> = {
  name: 'Maria Santos',
  title: 'Virtual Assistant / Executive Assistant',
  location: 'Cebu, Philippines · Works US hours',
  email: 'you@example.com',
  phone: '+63 900 000 0000',
  summary:
    'Operations and executive support for small remote teams. I build the systems that keep a founder out of the weeds — inbox, calendar, reporting, and the people doing the work.',
  skills:
    'Executive support, Inbox & calendar, SEO, Content ops, Notion, Asana, Social media, Reporting',
};
const OLD_SAMPLE_COMPANIES = new Set(['Remote marketing agency (US)', 'E-commerce client (AU)']);

function scrubOldSample(data: Data): Data {
  const clean = { ...data };
  for (const key of Object.keys(OLD_SAMPLE) as (keyof typeof OLD_SAMPLE & keyof Data)[]) {
    if (typeof clean[key] === 'string' && clean[key] === OLD_SAMPLE[key]) {
      (clean as Record<string, unknown>)[key] = '';
    }
  }
  const jobs = clean.jobs.filter((j) => !OLD_SAMPLE_COMPANIES.has(j.company));
  clean.jobs = jobs.length ? jobs : [{ id: 'j1', role: '', company: '', period: '', bullets: '' }];
  return clean;
}

/** True when a field is empty, so an account detail can safely fill it. */
function isPlaceholder(value: string) {
  return !value.trim();
}

export default function Resume() {
  const { resumeTemplate, hydrated: prefsReady } = usePreferences();
  const [pickedTpl, setPickedTpl] = useState<TemplateId>('clean');
  const [tplTouched, setTplTouched] = useState(false);
  // Opens on the account default, switches the moment you pick something else.
  // Derived, so a preference arriving late never overrides your click.
  const tpl: TemplateId = tplTouched ? pickedTpl : prefsReady ? resumeTemplate : pickedTpl;
  const [d, setD] = useState<Data>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setD(scrubOldSample({ ...DEFAULTS, ...JSON.parse(raw) }));
    } catch {
      /* keep defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORE, JSON.stringify(d));
  }, [d, ready]);

  // Signed in? Swap the sample identity for the real one. Only fields still
  // holding a placeholder get touched — anything typed here wins, always.
  const { status: authStatus, user, ready: authReady } = useAuth();
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!ready || !authReady || prefilled || authStatus !== 'in' || !user) return;
    let alive = true;

    void (async () => {
      let fullName = displayName(user);
      try {
        const { data } = await createClient()
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        const stored = (data as { full_name?: string | null } | null)?.full_name?.trim();
        if (stored) fullName = stored;
      } catch {
        /* the auth metadata name is a fine fallback */
      }
      if (!alive) return;

      setD((prev) => ({
        ...prev,
        name: isPlaceholder(prev.name) ? fullName : prev.name,
        email: isPlaceholder(prev.email) ? (user.email ?? prev.email) : prev.email,
      }));
      setPrefilled(true);
    })();

    return () => {
      alive = false;
    };
  }, [ready, authReady, prefilled, authStatus, user]);

  // Editing is free forever. Only the export spends an allowance, and the
  // allowance is spent server side, so print only after the server says yes.
  const { status: planStatus, data: plan, refresh: refreshPlan } = useSubscription();
  const exportsLeft =
    planStatus === 'ready' && plan && !plan.has_paid_access
      ? Math.max(0, FREE_RESUME_LIMIT - plan.resume_uses)
      : null;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<{ text: string; href: string; label: string } | null>(null);

  const exportPdf = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch('/api/usage/resume', { method: 'POST' });
      if (response.status === 401) {
        setExportError({
          text: 'Exports are counted against your account, so you need to be signed in.',
          href: '/login?next=/resume',
          label: 'Sign in',
        });
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setExportError({
          text: body?.error?.trim() || 'You have used all your free resume exports.',
          href: '/pricing',
          label: 'See what Pro includes (₱199)',
        });
        return;
      }
      refreshPlan();
      window.print();
    } catch {
      setExportError({
        text: 'Could not reach Verse, so the export was not counted. Try again.',
        href: '/pricing',
        label: 'See what Pro includes (₱199)',
      });
    } finally {
      setExporting(false);
    }
  };

  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }));
  const setJob = (id: string, p: Partial<Job>) =>
    setD((prev) => ({ ...prev, jobs: prev.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) }));
  const addJob = () =>
    setD((prev) => ({
      ...prev,
      jobs: [...prev.jobs, { id: crypto.randomUUID(), role: '', company: '', period: '', bullets: '' }],
    }));
  const delJob = (id: string) =>
    setD((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));

  return (
    <div className="min-h-screen">
      <GradientBg position="bottom-right" />
      <Nav />

      <section className="px-5 pt-28 md:px-8 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Resume builder</p>
          <h1 className="display-lg mt-4">
            Fill it once. Reuse it forever<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Three templates built for remote VA roles. Your details save automatically, so the next
            version takes a minute instead of an evening.
          </p>
        </div>
      </section>

      {/* templates */}
      <section className="px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {TEMPLATES.map((t) => {
              const on = tpl === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setPickedTpl(t.id);
                    setTplTouched(true);
                  }}
                  className="card p-5 text-left transition-transform hover:-translate-y-0.5"
                  style={on ? { boxShadow: '0 0 0 2px var(--color-accent), var(--shadow-card)' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-extrabold tracking-tight">{t.name}</span>
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full"
                      style={{
                        border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-line-2)'}`,
                        background: on ? 'var(--color-accent)' : 'transparent',
                      }}
                    >
                      {on && (
                        <svg width="9" height="7" viewBox="0 0 10 8" fill="none" aria-hidden>
                          <path d="M1 4.2 3.5 6.7 9 1.2" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                    {t.note}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* form + preview */}
      <section className="px-5 pt-6 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_1.05fr]">
          {/* form */}
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-xl font-extrabold tracking-tight">Your details</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              Everything saves automatically in this browser as you type — fill it once and it&rsquo;s
              still here next visit.
            </p>

            <PhotoField photo={d.photo} onChange={(v) => set('photo', v)} />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input label="Full name" v={d.name} on={(v) => set('name', v)} ph="Maria Santos" />
              <Input label="Headline" v={d.title} on={(v) => set('title', v)} ph="Virtual Assistant / Executive Assistant" />
              <div className="sm:col-span-2">
                <Input label="Location / availability" v={d.location} on={(v) => set('location', v)} ph="Cebu, Philippines · Works US hours" />
              </div>
              <Input label="Email" v={d.email} on={(v) => set('email', v)} ph="you@example.com" />
              <Input label="Phone" v={d.phone} on={(v) => set('phone', v)} ph="+63 9xx xxx xxxx" />
            </div>

            <div className="mt-4">
              <Label>Summary</Label>
              <textarea
                className="field"
                rows={3}
                value={d.summary}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="Two or three lines on what you do and who you do it for."
              />
            </div>

            <div className="mt-4">
              <Label>Skills (comma separated)</Label>
              <textarea
                className="field"
                rows={2}
                value={d.skills}
                onChange={(e) => set('skills', e.target.value)}
                placeholder="Executive support, Inbox & calendar, Notion, Reporting"
              />
            </div>

            <h3 className="font-display mt-8 text-lg font-extrabold tracking-tight">Experience</h3>
            <div className="mt-4 space-y-4">
              {d.jobs.map((j, i) => (
                <div key={j.id} className="rounded-2xl p-4" style={{ border: '1px solid var(--color-line)' }}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-faint)' }}>
                      Role {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => delJob(j.id)}
                      className="tap text-sm underline underline-offset-2"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Job title" v={j.role} on={(v) => setJob(j.id, { role: v })} ph="Executive Assistant" />
                    <Input label="Company" v={j.company} on={(v) => setJob(j.id, { company: v })} ph="Remote marketing agency (US)" />
                    <div className="sm:col-span-2">
                      <Input label="Period" v={j.period} on={(v) => setJob(j.id, { period: v })} ph="2023 — present" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Bullets (one per line)</Label>
                    <textarea
                      className="field"
                      rows={3}
                      value={j.bullets}
                      onChange={(e) => setJob(j.id, { bullets: e.target.value })}
                      placeholder={'One line per win — what you did and what it changed.\nRan inbox and calendar for two founders across three time zones.'}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-ghost mt-4 w-full" onClick={addJob}>
              + Add another role
            </button>
          </div>

          {/* preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow" style={{ color: 'var(--color-faint)' }}>
                Live preview
              </p>
              <button
                type="button"
                className="btn btn-ink !px-4 !py-2 !text-sm"
                disabled={exporting}
                onClick={() => void exportPdf()}
              >
                {exporting ? 'Preparing…' : 'Export PDF'}
              </button>
            </div>
            <div id="sheet" className="card-float overflow-hidden">
              <Sheet tpl={tpl} d={d} />
            </div>
            {exportError ? (
              <p
                role="alert"
                className="mt-3 rounded-xl p-3 text-[0.875rem] leading-relaxed"
                style={{ background: '#fbecef', color: '#8f2f47' }}
              >
                {exportError.text}{' '}
                <Link
                  href={exportError.href}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: '#8f2f47' }}
                >
                  {exportError.label}
                </Link>
              </p>
            ) : null}

            <p className="mt-3 text-center text-sm" style={{ color: 'var(--color-faint)' }}>
              Export uses your browser&rsquo;s print dialog, choose &ldquo;Save as PDF&rdquo;.
              {exportsLeft === null ? '' : ` ${exportsLeft} of ${FREE_RESUME_LIMIT} free exports left.`}
            </p>
          </div>
        </div>
      </section>

      <Footer tagline="Your skills, their format" />

      {/* Second copy of the sheet, portalled to <body>, shown only by the
          print stylesheet. Printing the on-page one directly never worked:
          it lives inside a sticky, clipped, shadowed column. */}
      <PrintPortal>
        <Sheet tpl={tpl} d={d} />
      </PrintPortal>
    </div>
  );
}

/** Mounts #ally-print as a direct child of <body>; globals.css does the rest. */
const NO_SUBSCRIBE = () => () => {};

function PrintPortal({ children }: { children: React.ReactNode }) {
  // false on the server and on the hydrating render, true after — so the portal
  // only appears once the DOM is ours to touch, without setState in an effect.
  const mounted = useSyncExternalStore(NO_SUBSCRIBE, () => true, () => false);
  const [host] = useState(() =>
    typeof document === 'undefined' ? null : Object.assign(document.createElement('div'), { id: 'ally-print' }),
  );

  useEffect(() => {
    if (!host) return;
    document.body.appendChild(host);
    return () => host.remove();
  }, [host]);

  return mounted && host ? createPortal(children, host) : null;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium">{children}</span>;
}

function Input({ label, v, on, ph }: { label: string; v: string; on: (v: string) => void; ph?: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="field" value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />
    </label>
  );
}

/**
 * Optional headshot. Photos on resumes are the norm for PH VA applications,
 * so this is a first-class field — but it stays in this browser only.
 *
 * The file is centre-cropped to a small square JPEG before it is stored:
 * localStorage holds ~5MB total and a phone photo is bigger than that on its
 * own, so the original never goes anywhere near storage.
 */
const PHOTO_SIZE = 240;

async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That file could not be read as an image.'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser blocked image processing.');
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      PHOTO_SIZE,
      PHOTO_SIZE,
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function PhotoField({ photo, onChange }: { photo: string; onChange: (v: string) => void }) {
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      onChange(await shrinkPhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that photo.');
    }
  };

  return (
    <div className="mt-5">
      <Label>Photo (optional)</Label>
      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local data URL, not a remote asset
          <img
            src={photo}
            alt="Your resume photo"
            className="h-14 w-14 flex-none rounded-full object-cover"
            style={{ border: '1px solid var(--color-line-2)' }}
          />
        ) : (
          <span
            aria-hidden
            className="grid h-14 w-14 flex-none place-items-center rounded-full"
            style={{ background: 'var(--color-paper-2)', border: '1px dashed var(--color-line-2)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8.4" r="3.6" stroke="var(--color-faint)" strokeWidth="1.6" />
              <path d="M4.9 20.2a7.3 7.3 0 0 1 14.2 0" stroke="var(--color-faint)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn btn-ghost !px-4 !py-2 !text-sm cursor-pointer">
            {photo ? 'Change photo' : 'Add photo'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {photo ? (
            <button
              type="button"
              className="tap text-sm underline underline-offset-2"
              style={{ color: 'var(--color-muted)' }}
              onClick={() => onChange('')}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-faint)' }}>
        Common on PH VA resumes, skip it for US/EU clients if you prefer. Stays in this browser only.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm" style={{ color: '#a3384f' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Photo({ src, ring }: { src: string; ring?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local data URL, not a remote asset
    <img
      src={src}
      alt=""
      className="h-16 w-16 flex-none rounded-full object-cover"
      style={ring ? { border: '2px solid rgba(255,255,255,.75)' } : { border: '1px solid var(--color-line-2)' }}
    />
  );
}

function Sheet({ tpl, d }: { tpl: TemplateId; d: Data }) {
  const skills = d.skills.split(',').map((s) => s.trim()).filter(Boolean);
  const classic = tpl === 'classic';
  const name = d.name.trim() || 'Your name';
  const hasExperience = d.jobs.some(
    (j) => j.role.trim() || j.company.trim() || j.period.trim() || j.bullets.trim(),
  );

  return (
    <div
      className="bg-white p-7 md:p-9"
      style={{ fontFamily: classic ? 'var(--display)' : 'var(--font-sans-body), sans-serif' }}
    >
      {/* header */}
      {tpl === 'bold' ? (
        <div
          className="-mx-7 -mt-7 mb-6 flex items-center gap-4 px-7 py-6 md:-mx-9 md:-mt-9 md:px-9"
          style={{ background: 'var(--color-accent)' }}
        >
          {d.photo && <Photo src={d.photo} ring />}
          <div className="min-w-0">
            <h2 className="font-display wrap-anywhere text-2xl font-extrabold tracking-tight text-white">{name}</h2>
            {d.title.trim() && (
              <p className="wrap-anywhere mt-1 text-sm" style={{ color: 'rgba(255,255,255,.85)' }}>
                {d.title}
              </p>
            )}
          </div>
        </div>
      ) : classic ? (
        <div className="text-center">
          {d.photo && (
            <div className="mb-3 flex justify-center">
              <Photo src={d.photo} />
            </div>
          )}
          <h2 className="font-display wrap-anywhere text-2xl font-extrabold tracking-tight">{name}</h2>
          {d.title.trim() && (
            <p className="wrap-anywhere mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
              {d.title}
            </p>
          )}
          <div className="mt-3 h-px w-full" style={{ background: 'var(--color-line-2)' }} />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4">
            {d.photo && <Photo src={d.photo} />}
            <div className="min-w-0">
              <h2 className="font-display wrap-anywhere text-2xl font-extrabold tracking-tight">{name}</h2>
              {d.title.trim() && (
                <p className="wrap-anywhere mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                  {d.title}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 h-px w-full" style={{ background: 'var(--color-accent)' }} />
        </div>
      )}

      {[d.location, d.email, d.phone].some((v) => v.trim()) && (
        <p
          className={`wrap-anywhere mt-3 text-[0.6875rem] ${classic ? 'text-center' : ''}`}
          style={{ color: 'var(--color-muted)' }}
        >
          {[d.location, d.email, d.phone].map((v) => v.trim()).filter(Boolean).join(' · ')}
        </p>
      )}

      {d.summary && (
        <p className="wrap-anywhere mt-5 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          {d.summary}
        </p>
      )}

      {skills.length > 0 && (
        <>
          <SectionTitle tpl={tpl}>Skills</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="wrap-anywhere rounded-md px-2 py-1 text-[0.6875rem]"
                style={{
                  background: tpl === 'bold' ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                  color: tpl === 'bold' ? 'var(--color-accent-deep)' : 'var(--color-ink-2)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {!hasExperience && !d.summary.trim() && skills.length === 0 && (
        <p className="mt-6 text-[0.8125rem]" style={{ color: 'var(--color-faint)' }}>
          Your resume builds itself here as you fill in the form.
        </p>
      )}

      {hasExperience && (
        <>
      <SectionTitle tpl={tpl}>Experience</SectionTitle>
      <div className="mt-2 space-y-4">
        {d.jobs.map((j) => (
          <div key={j.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="wrap-anywhere text-[0.8125rem] font-bold">
                {j.role || 'Role'}
                {j.company && <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}> · {j.company}</span>}
              </p>
              <span className="text-[0.6875rem]" style={{ color: 'var(--color-faint)' }}>
                {j.period}
              </span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {j.bullets
                .split('\n')
                .map((b) => b.trim())
                .filter(Boolean)
                .map((b, i) => (
                  <li key={i} className="wrap-anywhere flex gap-2 text-[0.75rem] leading-relaxed">
                    <span style={{ color: 'var(--color-accent)' }}>▪</span>
                    <span style={{ color: 'var(--color-ink-2)' }}>{b}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function SectionTitle({ tpl, children }: { tpl: TemplateId; children: React.ReactNode }) {
  return (
    <h3
      className="mt-6 text-[0.625rem] font-bold uppercase tracking-[0.16em]"
      style={{
        color: tpl === 'classic' ? 'var(--color-ink)' : 'var(--color-accent)',
        fontFamily: 'var(--font-sans-body), sans-serif',
      }}
    >
      {children}
    </h3>
  );
}
