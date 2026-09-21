'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import GradientBg from '@/components/GradientBg';
import Footer from '@/components/Footer';
import { type Niche, buildLetter, detectTools, nicheMeta, suggestNiche } from '@/lib/cover-letter-templates';
import NichePicker from '@/components/NichePicker';
import { usePreferences } from '@/lib/usePreferences';
import { useSubscription } from '@/lib/useSubscription';
import { FREE_COVER_LETTER_LIMIT } from '@/lib/subscription';
import {
  applyRulesToTemplate,
  enforceRulesOnAi,
  hasRules,
  type CoverLetterRules,
} from '@/lib/cover-letter-rules';
import {
  COMPANY_PARAM,
  JOB_PARAM,
  ROLE_PARAM,
  handoffToListing,
  takeJob,
  cameFromJobs,
  clearJobsReturn,
  type JobHandoff,
} from '@/lib/job-handoff';

/** Skills we can spot in a job post, mapped to how a VA would phrase the proof. */
const SKILL_MAP: { keys: string[]; label: string }[] = [
  { keys: ['inbox', 'email management', 'gmail'], label: 'inbox management' },
  { keys: ['calendar', 'scheduling', 'calendly'], label: 'calendar' },
  { keys: ['seo', 'keyword', 'ahrefs', 'semrush'], label: 'SEO' },
  { keys: ['social media', 'instagram', 'tiktok', 'facebook'], label: 'social media' },
  { keys: ['shopify', 'ecommerce', 'e-commerce', 'woocommerce'], label: 'ecommerce ops' },
  { keys: ['bookkeep', 'xero', 'quickbooks', 'invoice'], label: 'bookkeeping' },
  { keys: ['customer support', 'zendesk', 'helpdesk', 'tickets'], label: 'customer support' },
  { keys: ['notion', 'asana', 'clickup', 'trello', 'monday'], label: 'project tools' },
  { keys: ['video', 'premiere', 'capcut', 'editing'], label: 'video editing' },
  { keys: ['data entry', 'crm', 'hubspot', 'airtable'], label: 'CRM and data' },
  { keys: ['writing', 'content', 'copywriting', 'blog'], label: 'writing' },
  { keys: ['recruit', 'hiring', 'onboarding'], label: 'hiring support' },
];

const AI_STORE = 'ally-ai-settings-v1';
/** Name, years and pitch, saved locally so returning users don't retype them. */
const YOU_STORE = 'ally-letter-you-v1';
type Provider = 'openai' | 'anthropic';

const STOP = new Set(['the','and','for','with','you','are','our','your','will','who','this','that','have','from','their','been','they','all','can','has','not','but','out','use','using','work','role','team','job','about','into','more','than','when','what','a','an','to','of','in','on','is','be','we','it','as','at','or','by','if']);

function extractCompany(text: string) {
  const m =
    text.match(/(?:at|join|for)\s+([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,2})/) ??
    text.match(/^([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,2})\s+is\s+(?:hiring|looking)/m);
  return m?.[1]?.trim() ?? '';
}

function extractRole(text: string) {
  const m =
    text.match(/(?:hiring|seeking|looking for)\s+(?:an?\s+)?([A-Za-z/ -]{4,40}?)(?:\s+to\b|\s+who\b|[.,\n])/i) ??
    text.match(/^\s*(?:job title|position|role)\s*[:\-]\s*(.+)$/im);
  return (m?.[1] ?? '').trim().replace(/\s+/g, ' ');
}

function extractName(text: string) {
  const m = text.match(/\b(?:hi|hello|contact|reach out to|email|apply to|send it to)\s+([A-Z][a-z]{2,12})\b/i);
  return m?.[1] ?? '';
}

