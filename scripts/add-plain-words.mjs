#!/usr/bin/env node
/**
 * Injects an "In plain words" panel right under each course hero — a warm,
 * no-jargon answer to "what is this course, is it for me, what do I get".
 * Idempotent: re-running replaces the existing panel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/deep-courses');

/** slug -> { plain, forYou, walkAway } */
const WORDS = {
  'complete-va-starter': {
    plain: 'This is the start-from-zero course. It takes you from \u2018I have a laptop and I need income\u2019 to your first paying client — setting up your tools, finding real jobs, applying properly, and not getting scammed along the way.',
    forYou: 'You\u2019ve never freelanced before, or you started but nothing is landing yet. No experience needed — that\u2019s the point.',
    walkAway: 'A working setup, a starter portfolio, a rate you can defend, and a step-by-step plan for your first 30 days.',
  },
  'applications-that-get-replies': {
    plain: 'Most VAs never hear back because their applications read like everyone else\u2019s. This course teaches you to write a short, specific application that a busy client actually reads — and answers.',
    forYou: 'You keep applying and getting silence. Or you freeze every time the box says \u2018tell us why you\u2019re a fit\u2019.',
    walkAway: 'A four-paragraph application formula, real job posts pulled apart, and templates you can adapt in ten minutes per job.',
  },
  'pricing-and-negotiation': {
    plain: 'Money talk is the part nobody teaches. This course helps you work out what to charge — based on your real bills, not vibes — say it confidently, and handle a client who says \u2018that\u2019s too expensive\u2019.',
    forYou: 'You\u2019re charging whatever the client offers, or you haven\u2019t raised your rate since you started.',
    walkAway: 'Your personal minimum rate, word-for-word scripts for the awkward conversations, and a plan for your next raise.',
  },
  'executive-assistant': {
    plain: 'An executive assistant runs one busy person\u2019s work life — inbox, calendar, meetings, loose ends — so they can think. This course teaches the systems and the judgment the job actually needs.',
    forYou: 'You\u2019re organised, you like being trusted with real responsibility, and you\u2019d rather have one deep client relationship than five shallow ones.',
    walkAway: 'Inbox and calendar systems you can demo, answers for the classic EA interview scenarios, and a 90-day plan for a new executive.',
  },
  'seo-specialist': {
    plain: 'SEO is how businesses get found on Google — and it\u2019s one of the best-paid VA skills because the results are measurable. You practice every step on one pretend coffee shop, so by the end you\u2019ve actually done the job, not just read about it.',
    forYou: 'You want a skill with a clear career ladder and you don\u2019t mind numbers. Zero SEO background needed — every term is explained the first time it appears.',
    walkAway: 'A complete website audit, a keyword plan, a content brief and a monthly report — a whole portfolio, plus a local-SEO playbook used by a real agency.',
  },
  'social-media-manager': {
    plain: 'Social media managers plan, post and reply for a brand\u2019s accounts — and prove it\u2019s working. This course teaches the systems, plus how to avoid quietly becoming the client\u2019s everything-person for one flat fee.',
    forYou: 'You already live on these apps and want to get paid for understanding them — without burning out on 24/7 notifications.',
    walkAway: 'A content calendar system, caption and reply frameworks, a reporting template, and boundary scripts for scope creep.',
  },
  'real-estate-va': {
    plain: 'US real estate agents drown in leads, paperwork and follow-ups — and pay well for a VA who keeps it all moving. This course teaches the vocabulary, the tools and the weekly rhythm of the job.',
    forYou: 'You\u2019re reliable with follow-ups and detail, and you\u2019re okay working US hours. No real estate background needed.',
    walkAway: 'The transaction timeline by heart, lead follow-up scripts, CRM habits, and answers for the questions agents ask in interviews.',
  },
  'ecommerce-va': {
    plain: 'Online stores need someone keeping orders, listings, stock and customer emails under control every single day. This course teaches you to run that engine — and to spot problems before they become refunds.',
    forYou: 'You like systems and you don\u2019t panic when a customer is upset. Shopify experience helps but is not required.',
    walkAway: 'Store-management routines, reply templates for the daily email pile, and a problem-spotting checklist clients notice fast.',
  },
  'becoming-an-ops-lead': {
    plain: 'At some point you stop being paid for doing tasks and start being paid for making sure everything gets done — by you, by other VAs, by systems. This course is that promotion, taught step by step.',
    forYou: 'You\u2019re already someone\u2019s reliable VA and clients keep handing you more responsibility. Time to name it and price it.',
    walkAway: 'An SOP-writing method, delegation and check-in systems, and the exact words for renegotiating your role and rate.',
  },
  'customer-support': {
    plain: 'Support is the job of turning an annoyed customer into a calm one, a hundred times a week, in writing. This course teaches the tone, the tools and the numbers you\u2019ll be measured on.',
    forYou: 'You\u2019re patient, you write clearly, and you can stay kind on message forty of the day.',
    walkAway: 'Reply frameworks for every mood a customer arrives in, Zendesk and Intercom basics, and the support metrics in plain words.',
  },
  'general-va': {
    plain: 'The general VA is the steady pair of hands: inbox, calendar, research, follow-ups, whatever the week throws. This course turns \u2018I can help with anything\u2019 into a defined role clients pay properly for.',
    forYou: 'You\u2019re organised and dependable but not ready to specialise yet — or you want the strongest possible foundation first.',
    walkAway: 'A daily operating rhythm, update and handover templates, and a way to describe your role that earns more than \u2018general help\u2019.',
  },
  'data-and-research': {
    plain: 'Every business runs on lists and lookups — leads, prices, competitors, contacts. This course teaches you to produce clean, source-backed data fast enough to charge per project instead of per hour.',
    forYou: 'You\u2019re careful, a little obsessive about accuracy, and comfortable living in spreadsheets.',
    walkAway: 'Sheets techniques that triple your speed, a research method with sources a client can check, and QA habits that build trust.',
  },
  'email-marketing': {
    plain: 'Email is the channel that quietly makes online stores the most money. This course teaches the flows and campaigns — in Klaviyo and Mailchimp — plus how to report the revenue so the client sees your value.',
    forYou: 'You like writing AND numbers, and you want a skill where your work shows up directly in the client\u2019s sales.',
    walkAway: 'The three money-making flows built end to end, campaign templates, and a monthly report format clients renew for.',
  },
  'sales-development': {
    plain: 'Lead-gen VAs find the right people, start conversations, and book the sales call. It\u2019s the role closest to revenue — which is why it pays, and why clients measure it hard. This course preps you for both parts.',
    forYou: 'You\u2019re persistent, unbothered by silence or \u2018no\u2019, and you like clear targets.',
    walkAway: 'A list-building method, outbound scripts that don\u2019t sound like spam, and a qualification checklist sales teams love.',
  },
  'web-and-no-code': {
    plain: 'Someone has to update the website, fix the broken form and build the new landing page — and the VA who can is paid noticeably more. This course teaches Webflow, WordPress and just enough code to be dangerous, safely.',
    forYou: 'You\u2019re a tinkerer. You\u2019d rather figure out why it broke than write a ticket about it.',
    walkAway: 'Real pages built in Webflow and WordPress, a safe-changes checklist for live sites, and enough HTML and CSS to fix your own messes.',
  },
  'project-management': {
    plain: 'Project management is keeping everyone honest about who is doing what, by when — in Asana, ClickUp or Notion. This course teaches the setup and the gentle chasing that keeps clients renewing.',
    forYou: 'You\u2019re the friend who plans the group trip. You like order and you\u2019re comfortable nudging people.',
    walkAway: 'A project board you can rebuild for any client, a 10-minute status update format, and chase scripts that don\u2019t annoy.',
  },
  'graphic-design': {
    plain: 'Design VAs make the everyday brand graphics — socials, decks, ads — that need to look professional without a studio budget. This course teaches the fundamentals plus the Canva and Figma workflow.',
    forYou: 'You have an eye for what looks right and you\u2019re ready to learn why it looks right.',
    walkAway: 'A portfolio of client-style pieces, reusable templates, and a feedback-and-revision process that keeps projects moving.',
  },
  'writing-for-clients': {
    plain: 'Content writing pays when you\u2019re fast and consistent — which comes from process, not talent. This course gives you the brief-to-draft-to-edit system and teaches you to sound like the client, not like a robot.',
    forYou: 'You already write decently and want to get paid for it without drowning in endless revision rounds.',
    walkAway: 'A repeatable writing process, brief and outline templates, and editing habits that cut revisions in half.',
  },
  'video-editing': {
    plain: 'Short-form video is where brands are spending, and they need editors who understand pace, hooks and captions. This course teaches the CapCut and Premiere workflow from raw footage to delivered reel.',
    forYou: 'You watch reels thinking \u2018I could cut this better\u2019. Patience with footage required; fancy gear not.',
    walkAway: 'A start-to-finish editing workflow, a hook-and-caption playbook, and a delivery system clients trust with their raw files.',
  },
  'bookkeeping-basics': {
    plain: 'Small businesses need their money records kept clean far more often than they need an accountant. This course teaches the bookkeeping layer — invoices, bills, reconciliation — in Xero and QuickBooks.',
    forYou: 'You\u2019re precise, trustworthy and genuinely fine with routine. In bookkeeping, boring is a feature.',
    walkAway: 'The monthly bookkeeping rhythm, debits and credits explained like a human, and a clear line for when to hand off to an accountant.',
  },
  'ai-marketing-and-aeo': {
    plain: 'Two skills in one. First: using ChatGPT and Claude properly — prompts, quality control, honest workflows. Second: AEO, the brand-new work of getting a business mentioned inside AI answers like Google\u2019s AI Overviews. It\u2019s new enough that you can genuinely get ahead of agencies.',
    forYou: 'You\u2019re curious about AI but tired of the hype. You want the practical version, with the risks handled.',
    walkAway: 'A prompt library, a fact-checked content pipeline, an AI-citable page brief, and a measurement plan — assembled into one portfolio system in the capstone.',
  },
};

