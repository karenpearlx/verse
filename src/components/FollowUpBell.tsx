"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_DAYS,
  STORE,
  STORE_DAYS,
  STORE_SEEN,
  daysSince,
  markFollowUpsSeen,
  overdue,
  readApps,
  readFollowUpDays,
  subscribeApps,
  unseenFollowUps,
} from "@/lib/followups";
import { usePreferences } from "@/lib/usePreferences";

/** A cheap, referentially stable snapshot of the two keys we care about.
 *  useSyncExternalStore re-reads this on every subscription event, so it has to
 *  be a primitive — returning a fresh array here would loop forever. */
function snapshot() {
  try {
    return `${localStorage.getItem(STORE) ?? ""}|${localStorage.getItem(STORE_DAYS) ?? ""}|${localStorage.getItem(STORE_SEEN) ?? ""}`;
  } catch {
    return "";
  }
}

/** Server render has no localStorage, so it renders the empty state and the
 *  client fills in the badge after hydration. */
const serverSnapshot = () => null;

function BellIcon({ ringing }: { ringing: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      style={{
        transformOrigin: "50% 15%",
        animation: ringing ? "bell-tilt 4.5s ease-in-out 1.2s infinite" : "none",
      }}
    >
      <path
        d="M10 2.6a4.6 4.6 0 0 0-4.6 4.6c0 3.2-.9 4.6-1.6 5.4-.35.4-.08 1 .45 1h11.5c.53 0 .8-.6.45-1-.7-.8-1.6-2.2-1.6-5.4A4.6 4.6 0 0 0 10 2.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.2 16.1a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function FollowUpBell({
  className = "",
  /** The mobile menu owns the screen when it's open; the panel must yield. */
  forceClosed = false,
}: {
  className?: string;
  forceClosed?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { inAppNotifications } = usePreferences();
  const raw = useSyncExternalStore(subscribeApps, snapshot, serverSnapshot);
  const { days, list, unread } = useMemo(() => {
    if (raw === null) return { days: DEFAULT_DAYS, list: [] as ReturnType<typeof overdue>, unread: 0 };
    const d = readFollowUpDays();
    const due = overdue(readApps(), d);
    return { days: d, list: due, unread: unseenFollowUps(due).length };
  }, [raw]);

  // Close on navigation. Tracked as previous-props state rather than an effect
  // so the panel is already gone on the first render of the new route.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    markFollowUpsSeen(list.map((a) => a.id));
  }, [open, list]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrapRef.current?.querySelector("button")?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // Derived-state adjustment during render, not an effect: the panel must never
  // survive the mobile menu opening on top of it.
  if (forceClosed && open) setOpen(false);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const shown = open && !forceClosed && inAppNotifications;
  const count = list.length;
  const badge = unread;
  const label = badge
    ? `Follow-ups, ${badge} waiting`
    : count
      ? "Follow-ups, caught up on reminders"
      : "Follow-ups, nothing waiting";

  // Notifications off: the header goes quiet entirely. The tracker still flags
  // stale applications, so nothing is actually lost. Placed after every hook so
  // the order stays stable when the preference flips.
  if (!inAppNotifications) return null;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <style>{`@keyframes bell-tilt{0%,88%,100%{transform:rotate(0)}90%{transform:rotate(9deg)}93%{transform:rotate(-7deg)}96%{transform:rotate(4deg)}}`}</style>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={shown}
        aria-haspopup="dialog"
        aria-label={label}
        title={label}
        className="relative grid h-11 w-11 place-items-center rounded-full transition-colors"
        style={{
          border: "1px solid var(--color-line-2)",
          background: shown ? "var(--color-paper-2)" : "var(--color-surface)",
          color: badge ? "var(--color-accent-deep)" : "var(--color-ink-2)",
        }}
      >
        <BellIcon ringing={badge > 0} />
        {badge > 0 && (
          <span
            aria-hidden
            className="absolute grid place-items-center rounded-full text-[0.625rem] font-bold tabular-nums"
            style={{
              top: -3,
              right: -3,
              minWidth: 19,
              height: 19,
              padding: "0 5px",
              background: "#c2571c",
              color: "#fff",
              border: "2px solid var(--color-paper)",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {shown && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Applications needing a follow-up"
          tabIndex={-1}
          /* Phone: pinned to the viewport, because the bell sits inboard of the
             hamburger and a right-anchored panel would hang off the left edge.
             Desktop: anchored to the bell. */
          className="card fixed inset-x-3 top-[4.5rem] z-[60] p-4 md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+10px)] md:w-[21rem]"
          style={{
            maxHeight: "min(26rem, calc(100vh - 7rem))",
            overflowY: "auto",
            outline: "none",
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-extrabold tracking-tight">
              {count ? "Time to nudge" : "All quiet"}
            </h2>
            <span className="text-xs" style={{ color: "var(--color-faint)" }}>
              after {days} days
            </span>
          </div>

          {count === 0 ? (
            <p className="mt-2 text-[0.875rem] leading-relaxed" style={{ color: "var(--color-muted)" }}>
              Nothing has gone quiet on you yet. Anything you mark Applied or Interviewing shows up
              here once it passes {days} days.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-1">
                {list.slice(0, 6).map((a) => {
                  const age = daysSince(a.appliedAt);
                  return (
                    <li key={a.id}>
                      <Link
                        href="/tracker?filter=followup"
                        className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-paper-2)]"
                      >
                        <p className="wrap-anywhere text-[0.875rem] font-semibold leading-snug">
                          {a.role}
                        </p>
                        <p className="wrap-anywhere mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                          {a.company} · silent {age} day{age === 1 ? "" : "s"}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {count > 6 && (
                <p className="mt-1 px-3 text-xs" style={{ color: "var(--color-faint)" }}>
                  and {count - 6} more
                </p>
              )}
              <Link href="/tracker?filter=followup" className="btn btn-primary mt-3 w-full !py-2.5 !text-sm">
                Open the tracker
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
