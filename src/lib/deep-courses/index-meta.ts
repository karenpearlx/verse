// Card copy for the course library. Written for a first-time visitor: every
// blurb answers "what will I be able to do", not "what does the file contain".
export type DeepCourseCard = {
  slug: string; kicker: string; badge: string; title: string;
  blurb: string; bullets: string[]; duration: string;
};

export const COURSES_INDEX = {
  heading: "Learn one skill properly.",
  lede: "Pick the one thing you want to be known for. Every course takes you from \u201cnever done it\u201d to \u201ccan show a client proof\u201d — in plain English, at your own pace.",
  intro: "Every course works the same way: short modules you can finish in one sitting, a worked example so you see it done before you try it, an exercise that becomes a portfolio piece, honest rate numbers, and a plain-words glossary for the jargon in job ads. The three foundation courses are free for everyone; Pro unlocks the rest.",
  cards: [
    {
      slug: "complete-va-starter", kicker: "Foundations", badge: "Free course", title: "The Complete VA Starter",
      blurb: "Never freelanced before? Start here. From an empty desk to your first paying client — what to set up, what to say, and what to do when someone actually replies.",
      bullets: [
        "Get set up properly, even with zero experience",
        "Practice tasks that become your first portfolio",
        "Real numbers on what beginners actually earn",
        "10 short modules with a quiz and glossary",
      ],
      duration: "4h 45m",
    },
    {
      slug: "applications-that-get-replies", kicker: "Writing", badge: "Free course", title: "Applications That Get Replies",
      blurb: "You\u2019re not getting rejected — you\u2019re not getting read. Learn the short, specific application that makes a busy client stop scrolling and reply to you.",
      bullets: [
        "A four-paragraph application you can reuse for every job",
        "Real job posts pulled apart line by line",
        "What to say when you have no experience yet",
        "8 short modules with a quiz and glossary",
      ],
      duration: "3h 44m",
    },
    {
      slug: "pricing-and-negotiation", kicker: "Money", badge: "Free course", title: "Pricing & Negotiation",
      blurb: "Stop guessing your rate. Work out a number you can say out loud without flinching, defend it when a client pushes back, and raise it later without losing them.",
      bullets: [
        "Your personal rate floor, from your actual bills",
        "Word-for-word scripts for the awkward money talks",
        "How and when to raise your rate without drama",
        "9 short modules with a quiz and glossary",
      ],
      duration: "3h 58m",
    },
    {
      slug: "executive-assistant", kicker: "Career skill", badge: "Premium course", title: "Executive Assistant",
      blurb: "Run one busy person\u2019s work life — inbox, calendar, follow-ups — so well they stop checking behind you. The highest-trust VA role there is.",
      bullets: [
        "Inbox and calendar systems a founder will keep",
        "How to handle a crisis while they\u2019re asleep",
        "Practice scenarios from real EA job posts",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 34m",
    },
    {
      slug: "seo-specialist", kicker: "Career skill", badge: "Premium course", title: "SEO Specialist VA",
      blurb: "Learn how to get a business found on Google — the most reliably well-paid VA skill. You practice everything on one pretend coffee shop until you can do it for a real client.",
      bullets: [
        "A full website audit you can show as your portfolio",
        "Every confusing term explained in plain words",
        "A month-by-month plan for a real local client",
        "9 modules, 2 video lessons, quiz and glossary",
      ],
      duration: "6h 39m",
    },
    {
      slug: "ai-marketing-and-aeo", kicker: "Career skill", badge: "Premium course", title: "AI Marketing & AEO",
      blurb: "Use ChatGPT and Claude like a pro — and learn AEO, the brand-new skill of getting a client mentioned inside AI answers, before most agencies figure it out.",
      bullets: [
        "Prompts that produce drafts you can actually use",
        "A content workflow with the fact-check built in",
        "Get clients cited by Google\u2019s AI and ChatGPT",
        "8 modules, a video lesson, quiz and glossary",
      ],
      duration: "4h 40m",
    },
    {
      slug: "social-media-manager", kicker: "Career skill", badge: "Premium course", title: "Social Media Manager VA",
      blurb: "Run a brand\u2019s Facebook, Instagram and TikTok — and prove it\u2019s working — without quietly becoming their unpaid photographer, copywriter and crisis team.",
      bullets: [
        "A content calendar clients happily pay monthly for",
        "What to post, when, and how to show it worked",
        "Scripts for scope creep: \u201ccan you also just\u2026\u201d",
        "8 short modules with a quiz and glossary",
      ],
      duration: "5h 24m",
    },
    {
      slug: "real-estate-va", kicker: "Career skill", badge: "Premium course", title: "Real Estate VA",
      blurb: "US agents pay well for someone who keeps their leads answered in minutes and their deals from falling apart in week three. Learn the job before your first interview.",
      bullets: [
        "The transaction timeline, explained like you\u2019re new",
        "Lead follow-up scripts agents actually use",
        "CRM upkeep that makes you hard to replace",
        "8 short modules with a quiz and glossary",
      ],
      duration: "5h 42m",
    },
    {
      slug: "ecommerce-va", kicker: "Career skill", badge: "Premium course", title: "E-commerce VA",
      blurb: "Keep an online store running — orders, listings, stock, the where-is-my-order emails — and become the person who spots the problem before the refunds start.",
      bullets: [
        "Shopify and Amazon basics without the fluff",
        "Reply templates for the five daily email types",
        "Spot a stock or listing problem before it costs money",
        "8 short modules with a quiz and glossary",
      ],
      duration: "5h 48m",
    },
    {
      slug: "becoming-an-ops-lead", kicker: "Ops", badge: "Premium course", title: "Becoming an Operations Lead",
      blurb: "The promotion path. Stop being the person who does the tasks — become the person who owns whether the tasks happen. That\u2019s where VA pay doubles.",
      bullets: [
        "Write SOPs people actually follow",
        "Manage other VAs without the drama",
        "Talk outcomes so clients see your value",
        "10 short modules with a quiz and glossary",
      ],
      duration: "5h 1m",
    },
    {
      slug: "customer-support", kicker: "Career skill", badge: "Premium course", title: "Customer Support VA",
      blurb: "Handle the conversations that decide whether a customer stays or leaves — the tone, the tools, and the numbers support leads are judged on.",
      bullets: [
        "Reply frameworks for angry, confused and quiet customers",
        "Zendesk and Intercom basics before your first interview",
        "The metrics (CSAT, first reply time) in plain words",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 16m",
    },
    {
      slug: "general-va", kicker: "Career skill", badge: "Premium course", title: "General Virtual Assistant",
      blurb: "The all-rounder path: email, calendars, research, follow-ups. Learn to be the steady pair of hands a small team can\u2019t run a week without.",
      bullets: [
        "A daily rhythm that keeps every client\u2019s week on track",
        "Templates for updates, handovers and check-ins",
        "Turn \u201crandom tasks\u201d into a defined, paid role",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 16m",
    },
    {
      slug: "data-and-research", kicker: "Career skill", badge: "Premium course", title: "Data Entry & Research VA",
      blurb: "Turn messy spreadsheets and open-web research into clean, source-backed data — and learn the speed tricks that let you charge per project, not per hour.",
      bullets: [
        "Google Sheets skills that triple your speed",
        "Research anything and show your sources",
        "Quality checks that make clients trust your numbers",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 16m",
    },
    {
      slug: "email-marketing", kicker: "Career skill", badge: "Premium course", title: "Email Marketing VA",
      blurb: "Learn the emails that make online stores money — welcome series, abandoned carts, campaigns — in Klaviyo and Mailchimp, the tools in every job ad.",
      bullets: [
        "Build the three flows every store needs",
        "Subject lines and send times that get opened",
        "Reports that show real revenue, not vibes",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 16m",
    },
    {
      slug: "sales-development", kicker: "Career skill", badge: "Premium course", title: "Sales & Lead Generation VA",
      blurb: "Find the right people, write outbound messages that get answered, and book the sales call — the VA role closest to the money.",
      bullets: [
        "Build a clean prospect list from scratch",
        "Cold messages that don\u2019t sound cold",
        "Qualify leads so the sales team thanks you",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 2m",
    },
    {
      slug: "web-and-no-code", kicker: "Career skill", badge: "Premium course", title: "Web Development & No-Code VA",
      blurb: "Build and fix websites with Webflow, WordPress and just enough code to not panic. Clients pay more for the VA who solves it instead of reporting it.",
      bullets: [
        "Make safe changes to a live site without breaking it",
        "Webflow and WordPress, learned by doing",
        "Enough HTML and CSS to fix things yourself",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 2m",
    },
    {
      slug: "project-management", kicker: "Career skill", badge: "Premium course", title: "Project Management VA",
      blurb: "Keep client projects moving in Asana, ClickUp or Notion — who\u2019s doing what, by when, and what\u2019s stuck — without becoming the office nag.",
      bullets: [
        "Set up a project board a whole team actually uses",
        "Status updates that take 10 minutes and impress",
        "Chase people politely, effectively, repeatedly",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 2m",
    },
    {
      slug: "graphic-design", kicker: "Career skill", badge: "Premium course", title: "Graphic Design VA",
      blurb: "Make brand graphics in Canva and Figma that look bought, not improvised — and survive the client feedback round without tears.",
      bullets: [
        "The fundamentals in plain words: spacing, type, colour",
        "Client-ready templates for socials, decks and ads",
        "Take feedback and revise fast",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 2m",
    },
    {
      slug: "writing-for-clients", kicker: "Career skill", badge: "Premium course", title: "Content Writer VA",
      blurb: "Write blogs, emails and website copy clients happily pay for — with a brief-to-draft-to-edit process fast enough to still make the rate worth it.",
      bullets: [
        "A repeatable writing process, brief to final draft",
        "Sound like the client\u2019s brand, not like a robot",
        "Editing habits that halve your revision rounds",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 58m",
    },
    {
      slug: "video-editing", kicker: "Career skill", badge: "Premium course", title: "Video Editing VA",
      blurb: "Edit reels, shorts and TikToks in CapCut and Premiere — hooks, captions, and the pace that keeps people watching past three seconds.",
      bullets: [
        "A start-to-finish short-form editing workflow",
        "Hooks and captions that hold attention",
        "Organise raw footage so revisions are painless",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 58m",
    },
    {
      slug: "bookkeeping-basics", kicker: "Career skill", badge: "Premium course", title: "Bookkeeping VA",
      blurb: "Keep a small business\u2019s books clean in Xero and QuickBooks — invoices in, bills out, everything traceable — without pretending to be an accountant.",
      bullets: [
        "Debits and credits explained like a human",
        "The monthly rhythm: invoices, reconciliation, reports",
        "Know when to say \u201cthat\u2019s one for your accountant\u201d",
        "8 short modules with a quiz and glossary",
      ],
      duration: "4h 58m",
    },
  ],
} as {
  heading: string; lede: string; intro: string; cards: DeepCourseCard[];
};
