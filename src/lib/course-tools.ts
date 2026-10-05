/**
 * The working toolbox for each course: what to install or bookmark before
 * module 1, and what each thing is actually for. Rendered as the table at the
 * top of every course's module list.
 *
 * "Free tier" means free covers the course and a first client; "Paid" means
 * the client normally provides the seat — a VA should not buy it to learn.
 */

export type CourseTool = {
  name: string;
  use: string;
  cost: 'Free' | 'Free tier' | 'Paid (client provides)';
};

export const COURSE_TOOLS: Record<string, CourseTool[]> = {
  'complete-va-starter': [
    { name: 'Gmail', use: 'Your professional address and the inbox skills every client assumes.', cost: 'Free' },
    { name: 'Google Calendar', use: 'Time-zone-safe scheduling — the first trust test with a foreign client.', cost: 'Free' },
    { name: 'Google Drive + Docs', use: 'Where your SOPs, trackers and deliverables live and get shared.', cost: 'Free' },
    { name: 'Canva', use: 'Quick graphics, your portfolio pieces, and a clean resume export.', cost: 'Free tier' },
    { name: 'Loom', use: 'Short screen recordings — the fastest way to show a client what you did.', cost: 'Free tier' },
    { name: 'Speedtest.net', use: 'Proof of your connection for the outage plan in module 2.', cost: 'Free' },
  ],
  'applications-that-get-replies': [
    { name: 'Google Docs', use: 'Draft and version every application before it goes anywhere.', cost: 'Free' },
    { name: 'Verse cover letter builder', use: 'The four-paragraph structure from this course, pre-built.', cost: 'Free' },
    { name: 'Grammarly', use: 'Catches the typo that would sink an otherwise great application.', cost: 'Free tier' },
    { name: 'Loom', use: 'A 60-second intro video doubles reply rates on serious applications.', cost: 'Free tier' },
    { name: 'Verse application tracker', use: 'Who you applied to, when, and when to follow up.', cost: 'Free' },
  ],
  'pricing-and-negotiation': [
    { name: 'Google Sheets', use: 'Your rate-floor worksheet from module 1 — bills in, number out.', cost: 'Free' },
    { name: 'Verse rate calculator', use: 'Sanity-check your number against real market data.', cost: 'Free' },
    { name: 'Wise', use: 'Receiving USD without losing 8% to bad conversion.', cost: 'Free tier' },
    { name: 'GCash / Maya', use: 'Where the money actually lands; know the limits before the first invoice.', cost: 'Free' },
  ],
  'general-va': [
    { name: 'Gmail', use: 'Inbox triage with labels and filters is half of module 2.', cost: 'Free' },
    { name: 'Google Calendar', use: 'Calendar defence: buffers, focus blocks, and meeting hygiene.', cost: 'Free' },
    { name: 'Notion', use: 'The operating system for tasks, SOPs and client updates.', cost: 'Free tier' },
    { name: 'Slack', use: 'Where most clients live; threads and statuses done properly.', cost: 'Free tier' },
    { name: '1Password or Bitwarden', use: 'Client credentials handled like a professional, never a spreadsheet.', cost: 'Free tier' },
  ],
  'executive-assistant': [
    { name: 'Google Calendar', use: 'The core of the job: conflicts, buffers, time zones.', cost: 'Free' },
    { name: 'Calendly', use: 'Kills the "what time works for you" email chain.', cost: 'Free tier' },
    { name: 'Gmail (delegated)', use: 'Managing an inbox that is not yours without dropping anything.', cost: 'Free' },
    { name: 'Notion', use: 'Meeting briefs, travel docs and the exec\u2019s single source of truth.', cost: 'Free tier' },
    { name: 'Zoom', use: 'Scheduling, hosting and recording the exec\u2019s calls.', cost: 'Free tier' },
  ],
  'customer-support': [
    { name: 'Zendesk or Freshdesk', use: 'The ticket queue — macros, tags, SLAs. Freshdesk has a free tier to learn on.', cost: 'Free tier' },
    { name: 'Intercom', use: 'Live chat support; many ecommerce clients run it.', cost: 'Paid (client provides)' },
    { name: 'Google Sheets', use: 'Tracking your response times and ticket volume — your proof numbers.', cost: 'Free' },
    { name: 'Loom', use: 'Visual replies for "how do I…" tickets that text explains badly.', cost: 'Free tier' },
  ],
  'data-and-research': [
    { name: 'Google Sheets', use: 'The main stage: validation, formulas, pivot tables, QA sampling.', cost: 'Free' },
    { name: 'Excel', use: 'What enterprise clients send you; know where it differs from Sheets.', cost: 'Paid (client provides)' },
    { name: 'Airtable', use: 'Databases pretending to be spreadsheets — common in startup clients.', cost: 'Free tier' },
    { name: 'Google Forms', use: 'Clean data capture so you never have to clean it later.', cost: 'Free' },
    { name: 'ChatGPT', use: 'Drafting formulas and regex — always verified against the module 4 checks.', cost: 'Free tier' },
  ],
  'real-estate-va': [
    { name: 'A CRM (Follow Up Boss, KVCore…)', use: 'Lead intake, stages and follow-up cadences — the agent provides the seat.', cost: 'Paid (client provides)' },
    { name: 'Google Sheets', use: 'Comp tables for CMAs and transaction checklists.', cost: 'Free' },
    { name: 'Canva', use: 'Listing graphics, open-house flyers, social posts.', cost: 'Free tier' },
    { name: 'DocuSign', use: 'Chasing signatures on disclosures and agreements.', cost: 'Paid (client provides)' },
  ],
  'seo-specialist': [
    { name: 'Google Search Console', use: 'The source of truth for rankings, clicks and index problems.', cost: 'Free' },
    { name: 'Google Business Profile', use: 'The whole local SEO module happens here.', cost: 'Free' },
    { name: 'Ahrefs or Semrush', use: 'Keyword difficulty and competitor gaps — clients usually provide a seat.', cost: 'Paid (client provides)' },
    { name: 'Screaming Frog', use: 'Technical crawls; the free version covers 500 URLs.', cost: 'Free tier' },
    { name: 'Google Analytics 4', use: 'Tying rankings to traffic that actually converts.', cost: 'Free' },
  ],
  'writing-for-clients': [
    { name: 'Google Docs', use: 'Drafts, suggestions mode, and the comment threads clients love.', cost: 'Free' },
    { name: 'Grammarly', use: 'The second pass your tired eyes miss.', cost: 'Free tier' },
    { name: 'Hemingway Editor', use: 'Shows you exactly where your sentences run long.', cost: 'Free' },
    { name: 'ChatGPT or Claude', use: 'Outlines, angles and research — never the final voice.', cost: 'Free tier' },
    { name: 'WordPress', use: 'Where most client content ends up; learn the editor basics.', cost: 'Free' },
  ],
  'social-media-manager': [
    { name: 'Meta Business Suite', use: 'Scheduling and inbox for Facebook + Instagram, free and native.', cost: 'Free' },
    { name: 'Buffer or Later', use: 'Cross-platform scheduling when the client is everywhere.', cost: 'Free tier' },
    { name: 'Canva', use: 'The content factory: templates keep a month of posts on-brand.', cost: 'Free tier' },
    { name: 'CapCut', use: 'Short-form video editing straight from your phone or desktop.', cost: 'Free' },
    { name: 'Google Sheets', use: 'The content calendar and the numbers you report monthly.', cost: 'Free' },
  ],
  'email-marketing': [
    { name: 'Klaviyo', use: 'The ecommerce standard for flows and segments; free under 250 contacts.', cost: 'Free tier' },
    { name: 'Mailchimp', use: 'Where many small clients already are; know your way around.', cost: 'Free tier' },
    { name: 'Google Postmaster Tools', use: 'Deliverability signals straight from Gmail itself.', cost: 'Free' },
    { name: 'Mail-Tester.com', use: 'A spam-score check before every important send.', cost: 'Free' },
    { name: 'Canva', use: 'Email headers and section graphics that do not break on mobile.', cost: 'Free tier' },
  ],
  'sales-development': [
    { name: 'Apollo.io', use: 'Prospect lists with verified emails; the free tier is enough to learn.', cost: 'Free tier' },
    { name: 'LinkedIn', use: 'Researching the person before the first line gets written.', cost: 'Free' },
    { name: 'Instantly or Smartlead', use: 'Sending sequences at volume without burning the domain.', cost: 'Paid (client provides)' },
    { name: 'HubSpot CRM', use: 'Pipeline stages and the weekly numbers you report.', cost: 'Free tier' },
    { name: 'NeverBounce or ZeroBounce', use: 'List verification — the bounce rate protector.', cost: 'Free tier' },
  ],
  'graphic-design': [
    { name: 'Canva Pro', use: 'Brand kits, background remover, and resize — the working horse.', cost: 'Free tier' },
    { name: 'Figma', use: 'Anything layout-heavy, plus how modern teams hand off design.', cost: 'Free tier' },
    { name: 'Adobe Photoshop', use: 'Photo work Canva cannot do; clients often provide the seat.', cost: 'Paid (client provides)' },
    { name: 'Google Fonts', use: 'Licensed type you can use commercially without thinking twice.', cost: 'Free' },
  ],
  'video-editing': [
    { name: 'CapCut', use: 'Short-form editing with auto-captions; where this course starts.', cost: 'Free' },
    { name: 'DaVinci Resolve', use: 'A genuinely free professional editor when you outgrow CapCut.', cost: 'Free' },
    { name: 'Premiere Pro', use: 'The industry default; many clients hand you their subscription.', cost: 'Paid (client provides)' },
    { name: 'Frame.io', use: 'Client review and timestamped comments without email chaos.', cost: 'Free tier' },
    { name: 'Google Drive', use: 'Raw footage in, deliverables out, organised like module 7 teaches.', cost: 'Free' },
  ],
  'bookkeeping-basics': [
    { name: 'QuickBooks Online', use: 'The US small-business standard; most clients are here.', cost: 'Paid (client provides)' },
    { name: 'Xero', use: 'The other half of the market, big with AU/NZ/UK clients.', cost: 'Paid (client provides)' },
    { name: 'Google Sheets', use: 'Reconciliation worksheets and the query log from module 3.', cost: 'Free' },
    { name: 'Dext or Hubdoc', use: 'Receipt capture so documentation happens at the moment of expense.', cost: 'Paid (client provides)' },
  ],
  'project-management': [
    { name: 'Asana or ClickUp', use: 'The board where tasks, owners and dates live.', cost: 'Free tier' },
    { name: 'Trello', use: 'Lightweight boards smaller clients actually keep using.', cost: 'Free tier' },
    { name: 'Slack', use: 'The chasing channel: updates, nudges, decisions in writing.', cost: 'Free tier' },
    { name: 'Loom', use: 'Status updates people watch instead of skim.', cost: 'Free tier' },
    { name: 'Google Sheets', use: 'Timelines and the weekly status report from module 5.', cost: 'Free' },
  ],
  'web-and-no-code': [
    { name: 'WordPress + Elementor', use: 'The bulk of client sites; build and maintain without code.', cost: 'Free tier' },
    { name: 'Webflow', use: 'Higher-end marketing sites; the free tier is enough to learn.', cost: 'Free tier' },
    { name: 'PageSpeed Insights', use: 'The diagnosis tool for the "site is slow" module.', cost: 'Free' },
    { name: 'UpdraftPlus', use: 'Backups before anything ships — your rollback plan.', cost: 'Free tier' },
  ],
  'ecommerce-va': [
    { name: 'Shopify', use: 'Products, orders, discounts — the store back office.', cost: 'Paid (client provides)' },
    { name: 'Gorgias or Zendesk', use: 'Customer service wired to order data.', cost: 'Paid (client provides)' },
    { name: 'Google Sheets', use: 'Inventory reconciliation and the morning numbers from module 6.', cost: 'Free' },
    { name: 'Canva', use: 'Product graphics and promo banners on sale days.', cost: 'Free tier' },
  ],
  'becoming-an-ops-lead': [
    { name: 'Notion', use: 'The SOP library and the single source of truth you will own.', cost: 'Free tier' },
    { name: 'Loom', use: 'Training recordings that onboard the next VA without you.', cost: 'Free tier' },
    { name: 'Zapier or Make', use: 'The automation module: connect tools without code.', cost: 'Free tier' },
    { name: 'Slack', use: 'Running a team: channels, standups, decisions in writing.', cost: 'Free tier' },
    { name: 'Google Sheets', use: 'The weekly report the CEO actually reads.', cost: 'Free' },
  ],
  'ai-marketing-and-aeo': [
    { name: 'ChatGPT', use: 'The content pipeline this course builds, fact-check included.', cost: 'Free tier' },
    { name: 'Claude', use: 'Longer documents and a second model to cross-check claims.', cost: 'Free tier' },
    { name: 'Perplexity', use: 'See what AI search engines actually cite for your queries.', cost: 'Free tier' },
    { name: 'Google Search Console', use: 'Whether AI-era changes move real clicks.', cost: 'Free' },
  ],
};
