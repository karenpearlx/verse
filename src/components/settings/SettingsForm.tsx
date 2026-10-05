"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NichePicker from "@/components/NichePicker";
import CoverLetterRulesFields from "@/components/settings/CoverLetterRulesFields";
import PushToggle from "@/components/settings/PushToggle";
import { cleanUrl, parseRules, sameRules } from "@/lib/cover-letter-rules";
import { RESUME_BUILDER_TEMPLATES } from "@/lib/resume-builder-templates";
import {
  MAX_FOLLOW_UP_DAYS,
  MIN_FOLLOW_UP_DAYS,
  clampFollowUpDays,
  toRow,
  writePreferences,
  type Preferences,
} from "@/lib/preferences";

const QUICK_DAYS = [3, 5, 7, 10, 14];

type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

function same(a: Preferences, b: Preferences) {
  return (
    a.followUpDays === b.followUpDays &&
    a.resumeTemplate === b.resumeTemplate &&
    a.coverLetterTemplate === b.coverLetterTemplate &&
    sameRules(a.coverLetterRules, b.coverLetterRules) &&
    a.inAppNotifications === b.inAppNotifications
  );
}

/* ---------- small building blocks ---------- */

function Section({
  step,
  title,
  blurb,
  children,
}: {
  step: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="font-display mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-deep)" }}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">{title}</h2>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {blurb}
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors"
      style={{
        border: `1.5px solid ${on ? "var(--color-accent)" : "var(--color-line-2)"}`,
        background: on ? "var(--color-accent)" : "transparent",
      }}
    >
      {on && (
        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
          <path d="M1 4.1 3.6 6.8 9 1.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** A real radio under the surface, so arrow keys and screen readers behave. */
function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  note,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  note: string;
}) {
  return (
    <label
      className="panel group relative flex cursor-pointer items-start gap-3 p-4 transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-accent)]"
      style={{
        borderColor: checked ? "var(--color-accent)" : "var(--color-line-2)",
        background: checked ? "var(--color-accent-soft)" : "var(--color-surface)",
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <Tick on={checked} />
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-semibold" style={{ color: "var(--color-ink)" }}>
          {title}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {note}
        </span>
      </span>
    </label>
  );
}

/* ---------- the form ---------- */

export default function SettingsForm({ initial }: { initial: Preferences }) {
  const [saved, setSaved] = useState<Preferences>(initial);
  const [draft, setDraft] = useState<Preferences>(initial);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const savedTimer = useRef<number | null>(null);

  const dirty = useMemo(() => !same(draft, saved), [draft, saved]);

  // The server row wins over whatever this device last cached, so the tracker
  // and the bell agree with the account the moment the page opens.
  useEffect(() => {
    writePreferences(initial);
  }, [initial]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    };
  }, []);

  // Nothing here is worth losing to a stray back button.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setState((s) => (s.kind === "saved" ? { kind: "idle" } : s));
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || state.kind === "saving") return;

    // A half-typed URL should stop the save with a pointer at the row, not be
    // silently dropped on the way to the server.
    const badLink = draft.coverLetterRules.links.findIndex((l) => cleanUrl(l.url) === null);
    if (badLink !== -1) {
      setState({
        kind: "error",
        message: `Link ${badLink + 1} isn't a valid http or https address. Fix it or remove the row.`,
      });
      return;
    }

    const next: Preferences = {
      ...draft,
      followUpDays: clampFollowUpDays(draft.followUpDays),
      // Trim, drop empty rows, normalise the URLs — what we save is exactly
      // what a letter will show.
      coverLetterRules: parseRules(draft.coverLetterRules),
    };
    setDraft(next);
    setState({ kind: "saving" });

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toRow(next)),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error || "Could not save. Try again in a moment.");

      setSaved(next);
      // Mirror + broadcast: the bell, the tracker and both builders pick this
      // up on the same tick, no reload.
      writePreferences(next);
      setState({ kind: "saved" });
      savedTimer.current = window.setTimeout(() => setState({ kind: "idle" }), 3200);
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Could not save." });
    }
  };

  const daysLabel = `${draft.followUpDays} day${draft.followUpDays === 1 ? "" : "s"}`;

  return (
    <form onSubmit={onSubmit} className="px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-16">
      <div className="mx-auto grid max-w-5xl gap-5">
        {/* 1. follow-ups */}
        <Section
          step="1"
          title="Chase them after"
          blurb="Anything you marked Applied or Interviewing gets flagged once it has been quiet this long."
        >
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Common follow-up thresholds">
            {QUICK_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className="chip"
                data-on={draft.followUpDays === d}
                aria-pressed={draft.followUpDays === d}
                onClick={() => set("followUpDays", d)}
              >
                {d} days
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="followUpDays" className="mb-1.5 block text-sm font-medium">
                Or pick your own
              </label>
              <input
                id="followUpDays"
                name="followUpDays"
                type="number"
                inputMode="numeric"
                min={MIN_FOLLOW_UP_DAYS}
                max={MAX_FOLLOW_UP_DAYS}
                value={draft.followUpDays}
                onChange={(e) => set("followUpDays", Number(e.target.value))}
                onBlur={() => set("followUpDays", clampFollowUpDays(draft.followUpDays))}
                aria-describedby="followUpHint"
                className="field !w-32 tabular-nums"
              />
            </div>
            <p id="followUpHint" className="pb-3 text-sm" style={{ color: "var(--color-muted)" }}>
              {MIN_FOLLOW_UP_DAYS}&ndash;{MAX_FOLLOW_UP_DAYS} days. Currently <strong>{daysLabel}</strong>.
            </p>
          </div>
        </Section>

        {/* 2. resume */}
        <Section
          step="2"
          title="Resume template"
          blurb="Which look the builder opens with. A resume you are already part-way through keeps its own template."
        >
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Default resume template</legend>
            {RESUME_BUILDER_TEMPLATES.map((t) => (
              <RadioCard
                key={t.id}
                name="resumeTemplate"
                value={t.id}
                checked={draft.resumeTemplate === t.id}
                onChange={(v) => set("resumeTemplate", v as Preferences["resumeTemplate"])}
                title={t.name}
                note={t.note}
              />
            ))}
          </fieldset>
        </Section>

        {/* 3. cover letter */}
        <Section
          step="3"
          title="Cover letter niche"
          blurb="Your usual starting point. Paste a listing and Verse will still suggest a better fit when it spots one."
        >
          <div className="max-w-md">
            <NichePicker
              name="coverLetterTemplate"
              label="Default cover letter template"
              hideLabel
              value={draft.coverLetterTemplate}
              onChange={(v) => set("coverLetterTemplate", v)}
            />
          </div>
        </Section>

        {/* 4. cover letter rules */}
        <Section
          step="4"
          title="Cover letter rules"
          blurb="The parts you'd otherwise retype into every application. These go into every letter Verse writes, template or AI."
        >
          <CoverLetterRulesFields
            value={draft.coverLetterRules}
            onChange={(v) => set("coverLetterRules", v)}
          />
        </Section>

        {/* 5. notifications */}
        <Section
          step="5"
          title="Notifications"
          blurb="The bell in the header for follow-ups, and push alerts to this device when new jobs land."
        >
          <button
            type="button"
            role="switch"
            aria-checked={draft.inAppNotifications}
            onClick={() => set("inAppNotifications", !draft.inAppNotifications)}
            className="panel flex w-full items-center justify-between gap-4 p-4 text-left transition-colors"
            style={{
              borderColor: draft.inAppNotifications ? "var(--color-accent)" : "var(--color-line-2)",
              background: draft.inAppNotifications ? "var(--color-accent-soft)" : "var(--color-surface)",
            }}
          >
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-semibold">
                {draft.inAppNotifications ? "Follow-up bell is on" : "Follow-up bell is off"}
              </span>
              <span className="mt-0.5 block text-[0.8125rem]" style={{ color: "var(--color-muted)" }}>
                {draft.inAppNotifications
                  ? "You will see a badge in the header when something needs a nudge."
                  : "The header stays quiet. The tracker still flags stale applications."}
              </span>
            </span>
            <span
              aria-hidden
              className="relative block h-7 w-12 shrink-0 rounded-full transition-colors"
              style={{ background: draft.inAppNotifications ? "var(--color-accent)" : "var(--color-line-2)" }}
            >
              <span
                className="absolute top-1 block h-5 w-5 rounded-full bg-white transition-all"
                style={{
                  left: draft.inAppNotifications ? "1.5rem" : "0.25rem",
                  boxShadow: "0 1px 3px rgba(28,26,23,.28)",
                }}
              />
            </span>
          </button>

          <PushToggle />
        </Section>
      </div>

      {/* save bar */}
      <div
        className="sticky z-30 mx-auto mt-6 max-w-5xl px-1"
        // Clears the mobile tab bar; --ally-bottomnav is 0px wherever it is absent.
        style={{ bottom: "calc(1rem + var(--ally-bottomnav, 0px))" }}
      >
        <div
          className="card-float flex flex-wrap items-center gap-3 px-5 py-4"
          style={{ border: "1px solid var(--color-line)" }}
        >
          <p aria-live="polite" className="min-w-0 flex-1 text-sm" style={{ color: "var(--color-muted)" }}>
            {state.kind === "error" ? (
              <span style={{ color: "#b5581f" }}>{state.message}</span>
            ) : state.kind === "saved" ? (
              <span style={{ color: "var(--color-accent-deep)" }}>Saved. Everything updated across Verse.</span>
            ) : state.kind === "saving" ? (
              "Saving…"
            ) : dirty ? (
              "You have unsaved changes."
            ) : (
              "Everything here is up to date."
            )}
          </p>
          {dirty && state.kind !== "saving" && (
            <button type="button" className="btn btn-ghost !py-2.5 !text-sm" onClick={() => setDraft(saved)}>
              Discard
            </button>
          )}
          <button type="submit" className="btn btn-primary !py-2.5 !text-sm" disabled={!dirty || state.kind === "saving"}>
            {state.kind === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
