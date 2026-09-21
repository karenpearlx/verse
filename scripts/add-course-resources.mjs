#!/usr/bin/env node
/**
 * Injects a "Keep learning" resources section into every deep course:
 * hand-picked free links (official docs, academies, channels) and, where we
 * have verified stable IDs, embedded YouTube lessons via youtube-nocookie.
 *
 * Also appends module 9 ("The local SEO delivery system") to seo-specialist,
 * adapted from a working agency SOP, and refreshes that course's hero badges.
 *
 * Idempotent: re-running replaces the previously injected section.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'src/lib/deep-courses');

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

/** slug -> { videos: [{id,title,by}], links: [{href,title,note}] } */
const RESOURCES = {
  'complete-va-starter': {
    links: [
      { href: 'https://support.google.com/a/users/', title: 'Google Workspace Learning Center', note: 'Gmail, Docs, Sheets, Calendar — the tools in almost every VA job ad, taught by Google.' },
      { href: 'https://www.canva.com/designschool/', title: 'Canva Design School', note: 'Free structured lessons for the design tasks clients hand to general VAs.' },
      { href: 'https://www.loom.com/', title: 'Loom', note: 'Record your screen with your voice over it. The fastest way to prove you can do a task.' },
      { href: 'https://www.notion.com/help', title: 'Notion Help & Academy', note: 'Docs, wikis and databases — learn it before a client asks if you know it.' },
      { href: 'https://www.worldtimebuddy.com/', title: 'World Time Buddy', note: 'Never propose a meeting at 3am their time. Pin your client cities.' },
      { href: 'https://hemingwayapp.com/', title: 'Hemingway Editor', note: 'Paste your message, fix everything highlighted red. Free and instant.' },
    ],
  },
  'applications-that-get-replies': {
    links: [
      { href: 'https://hemingwayapp.com/', title: 'Hemingway Editor', note: 'Run every application through it. Shorter sentences get read.' },
      { href: 'https://www.grammarly.com/', title: 'Grammarly', note: 'The free tier catches the typos that get applications silently binned.' },
      { href: 'https://www.onlinejobs.ph/blog', title: 'OnlineJobs.ph blog', note: 'Written for employers too — read it to see what the other side is told to look for.' },
      { href: 'https://owl.purdue.edu/owl/job_search_writing/', title: 'Purdue OWL — job search writing', note: 'A university writing lab, free, with the fundamentals of letters that get replies.' },
    ],
  },
  'pricing-and-negotiation': {
    links: [
      { href: 'https://wise.com/ph/pricing/', title: 'Wise fees (PHP)', note: 'Know exactly what a transfer costs before you quote a rate.' },
      { href: 'https://www.payoneer.com/about/fees/', title: 'Payoneer fee schedule', note: 'The other common way clients pay. Compare before you pick.' },
      { href: 'https://www.xe.com/', title: 'XE currency converter', note: 'Check the mid-market rate so you know what a platform is really taking.' },
      { href: 'https://www.bir.gov.ph/', title: 'Bureau of Internal Revenue', note: 'Registering as self-employed is cheaper than the fixer prices suggest. Official source.' },
    ],
  },
  'executive-assistant': {
    links: [
      { href: 'https://support.google.com/calendar/', title: 'Google Calendar help', note: 'Appointment schedules, working hours, and the sharing settings EAs live in.' },
      { href: 'https://academy.asana.com/', title: 'Asana Academy', note: 'Free courses with certificates you can put on your profile.' },
      { href: 'https://www.notion.com/help', title: 'Notion Help & Academy', note: 'Most founder workspaces are Notion. Learn databases, not just pages.' },
      { href: 'https://help.calendly.com/', title: 'Calendly help center', note: 'Round robins, buffers, routing forms — scheduling is an EA superpower.' },
    ],
  },
  'seo-specialist': {
    videos: [
      { id: '0eKVizvYSUQ', title: 'How Google Search works (in 5 minutes)', by: 'Google Search Central' },
      { id: 'xsVTqzratPs', title: 'Complete SEO course for beginners', by: 'Ahrefs' },
    ],
    links: [
      { href: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', title: 'Google SEO Starter Guide', note: 'The official baseline. If advice contradicts this, the advice is wrong.' },
      { href: 'https://moz.com/beginners-guide-to-seo', title: 'Moz — Beginner\u2019s Guide to SEO', note: 'The classic long-form walkthrough, kept current.' },
      { href: 'https://www.youtube.com/@GoogleSearchCentral', title: 'Google Search Central on YouTube', note: 'Office hours and explainers straight from the Search team.' },
      { href: 'https://ahrefs.com/blog/', title: 'Ahrefs blog', note: 'Data-backed studies. Great for lines you can quote in client reports.' },
      { href: 'https://support.google.com/business/', title: 'Google Business Profile help', note: 'The official manual for the local SEO work in module 9.' },
      { href: 'https://search.google.com/search-console/about', title: 'Google Search Console', note: 'Set it up on your own site today. Free, and every client will expect you to know it.' },
    ],
  },
  'social-media-manager': {
    links: [
      { href: 'https://www.facebook.com/business/learn', title: 'Meta Blueprint', note: 'Free official courses on Facebook and Instagram marketing.' },
      { href: 'https://buffer.com/resources/', title: 'Buffer Resources', note: 'Honest, data-backed writing about what actually grows accounts.' },
      { href: 'https://blog.hootsuite.com/', title: 'Hootsuite blog', note: 'Good for platform updates and benchmark stats to use in reports.' },
      { href: 'https://later.com/blog/', title: 'Later blog', note: 'Strong on Instagram and TikTok specifics — hooks, hashtags, posting times.' },
      { href: 'https://www.canva.com/designschool/', title: 'Canva Design School', note: 'Free lessons for the graphics half of this job.' },
    ],
  },
  'real-estate-va': {
    links: [
      { href: 'https://www.nar.realtor/', title: 'National Association of Realtors', note: 'The vocabulary source. If a term confuses you, search it here first.' },
      { href: 'https://www.followupboss.com/blog', title: 'Follow Up Boss blog', note: 'The CRM many US teams run. Their blog doubles as ISA training.' },
      { href: 'https://www.zillow.com/agent-resources/', title: 'Zillow agent resources', note: 'How US agents think about leads — useful context for the person you support.' },
    ],
  },
  'ecommerce-va': {
    links: [
      { href: 'https://help.shopify.com/', title: 'Shopify Help Center', note: 'The manual for the platform most of your clients run.' },
      { href: 'https://www.shopify.com/blog', title: 'Shopify blog', note: 'Store operations, conversion and email — written for owners, useful for VAs.' },
      { href: 'https://sell.amazon.com/learn', title: 'Amazon Seller University', note: 'Free official training if the client also sells on Amazon.' },
      { href: 'https://www.gorgias.com/blog', title: 'Gorgias blog', note: 'E-commerce support benchmarks and macros worth borrowing.' },
    ],
  },
  'becoming-an-ops-lead': {
    links: [
      { href: 'https://academy.asana.com/', title: 'Asana Academy', note: 'Free certificates on project workflows — hiring managers recognise them.' },
      { href: 'https://university.clickup.com/', title: 'ClickUp University', note: 'The other tool half your clients run. Free courses.' },
      { href: 'https://www.process.st/', title: 'Process Street', note: 'Read their checklist examples to see what professional SOPs look like.' },
      { href: 'https://www.notion.com/help', title: 'Notion Help & Academy', note: 'Ops leads build the wiki. Learn relations and rollups properly.' },
    ],
  },
  'customer-support': {
    links: [
      { href: 'https://training.zendesk.com/', title: 'Zendesk Training', note: 'Free courses on the ticketing system in most job ads.' },
      { href: 'https://academy.intercom.com/', title: 'Intercom Academy', note: 'Chat-based support, taught by the company that built the category.' },
      { href: 'https://www.helpscout.com/blog/', title: 'Help Scout blog', note: 'The best free writing on support tone and difficult conversations.' },
      { href: 'https://www.gorgias.com/blog', title: 'Gorgias blog', note: 'E-commerce support specifics: refunds, where-is-my-order, macros.' },
    ],
  },
  'general-va': {
    links: [
      { href: 'https://support.google.com/a/users/', title: 'Google Workspace Learning Center', note: 'The core toolkit, taught free by Google.' },
      { href: 'https://zapier.com/blog/', title: 'Zapier blog', note: 'Automation ideas you can bring to a client before they ask.' },
      { href: 'https://www.notion.com/help', title: 'Notion Help & Academy', note: 'Learn databases and templates, not just note-taking.' },
      { href: 'https://www.loom.com/', title: 'Loom', note: 'Recording a process video is the fastest way to show your work.' },
    ],
  },
  'data-and-research': {
    links: [
      { href: 'https://support.google.com/docs/table/25273', title: 'Google Sheets function list', note: 'The official reference. Bookmark it; you will use it weekly.' },
      { href: 'https://exceljet.net/', title: 'Exceljet', note: 'The clearest formula explanations on the internet, with examples.' },
      { href: 'https://www.benlcollins.com/', title: 'Ben Collins — Sheets tips', note: 'Free Google Sheets course and a newsletter worth the inbox space.' },
    ],
  },
  'email-marketing': {
    links: [
      { href: 'https://academy.klaviyo.com/', title: 'Klaviyo Academy', note: 'Free certification on the platform in most e-commerce email job ads.' },
      { href: 'https://mailchimp.com/resources/', title: 'Mailchimp Resources', note: 'Fundamentals of lists, segments and automations.' },
      { href: 'https://reallygoodemails.com/', title: 'Really Good Emails', note: 'A searchable library of real emails. Steal structure, not copy.' },
      { href: 'https://www.litmus.com/blog', title: 'Litmus blog', note: 'Deliverability and rendering — the technical side clients pay extra for.' },
    ],
  },
  'sales-development': {
    links: [
      { href: 'https://academy.hubspot.com/', title: 'HubSpot Academy', note: 'Free sales and CRM certifications hiring managers actually recognise.' },
      { href: 'https://www.apollo.io/academy', title: 'Apollo Academy', note: 'The prospecting tool in half the lead-gen job ads, taught free.' },
      { href: 'https://www.close.com/blog', title: 'Close blog', note: 'Cold email and call scripts written by people who sell for a living.' },
    ],
  },
  'web-and-no-code': {
    links: [
      { href: 'https://www.freecodecamp.org/', title: 'freeCodeCamp', note: 'Free, certificate-granting HTML/CSS/JS curriculum. The gold standard.' },
      { href: 'https://developer.mozilla.org/', title: 'MDN Web Docs', note: 'The reference for how the web actually works. Trust it over blog posts.' },
      { href: 'https://university.webflow.com/', title: 'Webflow University', note: 'Genuinely excellent free video courses for the no-code half.' },
      { href: 'https://learn.wordpress.org/', title: 'Learn WordPress', note: 'Official free training for the CMS running most client sites.' },
    ],
  },
  'project-management': {
    links: [
      { href: 'https://academy.asana.com/', title: 'Asana Academy', note: 'Free certificates. Do the workflows course before your first PM client.' },
      { href: 'https://university.clickup.com/', title: 'ClickUp University', note: 'Free courses on the tool in a huge share of PM VA job ads.' },
      { href: 'https://www.coursera.org/professional-certificates/google-project-management', title: 'Google Project Management Certificate', note: 'Paid, but audit-able for free and widely recognised if you want a credential.' },
    ],
  },
  'graphic-design': {
    links: [
      { href: 'https://www.canva.com/designschool/', title: 'Canva Design School', note: 'Structured free lessons on the tool most clients ask for.' },
      { href: 'https://help.figma.com/', title: 'Figma Learn', note: 'Official tutorials for the step-up tool that raises your rate.' },
      { href: 'https://www.youtube.com/@thefutur', title: 'The Futur on YouTube', note: 'Design thinking and pricing creative work — watch before you quote.' },
    ],
  },
  'writing-for-clients': {
    links: [
      { href: 'https://hemingwayapp.com/', title: 'Hemingway Editor', note: 'Edit every draft in it until the grade drops below 9.' },
      { href: 'https://copyblogger.com/', title: 'Copyblogger', note: 'Two decades of free copywriting fundamentals.' },
      { href: 'https://www.nngroup.com/topic/writing-web/', title: 'Nielsen Norman Group — writing for the web', note: 'Research-backed rules for headlines, scanning and structure.' },
    ],
  },
  'video-editing': {
    links: [
      { href: 'https://www.capcut.com/', title: 'CapCut', note: 'Free editor with official tutorials — the tool in most short-form job ads.' },
      { href: 'https://helpx.adobe.com/premiere-pro/tutorials.html', title: 'Premiere Pro tutorials', note: 'Adobe\u2019s official free lessons for the step-up tool.' },
      { href: 'https://www.youtube.com/creators/', title: 'YouTube for Creators', note: 'How the platform itself says retention and packaging work.' },
    ],
  },
  'bookkeeping-basics': {
    links: [
      { href: 'https://quickbooks.intuit.com/learn-support/', title: 'QuickBooks Learn & Support', note: 'Official training for the software in most US bookkeeping ads.' },
      { href: 'https://central.xero.com/', title: 'Xero Central', note: 'The AU/NZ equivalent. Free courses and certification.' },
      { href: 'https://www.youtube.com/@AccountingStuff', title: 'Accounting Stuff on YouTube', note: 'Debits and credits explained better than most paid courses.' },
    ],
  },
};

function videoCard(v) {
  return `<div class="overflow-hidden rounded-2xl border border-line bg-card shadow-tile"><div class="aspect-video"><iframe class="h-full w-full" src="https://www.youtube-nocookie.com/embed/${v.id}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="px-4 py-3"><p class="font-display text-[0.9375rem] font-semibold text-ink">${esc(v.title)}</p><p class="mt-0.5 text-[0.8125rem] text-muted">${esc(v.by)} · YouTube</p></div></div>`;
}

function linkCard(l) {
  return `<li class="h-full"><a href="${l.href}" target="_blank" rel="noopener noreferrer" class="block h-full rounded-xl border border-line bg-card p-4 shadow-tile transition-colors hover:border-ink"><div class="flex items-start justify-between gap-3"><p class="font-display text-[0.9375rem] font-semibold text-ink">${esc(l.title)}</p><span aria-hidden="true" class="text-[0.875rem] text-muted">\u2197</span></div><p class="mt-2 text-[0.875rem] leading-relaxed text-ink-2">${esc(l.note)}</p></a></li>`;
}

function resourcesChunk(slug) {
  const r = RESOURCES[slug];
  if (!r) return null;
  const videos = r.videos?.length
    ? `<div class="mt-8"><p class="eyebrow text-muted">Watch first</p><div class="mt-3.5 grid gap-4 sm:grid-cols-2">${r.videos.map(videoCard).join('')}</div></div>`
    : '';
  const html =
    `<div class="mx-auto w-full px-5 sm:px-8 max-w-5xl py-14 sm:py-20"><section id="keep-learning" class="scroll-mt-32">` +
    `<h2 class="font-display text-[1.75rem] font-semibold text-ink">Keep learning<span class="dot" aria-hidden="true">.</span></h2>` +
    `<p class="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">Hand-picked and free. These open in a new tab \u2014 official docs, academies and channels that go deeper on what this track teaches. No affiliate links, no sign-up walls.</p>` +
    videos +
    `<ul class="mt-8 grid gap-3 sm:grid-cols-2">${r.links.map(linkCard).join('')}</ul>` +
    `</section></div>`;
  return { kind: 'html', value: html };
}

/* ---------------- SEO module 9: the local SEO delivery system ------------- */

const bullet = (t) =>
  `<li class="flex gap-3"><span aria-hidden="true" class="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-soft"></span><span class="text-[0.9375rem] leading-relaxed text-ink-2">${t}</span></li>`;

const th = (t) => `<th scope="col" class="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted first:pl-0 last:pr-0">${t}</th>`;
const rowTh = (t) => `<th scope="row" class="whitespace-nowrap py-2.5 pl-0 pr-3 text-[0.875rem] font-semibold text-ink">${t}</th>`;
const td = (t, extra = '') => `<td class="px-3 py-2.5 text-[0.875rem] leading-snug text-ink-2 ${extra}">${t}</td>`;

function table(minWidth, headers, rows) {
  return `<div class="mt-4"><p class="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-2 sm:hidden">Swipe the table sideways \u2192</p><div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><div style="min-width:${minWidth}"><table class="w-full border-collapse text-left"><thead><tr class="border-b border-line-2">${headers.map(th).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr class="border-b border-line last:border-0">${rowTh(r[0])}${r.slice(1).map((c) => td(c)).join('')}</tr>`)
    .join('')}</tbody></table></div></div></div>`;
}

const para = (t) => `<p class="text-[1.0625rem] leading-[1.75] text-ink-2">${t}</p>`;
const h4 = (t) => `<h4 class="font-display text-[1.0625rem] font-semibold leading-snug text-ink">${t}</h4>`;

function checklistItem(t) {
  return `<li><label class="flex cursor-pointer gap-2.5 text-[0.875rem] leading-relaxed text-ink-2 hover:text-ink"><span class="mt-0.5 shrink-0"><span class="inline-flex h-4 w-4 rounded border border-line-3 bg-card"></span></span><input type="checkbox" class="sr-only"/><span class="">${t}</span></label></li>`;
}

function exerciseBox(task, handIn, mins, checks) {
  return `<div class="rounded-xl border p-4 sm:p-5 border-teal-pale bg-teal-wash/60"><p class="eyebrow mb-2.5 text-muted">Do this</p><p class="text-[0.9375rem] leading-relaxed text-ink">${task}</p><div class="mt-3.5 flex flex-wrap items-center gap-2"><span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide bg-accent-soft text-accent-deep border-transparent">Hand in: ${handIn}</span><span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide bg-paper-2 text-ink-2 border-transparent">\u2248 ${mins} min</span></div><p class="eyebrow mt-4 mb-2 text-muted">Check before you call it done</p><ul class="space-y-1.5">${checks.map(checklistItem).join('')}</ul></div>`;
}

const SEO_MODULE_9 = {
  n: 9,
  title: 'The local SEO delivery system',
  outcome: 'You can run a local client month by month in the order agencies actually train it, from Business Profile to the proposal.',
  badges: ['Local SEO', 'Agency SOP', '4 tables'],
  minutes: 45,
  html:
    `<div class="space-y-6">` +
    para(
      'Everything so far taught you the skills. This module gives you the order — the sequence a real agency uses to train new local SEO staff, starting with the visible, tangible wins and ending with the strategy work. Follow it and you will never sit in front of a new client wondering what to do first.',
    ) +
    h4('The delivery order') +
    table('44rem', ['Step', 'What it is', 'Why this order'], [
      ['1 · Business Profile', 'Optimise the Google Business Profile: categories, services, photos, weekly posts, review replies, holiday hours.', 'It dominates local search and every change is visible the same week — momentum for you and the client.'],
      ['2 · Citations', 'Create or fix listings on directories (Yelp, BBB, Yellow Pages and the local ones).', 'Golden rule: every listing matches the Business Profile exactly. Consistency is the whole job.'],
      ['3 · Rank tracking', 'Set up local rank tracking and identify the three competitors that keep beating you.', 'You cannot report progress you never measured. Baseline before you change anything.'],
      ['4 · Location pages', 'One page per service area: title and H1 with the place name, service info, map, reviews, FAQs, internal links.', 'This is where local content lives. Thin duplicates get ignored; real pages rank.'],
      ['5 · Content', 'Blogs, service pages and guides matched to intent, written naturally.', 'Now that the local plumbing works, content is what expands the reach.'],
      ['6 · Backlinks', 'Foundational links first, content-based links second (table below).', 'Links amplify pages that already deserve to rank. Doing this earlier wastes them.'],
      ['7 · Research', 'Keyword research, competitor analysis and the backlink gap — what links to them but not to you.', 'By now you understand the business well enough for research to produce a plan, not a list.'],
      ['8 · Technical', 'Titles, metas, headers, broken links, page speed, mobile view, internal linking map, schema.', 'The engineering pass. Local Business, FAQ and Review schema are the ones that matter here.'],
      ['9 · Off-page', 'NAP consistency across social profiles; press releases for credibility.', 'Reinforcement, not foundation. Cheap to do once everything else is right.'],
      ['10 · The proposal', 'Present rankings and competitor data, propose strategy, pricing and deliverables.', 'Last on purpose: you can only sell strategy you have actually executed.'],
    ]) +
    h4('Backlinks: the two tiers, and the anchor rule') +
    para(
      'Local clients get burned by link sellers constantly. Here is the honest version of what links are worth buying with time (never with spam).',
    ) +
    table('40rem', ['Tier', 'Typical DR', 'Examples', 'Effort', 'What it does'], [
      ['Foundational', 'DR 10\u201330', 'Directories, listings, local associations', 'Easy — hours', 'Low SEO power, high necessity. The base layer every local business needs.'],
      ['Content-based', 'DR 40+', 'Guest posts, articles, resource mentions', 'Hard — weeks of outreach', 'The links that actually move competitive rankings.'],
    ]) +
    `<ul class="space-y-3">` +
    bullet('Anchor text needs diversity: mostly branded (&#x27;Baler Coffee&#x27;), some generic (&#x27;this guide&#x27;, &#x27;their website&#x27;), only a little exact-keyword. All-keyword anchors look bought, because they usually are.') +
    bullet('Do-follow links pass ranking value; no-follow links pass little. Check before celebrating — but a no-follow from a real local site still sends customers.') +
    bullet('If a link seller quotes you &#x27;DR 60 for $30&#x27;, the DR is inflated, the site is a link farm, or both. Walk away.') +
    `</ul>` +
    h4('Keyword mapping by page type') +
    para('Intent decides the page. Learning intent needs a blog, buying intent needs a service page, comparing intent needs a guide. Then each page type gets its own keyword pattern — here mapped to Baler Coffee:') +
    table('42rem', ['Page type', 'Keyword pattern', 'Baler Coffee example'], [
      ['Homepage', 'Main term + city', '&#x27;specialty coffee roaster quezon city&#x27;'],
      ['Service / category page', 'Service term + city', '&#x27;coffee bean subscription quezon city&#x27;'],
      ['Blog post', 'Informational SERP term', '&#x27;how to store coffee beans philippines&#x27;'],
      ['Location page', 'Service near neighbourhood', '&#x27;coffee shop near katipunan&#x27;'],
    ]) +
    h4('The reporting cadence clients keep paying for') +
    table('36rem', ['Cycle', 'What you deliver'], [
      ['Weekly', 'Business Profile updates and posts, ranking check, review replies.'],
      ['Monthly', 'Backlinks won, content published, movement on tracked keywords, three recommendations.'],
      ['Quarterly', 'Citation audit, technical audit, organic keyword audit — what is working, what to stop.'],
    ]) +
    `<div class="rounded-xl border p-4 sm:p-5 border-line-2 bg-paper-2"><p class="eyebrow mb-2.5 text-muted">Worked example — first month on a new local client</p><div class="rounded-lg border border-line-2 bg-card p-3.5"><p class="font-mono text-[0.8125rem] leading-relaxed text-ink-2">Week 1 → Business Profile audit + fixes, baseline rank tracking, competitor list</p><p class="font-mono text-[0.8125rem] leading-relaxed text-ink-2">Week 2 → Citation sweep: fix 12 listings to match the Profile exactly</p><p class="font-mono text-[0.8125rem] leading-relaxed text-ink-2">Week 3 → First location page drafted + review request flow switched on</p><p class="font-mono text-[0.8125rem] leading-relaxed text-ink-2">Week 4 → First monthly report: what changed, what moved, what&#x27;s next</p></div></div>` +
    exerciseBox(
      'Pick a real local business you know. Run steps 1\u20133 as a paper exercise: audit their Business Profile against the checklist above, find five citation inconsistencies, and list the three competitors that outrank them on one map search.',
      'A one-page audit note with the Profile gaps, the five citation fixes, and the competitor list.',
      60,
      [
        'Every citation fix quotes the exact wrong text and the exact right text',
        'The competitor list comes from an actual map search you screenshotted',
        'You wrote one sentence on which delivery step you would start with, and why',
      ],
    ) +
    `</div>`,
};

