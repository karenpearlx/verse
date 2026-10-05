import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Virtual Assistant Rate Calculator — What to Charge",
  description:
    "Work out a defendable hourly rate for Filipino virtual assistants, based on collected listing data for your skill and experience level.",
  path: "/pricing-tool",
});

export default function PricingToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