/** "two links, a sign-off and 1 snippet" — enough to trust it without opening settings. */
function rulesSummary(rules: CoverLetterRules) {
  const bits: string[] = [];
  if (rules.links.length) bits.push(`${rules.links.length} link${rules.links.length === 1 ? '' : 's'}`);
  if (rules.snippets.length) bits.push(`${rules.snippets.length} snippet${rules.snippets.length === 1 ? '' : 's'}`);
  if (rules.signOff) bits.push('your sign-off');
  if (rules.instructions) bits.push('your extra note');
  if (bits.length <= 1) return bits[0] ?? '';
  return `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}`;
}

/** Show enough to recognise the key, never enough to use it. */
function maskKey(key: string) {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 3)}••••••••${key.slice(-4)}`;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CoverLetter />
    </Suspense>
  );
}

function CoverLetter() {
  const params = useSearchParams();
  const router = useRouter();
  /** Set when the board sent us here, so there's a way back to it. */
  const [backToJobs, setBackToJobs] = useState<{ title: string; company: string } | null>(null);

  const [mode, setMode] = useState<'template' | 'ai'>('template');
  const [listing, setListing] = useState('');
  const [name, setName] = useState('');
  const [years, setYears] = useState('3');
  const [headline, setHeadline] = useState('');
  const [roleOverride, setRoleOverride] = useState(params.get('role') ?? '');
  const [companyOverride, setCompanyOverride] = useState(params.get('company') ?? '');
  const { coverLetterTemplate, coverLetterRules: rules, hydrated: prefsReady } = usePreferences();
  /** Set when we arrived from a job card, so the source stays visible. */
  const [fromJob, setFromJob] = useState<JobHandoff | null>(null);
  const [pickedNiche, setPickedNiche] = useState<Niche>('general');
  const [nicheTouched, setNicheTouched] = useState(false);

  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Renders a link next to the error, because "upgrade" needs somewhere to go. */
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null);
  const [source, setSource] = useState<'template' | 'ai' | null>(null);

  // Free accounts get a lifetime allowance, enforced server side. This is just
  // the counter, so nobody discovers the limit by hitting it.
  const { status: planStatus, data: plan, refresh: refreshPlan } = useSubscription();
  const freeLettersLeft =
    planStatus === 'ready' && plan && !plan.has_paid_access
      ? Math.max(0, FREE_COVER_LETTER_LIMIT - plan.cover_letter_uses)
      : null;

  // AI settings — provider + the user's own key, kept in this browser only.
  const [ai, setAi] = useState<{ provider: Provider; key: string | null }>({
    provider: 'openai',
    key: null,
  });
  const provider = ai.provider;
  const savedKey = ai.key;
  const setProvider = (p: Provider) => {
    setAi((prev) => {
      // Keep storage in step, otherwise a saved key stays tagged to the old provider.
      if (prev.key) {
        try {
          localStorage.setItem(AI_STORE, JSON.stringify({ provider: p, key: prev.key }));
        } catch {
          /* storage blocked; in-memory state still works for this session */
        }
      }
      return { ...prev, provider: p };
    });
  };
  const setSavedKey = (key: string | null) => setAi((prev) => ({ ...prev, key }));
  const [keyInput, setKeyInput] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  // localStorage has no server-side equivalent, so saved settings can only be
  // read after hydration. One state write, so hydration can't tear.
  useEffect(() => {
    let restored: { provider: Provider; key: string | null } | null = null;
    try {
      const raw = localStorage.getItem(AI_STORE);
      if (raw) {
        const parsed = JSON.parse(raw) as { provider?: Provider; key?: string };
        restored = {
          provider: parsed.provider === 'anthropic' ? 'anthropic' : 'openai',
          key: typeof parsed.key === 'string' && parsed.key ? parsed.key : null,
        };
      }
    } catch {
      /* corrupt settings shouldn't take the page down */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only store on mount
    if (restored) setAi(restored);
  }, []);

  // "You" fields persist across sessions: fill them once, every later visit
  // starts pre-filled. Saved only after the first read so an empty first
  // render can't wipe what a previous session stored.
  const youRestored = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(YOU_STORE);
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string; years?: string; headline?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only store on mount
        if (typeof saved.name === 'string' && saved.name) setName(saved.name);
        if (typeof saved.years === 'string' && saved.years) setYears(saved.years);
        if (typeof saved.headline === 'string' && saved.headline) setHeadline(saved.headline);
      }
    } catch {
      /* corrupt storage shouldn't take the page down */
    }
    youRestored.current = true;
  }, []);
  useEffect(() => {
    if (!youRestored.current) return;
    try {
      localStorage.setItem(YOU_STORE, JSON.stringify({ name, years, headline }));
    } catch {
      /* storage blocked; the session still works */
    }
  }, [name, years, headline]);

  /**
   * Arriving from a job card.
   *
   * Runs once, and only when the URL carries a handoff key, so an ordinary
   * visit to /cover-letter can never have its draft replaced. The stash is
   * read-once and the key is stripped from the URL straight afterwards, so a
   * refresh or a back-navigation doesn't silently re-prefill over edits.
   */
  const consumed = useRef(false);
  useEffect(() => {
    if (consumed.current) return;
    const key = params.get(JOB_PARAM);
    const queryRole = params.get(ROLE_PARAM) ?? '';
    const queryCompany = params.get(COMPANY_PARAM) ?? '';
    if (!key && !queryRole && !queryCompany) return;
    consumed.current = true;

    const job = takeJob(key);
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot prefill from a read-once store */
    if (cameFromJobs()) {
      setBackToJobs({
        title: job?.title || queryRole.slice(0, 120),
        company: job?.company || queryCompany.slice(0, 120),
      });
    }
    if (job) {
      setFromJob(job);
      setListing(handoffToListing(job));
      setRoleOverride(job.title);
      setCompanyOverride(job.company);
    } else {
      // sessionStorage was blocked or the key expired: the short query
      // parameters still give the builder something real to work with.
      if (queryRole) setRoleOverride(queryRole.slice(0, 120));
      if (queryCompany) setCompanyOverride(queryCompany.slice(0, 120));
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    // history.replaceState, not router.replace: this only needs the address
    // bar tidied so a refresh doesn't look like it should prefill again.
    // Asking the router to navigate would re-run the route for no benefit,
    // and in testing it left the consumed key sitting in the URL.
    window.history.replaceState(null, '', '/cover-letter');
  }, [params]);

  const detected = useMemo(() => {
    const lower = listing.toLowerCase();
    const skills = SKILL_MAP.filter((s) => s.keys.some((k) => lower.includes(k)));
    const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
    return {
      skills,
      tools: detectTools(listing),
      keywords: top,
      company: companyOverride || extractCompany(listing),
      role: roleOverride || extractRole(listing),
      contact: extractName(listing),
    };
  }, [listing, roleOverride, companyOverride]);

  // Suggest the niche from the listing until the user picks one themselves.
  const suggested = useMemo<Niche | null>(() => suggestNiche(listing), [listing]);

  // Derived, not stored: until you pick one yourself, the listing decides.
  // Your own pick wins; then whatever the pasted listing looks like; then the
  // account default. Derived rather than synced, so a saved preference can never
  // stomp on a letter you are part-way through.
  const fallbackNiche: Niche = prefsReady ? coverLetterTemplate : pickedNiche;
  const niche: Niche = nicheTouched ? pickedNiche : (suggested ?? fallbackNiche);

  const scrollToOutput = () =>
    requestAnimationFrame(() =>
      document.getElementById('out')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );

  const generateTemplate = async () => {
    setError(null);
    setErrorLink(null);
    setBusy(true);
    try {
      // Templates run in the browser, but the allowance does not, so ask first
      // and only write the letter once the server has actually spent a use.
      const response = await fetch('/api/usage/cover-letter', { method: 'POST' });
      if (response.status === 401) {
        setError('Cover letters are saved against your account, so you need to be signed in.');
        setErrorLink({ href: '/login?next=/cover-letter', label: 'Sign in' });
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error?.trim() || 'You have used all your free cover letters.');
        setErrorLink({ href: '/pricing', label: 'See Pro' });
        return;
      }
      writeTemplate();
      refreshPlan();
    } catch {
      setError('Could not reach Verse. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const writeTemplate = () => {
    const base = buildLetter(niche, {
      name,
      years,
      headline,
      role: detected.role,
      company: detected.company,
      contact: detected.contact,
      listing,
    });
    // Saved rules are folded in here rather than inside the templates, so all
    // seventeen stay pure functions of the listing.
    setGenerated(applyRulesToTemplate(base, rules, name));
    setSource('template');
    setCopied(false);
    scrollToOutput();
  };

  const saveKey = () => {
    const key = keyInput.trim();
    if (!key) return;
    try {
      localStorage.setItem(AI_STORE, JSON.stringify({ provider, key }));
      setSavedKey(key);
      setKeyInput('');
      setReplacing(false);
      setSaveNote('Saved in this browser.');
      setTimeout(() => setSaveNote(null), 2500);
    } catch {
      setError('Could not save the key — this browser is blocking storage.');
    }
  };

  const forgetKey = () => {
    try {
      localStorage.removeItem(AI_STORE);
    } catch {
      /* nothing to clean up */
    }
    setSavedKey(null);
    setKeyInput('');
    setReplacing(false);
    setSaveNote('Key removed from this browser.');
    setTimeout(() => setSaveNote(null), 2500);
  };

  const generateAI = async () => {
    const key = keyInput.trim() || savedKey;
    if (!key) {
      setError('Add your API key first.');
      return;
    }
    setBusy(true);
    setError(null);
    setErrorLink(null);
    try {
      const res = await fetch('/api/cover-letters/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: key,
          job_listing_content: listing,
          job_title: detected.role || null,
          company: detected.company || null,
          // Untrusted candidate data, delimited and labelled in the prompt.
          rules,
          // Only fields the endpoint allow-lists; anything else is dropped there.
          profile: {
            full_name: name.trim() || null,
            experience_years: Number(years) || null,
            headline: headline.trim() || null,
            bio: `Works mainly in ${nicheMeta(niche).label} roles.`,
            skills: detected.skills.map((s) => s.label),
          },
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      const payload = (data ?? {}) as { letter?: string; generated_letter?: string; error?: string };

      if (!res.ok) {
        // A 401 here is ambiguous: the provider rejects bad keys with one too.
        // Only offer sign-in when we already know there is no session.
        if (res.status === 401 && planStatus === 'signed-out') {
          setErrorLink({ href: '/login?next=/cover-letter', label: 'Sign in' });
        }
        if (res.status === 403) setErrorLink({ href: '/pricing', label: 'See Pro' });
        throw new Error(
          payload.error ||
            (res.status === 401
              ? 'That key was rejected by the provider.'
              : res.status === 404
                ? 'The AI endpoint isn\u2019t available on this deployment yet. Template mode still works.'
                : `Generation failed (${res.status}).`),
        );
      }

      const letter = payload.letter ?? payload.generated_letter;
      if (!letter) throw new Error('The provider returned an empty letter.');

      // The model is asked to include the links and the sign-off; this makes
      // sure it actually did, without stacking a second goodbye on the end.
      setGenerated(enforceRulesOnAi(letter, rules, name));
      setSource('ai');
      setCopied(false);
      scrollToOutput();
      // The AI endpoint spends the use itself, so only the counter needs a nudge.
      refreshPlan();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = listing.trim().length > 0 && !busy;

  return (
    <div className="min-h-screen">
      <GradientBg position="bottom-left" />
      <Nav />

      {backToJobs && (
        <BackToJobs
          job={backToJobs}
          onBack={() => {
            clearJobsReturn();
            router.back();
          }}
        />
      )}

      <section className={backToJobs ? 'px-5 pt-8 md:px-8 md:pt-12' : 'px-5 pt-28 md:px-8 md:pt-40'}>
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Cover letter builder</p>
          <h1 className="display-lg mt-4">
            Paste the job. Get a letter<span className="dot">.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">
            Pick a template built for your niche, or bring your own AI key and let a model write it.
            Either way it stays short enough that a busy founder will actually finish it.
          </p>
        </div>
      </section>

      <section className="px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
          {/* ---------------- input ---------------- */}
          <div className="card p-6 md:p-8">
            {fromJob && (
              <div
                className="mb-6 rounded-2xl p-4"
                style={{ background: 'var(--color-accent-soft)' }}
                role="status"
              >
                <p
                  className="text-[0.6875rem] font-bold uppercase tracking-wide"
                  style={{ color: 'var(--color-accent-deep)' }}
                >
                  Prefilled from the job board
                </p>
                <p className="wrap-anywhere mt-1.5 text-[0.9375rem] font-semibold">
                  {fromJob.title}
                  {fromJob.company ? ` · ${fromJob.company}` : ''}
                </p>
                {!fromJob.description && (
                  <p className="mt-1.5 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
                    This listing has no description saved, so only the basics came across. Paste the
                    full post below for a sharper letter.
                  </p>
                )}
                {fromJob.url && (
                  <a
                    href={fromJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[0.8125rem] font-semibold underline underline-offset-2"
                    style={{ color: 'var(--color-accent-deep)' }}
                  >
                    Open the original listing
                  </a>
                )}
              </div>
            )}

            {/* mode switch */}
            <div
              role="radiogroup"
              aria-label="How to write the letter"
              className="flex gap-1 rounded-full p-1"
              style={{ background: 'var(--color-paper-2)' }}
            >
              {(
                [
                  ['template', 'Use a template'],
                  ['ai', 'Use AI'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => {
                    setMode(id);
                    setError(null);
                  }}
                  className="min-h-[44px] flex-1 rounded-full px-4 py-2.5 text-[0.875rem] font-semibold transition-colors"
                  style={{
                    background: mode === id ? 'var(--color-surface)' : 'transparent',
                    color: mode === id ? 'var(--color-ink)' : 'var(--color-muted)',
                    boxShadow: mode === id ? 'var(--shadow-tile)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[0.8125rem]" style={{ color: 'var(--color-faint)' }}>
              {mode === 'template'
                ? freeLettersLeft === null
                  ? 'Instant, no API key needed. Sign in to write one.'
                  : `Instant, no API key needed. ${freeLettersLeft} of your ${FREE_COVER_LETTER_LIMIT} free letters left.`
                : 'Runs on your own API key. Nothing is charged to Verse, and nothing is stored on our side.'}
            </p>

            <h2 className="font-display mt-7 text-xl font-extrabold tracking-tight">The job post</h2>
            <label htmlFor="listing" className="sr-only">
              Paste the job listing
            </label>
            <textarea
              id="listing"
              className="field mt-4"
              rows={9}
              placeholder="Paste the whole listing here — responsibilities, requirements, all of it."
              value={listing}
              onChange={(e) => setListing(e.target.value)}
            />

            {listing.trim() && (
              <div className="mt-4">
                <p className="eyebrow" style={{ color: 'var(--color-faint)' }}>
                  What Verse spotted
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {detected.skills.length === 0 && detected.tools.length === 0 && (
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      No specific skills detected — the letter will stay general.
                    </span>
                  )}
                  {detected.skills.map((s) => (
                    <span
                      key={s.label}
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }}
                    >
                      {s.label}
                    </span>
                  ))}
                  {detected.tools.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: '#f3eee7', color: '#8a6a3d' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {detected.keywords.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {detected.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-md px-2 py-0.5 text-[0.6875rem]"
                        style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* niche picker (template mode) */}
            {mode === 'template' && (
              <>
                <h2 className="font-display mt-8 text-xl font-extrabold tracking-tight">
                  Which kind of role
                </h2>
                <p className="mt-1.5 text-[0.8125rem]" style={{ color: 'var(--color-muted)' }}>
                  Each one is written differently, not the same letter with the job title swapped.
                </p>
                <div className="mt-4">
                  <NichePicker
                    value={niche}
                    suggested={suggested}
                    hideLabel
                    onChange={(next) => {
                      setPickedNiche(next);
                      setNicheTouched(true);
                    }}
                  />
                </div>
              </>
            )}

            {/* AI settings */}
            {mode === 'ai' && (
              <>
                <h2 className="font-display mt-8 text-xl font-extrabold tracking-tight">Your AI key</h2>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label htmlFor="provider" className="mb-1.5 block text-sm font-medium">
                      Provider
                    </label>
                    <select
                      id="provider"
                      className="field"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as Provider)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Claude (Anthropic)</option>
                    </select>
                  </div>

                  {savedKey && !replacing ? (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5"
                      style={{ background: 'var(--color-accent-soft)' }}
                    >
                      <p className="text-[0.875rem]" style={{ color: 'var(--color-accent-deep)' }}>
                        Key saved <span className="font-mono">{maskKey(savedKey)}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost !px-3.5 !py-2 !text-[0.8125rem]"
                          onClick={() => setReplacing(true)}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost !px-3.5 !py-2 !text-[0.8125rem]"
                          onClick={forgetKey}
                        >
                          Forget
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="apikey" className="mb-1.5 block text-sm font-medium">
                        API key
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="apikey"
                          className="field"
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={provider === 'openai' ? 'sk-…' : 'sk-ant-…'}
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          aria-describedby="keyhelp"
                        />
                        <button
                          type="button"
                          className="btn btn-ghost flex-none"
                          onClick={saveKey}
                          disabled={!keyInput.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <p id="keyhelp" className="text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    Your key is kept in this browser&rsquo;s local storage and sent straight to{' '}
                    {provider === 'openai' ? 'OpenAI' : 'Anthropic'} for each request. Verse never
                    stores it, never logs it, and it never appears in a URL. Anyone with access to
                    this device or a script running on this page could read it, so use a key with a
                    spending limit and remove it when you&rsquo;re done.
                  </p>
                  {saveNote && (
                    <p className="text-[0.8125rem] font-medium" style={{ color: 'var(--color-accent-deep)' }} role="status">
                      {saveNote}
                    </p>
                  )}
                </div>
              </>
            )}

            <h2 className="font-display mt-8 text-xl font-extrabold tracking-tight">You</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="n" className="mb-1.5 block text-sm font-medium">
                  Your name
                </label>
                <input id="n" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label htmlFor="y" className="mb-1.5 block text-sm font-medium">
                  Years doing this
                </label>
                <select id="y" className="field" value={years} onChange={(e) => setYears(e.target.value)}>
                  {['1', '2', '3', '4', '5', '6', '8', '10'].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="hl" className="mb-1.5 block text-sm font-medium">
                  Your one-line pitch <span style={{ color: 'var(--color-faint)' }}>(optional)</span>
                </label>
                <input
                  id="hl"
                  className="field"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="One line about what you do best"
                />
              </div>
              <div>
                <label htmlFor="r" className="mb-1.5 block text-sm font-medium">
                  Role <span style={{ color: 'var(--color-faint)' }}>(optional)</span>
                </label>
                <input id="r" className="field" value={roleOverride} onChange={(e) => setRoleOverride(e.target.value)} placeholder="auto-detected" />
              </div>
              <div>
                <label htmlFor="c" className="mb-1.5 block text-sm font-medium">
                  Company <span style={{ color: 'var(--color-faint)' }}>(optional)</span>
                </label>
                <input id="c" className="field" value={companyOverride} onChange={(e) => setCompanyOverride(e.target.value)} placeholder="auto-detected" />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary mt-6 w-full !py-3.5"
              disabled={!canGenerate}
              onClick={mode === 'ai' ? () => void generateAI() : () => void generateTemplate()}
            >
              {busy ? (
                <>
                  <Spinner /> Writing…
                </>
              ) : mode === 'ai' ? (
                'Write it with AI'
              ) : (
                'Write my letter'
              )}
            </button>

            {prefsReady && (
              <p className="mt-3 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {hasRules(rules) ? (
                  <>
                    Your saved rules go in automatically: {rulesSummary(rules)}.{' '}
                    <Link
                      href="/settings"
                      className="font-semibold underline underline-offset-2"
                      style={{ color: 'var(--color-accent-deep)' }}
                    >
                      Change them
                    </Link>
                  </>
                ) : (
                  <>
                    Save your links, sign-off and go-to lines in{' '}
                    <Link
                      href="/settings"
                      className="font-semibold underline underline-offset-2"
                      style={{ color: 'var(--color-accent-deep)' }}
                    >
                      Settings
                    </Link>{' '}
                    and every letter picks them up.
                  </>
                )}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl p-3 text-[0.875rem] leading-relaxed"
                style={{ background: '#fbecef', color: '#8f2f47' }}
              >
                {error}
                {errorLink ? (
                  <>
                    {' '}
                    <Link
                      href={errorLink.href}
                      className="font-semibold underline underline-offset-2"
                      style={{ color: '#8f2f47' }}
                    >
                      {errorLink.label}
                    </Link>
                  </>
                ) : null}
              </p>
            )}
          </div>

          {/* ---------------- output ---------------- */}
          <div id="out" className="card flex flex-col p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Your letter</h2>
              {generated && (
                <div className="flex items-center gap-2">
                  {source && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide"
                      style={{ background: 'var(--color-paper-2)', color: 'var(--color-muted)' }}
                    >
                      {source === 'ai' ? (provider === 'openai' ? 'OpenAI' : 'Claude') : 'Template'}
                    </span>
                  )}
                  <button type="button" className="btn btn-ghost !px-4 !py-2 !text-sm" onClick={copy}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {generated ? (
              <>
                <label htmlFor="letter" className="sr-only">
                  Your cover letter
                </label>
                <textarea
                  id="letter"
                  className="field mt-4 flex-1"
                  rows={20}
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  style={{ lineHeight: 1.7 }}
                />
                <p className="mt-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                  Edit it before you send. A letter that sounds 90% like you beats one that sounds
                  100% like a template.
                </p>
              </>
            ) : (
              <div
                className="mt-4 flex flex-1 items-center justify-center rounded-2xl p-10 text-center"
                style={{ background: 'var(--color-paper-2)', minHeight: 320 }}
              >
                <p className="max-w-xs text-[0.9375rem]" style={{ color: 'var(--color-muted)' }}>
                  {busy ? 'Writing your letter…' : 'Paste a listing on the left and your letter shows up here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer tagline="Write once, stand out everywhere" />
    </div>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ animation: 'spin .8s linear infinite' }}>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
        <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

/**
 * Sticky return strip for the "board → builder" trip.
 *
 * It sits under the fixed nav rather than replacing it, shows which listing you
 * walked in with, and goes back through history so the board comes back on the
 * page and scroll position you left it at.
 */
function BackToJobs({
  job,
  onBack,
}: {
  job: { title: string; company: string };
  onBack: () => void;
}) {
  return (
    <div
      className="sticky top-0 z-30 px-5 pb-3 pt-[4.75rem] md:px-8 md:pb-4 md:pt-[5.75rem]"
      style={{
        background: 'rgba(247,246,244,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-line)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 flex-none place-items-center rounded-full transition-colors"
          style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-deep)' }}
          aria-label="Back to the job board"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M10 3.5 5.5 8l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="block max-w-full truncate text-left text-[0.9375rem] font-semibold"
          >
            {job.title || 'Back to jobs'}
          </button>
          <p className="truncate text-xs" style={{ color: 'var(--color-muted)' }}>
            {job.company ? `${job.company} · back to jobs` : 'Back to jobs'}
          </p>
        </div>
      </div>
    </div>
  );
}
