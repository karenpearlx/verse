import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Virtual Assistant Resume Builder — Free VA Resume",
  description:
    "Build a clean, remote-ready virtual assistant resume free. Templates made for Filipino VAs — export when you are ready to apply.",
  path: "/resume",
});

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
