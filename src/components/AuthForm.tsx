"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.92v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.92a9 9 0 0 0 0 8.08l3.03-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.96l3.03 2.33C4.66 5.16 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ animation: "spin .8s linear infinite" }}>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
        <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  // /auth/callback bounces failures back here as ?error=…
  const params = useSearchParams();
  const callbackError = params.get("error");
  // Where the user was headed before we bounced them here (e.g. /settings).
  // Same-origin paths only — an open redirect is not a feature.
  const requestedNext = params.get("next");
  // Default landing is the dashboard: it explains itself to a brand-new
  // account, unlike the tracker's empty board.
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google">(null);
  const [error, setError] = useState<string | null>(
    callbackError && /invalid flow state/i.test(callbackError)
      ? "Google sign-in hit a glitch. Please try Continue with Google once more."
      : callbackError,
  );
  const [notice, setNotice] = useState<string | null>(null);

  // A raced OAuth callback can show "invalid flow state" even when the first
  // request already signed the user in. If we have a session, just continue.
  useEffect(() => {
    if (!callbackError || !/invalid flow state|flow state/i.test(callbackError)) return;
    let live = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!live || !data.session) return;
        router.replace(next);
        router.refresh();
      })
      .catch(() => {
        /* keep the friendlier error on screen */
      });
    return () => {
      live = false;
    };
  }, [callbackError, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (isSignup && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setBusy("email");
    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || null },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (err) throw err;

        // Supabase returns a user with no session when email confirmation is on.
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        setNotice(
          `Account created. Check ${email} for a confirmation link — you'll need it before you can sign in. No email after a few minutes? Check your spam folder, and make sure the address above is spelled right.`,
        );
        setPassword("");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(null);
    }
  };

  const google = () => {
    setError(null);
    setNotice(null);
    setBusy("google");
    // Server route sets the PKCE code_verifier via Set-Cookie, then bounces
    // through /auth/continue before Google. Client-side signInWithOAuth can
    // lose that cookie before navigation and break exchangeCodeForSession.
    window.location.assign(`/auth/google?next=${encodeURIComponent(next)}`);
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={google}
        disabled={busy !== null}
        className="btn btn-ghost w-full !py-3.5"
        style={{ opacity: busy !== null ? 0.6 : 1 }}
      >
        {busy === "google" ? <Spinner /> : <GoogleMark />}
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1" style={{ background: "var(--color-line)" }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-faint)" }}>
          or
        </span>
        <span className="h-px flex-1" style={{ background: "var(--color-line)" }} />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {isSignup && (
          <Field
            label="Full name"
            name="name"
            type="text"
            placeholder="Juan Dela Cruz"
            autoComplete="name"
            value={fullName}
            onChange={setFullName}
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          value={password}
          onChange={setPassword}
        />

        {!isSignup && (
          <div className="flex items-center justify-between pt-1">
            <label
              className="-my-2 flex min-h-[44px] cursor-pointer items-center gap-2 py-2 text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 accent-[var(--color-accent)]" />
              Keep me signed in
            </label>
            <Link
              href="/forgot-password"
              className="-my-2 inline-flex min-h-[44px] items-center py-2 text-sm underline underline-offset-4"
              style={{ color: "var(--color-muted)" }}
            >
              Forgot password?
            </Link>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl p-3 text-[0.875rem] leading-relaxed"
            style={{ background: "#fbecef", color: "#8f2f47" }}
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl p-3 text-[0.875rem] leading-relaxed"
            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-deep)" }}
          >
            {notice}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full !py-3.5" disabled={busy !== null}>
          {busy === "email" ? <Spinner /> : null}
          {isSignup ? "Create free account" : "Sign in"}
        </button>
      </form>

      {isSignup && (
        <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: "var(--color-faint)" }}>
          By signing up you agree to our{" "}
          <Link href="/terms" className="tap underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="tap underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/** Supabase errors are usually readable, but a few are useless to a human. */
function messageFor(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/invalid flow state|flow state/i.test(raw))
    return "Google sign-in hit a glitch. Please try Continue with Google once more.";
  if (/invalid login credentials/i.test(raw)) return "That email and password don't match an account.";
  if (/email not confirmed/i.test(raw)) return "Confirm your email first — check your inbox for the link.";
  if (/user already registered/i.test(raw)) return "There's already an account with that email. Try signing in.";
  if (/provider is not enabled|unsupported provider/i.test(raw))
    return "Google sign-in isn't switched on for this project yet. Use email and password for now.";
  if (/fetch|network/i.test(raw)) return "Couldn't reach the server. Check your connection and try again.";
  return raw || "Something went wrong. Try again.";
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium" style={{ color: "var(--color-ink-2)" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </div>
  );
}
