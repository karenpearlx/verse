"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Bottom tab bar for phones (hidden from 768px up, where the header nav takes over).
 *
 * Rendered once from the root layout, so it has to opt itself out of the routes
 * that own the whole viewport: the admin console and the auth screens.
 *
 * The fixed bar is portaled to document.body so a transformed ancestor (e.g.
 * pull-to-refresh) cannot trap it mid-page. Height lives in `--ally-bottomnav`.
 */

const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/offline",
];

type Tab = {
  key: string;
  href: string;
  label: string;
  /** Extra paths that should light this tab up. */
  also?: string[];
  icon: (active: boolean) => React.ReactNode;
};

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

/** Active icons get a faint currentColor wash so the state reads without colour alone. */
const wash = (active: boolean) => (active ? "rgba(13,155,138,0.14)" : "none");

function makeTabs(signedIn: boolean): Tab[] {
  return [
    {
      key: "home",
      href: signedIn ? "/dashboard" : "/",
      label: signedIn ? "Dashboard" : "Home",
      icon: (a) => (
        <Svg>
          <path d="M3.6 10.1 12 3.6l8.4 6.5V19a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4Z" {...S} fill={wash(a)} />
          <path d="M9.4 20.4v-6.2h5.2v6.2" {...S} />
        </Svg>
      ),
    },
    {
      key: "jobs",
      href: "/jobs",
      label: "Jobs",
      icon: (a) => (
        <Svg>
          <rect x="3" y="7.4" width="18" height="13" rx="2.4" {...S} fill={wash(a)} />
          <path d="M8.6 7.4V5.8A1.8 1.8 0 0 1 10.4 4h3.2a1.8 1.8 0 0 1 1.8 1.8v1.6" {...S} />
          <path d="M3 12.6h18" {...S} />
        </Svg>
      ),
    },
    {
      key: "tracker",
      href: "/tracker",
      label: "Tracker",
      icon: (a) => (
        <Svg>
          <rect x="4.4" y="4.6" width="15.2" height="15.8" rx="2.4" {...S} fill={wash(a)} />
          <path d="M8.6 3.2h6.8v2.9H8.6z" {...S} fill={a ? "rgba(13,155,138,0.14)" : "var(--color-surface)"} />
          <path d="m8.7 12.6 2.1 2.1 4.5-4.5" {...S} />
        </Svg>
      ),
    },
    {
      key: "courses",
      href: "/courses",
      label: "Courses",
      also: ["/learn", "/interview-prep"],
      icon: (a) => (
        <Svg>
          <path d="M4 5.2h5.1c1.6 0 2.9 1.1 2.9 2.5v11c0-1.2-1.1-2.1-2.5-2.1H4Z" {...S} fill={wash(a)} />
          <path d="M20 5.2h-5.1c-1.6 0-2.9 1.1-2.9 2.5v11c0-1.2 1.1-2.1 2.5-2.1H20Z" {...S} fill={wash(a)} />
        </Svg>
      ),
    },
    {
      key: "profile",
      href: signedIn ? "/profile" : "/login",
      label: signedIn ? "Profile" : "Sign in",
      also: signedIn ? ["/settings", "/resume"] : [],
      icon: (a) => (
        <Svg>
          <circle cx="12" cy="8.4" r="3.6" {...S} fill={wash(a)} />
          <path d="M4.9 20.2a7.3 7.3 0 0 1 14.2 0" {...S} fill={wash(a)} />
        </Svg>
      ),
    },
  ];
}

function isActive(pathname: string, tab: Tab) {
  const paths = [tab.href, ...(tab.also ?? [])];
  return paths.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}

export default function MobileNav() {
  const pathname = usePathname() ?? "/";
  const { status, user, ready } = useAuth();
  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tell the document a bottom bar exists, so globals.css can hand out the
  // height to the spacer and to anything else pinned to the bottom.
  useEffect(() => {
    const el = document.documentElement;
    if (hidden) el.removeAttribute("data-bottomnav");
    else el.setAttribute("data-bottomnav", "on");
    return () => el.removeAttribute("data-bottomnav");
  }, [hidden]);

  if (hidden) return null;

  const signedIn = ready && status === "in" && Boolean(user);
  const tabs = makeTabs(signedIn);

  const bar = (
    <nav
      aria-label="Primary"
      className="ally-bottomnav fixed inset-x-0 bottom-0 z-[60] md:hidden"
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--color-line)",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -8px 24px -20px rgba(28,26,23,0.5)",
      }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex h-[3.75rem] flex-col items-center justify-center gap-1 transition-colors active:scale-95 active:opacity-70"
                style={{
                  color: active ? "var(--color-accent-deep)" : "#6b6863",
                  transition: "color 0.2s, transform 0.1s, opacity 0.1s",
                }}
              >
                <span
                  className="grid h-6 w-6 place-items-center transition-transform duration-200"
                  style={{ transform: active ? "translateY(-1px)" : "none" }}
                >
                  {tab.icon(active)}
                </span>
                <span
                  className="text-[0.6875rem] leading-none tracking-[0.01em]"
                  style={{ fontWeight: active ? 700 : 500 }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <div aria-hidden style={{ height: "var(--ally-bottomnav, 0px)" }} />
      {mounted ? createPortal(bar, document.body) : null}
    </>
  );
}
