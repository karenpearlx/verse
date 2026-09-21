"use client";

import { useMemo, useRef, useState } from "react";
import AvatarPicker from "@/components/profile/AvatarPicker";
import { NICHES, NICHE_GROUPS, type Niche } from "@/lib/cover-letter-templates";
import { cleanUrl, type RuleLink } from "@/lib/cover-letter-rules";
import {
  AVAILABILITY,
  EXPERIENCE_LEVELS,
  LANGUAGE_IDEAS,
  PROFILE_LIMITS,
  availabilityMeta,
  completeness,
  experienceMeta,
  nicheLabel,
  parseRate,
  rateLine,
  sameProfile,
  toRow,
  type Availability,
  type ExperienceLevel,
  type Profile,
} from "@/lib/profile";

type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };
type ImportState =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; needsKey?: boolean };

type AiSettings = { provider: "openai" | "anthropic"; key: string };

const AI_STORE = "ally-ai-settings-v1";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const FALLBACK_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

/** Every IANA zone the browser knows, or a short list when it doesn't. */
const ZONES: string[] = (() => {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
      "timeZone",
    );
    if (supported?.length) return supported;
  } catch {
    /* older engines */
  }
  return FALLBACK_ZONES;
})();

function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function initialsOf(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "VA";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

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

function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-medium">
      <span>{children}</span>
      {hint && (
        <span className="text-[0.75rem] font-normal" style={{ color: "var(--color-faint)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function ReadRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
      <span className="w-28 shrink-0 text-[0.8125rem] font-semibold uppercase tracking-wide" style={{ color: "var(--color-faint)" }}>
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
        {children}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-faint)" }}>{children}</span>;
}

function Dot({ tone }: { tone: string }) {
  const color = tone === "good" ? "var(--color-accent)" : tone === "warn" ? "#d08c2a" : "var(--color-faint)";
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: color, boxShadow: tone === "good" ? "0 0 0 3px rgba(13,155,138,.16)" : "none" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* the page body                                                       */
/* ------------------------------------------------------------------ */

export default function ProfileForm({
  userId,
  authEmail,
  initial,
  ready,
}: {
  userId: string;
  authEmail: string;
  initial: Profile;
  ready: boolean;
}) {
  const [saved, setSaved] = useState<Profile>(initial);
  const [draft, setDraft] = useState<Profile>(initial);
  // Anyone with nothing saved yet starts in edit mode; an empty read-only page
  // is a dead end.
  const [editing, setEditing] = useState(!initial.fullName && !initial.bio && initial.niches.length === 0);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [importState, setImportState] = useState<ImportState>({ kind: "idle" });
  const [draggingResume, setDraggingResume] = useState(false);
  const [language, setLanguage] = useState("");
  const savedTimer = useRef<number | null>(null);
  const resumeInput = useRef<HTMLInputElement | null>(null);

  const dirty = useMemo(() => !sameProfile(draft, saved), [draft, saved]);
  const percent = useMemo(() => completeness(draft), [draft]);
  const shownName = draft.fullName || authEmail.split("@")[0];
  const availability = availabilityMeta(draft.availability);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setState((s) => (s.kind === "error" ? { kind: "idle" } : s));
  }

  function toggleNiche(id: Niche) {
    setDraft((d) => {
      if (d.niches.includes(id)) return { ...d, niches: d.niches.filter((n) => n !== id) };
      if (d.niches.length >= PROFILE_LIMITS.maxNiches) return d;
      return { ...d, niches: NICHES.filter((n) => n.id === id || d.niches.includes(n.id)).map((n) => n.id) };
    });
  }

  function addLanguage(value: string) {
    const clean = value.trim().slice(0, PROFILE_LIMITS.maxLanguage);
    if (!clean) return;
    setDraft((d) => {
      if (d.languages.length >= PROFILE_LIMITS.maxLanguages) return d;
      if (d.languages.some((l) => l.toLowerCase() === clean.toLowerCase())) return d;
      return { ...d, languages: [...d.languages, clean] };
    });
    setLanguage("");
  }

  function setLink(index: number, patch: Partial<RuleLink>) {
    setDraft((d) => ({
      ...d,
      links: d.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  }

  function savedProfileHasContent() {
    return Boolean(
      saved.fullName.trim() ||
        saved.headline.trim() ||
        saved.contactEmail.trim() ||
        saved.bio.trim() ||
        saved.niches.length ||
        saved.hourlyRate != null ||
        saved.monthlyRate != null ||
        saved.links.length ||
        saved.location.trim() ||
        saved.timezone.trim() ||
        saved.languages.length,
    );
  }

  function mergeResumeProfile(imported: Partial<Profile>) {
    const next = { ...draft };
    let filled = 0;
    const fillString = (key: "fullName" | "headline" | "contactEmail" | "bio" | "location" | "timezone") => {
      const value = imported[key];
      if (!next[key].trim() && typeof value === "string" && value.trim()) {
        next[key] = value;
        filled += 1;
      }
    };

    fillString("fullName");
    fillString("headline");
    fillString("contactEmail");
    fillString("bio");
    fillString("location");
    fillString("timezone");

    if (!next.niches.length && imported.niches?.length) {
      next.niches = imported.niches;
      filled += 1;
    }
    if (next.hourlyRate == null && imported.hourlyRate != null) {
      next.hourlyRate = imported.hourlyRate;
      filled += 1;
    }
    if (next.monthlyRate == null && imported.monthlyRate != null) {
      next.monthlyRate = imported.monthlyRate;
      filled += 1;
    }
    if (!next.links.length && imported.links?.length) {
      next.links = imported.links;
      filled += 1;
    }
    if (!next.languages.length && imported.languages?.length) {
      next.languages = imported.languages;
      filled += 1;
    }

    // These controls have defaults rather than an empty state. Only replace a
    // default on a truly new profile, never a choice the user already saved.
    if (!savedProfileHasContent() && draft.experience === initial.experience && imported.experience) {
      next.experience = imported.experience;
      if (next.experience !== draft.experience) filled += 1;
    }
    if (!savedProfileHasContent() && draft.availability === initial.availability && imported.availability) {
      next.availability = imported.availability;
      if (next.availability !== draft.availability) filled += 1;
    }

    setDraft(next);
    setState({ kind: "idle" });
    return filled;
  }

  function aiSettings(): AiSettings | null {
    try {
      const raw = localStorage.getItem(AI_STORE);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AiSettings>;
      if (!parsed.key?.trim()) return null;
      return { provider: parsed.provider === "anthropic" ? "anthropic" : "openai", key: parsed.key.trim() };
    } catch {
      return null;
    }
  }

  async function importResume(file: File) {
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (file.size > MAX_RESUME_BYTES) {
      setImportState({ kind: "error", message: "Resume must be under 5MB" });
      return;
    }
    if (!RESUME_EXTENSIONS.has(extension)) {
      setImportState({ kind: "error", message: "Could not read this file. Try a different format." });
      return;
    }

    const ai = aiSettings();
    if (!ai) {
      setImportState({
        kind: "error",
        needsKey: true,
        message: "Add your OpenAI or Claude API key in the cover letter builder to use this feature.",
      });
      return;
    }

    setImportState({ kind: "reading" });
    const form = new FormData();
    form.set("file", file);
    form.set("provider", ai.provider);
    form.set("api_key", ai.key);

    try {
      const response = await fetch("/api/profile/parse-resume", { method: "POST", body: form });
      const body = (await response.json().catch(() => ({}))) as { profile?: Partial<Profile>; error?: string };
      if (!response.ok || !body.profile) {
        const known = body.error === "Resume must be under 5MB" || body.error === "Could not read this file. Try a different format.";
        throw new Error(known ? body.error : "Could not parse resume. Try again or fill manually.");
      }
      const filled = mergeResumeProfile(body.profile);
      setImportState({
        kind: "success",
        message: `Filled ${filled} ${filled === 1 ? "field" : "fields"} from your resume. Review and save.`,
      });
    } catch (error) {
      setImportState({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not parse resume. Try again or fill manually.",
      });
    } finally {
      if (resumeInput.current) resumeInput.current.value = "";
    }
  }

  async function save() {
    setState({ kind: "saving" });
    // Normalise the way the server will, so a half-typed URL never silently
    // vanishes without the field showing it.
    const cleaned: Profile = {
      ...draft,
      links: draft.links.map((l) => ({ label: l.label.trim() || "Link", url: cleanUrl(l.url) ?? "" })).filter((l) => l.url),
      hourlyRate: parseRate(draft.hourlyRate, PROFILE_LIMITS.maxRateHourly),
      monthlyRate: parseRate(draft.monthlyRate, PROFILE_LIMITS.maxRateMonthly),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toRow(cleaned)),
      });
      const body = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string };
      if (!res.ok) {
        setState({ kind: "error", message: body.error ?? "Could not save. Try again." });
        return;
      }
      const next = body.profile ?? cleaned;
      setSaved(next);
      setDraft(next);
      setEditing(false);
      setState({ kind: "saved" });
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setState({ kind: "idle" }), 2600);
    } catch {
      setState({ kind: "error", message: "You look offline. The profile is still here — try again in a bit." });
    }
  }

  /* ---------- left rail: live preview ---------- */

  const preview = (
    <aside className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none lg:sticky lg:top-28">
      <div className="card p-6 text-center">
        <AvatarPicker
          userId={userId}
          value={draft.avatarUrl}
          name={draft.fullName}
          initials={initialsOf(draft.fullName, authEmail)}
          onChange={(url) => set("avatarUrl", url)}
        />

        <h2 className="font-display mt-5 text-xl font-extrabold tracking-tight wrap-anywhere">{shownName}</h2>
        {draft.headline ? (
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {draft.headline}
          </p>
        ) : (
          <p className="mt-1.5 text-[0.9375rem]" style={{ color: "var(--color-faint)" }}>
            No headline yet
          </p>
        )}

        <span
          className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold"
          style={{ background: "var(--color-paper-2)", color: "var(--color-ink-2)" }}
        >
          <Dot tone={availability.tone} />
          {availability.label}
        </span>

        {rateLine(draft) && (
          <p className="font-display mt-4 text-lg font-extrabold" style={{ color: "var(--color-accent-deep)" }}>
            {rateLine(draft)}
          </p>
        )}

        {(draft.location || draft.timezone) && (
          <p className="mt-3 text-[0.8125rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {[draft.location, draft.timezone].filter(Boolean).join(" · ")}
          </p>
        )}

        {draft.niches.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {draft.niches.map((n) => (
              <span
                key={n}
                className="rounded-full px-2.5 py-1 text-[0.75rem] font-semibold"
                style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-deep)" }}
              >
                {nicheLabel(n)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 text-left">
          <div className="flex items-baseline justify-between text-[0.75rem] font-semibold uppercase tracking-wide">
            <span style={{ color: "var(--color-faint)" }}>Profile strength</span>
            <span style={{ color: "var(--color-accent-deep)" }}>{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-line)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${percent}%`, background: "var(--color-accent)" }}
            />
          </div>
        </div>
      </div>

      {!editing && (
        <button type="button" onClick={() => setEditing(true)} className="btn btn-ink mt-4 w-full">
          Edit profile
        </button>
      )}
    </aside>
  );

  /* ---------- read mode ---------- */

  const read = (
    <div className="space-y-5">
      <section className="card p-6 md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">About</h2>
        {draft.bio ? (
          <p className="mt-4 whitespace-pre-line text-[1.0625rem] leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
            {draft.bio}
          </p>
        ) : (
          <p className="mt-4 text-[1.0625rem]" style={{ color: "var(--color-faint)" }}>
            Nothing written yet. Two or three sentences on what you do and who you do it for is enough.
          </p>
        )}
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">The details</h2>
        <div className="mt-4 divide-y" style={{ borderColor: "var(--color-line)" }}>
          <ReadRow label="Email">{draft.contactEmail || authEmail}</ReadRow>
          <ReadRow label="Experience">{experienceMeta(draft.experience).label}</ReadRow>
          <ReadRow label="Rates">{rateLine(draft) || <Empty>Not set</Empty>}</ReadRow>
          <ReadRow label="Specialities">
            {draft.niches.length ? draft.niches.map(nicheLabel).join(", ") : <Empty>None picked</Empty>}
          </ReadRow>
          <ReadRow label="Location">{draft.location || <Empty>Not set</Empty>}</ReadRow>
          <ReadRow label="Timezone">{draft.timezone || <Empty>Not set</Empty>}</ReadRow>
          <ReadRow label="Languages">
            {draft.languages.length ? draft.languages.join(", ") : <Empty>Not set</Empty>}
          </ReadRow>
          <ReadRow label="Status">
            <span className="inline-flex items-center gap-2">
              <Dot tone={availability.tone} />
              {availability.label} — {availability.note}
            </span>
          </ReadRow>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Portfolio</h2>
        {draft.links.length ? (
          <ul className="mt-4 space-y-2">
            {draft.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="panel flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:border-[var(--color-ink)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-semibold">{link.label}</span>
                    <span className="block truncate text-[0.8125rem]" style={{ color: "var(--color-muted)" }}>
                      {hostOf(link.url)}
                    </span>
                  </span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden style={{ color: "var(--color-ink-2)", flex: "none" }}>
                    <path d="M5 10 10 5M5.6 4.7H10.3V9.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[0.9375rem]" style={{ color: "var(--color-faint)" }}>
            No links yet. A portfolio, a Google Drive folder of samples, even a LinkedIn — clients click the first one.
          </p>
        )}
      </section>
    </div>
  );

  /* ---------- edit mode ---------- */

  const edit = (
    <div className="space-y-5">
      <section className="card overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-deep)" }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                <path d="M7 3.75h7l3 3V20.25H7V3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M14 3.75v3h3M9.5 15.25l2.5-2.5 2.5 2.5M12 12.75v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Import from resume</h2>
              <p className="mt-1 text-[0.875rem] leading-relaxed" style={{ color: "#6b6863" }}>
                Pull in the useful bits first. Existing profile fields stay untouched.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary shrink-0"
            disabled={importState.kind === "reading"}
            onClick={() => resumeInput.current?.click()}
          >
            {importState.kind === "reading" ? "Reading…" : "Choose resume"}
          </button>
        </div>

        <input
          ref={resumeInput}
          className="sr-only"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importResume(file);
          }}
        />

        <div
          className="mt-5 rounded-[var(--radius-panel)] border border-dashed px-5 py-4 text-center transition-colors"
          style={{
            borderColor: draggingResume ? "var(--color-accent)" : "var(--color-line-2)",
            background: draggingResume ? "var(--color-accent-soft)" : "var(--color-paper-2)",
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (importState.kind !== "reading") setDraggingResume(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDraggingResume(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDraggingResume(false);
            const file = event.dataTransfer.files?.[0];
            if (file && importState.kind !== "reading") void importResume(file);
          }}
        >
          <p className="text-[0.875rem] font-semibold">Drop a PDF or Word file here</p>
          <p className="mt-1 text-[0.75rem]" style={{ color: "#6b6863" }}>
            PDF, DOCX, or DOC · 5MB max
          </p>
        </div>

        {importState.kind !== "idle" && (
          <div
            className="mt-4 flex items-start gap-2.5 text-[0.875rem] leading-relaxed"
            style={{
              color:
                importState.kind === "error"
                  ? "#a33b29"
                  : importState.kind === "success"
                    ? "var(--color-accent-deep)"
                    : "var(--color-ink-2)",
            }}
            role="status"
            aria-live="polite"
          >
            {importState.kind === "reading" ? (
              <svg className="mt-0.5 shrink-0 animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
                <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <span aria-hidden className="font-bold">
                {importState.kind === "success" ? "✓" : "!"}
              </span>
            )}
            <span>
              {importState.kind === "reading" ? "Reading your resume..." : importState.message}
              {importState.kind === "error" && importState.needsKey && (
                <>
                  {" "}
                  <a href="/cover-letter" className="font-semibold underline underline-offset-2">
                    Add a key
                  </a>
                </>
              )}
            </span>
          </div>
        )}

        <p className="mt-4 text-[0.75rem] leading-relaxed" style={{ color: "#6b6863" }}>
          Resume text is sent to your selected AI provider for this import. Verse does not save the file or your API key.
        </p>
      </section>

      <Section step="1" title="The basics" blurb="Name, one line of pitch, and where a client should email you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <input
              id="p-name"
              className="field"
              value={draft.fullName}
              maxLength={PROFILE_LIMITS.maxName}
              placeholder="Maria Santos"
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-email" hint="Login: nothing changes here">
              Contact email
            </Label>
            <input
              id="p-email"
              type="email"
              inputMode="email"
              className="field"
              value={draft.contactEmail}
              maxLength={PROFILE_LIMITS.maxEmail}
              placeholder={authEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="p-headline" hint={`${draft.headline.length}/${PROFILE_LIMITS.maxHeadline}`}>
            Headline
          </Label>
          <input
            id="p-headline"
            className="field"
            value={draft.headline}
            maxLength={PROFILE_LIMITS.maxHeadline}
            placeholder="SEO VA for home-service brands · 4 years, 30+ accounts"
            onChange={(e) => set("headline", e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="p-bio" hint={`${draft.bio.length}/${PROFILE_LIMITS.maxBio}`}>
            About you
          </Label>
          <textarea
            id="p-bio"
            className="field"
            rows={6}
            value={draft.bio}
            maxLength={PROFILE_LIMITS.maxBio}
            placeholder="What you do, who you do it for, and one thing you got a client. Skip the adjectives, keep the numbers."
            onChange={(e) => set("bio", e.target.value)}
          />
        </div>
      </Section>

      <Section
        step="2"
        title="What you do"
        blurb={`Up to ${PROFILE_LIMITS.maxNiches} specialities. Fewer and sharper beats a list of everything.`}
      >
        <div className="space-y-5">
          {NICHE_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-wide" style={{ color: "var(--color-faint)" }}>
                {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {NICHES.filter((n) => n.group === group).map((n) => {
                  const on = draft.niches.includes(n.id);
                  const full = !on && draft.niches.length >= PROFILE_LIMITS.maxNiches;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className="chip"
                      data-on={on}
                      aria-pressed={on}
                      disabled={full}
                      title={full ? `Deselect one to add another` : n.blurb}
                      style={full ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                      onClick={() => toggleNiche(n.id)}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Label htmlFor="p-exp">Experience level</Label>
          <select
            id="p-exp"
            className="field"
            value={draft.experience}
            onChange={(e) => set("experience", e.target.value as ExperienceLevel)}
          >
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[0.8125rem]" style={{ color: "var(--color-muted)" }}>
            {experienceMeta(draft.experience).note}
          </p>
        </div>
      </Section>

      <Section step="3" title="Your rates" blurb="In US dollars, the way clients quote. Leave one blank if you only work the other way.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-hourly">Hourly rate</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.9375rem]" style={{ color: "var(--color-faint)" }}>
                $
              </span>
              <input
                id="p-hourly"
                type="number"
                inputMode="decimal"
                min={1}
                max={PROFILE_LIMITS.maxRateHourly}
                step="0.5"
                className="field !pl-8"
                value={draft.hourlyRate ?? ""}
                placeholder="10"
                onChange={(e) => set("hourlyRate", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            {draft.hourlyRate != null && draft.hourlyRate > 0 && (
              <p className="mt-2 text-[0.8125rem]" style={{ color: "var(--color-muted)" }}>
                Full time that is about ${Math.round(draft.hourlyRate * 160).toLocaleString("en-US")}/mo at 40 hrs a week.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="p-monthly">Monthly rate</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.9375rem]" style={{ color: "var(--color-faint)" }}>
                $
              </span>
              <input
                id="p-monthly"
                type="number"
                inputMode="decimal"
                min={1}
                max={PROFILE_LIMITS.maxRateMonthly}
                step="50"
                className="field !pl-8"
                value={draft.monthlyRate ?? ""}
                placeholder="1600"
                onChange={(e) => set("monthlyRate", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section step="4" title="Proof" blurb={`Up to ${PROFILE_LIMITS.maxLinks} links. Portfolio, samples, LinkedIn, a Loom — whatever you would paste in an application.`}>
        <div className="space-y-3">
          {draft.links.map((link, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]">
              <input
                aria-label={`Link ${i + 1} label`}
                className="field"
                value={link.label}
                maxLength={PROFILE_LIMITS.maxLabel}
                placeholder="Portfolio"
                onChange={(e) => setLink(i, { label: e.target.value })}
              />
              <input
                aria-label={`Link ${i + 1} URL`}
                className="field"
                inputMode="url"
                value={link.url}
                placeholder="https://"
                onChange={(e) => setLink(i, { url: e.target.value })}
              />
              <button
                type="button"
                onClick={() => set("links", draft.links.filter((_, j) => j !== i))}
                className="btn btn-ghost w-auto justify-self-end !px-4"
                aria-label={`Remove link ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {draft.links.length < PROFILE_LIMITS.maxLinks && (
          <button
            type="button"
            onClick={() => set("links", [...draft.links, { label: "", url: "" }])}
            className="btn btn-ghost mt-3"
          >
            + Add a link
          </button>
        )}
      </Section>

      <Section step="5" title="Where and when" blurb="Clients filter on overlap hours more than anything else. Be specific.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-location">Location</Label>
            <input
              id="p-location"
              className="field"
              value={draft.location}
              maxLength={PROFILE_LIMITS.maxLocation}
              placeholder="Cebu City, Philippines"
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-zone">Timezone</Label>
            <select id="p-zone" className="field" value={draft.timezone} onChange={(e) => set("timezone", e.target.value)}>
              <option value="">Not set</option>
              {draft.timezone && !ZONES.includes(draft.timezone) && <option value={draft.timezone}>{draft.timezone}</option>}
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => set("timezone", localZone())}
              className="tap mt-2 text-[0.8125rem] font-semibold underline underline-offset-2"
              style={{ color: "var(--color-accent-deep)" }}
            >
              Use this device&apos;s timezone
            </button>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="p-lang" hint={`${draft.languages.length}/${PROFILE_LIMITS.maxLanguages}`}>
            Languages
          </Label>
          <div className="flex gap-2">
            <input
              id="p-lang"
              className="field"
              value={language}
              maxLength={PROFILE_LIMITS.maxLanguage}
              placeholder="English"
              onChange={(e) => setLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addLanguage(language);
              }}
            />
            <button
              type="button"
              className="btn btn-ghost !px-5"
              onClick={() => addLanguage(language)}
              disabled={!language.trim() || draft.languages.length >= PROFILE_LIMITS.maxLanguages}
            >
              Add
            </button>
          </div>

          {draft.languages.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {draft.languages.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    className="chip"
                    data-on="true"
                    onClick={() => set("languages", draft.languages.filter((x) => x !== l))}
                    aria-label={`Remove ${l}`}
                  >
                    {l}
                    <span aria-hidden style={{ opacity: 0.7 }}>
                      ×
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {draft.languages.length < PROFILE_LIMITS.maxLanguages && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[0.8125rem]" style={{ color: "var(--color-faint)" }}>
                Common here:
              </span>
              {LANGUAGE_IDEAS.filter((l) => !draft.languages.some((x) => x.toLowerCase() === l.toLowerCase()))
                .slice(0, 5)
                .map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => addLanguage(l)}
                    className="tap text-[0.8125rem] font-semibold underline underline-offset-2"
                    style={{ color: "var(--color-accent-deep)" }}
                  >
                    {l}
                  </button>
                ))}
            </div>
          )}
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium">Availability</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {AVAILABILITY.map((a) => {
              const on = draft.availability === a.id;
              return (
                <label
                  key={a.id}
                  className="panel flex cursor-pointer items-start gap-2.5 p-4 transition-all"
                  style={{
                    borderColor: on ? "var(--color-accent)" : "var(--color-line-2)",
                    background: on ? "var(--color-accent-soft)" : "var(--color-surface)",
                  }}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={a.id}
                    checked={on}
                    onChange={() => set("availability", a.id as Availability)}
                    className="sr-only"
                  />
                  <span className="mt-1.5">
                    <Dot tone={a.tone} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-semibold">{a.label}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                      {a.note}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Section>
    </div>
  );

  return (
    <section className="px-5 pb-24 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-6xl">
        {!ready && (
          <p
            className="panel mb-6 p-4 text-[0.9375rem] leading-relaxed"
            style={{ borderColor: "#e5c9a6", background: "#fdf6ec", color: "#7a5320" }}
            role="status"
          >
            The <code>profiles</code> table doesn&apos;t exist in Supabase yet, so nothing here will save. Run{" "}
            <code>supabase/migrations/2026-08-04-profiles.sql</code> in the SQL editor first.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-8">
          {preview}
          <div>{editing ? edit : read}</div>
        </div>
      </div>

      {/* Save bar. Fixed at the bottom of the viewport, above the mobile nav. */}
      {/* Only show when there are changes, or we're mid-save, or just saved, or error */}
      {editing && (dirty || state.kind !== "idle") && (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 px-4"
          style={{ bottom: "calc(1rem + var(--ally-bottomnav, 0px))" }}
        >
          <div
            className="pointer-events-auto mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-panel)",
              boxShadow: "var(--shadow-float)",
            }}
          >
            <p className="text-[0.875rem]" style={{ color: state.kind === "error" ? "#b4462f" : "var(--color-muted)" }} aria-live="polite">
              {state.kind === "error"
                ? state.message
                : state.kind === "saving"
                  ? "Saving…"
                  : state.kind === "saved"
                    ? "Saved!"
                    : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDraft(saved);
                  setState({ kind: "idle" });
                  setEditing(false);
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={!dirty || state.kind === "saving"}>
                {state.kind === "saving" ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
