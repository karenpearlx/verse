import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import JobsBoard from "./JobsBoard";

export const metadata = pageMetadata({
  title: "Virtual Assistant Jobs — Remote VA Job Board",
  description:
    "Thousands of remote virtual assistant jobs from OnlineJobs.ph, RemoteOK, and We Work Remotely in one free board. Filter by skill, check the pay, and apply at the source.",
  path: "/jobs",
});

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--color-muted)" }}>
          Loading the job board…
        </div>
      }
    >
      <JobsBoard />
    </Suspense>
  );
}
