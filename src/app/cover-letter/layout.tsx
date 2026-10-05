import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "VA Cover Letter Generator — Tailored in Minutes",
  description:
    "Write a tailored virtual assistant cover letter in minutes. Template or AI mode, with tone options and your saved profile.",
  path: "/cover-letter",
});

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
