/**
 * Niche cover-letter templates.
 *
 * These are deliberately NOT one letter with the job title swapped out. Hiring
 * managers in each of these niches skim for different proof: an EA client wants
 * to hear about judgement and discretion, an SEO client wants numbers, a support
 * client wants response times, a bookkeeper client wants reconciliation and
 * deadlines. Each template has its own structure, its own proof lines and its
 * own closer.
 *
 * Every niche is built from PARTS (intro, openers, context, bullets, closer)
 * rather than one string, so a single generation can render several ways:
 * - 'full'  — the classic letter
 * - 'short' — a compressed message for OnlineJobs.ph chats and Upwork proposals
 * and each niche carries a few interchangeable openers, so "Fresh take" can
 * produce a genuinely different letter from the same inputs.
 *
 * Pure functions, no network, no auth — template mode has to work for someone
 * who has never signed in.
 */

export type Niche =
  | 'general'
  | 'seo'
  | 'writer'
  | 'ea'
  | 'support'
  | 'ops'
  | 'social'
  | 'design'
  | 'video'
  | 'bookkeeping'
  | 'data'
  | 'pm'
  | 'email'
  | 'web'
  | 'sales'
  | 'realestate'
  | 'ecommerce';

export type LetterInput = {
  name: string;
  years: string;
  /** Optional one-line pitch that replaces the generic opener. */
  headline: string;
  role: string;
  company: string;
  /** First name spotted in the listing, e.g. "Hi Marco". */
  contact: string;
  listing: string;
};

/** Coarse buckets, only used to keep the picker readable at 17 options. */
export type NicheGroup = 'Admin & support' | 'Marketing & content' | 'Creative' | 'Ops & delivery' | 'Technical & stores';

export const NICHE_GROUPS: NicheGroup[] = [
  'Admin & support',
  'Marketing & content',
  'Creative',
  'Ops & delivery',
  'Technical & stores',
];

export type NicheMeta = {
  id: Niche;
  label: string;
  blurb: string;
  group: NicheGroup;
};

export const NICHES: NicheMeta[] = [
  { id: 'general', label: 'General VA', blurb: 'Admin, inbox, research, the bits nobody else picks up.', group: 'Admin & support' },
  { id: 'ea', label: 'Executive assistant', blurb: 'Calendar, gatekeeping, judgement. Leads with trust.', group: 'Admin & support' },
  { id: 'support', label: 'Customer support', blurb: 'Queues, tone, response times. Leads with the metric.', group: 'Admin & support' },
  { id: 'data', label: 'Data entry', blurb: 'Clean records at volume. Leads with accuracy, not speed alone.', group: 'Admin & support' },
  { id: 'realestate', label: 'Real estate VA', blurb: 'Listings, MLS, lead follow-up, transaction paperwork.', group: 'Admin & support' },

  { id: 'seo', label: 'SEO specialist', blurb: 'Rankings, audits, keyword work. Leads with numbers.', group: 'Marketing & content' },
  { id: 'writer', label: 'Content writer', blurb: 'Briefs, drafts, voice matching. Leads with published work.', group: 'Marketing & content' },
  { id: 'social', label: 'Social media manager', blurb: 'Calendars, hooks, comments. Leads with saves and replies.', group: 'Marketing & content' },
  { id: 'email', label: 'Email marketing', blurb: 'Flows, segments, deliverability. Leads with revenue per send.', group: 'Marketing & content' },
  { id: 'sales', label: 'Sales / lead gen', blurb: 'Lists, outreach, pipeline hygiene. Leads with booked calls.', group: 'Marketing & content' },

  { id: 'design', label: 'Graphic designer', blurb: 'Brand systems, ads, fast turnarounds. Leads with the work.', group: 'Creative' },
  { id: 'video', label: 'Video editor', blurb: 'Hooks, pacing, captions. Leads with retention.', group: 'Creative' },

  { id: 'ops', label: 'Operations', blurb: 'SOPs, systems, people. Leads with what you built.', group: 'Ops & delivery' },
  { id: 'pm', label: 'Project manager', blurb: 'Scope, dates, chasing. Leads with things that shipped.', group: 'Ops & delivery' },
  { id: 'bookkeeping', label: 'Bookkeeper', blurb: 'Reconciliation, payables, month-end. Leads with clean books.', group: 'Ops & delivery' },

  { id: 'web', label: 'Web developer', blurb: 'Builds, fixes, speed. Leads with shipped sites.', group: 'Technical & stores' },
  { id: 'ecommerce', label: 'E-commerce VA', blurb: 'Listings, orders, returns, store housekeeping.', group: 'Technical & stores' },
];

export function isNicheId(value: unknown): value is Niche {
  return typeof value === 'string' && NICHES.some((n) => n.id === value);
}

export function nicheMeta(id: Niche): NicheMeta {
  return NICHES.find((n) => n.id === id) ?? NICHES[0];
}