/* ------------------------------ file rewriting ---------------------------- */

function loadCourse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const start = src.indexOf('{', src.indexOf('const course'));
  const end = src.lastIndexOf('}');
  return { src, course: JSON.parse(src.slice(start, end + 1)) };
}

function saveCourse(file, course) {
  const out =
    `// Generated from the Verse deep-course source. Do not edit by hand.\n` +
    `import type { DeepCourse } from '../deep-course-types';\n\n` +
    `const course: DeepCourse = ${JSON.stringify(course)} as DeepCourse;\n\n` +
    `export default course;\n`;
  fs.writeFileSync(file, out);
}

let touched = 0;
for (const slug of Object.keys(RESOURCES)) {
  const file = path.join(DIR, `${slug}.ts`);
  if (!fs.existsSync(file)) {
    console.warn(`skip (missing): ${slug}`);
    continue;
  }
  const { course } = loadCourse(file);

  // Drop any previously injected section, then insert after the MODULES slot.
  course.chunks = course.chunks.filter((c) => !(c.kind === 'html' && c.value.includes('id="keep-learning"')));
  const modulesAt = course.chunks.findIndex((c) => c.kind === 'slot' && c.value === 'MODULES');
  const chunk = resourcesChunk(slug);
  course.chunks.splice(modulesAt + 1, 0, chunk);

  if (slug === 'seo-specialist') {
    course.modules = course.modules.filter((m) => m.n !== 9);
    course.modules.push(SEO_MODULE_9);
    course.chunks = course.chunks.map((c) => {
      if (c.kind !== 'html') return c;
      let v = c.value
        .replaceAll('>8 modules<', '>9 modules<')
        .replaceAll('>5h 54m of reading and doing<', '>6h 39m of reading and doing<')
        .replaceAll('>8 portfolio pieces<', '>9 portfolio pieces<');
      return { ...c, value: v };
    });
  }

  saveCourse(file, course);
  touched += 1;
  console.log(`ok: ${slug}`);
}
console.log(`done — ${touched} courses updated`);
