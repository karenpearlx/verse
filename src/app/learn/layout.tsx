import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Learn to Become a Virtual Assistant — Free Training",
  description:
    "Free and Pro virtual assistant training for Filipino VAs — from how-to-start tracks to specialist skills like SEO, bookkeeping and email marketing.",
  path: "/learn",
});

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