/** Tools worth naming back at them — specificity is the whole trick. */
const TOOLS: [string, RegExp][] = [
  ['Notion', /\bnotion\b/i],
  ['Asana', /\basana\b/i],
  ['ClickUp', /\bclickup\b/i],
  ['Trello', /\btrello\b/i],
  ['Monday.com', /\bmonday\.?com\b/i],
  ['Jira', /\bjira\b/i],
  ['Slack', /\bslack\b/i],
  ['HubSpot', /\bhubspot\b/i],
  ['Salesforce', /\bsalesforce\b/i],
  ['Pipedrive', /\bpipedrive\b/i],
  ['Airtable', /\bairtable\b/i],
  ['Zapier', /\bzapier\b/i],
  ['Make', /\bmake\.com\b/i],
  ['Shopify', /\bshopify\b/i],
  ['WooCommerce', /\bwoo\s?commerce\b/i],
  ['Amazon Seller Central', /seller central|\bamazon fba\b/i],
  ['Klaviyo', /\bklaviyo\b/i],
  ['Mailchimp', /\bmailchimp\b/i],
  ['ConvertKit', /\bconvert\s?kit\b|\bkit\.com\b/i],
  ['Zendesk', /\bzendesk\b/i],
  ['Gorgias', /\bgorgias\b/i],
  ['Intercom', /\bintercom\b/i],
  ['Freshdesk', /\bfreshdesk\b/i],
  ['Ahrefs', /\bahrefs\b/i],
  ['Semrush', /\bsem\s?rush\b/i],
  ['Screaming Frog', /screaming\s?frog/i],
  ['Surfer', /\bsurfer\s?(seo)?\b/i],
  ['GA4', /\bga4\b|google analytics/i],
  ['Search Console', /search console|\bgsc\b/i],
  ['WordPress', /\bwordpress\b/i],
  ['Webflow', /\bwebflow\b/i],
  ['Squarespace', /\bsquarespace\b/i],
  ['Canva', /\bcanva\b/i],
  ['Figma', /\bfigma\b/i],
  ['Photoshop', /\bphotoshop\b/i],
  ['Illustrator', /\billustrator\b/i],
  ['Premiere Pro', /\bpremiere\b/i],
  ['After Effects', /after\s?effects/i],
  ['CapCut', /\bcap\s?cut\b/i],
  ['DaVinci Resolve', /\bda\s?vinci\b|\bresolve\b/i],
  ['Descript', /\bdescript\b/i],
  ['Buffer', /\bbuffer\b/i],
  ['Hootsuite', /\bhootsuite\b/i],
  ['Later', /\blater\.com\b/i],
  ['Metricool', /\bmetricool\b/i],
  ['Apollo', /\bapollo\.io\b|\bapollo\b/i],
  ['Instantly', /\binstantly\.ai\b|\binstantly\b/i],
  ['Sales Navigator', /sales navigator/i],
  ['Calendly', /\bcalendly\b/i],
  ['Google Workspace', /google workspace|\bgsuite\b|g suite/i],
  ['Google Sheets', /google sheets/i],
  ['Excel', /\bexcel\b/i],
  ['QuickBooks', /\bquickbooks\b/i],
  ['Xero', /\bxero\b/i],
  ['Wave', /\bwave accounting\b/i],
  ['Bill.com', /\bbill\.com\b/i],
  ['Gusto', /\bgusto\b/i],
  ['MLS', /\bmls\b/i],
  ['Follow Up Boss', /follow ?up boss/i],
  ['kvCORE', /\bkv\s?core\b/i],
  ['Zillow', /\bzillow\b/i],
  ['DocuSign', /\bdocusign\b/i],
  ['React', /\breact\b/i],
  ['Next.js', /\bnext\.?js\b/i],
  ['Tailwind', /\btailwind\b/i],
  ['Loom', /\bloom\b/i],
];

export function detectTools(listing: string) {
  return TOOLS.filter(([, re]) => re.test(listing)).map(([name]) => name).slice(0, 4);
}

/** Themes a letter can react to, so two listings in the same niche don't
 *  produce identical letters. */
const THEMES: [string, RegExp][] = [
  ['startup', /\bstartup|early[- ]stage|founder[- ]led|seed\b/i],
  ['agency', /\bagency|client accounts|multiple clients\b/i],
  ['ecommerce', /\becommerce|e-commerce|dtc|online store|shopify\b/i],
  ['saas', /\bsaas|b2b software|subscription\b/i],
  ['ai', /\bai\b|automation|gpt|chatgpt|claude/i],
  ['scale', /\bscal(e|ing)|grow(th|ing) fast|high volume\b/i],
];

function themes(listing: string) {
  return new Set(THEMES.filter(([, re]) => re.test(listing)).map(([t]) => t));
}

function list(items: string[]) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function plural(years: string) {
  return years === '1' ? 'year' : 'years';
}

function greeting(contact: string) {
  return contact ? `Hi ${contact},` : 'Hi there,';
}

function signoff(name: string, line: string) {
  return `${line}\n\n${name.trim() || 'Your name'}`;
}

