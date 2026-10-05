import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Job Application Tracker for Virtual Assistants",
  description:
    "Track every virtual assistant job application on one free board, with follow-up reminders so nothing goes cold.",
  path: "/tracker",
});

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
