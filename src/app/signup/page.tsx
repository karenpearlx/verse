import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

export default function Signup() {
  return (
    <AuthShell
      eyebrow="Free to start"
      title="Create your account"
      sub="Takes about a minute. No card to sign up, and no placement fee, ever."
      aside={{
        heading: "What you unlock",
        points: [
          "Cover letter builder that reads the job post and writes from your profile",
          "Resume builder with templates made for remote VA roles",
          "Application tracker with status, notes, and links in one place",
          "Automatic follow-up reminders after five days",
          "Job matches picked for your niches on your dashboard",
        ],
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="tap font-medium underline underline-offset-4" style={{ color: "var(--color-accent)" }}>
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="mt-8" style={{ minHeight: 380 }} />}>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