function roleLine(role: string, company: string) {
  const r = role ? `the ${role} role` : 'this role';
  return company ? `${r} at ${company}` : r;
}

function toolLine(tools: string[], verb = 'I already work in') {
  return tools.length ? `${verb} ${list(tools)}, so nothing here needs a week of ramp-up. ` : '';
}

/**
 * The pieces every niche letter is assembled from. Copy lives here; layout
 * lives in `compose`, so one generation can render as a full letter or a
 * short message without each niche knowing about formats.
 */
type LetterParts = {
  /** "I read your post for the X role at Y." */
  intro: string;
  /** Interchangeable first paragraphs; a user headline replaces all of them. */
  openers: string[];
  /** The niche's angle on the listing plus the tool name-back. */
  context: string;
  bulletsHeader: string;
  bullets: string[];
  closer: string;
  signLine: string;
};

export type LetterFormat = 'full' | 'short';

function compose(parts: LetterParts, input: LetterInput, format: LetterFormat, take: number) {
  const opener = input.headline.trim() || parts.openers[take % parts.openers.length];
  const head = `${greeting(input.contact)}\n\n${parts.intro} ${opener}`;
  const sign = signoff(input.name, parts.signLine);

  if (format === 'short') {
    // A chat-box message: intro, the two strongest proof lines, then straight
    // to the ask. Under ~120 words on purpose.
    const proof = parts.bullets.slice(0, 2).map((b) => `- ${b}`).join('\n');
    return `${head}\n\nTwo specifics:\n\n${proof}\n\n${parts.closer}\n\n${sign}`
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  const bulletBlock = parts.bullets.map((b) => `- ${b}`).join('\n');
  return `${head}\n\n${parts.context}\n\n${parts.bulletsHeader}:\n\n${bulletBlock}\n\n${parts.closer}\n\n${sign}`
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

type PartsBuilder = (i: LetterInput) => LetterParts;

const BUILDERS: Record<Niche, PartsBuilder> = {
  /* ------------------------------------------------------------------ */
  general: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const context = t.has('startup')
      ? 'I know what an early-stage day looks like: the priority changes at 10am and the thing still has to ship.'
      : t.has('agency')
        ? 'I\'m used to juggling a few client accounts at once without letting any of them feel like the second priority.'
        : 'I like the work that keeps a business tidy: the follow-ups, the files, the things that go wrong quietly.';

    return {
      intro: `I read your post for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've spent ${i.years} ${plural(i.years)} being the person small remote teams hand the messy stuff to.`,
        `For the last ${i.years} ${plural(i.years)} I've been the VA my clients stopped double-checking after month one.`,
        `${i.years} ${plural(i.years)} of keeping founders' plates from overflowing — inbox, calendar, and everything that falls between job titles.`,
      ],
      context: `${context} ${toolLine(tools)}`,
      bulletsHeader: 'What that looks like day to day',
      bullets: [
        'Inbox and calendar handled, with drafts ready for you to approve instead of write',
        'Research and admin turned around the same day, not "sometime this week"',
        "A short end-of-day note so you always know what moved and what's stuck",
      ],
      closer:
        "I work US hours and I'd rather ask one clarifying question up front than hand you something wrong. Happy to do a small paid trial task if that's easier than taking my word for it.",
      signLine: 'Thanks for reading,',
    };
  },

  /* ------------------------------------------------------------------ */
  seo: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'On ecommerce sites most of the win is boring: collection pages, internal links, and killing the duplicate variants eating the crawl budget.'
      : t.has('saas')
        ? 'For SaaS the traffic that converts is almost never the head term, so I build out the comparison and alternative pages people actually search before they buy.'
        : 'Most sites I pick up are losing to their own architecture before content is even the problem, so I audit first and write second.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `${i.years} ${plural(i.years)} in SEO, mostly for small sites that couldn't afford to waste a month on the wrong keywords.`,
        `I've done ${i.years} ${plural(i.years)} of SEO where the client checks the rankings themselves, so the numbers had to be real.`,
        `${i.years} ${plural(i.years)} of audits, keyword maps and content briefs — the unglamorous SEO that actually moves a small site.`,
      ],
      context: `${angle} ${toolLine(tools, 'I run')}`,
      bulletsHeader: "Three things I've actually delivered",
      bullets: [
        "Took a client's money keywords from page three into the top five in under four months",
        'Fixed a technical audit backlog (indexation, redirects, thin pages) that unlocked traffic no new content would have',
        'Built briefs writers could follow without me rewriting the draft afterwards',
      ],
      closer:
        "I report in plain numbers: what ranked, what moved, what didn't and why. If it helps, send me a URL and I'll come back with the three things I'd change first, free.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  writer: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ai')
      ? 'I use AI the way most good writers do now: for research and outlines, never for the final draft. You can tell, and so can readers.'
      : 'I write to a brief and match an existing voice rather than importing my own, which usually means fewer rounds of edits.';

    return {
      intro: `I'd like to write for ${i.company || 'you'}${i.role ? ` as your ${i.role}` : ''}.`,
      openers: [
        `I've been writing content for ${i.years} ${plural(i.years)}, mostly long-form that has to earn its traffic.`,
        `${i.years} ${plural(i.years)} of writing to briefs, deadlines and other people's brand voices — and enjoying it, mostly.`,
        `I've spent ${i.years} ${plural(i.years)} writing the kind of content that gets measured: ranked, opened, or clicked, not just published.`,
      ],
      context: `${angle} ${toolLine(tools, 'I draft and publish in')}`,
      bulletsHeader: 'How I work',
      bullets: [
        'Brief first: angle, audience, what the piece has to do. No surprises at draft stage',
        'First drafts land on schedule, and I take edits without getting precious',
        "I'll flag when a topic won't perform instead of writing it anyway to hit a quota",
      ],
      closer:
        "Samples are in my portfolio, and I'm happy to write one paid test piece on a topic you choose so you can judge the real thing instead of my best work.",
      signLine: 'Thanks for reading,',
    };
  },

  /* ------------------------------------------------------------------ */
  ea: (i) => {
    const tools = detectTools(i.listing);

    return {
      intro: `I'm applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've supported founders and executives for ${i.years} ${plural(i.years)}, the kind of support where you're trusted with the calendar and the awkward emails.`,
        `${i.years} ${plural(i.years)} as an EA taught me the real job description: protect the calendar, read the room, say no politely on someone else's behalf.`,
        `For ${i.years} ${plural(i.years)} I've been the person executives hand their inbox to — and the reason it stops being a source of dread.`,
      ],
      context: `${toolLine(tools, 'I live in')}The part of this job that matters isn't the scheduling, it's the judgement: knowing which meeting can move, which email needs you personally, and which problem to solve without asking.`,
      bulletsHeader: "What you'd get",
      bullets: [
        'A calendar defended properly, including the gaps between things',
        'Inbox triaged daily, with replies drafted in your voice for a one-click send',
        'Travel, docs and follow-ups handled quietly, and discretion about everything I see',
      ],
      closer:
        "I work US hours and I'm reachable during them. If it's useful, give me one week of your real inbox rules and I'll show you rather than describe it.",
      signLine: 'Thanks for your time,',
    };
  },

  /* ------------------------------------------------------------------ */
  support: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'Most ecommerce tickets are the same eight questions plus one genuinely angry person, and the second one decides your reviews.'
      : 'Most tickets are repeat questions, so I fix the macro and the help doc instead of answering the same thing forever.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `${i.years} ${plural(i.years)} on support queues, including the ones that got busy faster than they got staffed.`,
        `I've spent ${i.years} ${plural(i.years)} in support inboxes, where the metric that matters is whether the customer comes back.`,
        `${i.years} ${plural(i.years)} of tickets, live chat and the occasional customer who typed in all caps — still patient, still fast.`,
      ],
      context: `${angle} ${toolLine(tools, 'I know my way around')}`,
      bulletsHeader: 'What I bring to a queue',
      bullets: [
        'Sub-two-hour first response held on a busy inbox, without canned answers that read like canned answers',
        'De-escalation that ends in a refund or a fix, not a thread with nine replies',
        'Notes back to the team on what keeps breaking, because support sees it first',
      ],
      closer:
        'I can cover US hours, weekends included if you need them. Send me three real tickets and I\'ll reply to them as a test.',
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  ops: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('scale')
      ? "Growing fast usually breaks the same three things first: handoffs, reporting, and whoever's holding it all in their head. I document those before they break."
      : t.has('ai')
        ? 'I automate the repetitive parts, but only after the manual version works. Automating a broken process just makes it fail faster.'
        : 'I care less about tools than about whether a task can be handed to someone new without a 40-minute call.';

    return {
      intro: `I'm interested in ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've run operations for ${i.years} ${plural(i.years)}, mostly for small remote teams where I was the process and the person doing it.`,
        `${i.years} ${plural(i.years)} of ops work: turning "only Maria knows how to do that" into a document anyone can follow.`,
        `For ${i.years} ${plural(i.years)} I've owned the boring machinery of small businesses — SOPs, handoffs, reporting — so the founders could stop being the machinery.`,
      ],
      context: `${angle} ${toolLine(tools, 'I build in')}`,
      bulletsHeader: "What I've built",
      bullets: [
        'SOPs and onboarding that let new VAs run a client account in their first week',
        'Reporting the team actually reads, because it answers one question instead of showing forty metrics',
        "A hiring and training loop I ran end to end, from job post to a person who's productive",
      ],
      closer:
        "I'd start by learning how things run now before changing anything. First thirty days: map it, find the two worst bottlenecks, fix one.",
      signLine: 'Thanks for reading,',
    };
  },

  /* ------------------------------------------------------------------ */
  social: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'For a store, the feed is a shop window and the comments are the checkout queue, so I treat replies as revenue work rather than community fluff.'
      : 'Reach is mostly the hook. I test three openings on the same idea rather than posting one version and hoping the algorithm is kind.';

    return {
      intro: `I'd like to take on ${roleLine(i.role, i.company)}.`,
      openers: [
        `${i.years} ${plural(i.years)} running social accounts that had to sell something, not just post consistently.`,
        `I've managed brand accounts for ${i.years} ${plural(i.years)} — the posting is the easy half; the calendar, comments and reporting are the job.`,
        `${i.years} ${plural(i.years)} of content calendars, hooks and comment sections, for brands that measured me on saves and sales rather than likes.`,
      ],
      context: `${angle} ${toolLine(tools, 'I schedule and track in')}`,
      bulletsHeader: "How I'd run the account",
      bullets: [
        'A month of content mapped to a few repeatable formats, so nothing depends on a burst of inspiration',
        'Hooks and captions written per platform, because a Reel caption and a LinkedIn post are not the same asset',
        'Comments and DMs answered daily, and a monthly read on saves, shares and follows rather than vanity likes',
      ],
      closer:
        "Send me your last thirty posts and I'll tell you which three formats are carrying the account and what I'd cut.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  design: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('agency')
      ? 'Agency pace suits me. I can hold several brands in my head and keep each one looking like itself, not like my portfolio.'
      : 'I design inside a brand system rather than restarting from taste every time, which is why revisions stay small.';

    return {
      intro: `I'm applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've been designing for ${i.years} ${plural(i.years)}, mostly the everyday work: ads, landing pages, decks, social sets.`,
        `${i.years} ${plural(i.years)} of production design — the fast, on-brand, correctly-exported kind that keeps a marketing team moving.`,
        `For ${i.years} ${plural(i.years)} I've made the graphics businesses need weekly, delivered so they can be used without a fix-it round.`,
      ],
      context: `${angle} ${toolLine(tools, 'I work in')}`,
      bulletsHeader: "What you'd get from me",
      bullets: [
        'Ad and social sets delivered in every size you need, exported and named properly, not one artboard you have to crop',
        'Templates your team can reuse without breaking the type scale',
        'Two directions on the first round, then refinement, instead of eight variations that all hedge',
      ],
      closer:
        "I'll send a portfolio link with work closest to your category. Give me one real brief and I'll turn around a first concept so you're judging the work, not the pitch.",
      signLine: 'Thanks for looking,',
    };
  },

  /* ------------------------------------------------------------------ */
  video: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'For product video the edit has to show the thing working before it shows the logo, so I cut to the demo fast and keep the proof on screen.'
      : 'Retention is an editing problem more than a filming one: pace, cuts on the beat, captions that carry the video on mute.';

    return {
      intro: `I'd like to edit for ${i.company || 'you'}${i.role ? ` as your ${i.role}` : ''}.`,
      openers: [
        `I've been editing for ${i.years} ${plural(i.years)}, mostly short-form that lives or dies in the first two seconds.`,
        `${i.years} ${plural(i.years)} of cutting reels, shorts and ads — the kind of editing you judge by watch time, not by effects.`,
        `For ${i.years} ${plural(i.years)} I've turned raw talking-head footage into videos people finish, on a weekly delivery schedule.`,
      ],
      context: `${angle} ${toolLine(tools, 'I cut in')}`,
      bulletsHeader: 'How I work',
      bullets: [
        'Hook options cut from the same footage, so you can test openings instead of guessing',
        'Clean captions, sound levelling and colour that matches across a batch',
        'Consistent turnaround on a weekly batch, with organised project files if someone else has to open them',
      ],
      closer:
        "Send me one raw clip and I'll edit thirty seconds of it. It's faster than reading about my process.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  bookkeeping: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'Store books get messy at the payout level, so I reconcile gateway deposits to orders and fees rather than dumping a lump sum into sales.'
      : 'Categorisation is where most small books go wrong, so I agree the chart of accounts with you once and then keep it boring.';

    return {
      intro: `I'm applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've kept books for ${i.years} ${plural(i.years)}, mostly for small businesses whose accountant was tired of cleaning up the file.`,
        `${i.years} ${plural(i.years)} of reconciliations, payables and month-end closes that landed on the agreed date.`,
        `For ${i.years} ${plural(i.years)} I've kept small-business books clean enough that year-end is a formality, not an archaeology project.`,
      ],
      context: `${angle} ${toolLine(tools, 'I work in')}`,
      bulletsHeader: 'What I handle',
      bullets: [
        'Weekly categorisation and bank reconciliation, with a short list of anything I need you to confirm',
        'Payables and receivables chased on schedule, so nothing goes late quietly',
        'Month-end close with P&L and balance sheet, delivered by an agreed date instead of whenever',
      ],
      closer:
        'I ask before guessing on a transaction, and I keep the audit trail clean enough that your accountant has no questions at year end. Happy to reconcile one recent month as a paid trial.',
      signLine: 'Thanks for your time,',
    };
  },

  /* ------------------------------------------------------------------ */
  data: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ai')
      ? 'Where a task repeats, I script or automate it and keep a manual check on a sample, because a fast wrong import is worse than slow typing.'
      : 'Speed is easy to promise, so I care about the other half: consistent formatting, no duplicates, and a note on every record I could not verify.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've done data work for ${i.years} ${plural(i.years)}: entry, cleanup, migrations, and the lists nobody wants to touch.`,
        `${i.years} ${plural(i.years)} of data entry and cleanup where the deliverable was a sheet someone could trust without spot-checking it.`,
        `For ${i.years} ${plural(i.years)} I've turned messy exports and half-finished CRMs into records a business can actually use.`,
      ],
      context: `${angle} ${toolLine(tools, 'I work in')}`,
      bulletsHeader: 'What I bring',
      bullets: [
        'Accurate entry at volume with a defined format, so the sheet stays sortable six months later',
        'Deduping, validation and cleanup before import rather than fixing the CRM afterwards',
        'A flagged exceptions list each batch instead of silent guesses',
      ],
      closer:
        "I'll follow whatever conventions you already use, and if you do not have any I'll propose one page of rules first. Give me a hundred sample rows and check my work before committing to more.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  pm: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('agency')
      ? 'Agency work fails on scope and silence more than on skill, so I keep the scope written down and the client updated before they have to ask.'
      : t.has('startup')
        ? 'In a small team the plan changes weekly, so I keep one visible priority list instead of a Gantt chart nobody trusts by Wednesday.'
        : 'Most slipped deadlines are visible a week early if someone is actually looking, so I chase early and quietly rather than escalating late.';

    return {
      intro: `I'm interested in ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've managed projects for ${i.years} ${plural(i.years)}, mostly remote teams across time zones where nobody could just tap someone on the shoulder.`,
        `${i.years} ${plural(i.years)} of keeping remote projects honest: scope written down, owners named, dates that mean something.`,
        `For ${i.years} ${plural(i.years)} I've been the person who notices a deadline wobbling a week before it slips.`,
      ],
      context: `${angle} ${toolLine(tools, 'I run projects in')}`,
      bulletsHeader: 'How I keep things moving',
      bullets: [
        'Scope, owner and date on every task, so "in progress" always means something',
        "A weekly status that says what shipped, what's at risk and what I need a decision on",
        'Blockers raised the day they appear, with a proposed answer attached',
      ],
      closer:
        "I'd rather have one uncomfortable conversation in week one than a surprise in week six. Happy to walk through a project I ran end to end and what I'd do differently.",
      signLine: 'Thanks for reading,',
    };
  },

  /* ------------------------------------------------------------------ */
  email: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'For a store the flows do the heavy work: welcome, browse and cart abandonment, post-purchase and winback usually beat another campaign blast.'
      : t.has('saas')
        ? 'For subscription products onboarding email decides activation, so I sequence around the one action that predicts retention.'
        : 'A smaller, better-segmented send almost always beats emailing everyone, and it keeps you out of the promotions tab.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `${i.years} ${plural(i.years)} on email and lifecycle marketing, the kind measured in revenue per recipient rather than open rate.`,
        `I've built and run email programs for ${i.years} ${plural(i.years)} — flows first, campaigns second, deliverability always.`,
        `${i.years} ${plural(i.years)} of Klaviyo-and-spreadsheet work: segments, sequences and subject lines that get judged by the revenue column.`,
      ],
      context: `${angle} ${toolLine(tools, 'I build in')}`,
      bulletsHeader: "What I'd own",
      bullets: [
        'Core flows built and A/B tested on subject lines and offers, not just design tweaks',
        'Segmentation and suppression rules that protect deliverability while list size grows',
        'A monthly readout in revenue, unsubscribes and deliverability, with the next test already named',
      ],
      closer:
        "Send me your current flow list and I'll tell you which one I'd rebuild first and why.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  web: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('ecommerce')
      ? 'On a store the money is in speed and checkout, so I fix load time and broken flows before anyone repaints the homepage.'
      : 'Most site problems I inherit are performance and structure, not looks, so I measure first and only then start changing markup.';

    return {
      intro: `I'd like to work on ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've been building and maintaining websites for ${i.years} ${plural(i.years)}, from small marketing sites to ongoing fixes on somebody else's codebase.`,
        `${i.years} ${plural(i.years)} of shipping pages, fixing forms and inheriting other people's WordPress installs without complaining about them in the commit messages.`,
        `For ${i.years} ${plural(i.years)} I've been the person a small business calls when the site is slow, broken or three plugins past saving.`,
      ],
      context: `${angle} ${toolLine(tools, 'I build with')}`,
      bulletsHeader: 'What I deliver',
      bullets: [
        'Pages that match the design on mobile first, and stay accessible with keyboard and screen readers',
        'Fast load times, with the Core Web Vitals measured before and after rather than assumed',
        'Clean handover: readable code, a short note on how to edit it, and no plugin sprawl',
      ],
      closer:
        'I give estimates in ranges and tell you early if something is bigger than it looked. Happy to start with one paid bug or a single page so you can see how I work.',
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  sales: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('saas')
      ? 'For software the reply rate lives in the list, not the template, so I qualify by trigger and role before writing a single line.'
      : 'Volume without research just burns a domain, so I keep sends small, personalised on one real detail, and warmed properly.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `${i.years} ${plural(i.years)} in lead generation and outbound, the unglamorous half: list building, sequences and follow-up nobody else does.`,
        `I've done outbound for ${i.years} ${plural(i.years)} — built the lists, wrote the sequences, and kept following up after everyone else stopped.`,
        `${i.years} ${plural(i.years)} of prospecting where the report ends in booked calls, not "emails sent".`,
      ],
      context: `${angle} ${toolLine(tools, 'I work in')}`,
      bulletsHeader: "What I'd do in the first month",
      bullets: [
        'Build and verify a targeted list against your actual ICP, not a scraped dump',
        'Run sequences with real follow-up steps, and report reply rate and booked calls rather than emails sent',
        'Keep the CRM honest: every lead staged, noted and next-actioned, so nothing sits forgotten',
      ],
      closer:
        "I'll tell you when a segment is not responding instead of quietly emailing it forever. Give me one ICP and I'll build a sample list of twenty-five so you can judge quality first.",
      signLine: 'Thanks,',
    };
  },

  /* ------------------------------------------------------------------ */
  realestate: (i) => {
    const tools = detectTools(i.listing);

    return {
      intro: `I'm applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've supported real estate agents and teams for ${i.years} ${plural(i.years)}, on the admin and follow-up that keeps deals from stalling.`,
        `${i.years} ${plural(i.years)} of real estate support: listings kept current, leads called back on day one, files complete before anyone asks.`,
        `For ${i.years} ${plural(i.years)} I've been the back office for busy agents — CRM, paperwork and the follow-up calls that keep pipelines warm.`,
      ],
      context: `${toolLine(tools, 'I work in')}Most leads go cold because nobody called back on day two, and most closings slow down because one document was missing. Both are fixable with someone reliable on them.`,
      bulletsHeader: "What I'd handle",
      bullets: [
        'Listings created and syndicated with correct photos, copy and details, then kept updated as status changes',
        'Lead follow-up on a set cadence, with notes in the CRM so you walk into every call informed',
        'Transaction coordination: disclosures, deadlines, signatures chased, and a checklist per file',
      ],
      closer:
        "I work US hours and I'm comfortable talking to clients, lenders and title when you need me to. I'm careful with confidential documents and I never send anything client-facing without your sign-off first.",
      signLine: 'Thanks for your time,',
    };
  },

  /* ------------------------------------------------------------------ */
  ecommerce: (i) => {
    const tools = detectTools(i.listing);
    const t = themes(i.listing);
    const angle = t.has('scale')
      ? 'When order volume jumps, the cracks show in fulfilment and returns first, so I keep those processes written down and checked daily.'
      : 'A store loses money quietly: a listing with the wrong variant, a stockout nobody caught, a return sitting unprocessed for a week.';

    return {
      intro: `Applying for ${roleLine(i.role, i.company)}.`,
      openers: [
        `I've supported online stores for ${i.years} ${plural(i.years)}, on the daily running of them rather than the marketing around them.`,
        `${i.years} ${plural(i.years)} of store operations: listings, orders, returns and the customer emails that decide your reviews.`,
        `For ${i.years} ${plural(i.years)} I've kept stores tidy behind the scenes — inventory that matches reality, orders that ship, returns that don't sit.`,
      ],
      context: `${angle} ${toolLine(tools, 'I work in')}`,
      bulletsHeader: "What I'd take off your plate",
      bullets: [
        'Product listings built properly: titles, variants, images, descriptions and inventory that match reality',
        'Orders, fulfilment issues and returns processed daily, with suppliers chased when a shipment slips',
        'Customer messages answered in your tone, plus a weekly note on what buyers keep asking about',
      ],
      closer:
        "I'll flag the small things that cost sales, like a broken discount or a product page missing sizing. Happy to audit ten of your listings before you hire me so you can see the standard.",
      signLine: 'Thanks,',
    };
  },
};

