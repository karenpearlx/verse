import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "@/components/LegalDoc";
import { CONTACT_EMAIL } from "@/lib/contact";

const CONTACT = CONTACT_EMAIL;
const UPDATED = "8 August 2026";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The rules for using Verse. Free plan and optional Pro, no placement fees, and no promises we cannot keep.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "what-verse-is",
    title: "What Verse is",
    paragraphs: [
      "Verse is a set of tools for Filipino virtual assistants: a job board pulled from public listings, a cover letter and resume builder, an application tracker, a rate checker, and lessons. A free plan covers the core tools; Pro is optional paid access for higher limits and premium courses.",
      "Verse is not an agency, a recruiter, or an employer. We are not a party to anything you agree with a client. We never take a cut of your pay and never charge a placement fee.",
      "Using Verse means you accept these terms. If you do not, please do not use it.",
    ],
  },
  {
    id: "your-account",
    title: "Your account",
    paragraphs: [
      "You need to be at least 18. Use a real email you can access, keep your login to yourself, and tell us if you think someone else got into your account.",
      "One account per person. Anything done from your account is treated as done by you.",
    ],
  },
  {
    id: "no-guarantees",
    title: "What we do not promise",
    paragraphs: [
      "Verse will not get you hired. It makes applying faster and better informed; the rest is you and the market.",
      "We also make no promise about the listings themselves:",
    ],
    bullets: [
      "A listing may be filled, expired, or removed by the time you open it.",
      "Salary figures are whatever the employer wrote, and employers exaggerate.",
      "Rate suggestions in the pricing tool are estimates from collected data, not a quote and not financial advice.",
      "Lessons and templates are general guidance, not legal, tax, or employment advice.",
    ],
  },
  {
    id: "third-party-listings",
    title: "Listings come from other sites",
    paragraphs: [
      "Jobs are collected from public boards, currently OnlineJobs.ph, RemoteOK, and We Work Remotely. We do not vet employers, verify companies, or screen for scams, and appearing on Verse is not an endorsement.",
      "Applying happens on the original site under its rules. Please do your own checking, and remember the oldest rule in remote work: a real employer never asks you to pay for a job, a training kit, or a background check.",
      "If a listing looks fraudulent, email us and we will pull it.",
    ],
  },
  {
    id: "your-content",
    title: "Your content stays yours",
    paragraphs: [
      "Your resumes, letters, notes, and profile belong to you. You give us only the permission needed to store them, process them, and show them back to you inside Verse. We do not publish them, sell them, or feed them to recruiters.",
      "You are responsible for what you upload: it should be accurate, and it should be yours to use.",
    ],
  },
  {
    id: "ai-output",
    title: "AI output is a draft",
    paragraphs: [
      "The AI writer can be confidently wrong. It can invent an achievement, mangle a company name, or claim experience you do not have. Read every letter before you send it.",
      "Whatever goes out under your name is yours, so the last check is always yours too.",
    ],
  },
  {
    id: "fair-use",
    title: "Fair use",
    paragraphs: ["Do not use Verse to do any of this:"],
    bullets: [
      "Scrape, bulk-download, or resell the job board or lesson content.",
      "Blast identical applications at every listing. It wastes everyone's time, including yours.",
      "Create fake profiles, impersonate someone, or misrepresent your experience.",
      "Post anything unlawful, harassing, or malicious, or attempt to break into other accounts.",
      "Overload or probe the service, or work around its limits.",
    ],
  },
  {
    id: "availability",
    title: "Availability",
    paragraphs: [
      "Verse is a small product. Features get added, changed, or removed. The site will occasionally be down, and a scraper run will occasionally fail. We do not promise uptime.",
      "We can suspend or close an account that breaks these terms, and we will say why where we reasonably can.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    paragraphs: [
      "Verse is provided as is, with no warranties beyond those the law will not let us disclaim.",
      "To the fullest extent Philippine law allows, we are not liable for lost work, lost income, bad hires, dodgy clients, missed opportunities, or data loss arising from your use of Verse. Our total liability is limited to what you paid us for Pro in the twelve months before the claim — or nothing, if you only used the free plan.",
    ],
  },
  {
    id: "ending-it",
    title: "Ending it",
    paragraphs: [
      "You can stop using Verse whenever you like and ask us to delete your account. We can also discontinue the service; if that happens we will give notice and a way to export your data.",
    ],
  },
  {
    id: "law",
    title: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of the Republic of the Philippines, and disputes belong to the proper courts of the Philippines. Talk to us first, though. Most things get sorted by email.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    paragraphs: [
      "If these terms change materially, the date at the top changes and we will flag it in the app. Continuing to use Verse after that means you accept the update.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalDoc
      eyebrow="Terms of service"
      title="The deal"
      titleTail=", in plain words"
      updated={UPDATED}
      summary={[
        "Free plan and optional Pro. No placement fees, no cut of your pay, no agency in the middle.",
        "We are not a recruiter. Listings come from other sites and we do not vet employers, so check before you apply.",
        "Nobody can promise you a job, and we are not going to pretend to.",
        "Your resumes, letters, and notes stay yours. Read anything the AI writes before you send it.",
        "Be honest, do not spam or scrape, and we will get along fine.",
      ]}
      sections={SECTIONS}
      contactEmail={CONTACT}
    />
  );
}
