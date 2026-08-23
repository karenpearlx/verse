"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Wordmark from "./Wordmark";
import FollowUpBell from "./FollowUpBell";
import { AccountMenu, AccountSheetBlock } from "./AccountMenu";
import PreferencesSync from "./PreferencesSync";
import { useAuth } from "@/lib/AuthContext";
import { isClientAdminEmail } from "@/lib/admin/client-allowlist";

type NavLink = {
  href: string;
  label: string;
  /** Hidden from the desktop bar below 1024px while signed in. */
  wide?: boolean;
  /** Hidden below 1024px whether or not you are signed in. */
  alwaysWide?: boolean;
};

const DASHBOARD: NavLink = { href: "/dashboard", label: "Dashboard" };

// `wide` links are hidden from the desktop bar below 1024px. Signed in, six
// links plus the bell and the account menu overflow the 768px header, and a
// wrapped nav looks broken. Pricing is `alwaysWide` because it is the newest
// arrival and the least urgent of the six. Nothing becomes unreachable: they
// all still sit in the mobile sheet, the account menu and the footer.
const LINKS: NavLink[] = [
  { href: "/jobs", label: "Jobs" },
  { href: "/tracker", label: "Tracker" },
  { href: "/tools", label: "Tools", wide: true },
  { href: "/learn", label: "Learn" },
  { href: "/pricing", label: "Pricing", alwaysWide: true },
];

// The phone sheet is not the desktop bar with a different layout.
// Dashboard, Jobs, Tracker and Courses already live in the bottom tab bar, so
// repeating them here just buried the two things the tab bar has no room for.
// Signed in you get those two plus the account block; signed out there is no
// tab bar worth speaking of, so the sheet stays the full menu.
const SHEET_LINKS: NavLink[] = [
  { href: "/tools", label: "Tools" },
  { href: "/help", label: "Help" },
];


export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  // One subscription for the whole header; desktop and the sheet share it.
  const { status, user, ready } = useAuth();
  // Signed in, this is home: the wordmark and the first nav slot both go there.
  // While the session is still "unknown" we render the signed-out set, so the
  // header never shows a private link to someone who turns out to be a visitor.
  // Only show signed-in nav once auth is ready
  const signedIn = ready && status === "in" && Boolean(user);
  const isAdmin = signedIn && isClientAdminEmail(user?.email);
  const links = signedIn ? [DASHBOARD, ...LINKS] : LINKS;
  const sheetLinks = signedIn
    ? [...SHEET_LINKS, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])]
    : [...LINKS, { href: "/help", label: "Help" }];
  const home = signedIn ? DASHBOARD.href : "/";

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the sheet on navigation. Previous-props state rather than an effect,
  // so the new route's first paint already has it closed.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      {/* Account preferences beat whatever this device cached. */}
      <PreferencesSync user={ready ? user : null} />

      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300"
        style={{
          background: lifted ? "rgba(247,246,244,0.82)" : "transparent",
          backdropFilter: lifted ? "blur(12px)" : "none",
          borderBottom: `1px solid ${lifted ? "var(--color-line)" : "transparent"}`,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <Wordmark href={home} />

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors ${
                    l.alwaysWide || (signedIn && l.wide) ? "hidden lg:block" : ""
                  }`}
                  style={{ color: active ? "var(--color-ink)" : "var(--color-ink)", opacity: active ? 1 : 0.7 }}
                >
                  {l.label}
                  <span
                    aria-hidden
                    className="mt-1 block h-[2px] rounded-full transition-all"
                    style={{
                      background: active ? "var(--color-accent)" : "transparent",
                    }}
                  />
                </Link>
              );
            })}
            {signedIn && <FollowUpBell className="ml-2" />}
            {/* Hold the slot until the session is known, so a signed-in header
                never flashes "Sign in" on the way in. */}
            {!ready ? (
              <span
                aria-hidden
                className="ml-2 block h-10 w-[6.5rem] rounded-full"
                style={{ background: "var(--color-line)", opacity: 0.5 }}
              />
            ) : signedIn ? (
              <AccountMenu user={user!} />
            ) : (
              <Link href="/login" className="btn btn-ink ml-2 !px-5 !py-2.5 !text-sm">
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            {signedIn && <FollowUpBell forceClosed={open} />}
            <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ border: "1px solid var(--color-line-2)", background: "var(--color-surface)" }}
          >
            <span className="relative block h-3 w-4">
              <span
                className="absolute left-0 block h-[2px] w-4 rounded-full transition-all duration-300"
                style={{
                  background: "var(--color-ink)",
                  top: open ? 5 : 0,
                  transform: open ? "rotate(45deg)" : "none",
                }}
              />
              <span
                className="absolute left-0 block h-[2px] w-4 rounded-full transition-all duration-300"
                style={{
                  background: "var(--color-ink)",
                  bottom: open ? 5 : 0,
                  transform: open ? "rotate(-45deg)" : "none",
                }}
              />
            </span>
            </button>
          </div>
        </div>
      </header>

      {/* mobile sheet — sibling of header so backdrop-filter can't trap it */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transition: "opacity .28s ease",
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => setOpen(false)}
          className="absolute inset-0 w-full"
          style={{ background: "rgba(33,32,30,0.35)" }}
        />
        <div
          className="absolute inset-x-3 top-[4.5rem] card p-3"
          style={{
            transform: open ? "none" : "translateY(-10px)",
            transition: "transform .28s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {sheetLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold"
              style={{
                color: pathname === l.href ? "var(--color-accent)" : "var(--color-ink)",
              }}
            >
              {l.label}
              <span aria-hidden style={{ color: "var(--color-faint)" }}>
                ›
              </span>
            </Link>
          ))}
          {!ready ? (
            <span
              aria-hidden
              className="mt-2 block h-[3.25rem] w-full rounded-full"
              style={{ background: "var(--color-line)", opacity: 0.5 }}
            />
          ) : signedIn ? (
            <AccountSheetBlock user={user!} onDismiss={() => setOpen(false)} />
          ) : (
            <Link href="/login" className="btn btn-ink mt-2 w-full !py-3.5 !text-base">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