export function buildLetter(
  niche: Niche,
  input: LetterInput,
  opts?: { format?: LetterFormat; take?: number },
) {
  return compose(BUILDERS[niche](input), input, opts?.format ?? 'full', opts?.take ?? 0);
}

/** How many distinct openers a niche can cycle through with "Fresh take". */
export function takeCount(niche: Niche, input: LetterInput) {
  return input.headline.trim() ? 1 : BUILDERS[niche](input).openers.length;
}

/**
 * Which niche a pasted listing looks like.
 *
 * Ordered most specific first: "transaction coordinator" is real estate before
 * it is project management, and "Klaviyo flows" is email before it is generic
 * marketing. Returns null when nothing is confident enough to override the
 * user's own default.
 */
const NICHE_HINTS: [Niche, RegExp][] = [
  ['realestate', /real estate|realtor|\bmls\b|listing agent|escrow|transaction coordinator|brokerage|property manager/i],
  ['bookkeeping', /bookkeep|quickbooks|\bxero\b|reconcil|accounts payable|accounts receivable|month[- ]end close|payroll processing/i],
  ['video', /video editor|video editing|premiere pro|after effects|cap ?cut|da ?vinci|edit (reels|shorts)|youtube editor/i],
  ['design', /graphic design|brand identity|photoshop|illustrator|creative designer|ad creatives?\b/i],
  ['email', /email marketing|klaviyo|mailchimp|convert ?kit|newsletter|email campaigns?|lifecycle marketing|drip sequence/i],
  ['social', /social media (manager|marketing|specialist)|community manager|content calendar|instagram|tik ?tok/i],
  ['sales', /lead gen|appointment setter|\bsdr\b|cold (email|calling)|outbound|sales development|prospect(ing|s)\b/i],
  ['ecommerce', /ecommerce|e-commerce|shopify (store|assistant|va)|amazon fba|seller central|product listings?|order fulfil/i],
  ['seo', /\bseo\b|search engine|backlink|keyword research|ahrefs|semrush/i],
  ['writer', /content writer|copywriter|blog writer|ghostwrit|write.{0,15}articles/i],
  ['web', /web developer|front[- ]?end developer|full[- ]?stack|wordpress developer|webflow developer|react\b|javascript\b/i],
  ['data', /data entry|data encoder|data cleanup|encoding|spreadsheet maintenance/i],
  ['ea', /executive assistant|\bea\b|chief of staff|founder'?s assistant|personal assistant/i],
  ['support', /customer (support|service|success)|help ?desk|support agent|tickets/i],
  ['pm', /project (manager|coordinator|management)|delivery manager|scrum|program manager/i],
  ['ops', /\boperations\b|ops (manager|lead)|process improvement|\bsop\b/i],
];

export function suggestNiche(listing: string): Niche | null {
  if (!listing.trim()) return null;
  return NICHE_HINTS.find(([, re]) => re.test(listing))?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Extras that ride along with a generated letter                      */
/* ------------------------------------------------------------------ */

/**
 * Subject lines for when the application goes by email. Three angles: plain
 * and searchable, warm, and confident. All under ~60 characters so nothing
 * gets cut off in an inbox list.
 */
export function subjectLines({ role, company, name }: { role: string; company: string; name: string }) {
  const r = role.trim() || 'Virtual assistant';
  const who = name.trim().split(/\s+/)[0] || 'a VA';
  return [
    `${r} application — ${name.trim() || 'my details inside'}`.slice(0, 70),
    `Re: your ${r} post${company.trim() ? ` at ${company.trim()}` : ''}`.slice(0, 70),
    `${r} who can start this week — ${who}`.slice(0, 70),
  ];
}

export type LetterCheck = {
  id: string;
  label: string;
  pass: boolean;
};

/**
 * The letter checkup: the handful of things that actually decide whether a
 * busy client keeps reading. Runs live against the current text, so it keeps
 * working while the user edits.
 */
export function checkLetter(
  letter: string,
  ctx: { listing: string; company: string; contact: string },
): LetterCheck[] {
  const words = letter.trim().split(/\s+/).filter(Boolean).length;
  const tools = detectTools(ctx.listing);
  const checks: LetterCheck[] = [
    {
      id: 'length',
      label: words <= 250 ? `Short enough to finish (${words} words)` : `Getting long — ${words} words (aim under 250)`,
      pass: words <= 250,
    },
  ];
  if (ctx.company.trim()) {
    checks.push({
      id: 'company',
      label: letter.toLowerCase().includes(ctx.company.trim().toLowerCase())
        ? 'Mentions the company by name'
        : 'Doesn\u2019t mention the company by name',
      pass: letter.toLowerCase().includes(ctx.company.trim().toLowerCase()),
    });
  }
  if (ctx.contact.trim()) {
    const used = letter.toLowerCase().includes(ctx.contact.trim().toLowerCase());
    checks.push({
      id: 'contact',
      label: used ? `Greets ${ctx.contact} by name` : `The post has a name (${ctx.contact}) — use it`,
      pass: used,
    });
  }
  if (tools.length) {
    const named = tools.filter((t) => letter.toLowerCase().includes(t.toLowerCase()));
    checks.push({
      id: 'tools',
      label: named.length
        ? `Names their tools: ${named.join(', ')}`
        : `Their post mentions ${tools[0]} — naming it back proves you read it`,
      pass: named.length > 0,
    });
  }
  checks.push({
    id: 'cta',
    label: /trial|sample|test|call|start|next step|send me|give me|walk (you|through)|audit/i.test(letter)
      ? 'Ends with a concrete next step'
      : 'No clear next step — offer a trial task or a quick call',
    pass: /trial|sample|test|call|start|next step|send me|give me|walk (you|through)|audit/i.test(letter),
  });
  return checks;
}
