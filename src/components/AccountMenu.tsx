"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl, displayName, initials } from "@/lib/AuthContext";
import { isClientAdminEmail } from "@/lib/admin/client-allowlist";

/* ---------- shared bits ---------- */

function Avatar({ user, size = 26 }: { user: User; size?: number }) {
  const src = avatarUrl(user);
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      // Google serves these from a CDN we don't proxy; 26px, no layout cost.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, border: "1px solid var(--color-line-2)" }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: "var(--color-accent-soft)",
        color: "var(--color-accent-deep)",
        fontSize: Math.max(10, Math.round(size * 0.4)),
        letterSpacing: "0.02em",
      }}
    >
      {initials(user)}
    </span>
  );
}

function useSignOut(onDone?: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await createClient().auth.signOut();
      onDone?.();
      // Server components rendered with the old cookie need to be thrown away,
      // and anything private shouldn't linger on screen after the click.
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [onDone, router]);

  return { signOut, busy };
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.6" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.9 13.4c.5-2.4 2.6-4 5.1-4s4.6 1.6 5.1 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2.15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.9l.9 1.5 1.7-.3.5 1.7 1.6.7-.7 1.6.7 1.6-1.6.7-.5 1.7-1.7-.3L8 14.1l-.9-1.5-1.7.3-.5-1.7-1.6-.7.7-1.6-.7-1.6 1.6-.7.5-1.7 1.7.3L8 1.9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.9l1.5 3.9 3.9 1.5-3.9 1.5L8 12.7 6.5 8.8 2.6 7.3l3.9-1.5L8 1.9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6.2 13.5H3.4a.9.9 0 0 1-.9-.9V3.4a.9.9 0 0 1 .9-.9h2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.4 10.7 13.1 8l-2.7-2.7M12.8 8H6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.2 7.2 8 3.4l4.8 3.8V13a.9.9 0 0 1-.9.9H4.1a.9.9 0 0 1-.9-.9V7.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.4 13.9v-3.6h3.2v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- desktop ---------- */

export function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  // Hash-based allowlist check is async; the link just appears a tick later.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    isClientAdminEmail(user.email).then((ok) => {
      if (alive) setIsAdmin(ok);
    });
    return () => {
      alive = false;
    };
  }, [user.email]);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const { signOut, busy } = useSignOut(close);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = displayName(user);

  return (
    <div ref={wrap} className="relative ml-2">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.email ?? name}`}
        className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors"
        style={{
          border: `1px solid ${open ? "var(--color-ink)" : "var(--color-line-2)"}`,
          background: "var(--color-surface)",
        }}
      >
        <Avatar user={user} />
        <span
          className="max-w-[9rem] truncate text-[0.875rem] font-medium"
          style={{ color: "var(--color-ink)" }}
        >
          {name}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", color: "var(--color-faint)" }}
        >
          <path d="M2.8 4.4 6 7.6l3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className="absolute right-0 top-[calc(100%+.6rem)] w-64 overflow-hidden p-2"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--shadow-float)",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(-6px)",
          transition: "opacity .18s ease, transform .18s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-2.5">
          <Avatar user={user} size={34} />
          <span className="min-w-0">
            <span className="block truncate text-[0.875rem] font-semibold" style={{ color: "var(--color-ink)" }}>
              {name}
            </span>
            <span className="block truncate text-xs" style={{ color: "var(--color-muted)" }}>
              {user.email}
            </span>
          </span>
        </div>

        <span className="my-1 block h-px" style={{ background: "var(--color-line)" }} />

        <Link
          href="/profile"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={close}
          className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[0.875rem] font-medium transition-colors hover:bg-[var(--color-paper-2)]"
          style={{ color: "var(--color-ink-2)" }}
        >
          <PersonIcon />
          Profile
        </Link>

        <Link
          href="/settings"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={close}
          className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[0.875rem] font-medium transition-colors hover:bg-[var(--color-paper-2)]"
          style={{ color: "var(--color-ink-2)" }}
        >
          <GearIcon />
          Settings
        </Link>

        <Link
          href="/pricing"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={close}
          className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[0.875rem] font-medium transition-colors hover:bg-[var(--color-paper-2)]"
          style={{ color: "var(--color-ink-2)" }}
        >
          <SparkIcon />
          Plans &amp; pricing
        </Link>

        {isAdmin ? (
          <Link
            href="/admin"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={close}
            className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[0.875rem] font-medium transition-colors hover:bg-[var(--color-paper-2)]"
            style={{ color: "var(--color-ink-2)" }}
          >
            <AdminIcon />
            Admin
          </Link>
        ) : null}

        <button
          type="button"
          role="menuitem"
          onClick={() => void signOut()}
          disabled={busy}
          tabIndex={open ? 0 : -1}
          className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-[0.875rem] font-medium transition-colors hover:bg-[var(--color-paper-2)]"
          style={{ color: "var(--color-ink-2)", opacity: busy ? 0.6 : 1 }}
        >
          <ExitIcon />
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

/* ---------- mobile sheet ---------- */

/**
 * The account block at the foot of the phone sheet.
 *
 * The card itself is the link to /profile — Profile, Settings and Plans were
 * three more rows saying what tapping your own name already says, and the
 * sheet is not where you want a scroll. Settings and billing hang off the
 * profile page now. Sign out stays, because it is the one thing here that is
 * not navigation and should never be a tap deeper than it has to be.
 */
export function AccountSheetBlock({ user, onDismiss }: { user: User; onDismiss?: () => void }) {
  const { signOut, busy } = useSignOut(onDismiss);

  return (
    <div className="mt-2">
      <Link
        href="/profile"
        onClick={onDismiss}
        aria-label={`Your profile, ${displayName(user)}`}
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors active:opacity-70"
        style={{ background: "var(--color-paper-2)" }}
      >
        <Avatar user={user} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-semibold" style={{ color: "var(--color-ink)" }}>
            {displayName(user)}
          </span>
          <span className="block truncate text-sm" style={{ color: "var(--color-muted)" }}>
            {user.email}
          </span>
          <span className="mt-0.5 block text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
            Profile, settings &amp; plan
          </span>
        </span>
        <span aria-hidden className="flex-none" style={{ color: "var(--color-faint)" }}>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M1.5 1.5 6.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
        className="btn btn-ghost mt-2 w-full !py-3.5 !text-base"
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <ExitIcon />
        {busy ? "Signing out\u2026" : "Sign out"}
      </button>
    </div>
  );
}
