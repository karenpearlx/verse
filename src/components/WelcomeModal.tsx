"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/AuthContext";

/**
 * First-visit welcome / signup nudge.
 *
 * Rendered once from the root layout, so like MobileNav it has to opt itself
 * out of the routes that own the whole viewport. It also stays out of the way
 * of anyone who is already signed in — they've converted, there is nothing to
 * pitch — and of anyone who has seen it before.
 *
 * The "seen" flag is written the moment it becomes visible, not on dismissal.
 * If it were written on dismissal, a visitor who read it and then clicked a
 * nav link would get it again on the next page, which is how a welcome modal
 * turns into a popup.
 */

const SEEN_KEY = "ally-welcome-seen";

/** Routes where a modal would be actively hostile. */
const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/offline",
  "/p",
];

/** Shown until the live count comes back — and if it never does. */
const FALLBACK_JOBS = "900+";

/** Long enough for the page to paint and settle first. */
const APPEAR_DELAY = 550;

const BENEFITS = [
  { key: "jobs", text: (count: string) => `${count} VA jobs, updated daily` },
  { key: "track", text: () => "Track your applications in one place on the free plan" },
  { key: "learn", text: () => "Free foundation courses to lift your rate" },
  { key: "rate", text: () => "Know what you're worth with real rate data" },
];

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private mode / storage disabled: treat as seen rather than showing this
    // on every single page view forever.
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function GiftIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden focusable="false">
      <rect
        x="4.6"
        y="13.4"
        width="22.8"
        height="14"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="3"
        y="8.6"
        width="26"
        height="5.4"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M16 8.6v18.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M16 8.6S14.4 4 11.4 4a2.9 2.9 0 0 0 0 5.8H16Zm0 0S17.6 4 20.6 4a2.9 2.9 0 0 1 0 5.8H16Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden focusable="false">
      <path
        d="m2.6 7.3 2.9 2.9 6-6.4"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeModal() {
  const pathname = usePathname();
  const { status, ready } = useAuth();

  const [open, setOpen] = useState(false);
  // Drives the enter transition: mounted first, then flipped on so the browser
  // has a frame to paint the "from" state.
  const [shown, setShown] = useState(false);
  const [jobs, setJobs] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const blocked = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // --- decide whether to open
  useEffect(() => {
    // "unknown" means the session read hasn't landed yet. Waiting avoids
    // flashing a signup pitch at someone who is already logged in.
    if (status !== "out" || blocked || open || seen()) return;

    const t = window.setTimeout(() => {
      if (seen()) return;
      markSeen();
      setOpen(true);
      requestAnimationFrame(() => setShown(true));
    }, APPEAR_DELAY);

    return () => window.clearTimeout(t);
  }, [status, blocked, open]);

  // --- live listing count, fetched only once we're actually showing something
  useEffect(() => {
    if (!open) return;
    let alive = true;

    createClient()
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count, error }) => {
        if (!alive || error || !count) return;
        setJobs(count.toLocaleString("en-US"));
      });

    return () => {
      alive = false;
    };
  }, [open]);

  const close = useCallback(() => {
    setShown(false);
    // Let the exit transition finish before unmounting.
    window.setTimeout(() => setOpen(false), 200);
    restoreFocus.current?.focus?.();
  }, []);

  // --- focus, scroll lock, Escape, tab trap
  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    // Compensating for the scrollbar keeps the page from jolting sideways
    // underneath the backdrop.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    const card = cardRef.current;
    card?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !card) return;
      const focusable = card.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === card)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open, close]);

  if (!open) return null;

  const count = jobs ?? FALLBACK_JOBS;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      style={{
        background: "rgba(28, 26, 23, 0.42)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: shown ? 1 : 0,
        transition: "opacity 0.24s ease",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .ally-welcome, .ally-welcome-row { transition: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ally-welcome-title"
        aria-describedby="ally-welcome-sub"
        tabIndex={-1}
        className="ally-welcome card-float relative w-full max-w-[27rem] p-6 sm:p-8"
        style={{
          outline: "none",
          maxHeight: "calc(100dvh - 1.5rem)",
          overflowY: "auto",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(12px) scale(0.965)",
          transition:
            "opacity 0.26s cubic-bezier(0.22, 1, 0.36, 1), transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute grid place-items-center rounded-full transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
          style={{
            top: 10,
            right: 10,
            width: 44,
            height: 44,
            color: "var(--color-muted)",
            background: "transparent",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.2 3.2l9.6 9.6m0-9.6-9.6 9.6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* icon */}
        <div
          className="grid place-items-center rounded-2xl"
          style={{
            width: 56,
            height: 56,
            background: "var(--color-accent-soft)",
            color: "var(--color-accent-deep)",
          }}
        >
          <GiftIcon />
        </div>

        <h2
          id="ally-welcome-title"
          className="font-display mt-5 text-[1.6rem] font-extrabold leading-[1.1] tracking-tight sm:text-[1.75rem]"
        >
          Start for free. Track every application<span className="dot">.</span>
        </h2>

        <p
          id="ally-welcome-sub"
          className="mt-2.5 text-[0.9375rem] leading-relaxed"
          style={{ color: "var(--color-ink-2)" }}
        >
          Verse helps Filipino VAs find jobs faster and land better rates.
        </p>

        <ul className="mt-5 space-y-2.5">
          {BENEFITS.map((b, i) => (
            <li
              key={b.key}
              className="ally-welcome-row flex items-start gap-2.5 text-[0.9375rem] leading-snug"
              style={{
                color: "var(--color-ink-2)",
                opacity: shown ? 1 : 0,
                transform: shown ? "none" : "translateY(6px)",
                transition: `opacity 0.4s ease ${120 + i * 60}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${120 + i * 60}ms`,
              }}
            >
              <span
                aria-hidden
                className="grid flex-none place-items-center rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  marginTop: 1,
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent-deep)",
                }}
              >
                <CheckIcon />
              </span>
              {b.text(count)}
            </li>
          ))}
        </ul>

        <div className="mt-7 space-y-2.5">
          <Link href="/signup" onClick={close} className="btn btn-primary w-full">
            Start free, no payment needed
          </Link>
          <Link href="/jobs" onClick={close} className="btn btn-ghost w-full">
            Browse jobs first
          </Link>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={close}
            className="tap text-[0.875rem] font-medium underline underline-offset-[5px]"
            style={{ color: "var(--color-muted)", padding: "0.5rem 0.75rem" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