function panel({ plain, forYou, walkAway }) {
  return (
    `<section class="px-5 pt-10 md:px-8"><div class="mx-auto max-w-5xl">` +
    `<div id="plain-words" class="rounded-2xl border border-line bg-card p-6 shadow-tile sm:p-7">` +
    `<p class="eyebrow">In plain words</p>` +
    `<p class="mt-3 max-w-3xl text-[1.0625rem] leading-[1.75] text-ink">${plain}</p>` +
    `<div class="mt-6 grid gap-5 sm:grid-cols-2">` +
    `<div><p class="eyebrow text-muted">This is for you if</p><p class="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">${forYou}</p></div>` +
    `<div><p class="eyebrow text-muted">You walk away with</p><p class="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">${walkAway}</p></div>` +
    `</div></div></div></section>`
  );
}

let ok = 0;
for (const [slug, words] of Object.entries(WORDS)) {
  const file = path.join(DIR, `${slug}.ts`);
  const src = fs.readFileSync(file, 'utf8');
  const start = src.indexOf('{', src.indexOf('const course'));
  const course = JSON.parse(src.slice(start, src.lastIndexOf('}') + 1));

  let v = course.chunks[0].value;
  // Replace an earlier panel, if any.
  v = v.replace(/<section class="px-5 pt-10 md:px-8"><div class="mx-auto max-w-5xl"><div id="plain-words".*?<\/section>/s, '');
  // Insert after the sticky section nav when the course has one, otherwise
  // right after the hero section.
  const navEnd = v.indexOf('</nav>');
  const at =
    navEnd !== -1
      ? navEnd + '</nav>'.length
      : v.indexOf('</section>') + '</section>'.length;
  course.chunks[0].value = v.slice(0, at) + panel(words) + v.slice(at);

  const out =
    `// Generated from the Verse deep-course source. Do not edit by hand.\n` +
    `import type { DeepCourse } from '../deep-course-types';\n\n` +
    `const course: DeepCourse = ${JSON.stringify(course)} as DeepCourse;\n\n` +
    `export default course;\n`;
  fs.writeFileSync(file, out);
  ok += 1;
  console.log(`ok: ${slug}`);
}
console.log(`done — ${ok} of ${Object.keys(WORDS).length} courses updated`);
