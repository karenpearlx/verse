'use client';

import { useMemo, useState } from 'react';

/**
 * Follow-up email writer.
 *
 * Deterministic on purpose: no model, no key, no network. The whole value is
 * the shape of the message, and the shape is the same every time. What changes
 * is the pressure, which comes from how long it has been, and the one new thing
 * you can put in front of them.
 */

type Draft = { subject: string; body: string };

/** Three windows, three completely different jobs for the email to do. */
function windowFor(days: number): 'early' | 'nudge' | 'close' {
  if (days <= 4) return 'early';
  if (days <= 12) return 'nudge';
  return 'close';
}

function elapsed(days: number): string {
  if (days <= 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 31) return `${Math.round(days / 7)} weeks ago`;
  return 'a while back';
}

function sentence(value: string): string {
  const clean = value.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const first = clean[0].toUpperCase() + clean.slice(1);
  return /[.!?]$/.test(first) ? first : `${first}.`;
}

function build({
  name,
  role,
  company,
  contact,
  days,
  update,
}: {
  name: string;
  role: string;
  company: string;
  contact: string;
  days: number;
  update: string;
}): Draft {
  const roleText = role.trim() || 'the role';
  const companyText = company.trim();
  const greeting = contact.trim() ? `Hi ${contact.trim()},` : 'Hi there,';
  const sign = name.trim() || 'Your name';
  const news = sentence(update);
  const stage = windowFor(days);

  const subject =
    stage === 'close'
      ? `Closing the loop on ${roleText}`
      : stage === 'nudge'
        ? `Following up: ${roleText}`
        : `${roleText} application`;

  const opener =
    stage === 'early'
      ? `I applied for ${roleText}${companyText ? ` at ${companyText}` : ''} ${elapsed(days)} and wanted to put my name in front of you once, properly.`
      : stage === 'nudge'
        ? `I applied for ${roleText}${companyText ? ` at ${companyText}` : ''} ${elapsed(days)}. I know hiring takes longer than anyone plans, so this is just a nudge, not a chase.`
        : `I applied for ${roleText}${companyText ? ` at ${companyText}` : ''} ${elapsed(days)} and have not heard back, which is completely fine.`;

  const middle = news
    ? stage === 'close'
      ? `One thing has changed since then: ${news[0].toLowerCase()}${news.slice(1)}`
      : `One thing has changed since I applied: ${news[0].toLowerCase()}${news.slice(1)}`
    : stage === 'close'
      ? 'I am still interested and still available for the hours in the post.'
      : 'I am still available for the hours in the post and can start on your timeline.';

  const closer =
    stage === 'close'
      ? 'If the role is filled or on hold, tell me and I will stop emailing. If it is still open, I would like a short call this week.'
      : stage === 'nudge'
        ? 'If it is still open, I would be glad to do a short call or a paid test task. If it is not, a one-line no is genuinely useful to me.'
        : 'No reply needed if the timeline is longer than a week, I just did not want the application to sit unread.';

  const body = [greeting, '', opener, '', middle, '', closer, '', 'Thanks,', sign].join('\n');

  return { subject, body };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {hint ? (
          <span style={{ color: 'var(--color-faint)' }}> {hint}</span>
        ) : null}
      </span>
      <input className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function FollowUpWriter({ defaultName = '' }: { defaultName?: string }) {
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [days, setDays] = useState(6);
  const [update, setUpdate] = useState('');
  const [copied, setCopied] = useState(false);

  const draft = useMemo(
    () => build({ name, role, company, contact, days, update }),
    [name, role, company, contact, days, update],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the text is on screen and selectable anyway */
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
      <div className="card p-6 md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight">What happened</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Your name" value={name} onChange={setName} placeholder="Maria Santos" />
          <Field label="Who you are writing to" hint="(optional)" value={contact} onChange={setContact} placeholder="Maddie" />
          <Field label="Role" value={role} onChange={setRole} placeholder="Operations Assistant" />
          <Field label="Company" value={company} onChange={setCompany} placeholder="Northwind" />
        </div>

        <div className="mt-5">
          <label htmlFor="days" className="mb-1.5 block text-sm font-medium">
            Days since you applied
          </label>
          <input
            id="days"
            type="range"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            {days} {days === 1 ? 'day' : 'days'}. {windowFor(days) === 'early'
              ? 'Too early to push. This one just gets your name read.'
              : windowFor(days) === 'nudge'
                ? 'The right window. Ask for the call.'
                : 'Long enough to ask for a yes or a no.'}
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="update" className="mb-1.5 block text-sm font-medium">
            One new thing since you applied
          </label>
          <textarea
            id="update"
            className="field"
            rows={3}
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            placeholder="I finished the HubSpot admin course and rebuilt my client's reporting sheet."
          />
          <p className="mt-2 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-faint)' }}>
            This is the whole reason the email is allowed to exist. A follow-up with no new information reads as
            pestering; a follow-up with one concrete thing reads as momentum.
          </p>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow" style={{ color: 'var(--color-faint)' }}>
            Your draft
          </p>
          <button type="button" onClick={() => void copy()} className="btn btn-ink !px-4 !py-2 !text-sm">
            {copied ? 'Copied' : 'Copy email'}
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b px-6 py-4" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-faint)' }}>
              Subject
            </p>
            <p className="wrap-anywhere mt-1 font-semibold">{draft.subject}</p>
          </div>
          <pre
            className="wrap-anywhere whitespace-pre-wrap px-6 py-6 text-[0.9375rem] leading-relaxed"
            style={{ color: 'var(--color-ink-2)', fontFamily: 'var(--font-sans-body), system-ui, sans-serif' }}
          >
            {draft.body}
          </pre>
        </div>

        <p className="mt-3 text-center text-sm" style={{ color: 'var(--color-faint)' }}>
          Reply to the original thread if you have one. A new email is easier to miss.
        </p>
      </div>
    </div>
  );
}
