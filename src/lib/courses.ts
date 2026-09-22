/**
 * Course catalogue.
 *
 * Two shapes live here on purpose:
 *  - status "open"  → has `lessons`, every word of which renders on the course page.
 *  - status "soon"  → has `outline` only, and the page says so plainly instead of
 *                     pretending there is something behind a login wall.
 *
 * The niche ids match `Niche` in cover-letter-templates.ts, so a course page and
 * the cover letter builder can point at each other later without a mapping table.
 */

import {
  EXTRAS,
  type ClientLooksFor,
  type PracticeProject,
  type QuizQuestion,
  type TemplateRef,
  type Walkthrough,
} from './course-extras';

export type {
  ClientLooksFor,
  PracticeProject,
  QuizQuestion,
  TemplateRef,
  Walkthrough,
} from './course-extras';

export type CourseStatus = 'open' | 'soon';

export type Lesson = {
  title: string;
  minutes: number;
  /** Paragraphs. Plain strings, no markdown — rendered as <p>. */
  body: string[];
  /** “Do these before moving on.” Merged in from course-extras.ts. */
  checklist?: string[];
};

export type Course = {
  slug: string;
  /** Matching cover-letter niche id, where one exists. */
  niche?: string;
  tag: string;
  title: string;
  author: string;
  blurb: string;
  tint: string;
  fg: string;
  status: CourseStatus;
  /**
   * Paid course. Set by the catalogue below, never authored inline, so the
   * basic/premium split lives in exactly one list.
   */
  premium?: boolean;
  lessons?: Lesson[];
  outline?: string[];
  /* --- all merged in from course-extras.ts, never authored inline --- */
  quiz?: QuizQuestion[];
  templates?: TemplateRef[];
  practiceProject?: PracticeProject;
  clientLooksFor?: ClientLooksFor[];
  walkthroughs?: Walkthrough[];
};

/* ------------------------------------------------------------------ */
/* Open courses                                                        */
/* ------------------------------------------------------------------ */

const STARTER: Lesson[] = [
  {
    title: 'What a VA actually does all day',
    minutes: 6,
    body: [
      'Most job posts say “virtual assistant” and mean one of four things: keeping a founder’s inbox and calendar sane, doing repeatable production work like posting and formatting, handling customers, or running a specific tool nobody in the company wants to learn. The pay gap between those four is enormous, and it has almost nothing to do with how hard the work feels.',
      'Spend a week reading twenty real listings before you decide what you are. Write down the tasks that repeat and the ones that scare you slightly. The scary-but-learnable pile is where your rate goes up.',
    ],
  },
  {
    title: 'Picking a niche that pays more than general admin',
    minutes: 8,
    body: [
      'General admin is the most crowded category on every board, which means you compete on price with a thousand people. A niche is not a personality, it is a promise: “I run Klaviyo flows for ecommerce brands” is a promise. “Detail-oriented and hardworking” is not.',
      'Pick a niche you can prove within a month. If you already do reporting at your day job, that is analytics. If you already fix your cousin’s Shopify theme, that is ecommerce ops. Starting from what you touch anyway beats starting from what pays best on paper, because you can show work in week two instead of month six.',
    ],
  },
  {
    title: 'The equipment and internet floor clients expect',
    minutes: 5,
    body: [
      'The realistic floor for full-time remote work in 2026: a laptop from the last five years, 8GB of RAM, a wired fiber line of at least 25 Mbps, a backup connection on a different provider or a mobile hotspot, a headset with a boom mic, and a UPS that gives you enough time to save and message your client.',
      'Clients rarely ask for a speed test up front. They ask after the second time you disappear mid-call. Buy the backup before you need it; it is the cheapest reputation insurance you will ever pay for.',
    ],
  },
  {
    title: 'Setting up a workspace that survives a brownout',
    minutes: 5,
    body: [
      'Work somewhere with a door if you can, a corner and a pair of over-ear headphones if you cannot. Put a plain wall or a bookshelf behind you and one light source in front of you, not behind. That is the whole video-call setup; ring lights are optional and virtual backgrounds usually look worse than a real wall.',
      'Then write your outage plan on paper and send it to your client on day one: what you do if power drops, what you do if internet drops, how fast you can be back, and where you will message from. Most VAs never do this, so it lands as unusual competence.',
    ],
  },
  {
    title: 'Time zones without wrecking your health',
    minutes: 6,
    body: [
      'US hours from the Philippines means a graveyard shift. It pays more, and it costs something. If you take it, keep one fixed sleep block instead of napping around the day, eat on a schedule your body can predict, and protect a real day off where you do not open Slack at all.',
      'Also negotiate overlap rather than coverage. Four hours of guaranteed overlap with your client plus four hours of async work is usually enough, and it is a much easier ask than you expect. Say it in the interview, not in month three when you are already burning out.',
    ],
  },
  {
    title: 'Contracts, invoices, and getting paid',
    minutes: 7,
    body: [
      'A one-page agreement is enough for most VA work: scope, hours, rate, payment date, notice period, and who owns the output. Send it yourself if the client does not have one. Anyone who refuses to put a number and a payment date in writing is telling you something useful.',
      'Invoice on a fixed schedule, not when you remember. Wise and Payoneer both work from the Philippines; compare the total landed cost including the conversion spread, not the headline fee. Ask for the first payment early — a small deposit or a shorter first cycle — because the riskiest invoice you will ever send is the first one.',
    ],
  },
  {
    title: 'Taxes and registration in the Philippines',
    minutes: 6,
    body: [
      'If you work for foreign clients as a freelancer you are still earning income here, and BIR registration as a self-employed professional is the clean route: fill out the forms, get your COR, keep your books, file quarterly. Under the current thresholds many freelancers land on the 8% option instead of graduated rates plus percentage tax, but run your own numbers or pay an accountant for one hour.',
      'The practical reason to register is not fear. It is that a COR and real income documents are what let you open business accounts, get a car loan, or rent without a payslip. Undeclared income is invisible income.',
    ],
  },
  {
    title: 'Your first thirty days with a client',
    minutes: 6,
    body: [
      'Week one: ask for access to everything and write down how each system works as you learn it. Week two: take over one full recurring task end to end. Week three: find something small that is broken and fix it without being asked. Week four: send a summary of what changed since you arrived.',
      'That last message is the one that gets you kept. Clients do not track your contribution as carefully as you do, so hand them the receipts in five lines. Do it monthly forever after.',
    ],
  },
];

const APPLICATIONS: Lesson[] = [
  {
    title: 'Why most applications never get read',
    minutes: 5,
    body: [
      'A busy client opens twenty applications, spends about eight seconds on each, and keeps three. They are not reading for talent, they are scanning for reasons to stop reading. Long paragraphs, “I am writing to express my interest”, and a résumé attached with no message are all reasons to stop.',
      'Your job in those eight seconds is to prove you read the post and can do the specific thing it asks for. Everything else is decoration.',
    ],
  },
  {
    title: 'The four-line cover letter',
    minutes: 7,
    body: [
      'Line one: what you do and the one relevant thing you have done. Line two: the specific task in their post, repeated back with a detail only a careful reader would catch. Line three: proof — a link, a number, a short example. Line four: a plain sentence saying you are available and how to reach you.',
      'No greeting longer than “Hi [name]”. No paragraph about your passion. If you cannot fill line three with something real, that is the actual problem to fix, not the writing.',
    ],
  },
  {
    title: 'Proof when you have no clients yet',
    minutes: 7,
    body: [
      'Make the work instead of describing it. Audit a real company’s Google Business Profile and write up what you would change. Rebuild a bad landing page in Canva. Take a public brand’s last ten posts and write a better caption for each. Put it in one shared doc with your reasoning.',
      'Unpaid spec work for a stranger is fine when you choose it and it takes an hour. It stops being fine when a “client” asks for a five-hour test task. The difference is who set the scope.',
    ],
  },
  {
    title: 'Reading a job post for red flags',
    minutes: 6,
    body: [
      'Red flags that hold up: no salary range plus a demand for your “expected rate” first, unpaid trial periods longer than an hour, “must be available anytime”, a role that lists five jobs in one, contact moved instantly to a personal chat app, and anything asking you to pay for training or equipment.',
      'Green flags are boring: a number, named hours, a named person, and a described process. Boring is what you want.',
    ],
  },
  {
    title: 'Interview questions that always come up',
    minutes: 8,
    body: [
      'Prepare four answers and you have covered ninety percent of interviews: walk me through your day, tell me about a mistake you made, how do you handle a client who goes quiet, and what are you weakest at. For the mistake question, tell a real one with what you changed afterwards. Nobody believes the person who has never broken anything.',
      'Ask three questions back. What does the first month look like, how do you prefer to communicate, and who else works on this? Candidates who ask about the work instead of the perks read as employees rather than applicants.',
    ],
  },
  {
    title: 'Following up without sounding desperate',
    minutes: 5,
    body: [
      'One follow-up, five business days after applying, three sentences long, adding one new thing — a relevant piece of work, a thought about their post, an update on your availability. Then stop. A second and third chase does not convert; it just tells them how you will behave as a contractor.',
      'Track everything in one place so you are not chasing from memory. Applications you cannot remember sending are applications you will follow up twice or never.',
    ],
  },
];

const PRICING: Lesson[] = [
  {
    title: 'What the market actually pays',
    minutes: 6,
    body: [
      'Rates for Filipino VAs split roughly three ways: general admin at the bottom, a specialist skill in the middle, and anything that touches revenue or hiring at the top. The difference between the bands is not effort, it is how expensive your mistake would be for the client. Price the risk you absorb, not the hours you sit.',
      'Use the rate check tool on real listings rather than Facebook group folklore. Group averages skew low because the people getting paid well are not posting about it.',
    ],
  },
  {
    title: 'Saying your number out loud',
    minutes: 5,
    body: [
      'Give one number, not a range, then stop talking. Ranges get read as “the lower one”, and the pause after your number is not your problem to fill. If they say it is too high, ask what budget they had in mind before you move; half the time the gap is smaller than the discount you were about to offer.',
      'Practice it out loud once before the call. The sentence is short: “My rate is X per hour.” The awkwardness lives in the delivery, not the number.',
    ],
  },
  {
    title: 'Hourly, retainer, or per project',
    minutes: 7,
    body: [
      'Hourly protects you when the scope is unclear and punishes you as you get faster. A monthly retainer for a defined scope pays you for the outcome instead of the clock and is where most VAs should end up by year two. Per-project only works when you can predict the work within about twenty percent.',
      'Switch by proposing it, not by asking. “Here is what I handle each month, here is the flat number, here is what falls outside it.” Attach the last two months of your own logged hours so the number looks like arithmetic rather than a raise.',
    ],
  },
  {
    title: 'Raising your rate with an existing client',
    minutes: 7,
    body: [
      'Ask after a win, not at renewal. Give thirty to sixty days notice, name the new rate, and give one line of justification tied to what you now handle. Do not apologise, do not list personal expenses, and do not threaten to leave.',
      'Expect roughly this: some say yes immediately, some negotiate to the middle, and occasionally one leaves. That last outcome is information about how they valued the work. Plan for it by having your pipeline warm before you send the message, not after.',
    ],
  },
  {
    title: 'Scope creep and how it starts',
    minutes: 6,
    body: [
      'It never arrives as a big ask. It is one small favour outside the scope, then that favour becoming weekly, then a whole function nobody named. By the time it feels unfair you have already trained them.',
      'The fix is a sentence, not a confrontation: “Happy to take that on — it sits outside our current scope, so do you want me to swap it for X or add it at Y?” Choices are easy to answer. Complaints are not.',
    ],
  },
  {
    title: 'Getting paid on time, every time',
    minutes: 5,
    body: [
      'Invoice on the same date each cycle with net-7 terms, a due date in bold, and the payment link in the first line. Late payment is usually disorganisation rather than malice, so a short reminder the day after due date fixes most of it.',
      'If an invoice goes two weeks past due, pause new work and say so calmly in writing. Continuing to deliver while unpaid teaches the client that the due date is decorative, and it is much harder to reverse that later.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

const BASE_COURSES: Course[] = [
  {
    slug: 'complete-va-starter',
    tag: 'Foundations',
    title: 'The Complete VA Starter',
    author: 'Verse team',
    blurb: 'Everything from setting up your workspace to sending your first invoice.',
    tint: '#e6f4f1',
    fg: '#0a7d6f',
    status: 'open',
    lessons: STARTER,
  },
  {
    slug: 'applications-that-get-replies',
    tag: 'Writing',
    title: 'Applications That Get Replies',
    author: 'Verse team',
    blurb: 'The short human cover letter format, plus how to prove you can do the work.',
    tint: '#eef2ff',
    fg: '#4453b8',
    status: 'open',
    lessons: APPLICATIONS,
  },
  {
    slug: 'pricing-and-negotiation',
    tag: 'Money',
    title: 'Pricing & Negotiation',
    author: 'Verse team',
    blurb: 'Quote a number, hold it, and raise it later without losing the client.',
    tint: '#fdf0e8',
    fg: '#b5581f',
    status: 'open',
    lessons: PRICING,
  },

  /* --- niche tracks, one per cover-letter niche --- */
  {
    slug: 'general-va',
    niche: 'general',
    tag: 'General',
    title: 'The Reliable Generalist',
    author: 'Verse team',
    blurb: 'How to be the VA a small team cannot run a week without.',
    tint: '#f1efec',
    fg: '#4a4845',
    status: 'open',
    lessons: [
      {
        title: 'Inbox triage rules that survive 300 emails a day',
        minutes: 7,
        body: [
          "Start with four labels: action, waiting, reference, and archive. Do not create fifteen labels for one founder. In Gmail, make filters for receipts, newsletters, calendar notifications, and automated alerts, then leave the human email visible.",
          "For anything that needs a decision, write the decision in the subject or first line. A good triage note says what happened, what you recommend, and the deadline. It does not forward a twelve-message thread with 'thoughts?'",
          "Keep a waiting-for list in Notion, Asana, or a plain Sheet. Check it twice a day. The useful skill is noticing that a client promised a file on Tuesday and it is now Thursday, not moving email into colourful folders."
        ]
      },
      {
        title: 'Calendar defence and the meeting nobody needed',
        minutes: 6,
        body: [
          "Before booking anything, check the purpose, attendees, time zone, and whether a decision is actually needed. A calendar invite with no agenda is not a complete request. Google Calendar's working hours and appointment schedules handle the easy part; judgement handles the rest.",
          "Protect focus blocks like real appointments. Leave ten or fifteen minutes around calls when the principal has to switch contexts, and keep one buffer block each day for the meeting that will run over. Calendars are not Tetris boards.",
          "When you decline for someone else, give two alternatives and one sentence of context. 'She cannot make that slot, but Tuesday at 2pm or Wednesday at 10am works' is enough. You do not need to explain their entire life."
        ]
      },
      {
        title: 'Travel, expenses, and receipts without chasing',
        minutes: 7,
        body: [
          "Make one travel brief before you search: dates, acceptable airports, baggage, hotel ceiling, loyalty numbers, and what is non-negotiable. Put the final itinerary in a single Google Doc with local times and confirmation numbers. Screenshots scattered through Slack are not an itinerary.",
          "For expenses, agree on the fields first. Date, vendor, category, amount, currency, project, receipt link, and payment method covers most small businesses. A Google Form feeding a Sheet is often faster than forcing a tiny company into a finance app.",
          "Name receipts the same way every time, for example 2026-08-04_Hotel_ClientName_180USD.pdf. It sounds fussy until someone asks for one receipt six months later."
        ]
      },
      {
        title: 'Writing an update your client actually reads',
        minutes: 5,
        body: [
          "Send updates on a predictable day and keep the format boring. Done, in progress, blocked, and decisions needed is enough for most weekly work. Put links beside the item instead of making the client search through a project board.",
          "Numbers need a label and a comparison. '12 tickets closed' is a count. '12 tickets closed, down from 19 last week because the billing issue is fixed' gives the client something to use.",
          "If there is a problem, write it before the client finds it. State the impact, what you already tried, and the next choice. Do not hide a blocked task inside a cheerful paragraph."
        ]
      },
      {
        title: 'Building SOPs so you become hard to replace',
        minutes: 8,
        body: [
          "Write an SOP while doing the task, not after you have forgotten the annoying bits. Loom is useful for a screen recording, but pair it with a short written checklist because nobody wants to watch a nine-minute video to find one setting.",
          "Include the trigger, the exact steps, the expected result, and what to do when the result is wrong. Add the login location, not the password. Passwords belong in 1Password or the client's chosen vault.",
          "Review the document after someone else follows it. If they ask a question, that question is a missing line. Recent Philippine VA rate guides put general admin around $500 to $1,000 monthly depending on ownership, and process ownership is what moves you upward."
        ]
      }
    ],
  },
  {
    slug: 'executive-assistant',
    niche: 'ea',
    tag: 'Executive support',
    title: 'Executive Assistant Craft',
    author: 'Guest instructor',
    blurb: 'Working next to a founder: judgement calls, gatekeeping, and confidentiality.',
    tint: '#eef2ff',
    fg: '#4453b8',
    status: 'open',
    lessons: [
      {
        title: 'Learning a principal: preferences, patterns, and pet peeves', minutes: 7,
        body: [
          "The first week is mostly observation. Note how they name files, where they want messages, which meetings they attend reluctantly, and what they always ask before agreeing. Keep those notes private and useful, not weirdly personal.",
          "Build a one-page working preferences document with time zone, travel rules, communication channels, decision limits, and recurring commitments. Ask them to correct it. People change their minds, so add a last-reviewed date.",
          "A strong EA does not imitate the executive's personality. It learns the boundaries well enough to make routine decisions without creating new work."
        ]
      },
      {
        title: 'Saying no on someone’s behalf', minutes: 6,
        body: [
          "Gatekeeping is not deleting everything inconvenient. Sort requests into answer now, delegate, schedule, decline, and ask the principal. A request from a board member and a request for a podcast guest spot should not use the same rule.",
          "Use a short decline with no invented excuse. 'Thanks for thinking of us. Her calendar is full this quarter, so we will pass' is safer than a dramatic story that someone can disprove.",
          "For uncertain requests, send a two-line summary and your recommendation. Include the cost in time or money. Executives can decide quickly when the decision has already been framed."
        ]
      },
      {
        title: 'Running a weekly one-to-one that saves you both hours', minutes: 7,
        body: [
          "Keep a shared agenda in Notion, Google Docs, or Asana. Add items during the week, then group them into decisions, updates, and issues. Do not spend the whole call reading status notes aloud.",
          "A useful one-to-one ends with owners and dates. Write those down while you are on the call, then send the notes within fifteen minutes. If the same item appears for three weeks, it is not a reminder problem.",
          "Leave space for the principal to think. Silence is cheaper than a second meeting."
        ]
      },
      {
        title: 'Handling sensitive information and legal basics', minutes: 8,
        body: [
          "Treat payroll, customer exports, acquisition talks, health information, and passwords as restricted by default. Use the client's approved storage, turn on MFA, and never download a confidential file to a shared family computer.",
          "You are not the lawyer. Read the NDA, note what it covers, and ask before forwarding material outside the named group. Keep a simple access list so former contractors do not remain in Drive, Slack, or Notion months later.",
          "Do not paste private client data into a public AI tool. If the company has an approved workspace, use that and follow its retention rules. Recent PH guides place executive VA work roughly around $800 to $1,400 monthly for direct hires, with trust doing more for the rate than speed alone."
        ]
      },
      {
        title: 'Board packs, decks, and briefing notes', minutes: 8,
        body: [
          "Start with the decision the reader needs to make. A board pack is not a scrapbook of everything that happened. Put the summary first, then the numbers, then supporting detail with a clear owner for each section.",
          "For decks, use the existing template and check every chart against the source Sheet. Make a PDF before sending and inspect page breaks, tiny labels, and speaker notes. PowerPoint and Google Slides both make it easy to move one object by accident.",
          "Briefing notes should answer who, why now, what is known, what is unknown, and what to ask. Keep a version history."
        ]
      }
    ],
  },
  {
    slug: 'customer-support',
    niche: 'support',
    tag: 'Support',
    title: 'Customer Support That Keeps Accounts',
    author: 'Guest instructor',
    blurb: 'Tickets, tone, and the metrics support leads are judged on.',
    tint: '#e9f6ec',
    fg: '#2f7a45',
    status: 'open',
    lessons: [
      {
        title: 'Intercom, Zendesk, and Front without the panic', minutes: 7,
        body: [
          "Learn the ticket shape before the buttons. Every conversation needs a customer, issue, current status, owner, and next action. Intercom, Zendesk, and Front all show those pieces in different places.",
          "Make a small personal map of the workspace during training. Where do you see SLA timers, refunds, internal notes, order data, and collision warnings? Keep it beside you until your hands stop searching.",
          "Never put internal speculation in a public reply. Use a private note and tag the person who can answer it."
        ]
      },
      {
        title: 'Macros that do not read like macros', minutes: 6,
        body: [
          "A macro is a starting point, not a finished reply. Keep the sentence that changes per customer at the top, then explain the next step in plain language. Zendesk macros and Intercom saved replies should leave room for names, dates, and the actual product.",
          "Delete anything that sounds like a policy pasted from a wall. 'We understand your frustration' is not useful when the customer wants to know whether the replacement shipped.",
          "Review ten sent macros every Friday. If agents keep editing the same line, fix the source instead of teaching everyone a workaround."
        ]
      },
      {
        title: 'De-escalating an angry customer in three replies', minutes: 8,
        body: [
          "First reply: acknowledge the specific failure and say what you are checking. Do not promise a result you have not verified. Second reply: give the answer, options, and a time if something is still pending.",
          "If the customer insults you, do not answer the insult. Keep the boundary short and move back to the account. A refund, replacement, or escalation has to follow the actual policy, not the volume of the message.",
          "The third reply should close the loop or name the next owner. Customers can tolerate waiting better than being passed around without a sentence explaining why."
        ]
      },
      {
        title: 'First response time, CSAT, and what they hide', minutes: 7,
        body: [
          "First response time measures how quickly someone touches a ticket. It does not tell you whether the answer helped. Track resolution time, reopen rate, backlog age, escalation rate, and contact reason beside it.",
          "CSAT is useful but noisy. A customer may rate the delivery problem, not your writing. Read the comments and group them by issue before changing a script.",
          "For a small team, a weekly Sheet with ticket count, median first response, old tickets, and top three reasons is enough. Recent PH rate guides put customer support VAs around $550 to $1,200 monthly, with technical support and escalation ownership at the higher end."
        ]
      },
      {
        title: 'Turning repeat tickets into a help centre', minutes: 8,
        body: [
          "Export the last month of tickets and group them by the question the customer was trying to answer. Write the article from the customer's starting point, not from the internal team structure.",
          "Use screenshots only where they still match the product. Add the date reviewed and the owner. A help article with a wrong button is worse than no article because it makes the customer doubt themselves.",
          "Link the article in the macro, then check deflection and negative feedback. Keep the ticket open when the answer needs a human."
        ]
      }
    ],
  },
  {
    slug: 'data-and-research',
    niche: 'data',
    tag: 'Data',
    title: 'Data Entry & Research, Done Fast',
    author: 'Verse team',
    blurb: 'The speed and accuracy tricks that let you charge per project.',
    tint: '#eef4f8',
    fg: '#2b6a8f',
    status: 'open',
    lessons: [
      {
        title: 'Sheets formulas worth memorising', minutes: 7,
        body: [
          "Start with XLOOKUP, FILTER, IFERROR, COUNTIF, SUMIFS, and TEXTSPLIT. You do not need to memorise every Sheets function. You need to retrieve a value without overwriting the source data.",
          "Keep raw exports on one tab and working columns on another. Add a date and source column before you clean anything. That gives you a way back when the client asks why row 417 changed.",
          "Use data validation for status fields and freeze the header row. Small controls prevent a lot of silent damage."
        ]
      },
      {
        title: 'Cleaning a messy export in ten minutes', minutes: 6,
        body: [
          "Make a copy first. Remove blank rows, trim whitespace, standardise phone and date formats, and identify duplicate keys. Google Sheets can do most of this with TRIM, CLEAN, SPLIT, and conditional formatting.",
          "Do not merge records just because two names look alike. Match on email, order number, or another stable identifier, then keep an exceptions tab for uncertain rows.",
          "Write down the transformations in a note. A clean sheet without a method is hard to trust next month."
        ]
      },
      {
        title: 'Scraping responsibly and when not to', minutes: 8,
        body: [
          "Research is not permission to copy everything visible on a site. Check the site's terms, robots guidance, rate limits, and whether the data contains personal information. Prefer an official export or API when one exists.",
          "For a small public list, manual research with source URLs may be faster and safer than building a scraper. For repeated work, tools such as Apify, Browse AI, or an approved script still need throttling and a failure log.",
          "Store the URL, access date, and fields collected. If the client cannot explain why a field is needed, leave it out."
        ]
      },
      {
        title: 'Verifying a lead list so it does not bounce', minutes: 7,
        body: [
          "A lead record is not verified because a name and website exist. Check the company, role, domain, location, and whether the person still works there. Apollo, Hunter, NeverBounce, and ZeroBounce can assist, but no tool is perfect.",
          "Mark uncertain emails instead of forcing a yes or no. Separate generic addresses such as info@ from named contacts, and never add a personal address to outreach without a lawful and relevant reason.",
          "Send the client a count of valid, risky, and rejected records. Quality is easier to discuss when it is visible."
        ]
      },
      {
        title: 'Building a dashboard your client will open', minutes: 8,
        body: [
          "Pick one decision the dashboard supports. In Looker Studio, Airtable, or a Sheet, show the current number, the comparison period, and the owner of the next action. Twenty charts is not a dashboard.",
          "Use consistent filters and name every date range. If a metric is delayed, say so beside it. Clients lose trust quickly when today's number changes tomorrow without explanation.",
          "Send a short note with the dashboard link during the first few weeks. After that, it should answer a question without you presenting it. Data and research VAs often start near general admin rates, then charge more when they own QA, reporting, or a repeatable research system."
        ]
      }
    ],
  },
  {
    slug: 'real-estate-va',
    niche: 'realestate',
    tag: 'Real estate',
    title: 'Real Estate VA (US Market)',
    author: 'Guest instructor',
    blurb: 'MLS, CRM hygiene, and transaction coordination for US agents.',
    tint: '#fdf0e8',
    fg: '#b5581f',
    status: 'open',
    lessons: [
      {
        title: 'How a US transaction actually flows, contract to close', minutes: 8,
        body: [
          "Learn the broad sequence first: lead, consultation, offer, accepted contract, inspections, financing, appraisal, title work, final walkthrough, and closing. The exact forms and deadlines depend on the state and brokerage.",
          "Build a transaction checklist with a due date, responsible person, evidence of completion, and escalation rule. Put the contract date at the top because every later date depends on it.",
          "You coordinate. You do not give legal advice, interpret a contract, or promise that a lender or title company will close."
        ]
      },
      {
        title: 'MLS listings and comparative market analyses', minutes: 7,
        body: [
          "MLS data is local and access is controlled by the brokerage or association. Follow the agent's permission rules, do not repost private remarks, and check status, price, photos, room counts, and open-house times before publishing anywhere else.",
          "A basic CMA compares similar properties by location, size, age, condition, and recent sale date. Put the selection criteria in the file so the agent can explain why a property made the set.",
          "Your job is accurate preparation. The licensed agent makes the pricing recommendation."
        ]
      },
      {
        title: 'Follow Up Boss and KVCore day to day', minutes: 7,
        body: [
          "Every lead needs a source, stage, next action, and next-action date. Follow Up Boss, kvCORE, BoomTown, Salesforce, and HubSpot use different labels, but the hygiene problem is the same: a lead without a next action disappears.",
          "Use tags sparingly. Put facts in fields and context in notes, with the date and your initials. Do not write a novel in the contact record.",
          "A daily queue should show new leads, overdue tasks, unanswered inquiries, and appointments. Run that queue before you open old email."
        ]
      },
      {
        title: 'Cold calling and ISA scripts that are not robotic', minutes: 6,
        body: [
          "A script is a guardrail, not a paragraph to recite. Confirm who you are speaking with, ask one relevant question, and listen for timing, motivation, and permission to follow up.",
          "Log the result immediately: answered, wrong number, not interested, nurture, appointment, or callback with a date. A call that is not logged becomes a repeated interruption for the next person.",
          "Check the brokerage's calling, recording, do-not-call, and texting rules before you start. State and federal requirements can differ."
        ]
      },
      {
        title: 'Compliance paperwork and deadlines you cannot miss', minutes: 8,
        body: [
          "Use a deadline tracker with reminders at contract, seven days before, two days before, and due date. Add a second person for high-risk items such as earnest money, inspection response, financing, and closing documents.",
          "Keep files in the approved transaction platform, not in personal Drive folders. Dotloop, SkySlope, and transaction management systems usually keep a useful audit trail when people actually use them.",
          "Recent real-estate VA listings commonly ask for MLS research, CRM work, strong English, and US time-zone coverage. A 2026 PH rate guide puts specialist VA work broadly around $800 to $1,500 monthly, but licensed tasks stay with the agent."
        ]
      }
    ],
  },
  {
    slug: 'seo-for-vas',
    niche: 'seo',
    tag: 'Career skill',
    title: 'SEO for Virtual Assistants',
    author: 'Guest instructor',
    blurb: 'The highest-paying skill on the board right now, taught from scratch.',
    tint: '#f2effa',
    fg: '#5b46a8',
    status: 'open',
    lessons: [
      {
        title: 'How search works in an AI-answer world', minutes: 7,
        body: [
          "SEO work still starts with a person looking for an answer, product, service, or place. Search results now include AI summaries, forums, video, maps, and shopping surfaces, so a blue-link ranking is not the whole report.",
          "Your execution lane is usually technical cleanup, content updates, internal links, citations, and measurement. A strategist decides the market and priorities. Do not promise that an AI answer will cite a page because you added a keyword.",
          "Use Google Search Console, GA4, and the site's own conversion data together. Traffic without useful actions is a weak win."
        ]
      },
      {
        title: 'Keyword research without an expensive tool', minutes: 7,
        body: [
          "Begin with the client's customers and sales calls. Search Google, inspect autocomplete, People Also Ask, related searches, competitor headings, and Search Console queries. Those sources are enough to make a first content map.",
          "Group phrases by intent rather than stuffing every variation into one page. A person comparing options, looking for a local provider, and trying to log in needs different pages.",
          "Ahrefs, Semrush, Keywords Everywhere, and Google Keyword Planner add volume and difficulty estimates. Treat the numbers as directional. Record the date and country because the same query behaves differently in Manila and Chicago."
        ]
      },
      {
        title: 'On-page fixes that move rankings in weeks', minutes: 8,
        body: [
          "Check title, H1, intent match, useful headings, image alt text, internal links, canonical, indexability, and page speed. Fix the page that already has impressions before writing ten new ones.",
          "Use Screaming Frog or Sitebulb for a crawl, then verify important findings in Search Console. A spreadsheet of URLs, issue, recommendation, owner, and status makes an audit executable.",
          "Do not change a title every three days and call it testing. Give the page enough time and note what else changed."
        ]
      },
      {
        title: 'Google Business Profile and local packs', minutes: 7,
        body: [
          "Keep the business name, address, phone, hours, categories, services, photos, and appointment link accurate. Do not create extra profiles for every keyword or use a virtual office when the business is not eligible.",
          "Build a review request process that asks real customers after a completed job. Never write reviews for the client or offer a reward for a positive review. Reply to negative feedback with facts and a private route to resolve it.",
          "Local SEO VAs often work in BrightLocal, GBP, Looker Studio, and citation platforms. Log changes because profile edits can be rejected or overwritten."
        ]
      },
      {
        title: 'Reporting that survives a sceptical client', minutes: 8,
        body: [
          "A monthly report should show work completed, rankings or visibility, organic clicks, leads or sales, important pages, and next actions. Keep brand and non-brand queries separate when you can.",
          "Explain drops without pretending to know the cause. Check seasonality, tracking, indexing, competitors, site changes, and algorithm announcements before blaming one thing.",
          "Recent SEO VA guides and job listings commonly mention GSC, GA4, Ahrefs or Semrush, Screaming Frog, WordPress, and local SEO. PH compensation guides place SEO specialists above general admin, often around PHP 50,000 to PHP 120,000 monthly, but proof of results still matters more than tool names."
        ]
      }
    ],
  },
  {
    slug: 'writing-for-clients',
    niche: 'writer',
    tag: 'Writing',
    title: 'Writing for Clients Who Pay',
    author: 'Guest instructor',
    blurb: 'Briefs, drafts, and edits at a pace that still pays by the word.',
    tint: '#fbf3e6',
    fg: '#9a6b1c',
    status: 'open',
    lessons: [
      {
        title: 'Reading a brief for what the client actually wants', minutes: 7,
        body: [
          "Mark the deliverable, reader, channel, length, deadline, source material, examples, and approval process. 'Write a blog post' is not a brief until those pieces exist.",
          "Ask one useful question when a missing detail changes the work. Do not send a questionnaire with twenty questions when the client has not even chosen the topic.",
          "Save the brief beside the draft. Clients remember what they wanted, not what they typed in a Slack message three weeks earlier."
        ]
      },
      {
        title: 'Research that stops you sounding generic', minutes: 8,
        body: [
          "Use primary sources first: the client's interviews, product docs, support tickets, customer reviews, and sales calls. Then use reputable studies, government sites, and specialist publications for claims.",
          "Keep a source log with the URL, date, useful quote, and what it supports. If a statistic has no original source, do not build the whole paragraph around it.",
          "Read three competing pages, but do not copy their headings and call it a strategy. Look for questions they leave unanswered."
        ]
      },
      {
        title: 'Editing your own draft down by a third', minutes: 7,
        body: [
          "Edit in passes. First check the argument, then remove repeated ideas, then shorten sentences, then check names, numbers, and links. Trying to improve every line at once makes you keep weak material because it took time.",
          "Read the draft aloud or use text-to-speech. You will hear the sentence that has three openings and no verb. Hemingway can flag dense sentences, but it cannot decide what the reader needs.",
          "Leave a little plain language in the piece. Every sentence does not need a clever verb."
        ]
      },
      {
        title: 'Writing with AI without producing sludge', minutes: 8,
        body: [
          "Use AI for a rough outline, alternative headlines, transcription cleanup, or a list of questions. Give it source material you are allowed to use, and keep the client's confidential information out of an unapproved account.",
          "Do not ask for a complete article and paste the result. The draft will flatten the voice, invent transitions, and repeat the same point in slightly different clothes. You still own the facts and the final wording.",
          "Keep a simple note of where AI was used when the client requires disclosure. Google Docs version history is useful when someone asks how a claim got into the final copy."
        ]
      },
      {
        title: 'Building a portfolio from unpublished work', minutes: 6,
        body: [
          "Make three samples for the kind of client you want: one service page, one useful article, and one email or case study. Use a fictional business or ask permission to anonymise real work.",
          "Show the brief, your process, and the finished piece. A hiring manager wants to know whether you can follow constraints, not only whether you can produce a pretty paragraph.",
          "Writing rates vary wildly by market and by whether strategy, SEO, or editing is included. Price by deliverable only after you know how many hours research, drafting, feedback, and admin actually take."
        ]
      }
    ],
  },
  {
    slug: 'social-media-management',
    niche: 'social',
    tag: 'Social',
    title: 'Social Media Management',
    author: 'Guest instructor',
    blurb: 'Calendars, community, and the numbers that justify your retainer.',
    tint: '#fbecef',
    fg: '#a83d55',
    status: 'open',
    lessons: [
      {
        title: 'A month of content in one working day', minutes: 8,
        body: [
          "Start with the business goal and the audience's repeated questions. A calendar can have education, proof, offer, behind-the-scenes, and community posts, but those categories need a reason to exist.",
          "Batch the work by stage: ideas, briefs, copy, design, review, scheduling. Meta Business Suite, Buffer, Later, and Metricool can schedule, but none of them will rescue a calendar that has no approval owner.",
          "Keep a reserve of low-effort posts for a missed shoot or a late product launch. Do not fill the whole month with content that depends on one person sending a file."
        ]
      },
      {
        title: 'Hooks, captions, and formats per platform', minutes: 7,
        body: [
          "The same idea can become a Reel, carousel, LinkedIn post, Story, or short email. Change the opening and the job of the format. Do not paste a LinkedIn paragraph into an Instagram caption and call it repurposing.",
          "Write the first line before the rest. It can name a problem, show a result, ask a specific question, or start in the middle of a story. Avoid claims the client cannot prove.",
          "Use Canva templates as a starting point, then check safe areas, text size, contrast, and how the post looks on a phone."
        ]
      },
      {
        title: 'Community management and comment triage', minutes: 7,
        body: [
          "Set response windows and an escalation map. Questions about price, shipping, availability, complaints, threats, and legal or health claims should not all receive the same reply.",
          "Keep a response bank with approved facts, but make the first sentence specific to the person. Delete spam and hide harassment according to the platform and brand rules. Do not argue in public because you are tired.",
          "Tag recurring questions in a Sheet or help desk. Those comments are free research for the next calendar."
        ]
      },
      {
        title: 'Working with creators and UGC', minutes: 8,
        body: [
          "A creator brief needs the product, audience, key claim, required shots, prohibited claims, deadline, usage rights, file format, and payment terms. 'Make it authentic' is not enough direction.",
          "Track content received, revision status, whitelisting or ad permissions, and expiration dates. Keep raw files separate from approved exports. Rights often cover the post but not paid usage.",
          "Ask for clean footage when possible, without music burned in. It gives the editor more options and avoids licensing trouble."
        ]
      },
      {
        title: 'Reporting reach honestly when it dips', minutes: 7,
        body: [
          "Report reach, watch time or saves where relevant, profile actions, link clicks, and conversions. Follower count is context, not a business result by itself.",
          "Compare like with like. A launch week, a quiet week, and a viral outlier should not sit in one average. Note posting volume, format mix, paid support, and major changes.",
          "Recent PH salary guides put social media VA work around PHP 40,000 to PHP 80,000 monthly, with strategy, paid media, and community ownership pushing higher. A report that says what to do next is part of that value."
        ]
      }
    ],
  },
  {
    slug: 'email-marketing',
    niche: 'email',
    tag: 'Lifecycle',
    title: 'Email Marketing & Lifecycle',
    author: 'Guest instructor',
    blurb: 'Klaviyo and Mailchimp flows that make a store measurably more money.',
    tint: '#e9f6ec',
    fg: '#2f7a45',
    status: 'open',
    lessons: [
      {
        title: 'List health, deliverability, and the spam folder', minutes: 8,
        body: [
          "Deliverability starts before the campaign. Check consent, bounce rate, complaint rate, unsubscribes, domain authentication, and sending volume. Gmail and Yahoo requirements make SPF, DKIM, DMARC, and easy unsubscribe practical concerns, not technical decoration.",
          "Never buy a list and never keep sending to people who do not engage just to make the database look large. Suppress hard bounces, complaints, and unsubscribes in the ESP.",
          "Klaviyo and Mailchimp show useful warning signs, but open rates are noisy. Clicks, replies, purchases, and complaints are better decisions for most campaigns."
        ]
      },
      {
        title: 'Welcome, abandoned cart, and win-back flows', minutes: 8,
        body: [
          "Map the trigger, audience, delay, message, condition, and exit rule before building. A welcome flow should not continue selling a product someone already bought.",
          "For abandoned cart, check the event data and product links with a test profile. For win-back, suppress recent purchasers and set a reasonable time window. The exact delay depends on how often people buy.",
          "Use a naming convention for flows and messages, then keep a test log. A flow that quietly stops after a store theme change is an expensive little bug."
        ]
      },
      {
        title: 'Segmentation without over-engineering it', minutes: 7,
        body: [
          "Start with useful differences: bought or not, product category, location, engagement, customer value, or stated preference. If a segment does not change the message, it does not need to exist.",
          "Document the source of each property and how it updates. Klaviyo profiles can carry events, custom properties, and predictive fields, but a segment built on a broken property is only a polished guess.",
          "Test the audience count before sending. A typo in a date filter can turn a 4,000-person campaign into a 40-person campaign."
        ]
      },
      {
        title: 'Writing a campaign that is not a sale banner', minutes: 7,
        body: [
          "Write one clear job for the email. A launch email can explain the new product, show it in use, answer one objection, and give the next step. It does not need six competing buttons.",
          "Build the email in the client's template, then check mobile width, alt text, plain-text fallback, links, discount codes, and the preview line. Send a test to more than one inbox.",
          "AI can generate subject-line options, but you still need to check the promise against the landing page and the brand's actual offer."
        ]
      },
      {
        title: 'Attribution and what to claim credit for', minutes: 8,
        body: [
          "Klaviyo and Shopify can report revenue attributed to email, but attribution windows and tracking settings affect the number. Call it attributed revenue, not revenue caused by email.",
          "Compare campaigns against similar sends and note discounts, seasonality, traffic, and deliverability. A campaign can have high revenue because the offer was strong, even if the copy was average.",
          "Current job listings often ask for Klaviyo, Mailchimp, Shopify, campaign QA, flows, and reporting. PH specialist guides place email and marketing VA work above basic admin, but a small portfolio with clean tests is more useful than a certificate list."
        ]
      }
    ],
  },
  {
    slug: 'sales-development',
    niche: 'sales',
    tag: 'Sales',
    title: 'Sales Development & Lead Gen',
    author: 'Guest instructor',
    blurb: 'Building a list, writing outbound, and booking the call.',
    tint: '#eef2ff',
    fg: '#4453b8',
    status: 'open',
    lessons: [
      {
        title: 'Defining an ideal customer profile that narrows the list', minutes: 7,
        body: [
          "An ICP is not 'companies that need marketing.' Name the industry, size, geography, business model, trigger, buyer role, and problem you can actually help with.",
          "Ask the client for five good customers and five bad-fit customers. Look for a pattern in the real accounts before opening Apollo. A narrow list is easier to research and less annoying to receive.",
          "Keep disqualifiers visible. No budget, wrong geography, no relevant use case, or no permission to contact can save more time than another filter."
        ]
      },
      {
        title: 'Apollo, Clay, and LinkedIn Sales Navigator', minutes: 8,
        body: [
          "Use Apollo for prospect and contact data, Sales Navigator for role and account research, and Clay when the workflow genuinely needs enrichment or scoring across sources. Do not buy every tool before the list and message are working.",
          "Verify the company and role before exporting. Add source, date checked, and confidence to the record. Job changes and stale domains are normal, so a list needs a refresh rule.",
          "Respect platform terms and privacy requirements. Keep only the data the outreach needs."
        ]
      },
      {
        title: 'Cold email that gets a reply instead of a report', minutes: 7,
        body: [
          "Write to one person about one likely problem. A short email with a specific observation and an easy question is enough for the first touch. Do not attach a brochure or explain the entire company.",
          "Set up domain authentication, suppression, bounce monitoring, and sensible sending limits before a sequence. Deliverability is part of lead generation now. Apollo or an outbound platform cannot fix a damaged domain by itself.",
          "Track positive replies, negative replies, bounces, unsubscribes, and meetings. Opens are unreliable and should not be your headline metric."
        ]
      },
      {
        title: 'Handling objections in the first two lines', minutes: 6,
        body: [
          "An objection is often missing context. If they say 'not a priority,' ask whether the problem is timing, budget, or fit, but do not force a call after a clear no.",
          "Use a short reply that confirms what you heard and gives one relevant next step. Do not answer a price objection with a list of every feature.",
          "Record objection patterns in the CRM. After twenty replies, the same questions should change the message or the qualification process."
        ]
      },
      {
        title: 'CRM hygiene and pipeline reporting', minutes: 8,
        body: [
          "Every opportunity needs a stage, amount or range, close date, owner, next action, and reason for loss when it leaves the pipeline. HubSpot, Salesforce, and Pipedrive are only as useful as the fields people maintain.",
          "Run a duplicate check and stale-deal report each week. A pipeline full of untouched opportunities makes the forecast look better while making the next call harder.",
          "Modern SDR roles combine email, phone, social, research, and clean handoff notes. Current 2026 guidance also stresses authentication, list hygiene, and pipeline quality, not just activity volume."
        ]
      }
    ],
  },
  {
    slug: 'graphic-design',
    niche: 'design',
    tag: 'Design',
    title: 'Graphic Design for Small Brands',
    author: 'Guest instructor',
    blurb: 'Canva and Figma work that looks bought, not improvised.',
    tint: '#f2effa',
    fg: '#5b46a8',
    status: 'open',
    lessons: [
      {
        title: 'Type, spacing, and the three rules that fix most layouts', minutes: 7,
        body: [
          "Fix hierarchy before decoration. Pick a type scale, align elements to a simple grid, and leave enough space around the important thing. Most small-brand graphics are not missing effects.",
          "Use two typefaces at most unless the brand already has a system. Check contrast and body text size on a phone, not only on a large monitor.",
          "Make three versions of the same post with different spacing. Put them side by side. You will notice alignment problems faster than when you keep editing one canvas."
        ]
      },
      {
        title: 'Building and holding a brand kit', minutes: 6,
        body: [
          "Collect the logo files, colours, typefaces, image treatment, icon style, and examples that the client actually approved. Canva Brand Kits and Figma libraries help only when the source files are clean.",
          "Name colours by use, such as background, text, accent, and warning, not only by hex code. Keep a black logo and a light logo available. Someone will need them at 11pm.",
          "Do not invent a new shade because the existing one feels boring. Ask whether the system needs a change, then update the kit once."
        ]
      },
      {
        title: 'Ad creative variations at speed', minutes: 8,
        body: [
          "Change one variable at a time: hook, image, offer, format, or call to action. If you change everything, the results will not tell you what worked.",
          "Design for the placement. Check 1:1, 4:5, 9:16, and the text-safe area when the ad needs them. Export with a clear filename that includes campaign, angle, size, and version.",
          "Keep a source file and a flattened export. Do not make the client rebuild an editable design from a PNG."
        ]
      },
      {
        title: 'Figma basics for handing files to a developer', minutes: 7,
        body: [
          "Use frames, auto layout, components, and sensible layer names. A developer needs to know what repeats and what changes across desktop and mobile.",
          "Put copy in text layers, keep images replaceable, and include the font or a permitted alternative. Inspect the prototype at the actual breakpoint instead of trusting one wide artboard.",
          "Add a short handoff note with dimensions, colours, states, and open questions. Figma comments are not a substitute for a decision."
        ]
      },
      {
        title: 'Taking feedback without redesigning everything', minutes: 7,
        body: [
          "Ask what problem the feedback is trying to solve. 'Make it pop' could mean low contrast, weak hierarchy, a bad image, or simply that the approver is nervous.",
          "Group comments, resolve contradictions, and send one revised version with the changes called out. Keep the previous version until approval is written.",
          "Current design VA listings commonly mention Canva, Figma, Photoshop, email graphics, and ecommerce product images. The rate rises when you can work from a brief and manage revisions without making every request a fresh project."
        ]
      }
    ],
  },
  {
    slug: 'video-editing',
    niche: 'video',
    tag: 'Video',
    title: 'Video Editing for Short Form',
    author: 'Guest instructor',
    blurb: 'CapCut and Premiere workflows for reels, shorts, and TikTok.',
    tint: '#fbecef',
    fg: '#a83d55',
    status: 'open',
    lessons: [
      {
        title: 'Cutting for retention in the first two seconds', minutes: 7,
        body: [
          "Watch the raw footage once without editing. Mark the strongest opening, the clear explanation, the proof, and the ending. A short video can start with a result, a question, or the line that would normally appear halfway through.",
          "Remove throat-clearing, repeated points, long pauses, and clips that need too much context. Keep the speaker human; cutting every breath makes people sound strange.",
          "Export a rough cut before adding effects. Pacing problems are easier to see when the screen is plain."
        ]
      },
      {
        title: 'Captions, sound design, and pacing', minutes: 8,
        body: [
          "Captions need to be readable on a phone, timed to speech, and checked for names and numbers. CapCut, Premiere Pro, Descript, and other tools can transcribe, but auto captions are a draft.",
          "Lower music under speech and use sound effects only when they help the cut. Loud clicks on every word become tiring. Check the mix through laptop speakers and headphones.",
          "Keep text inside the platform-safe area. TikTok and Reels cover part of the frame with interface elements."
        ]
      },
      {
        title: 'Batch editing a week of clips', minutes: 7,
        body: [
          "Create one project template with the brand font, caption style, intro or outro, audio levels, and export preset. Then duplicate it instead of rebuilding the same sequence five times.",
          "Use a folder structure for raw, selects, project files, review exports, and approved files. Proxy large footage when the computer struggles. Do not edit from a random Downloads folder.",
          "Track clip title, platform, status, feedback, and delivery link in a simple board. Fast turnaround depends on finding the right version."
        ]
      },
      {
        title: 'Repurposing one long video into ten', minutes: 8,
        body: [
          "Find complete ideas, not just sentences that sound dramatic alone. Add enough setup for a viewer who never saw the podcast or webinar.",
          "Make variations with different hooks and endings, but do not promise ten good clips if the source only contains four. Mark quotes and statistics so the client can approve them.",
          "A transcript in Descript makes searching easier, then Premiere, CapCut, or DaVinci Resolve can handle the final cut. Keep the original timecode in your notes."
        ]
      },
      {
        title: 'File delivery, versions, and revision limits', minutes: 7,
        body: [
          "Agree on aspect ratio, resolution, frame rate, naming, captions, thumbnails, and where final files live. A 1080 by 1920 vertical export is common for Reels, TikTok, and Shorts, but confirm the brief.",
          "Use Frame.io or a shared folder for review and label exports v1, v2, and approved. Do not overwrite the file the client commented on.",
          "Current short-form listings commonly ask for CapCut or Premiere, captions, sound design, fast 24 to 48 hour delivery, and comfort with multiple revisions. Rates on recent listings range from roughly $10 to $20 per hour for remote entry roles, with portfolios and ad performance moving higher."
        ]
      }
    ],
  },
  {
    slug: 'operations-lead',
    niche: 'ops',
    tag: 'Ops',
    title: 'Becoming an Operations Lead',
    author: 'Guest instructor',
    blurb: 'How VAs move from task-taker to the person who runs the system.',
    tint: '#e6f4f1',
    fg: '#0a7d6f',
    status: 'open',
    lessons: [
      {
        title: 'Mapping a process before you try to fix it', minutes: 8,
        body: [
          "Watch the work from request to finished result. Write the trigger, people, tools, handoffs, decisions, wait time, and failure points. Do not design a perfect process from an old SOP that nobody follows.",
          "Talk to the person doing the task and the person receiving it. They usually describe two different processes. Put both on the map before deciding which one is wrong.",
          "Start with one measurable problem, such as late approvals or duplicate entry. A map is useful when it leads to a change someone can test."
        ]
      },
      {
        title: 'Automations that do not break silently', minutes: 8,
        body: [
          "Zapier, Make, Airtable automations, and native rules are good at repeatable handoffs. Give every automation an owner, a name, a test record, an error destination, and a review date.",
          "Test missing fields, duplicate events, changed names, and an API timeout. A happy-path test proves very little. Log what happens when the output is wrong.",
          "Keep a manual fallback for payroll, customer refunds, access changes, and other work where a silent failure is expensive."
        ]
      },
      {
        title: 'Hiring, onboarding, and managing other VAs', minutes: 8,
        body: [
          "Write the outcome and working hours before the job description. A list of thirty tasks attracts someone who can say yes to thirty tasks, not necessarily someone who can own the result.",
          "Use a paid, bounded test based on real work. Give the same instructions to each candidate and score accuracy, communication, judgement, and time used.",
          "Onboarding needs access, context, examples, a first-week checklist, and a person to ask. Do not drop a new VA into a folder called 'everything.'"
        ]
      },
      {
        title: 'Dashboards and the weekly operating rhythm', minutes: 7,
        body: [
          "Choose a few numbers that show flow, quality, capacity, and risk. An operations dashboard might use open work, overdue work, turnaround time, error count, and cash or revenue linked to the process.",
          "Use a weekly meeting for decisions and blockers, not reading every task. ClickUp, Asana, Airtable, Notion, and Slack can hold the work, but one place needs to be the source of truth.",
          "Publish the same update every week until people stop asking where it is."
        ]
      },
      {
        title: 'Making the case for your own promotion', minutes: 7,
        body: [
          "Keep a before-and-after record. Hours saved, errors reduced, faster handoff, fewer escalations, more capacity, and clearer ownership are better evidence than 'I helped with operations.'",
          "Show the system, not only the effort. Bring the process map, dashboard, SOP, and a proposal for the next responsibility with its expected result.",
          "Operations VA guides commonly place experienced ops work around $900 to $1,500 monthly in the Philippines, with team leadership and automation pushing beyond that. Ask for a title and scope that match the work, not only a nicer compliment."
        ]
      }
    ],
  },
  {
    slug: 'project-management',
    niche: 'pm',
    tag: 'Delivery',
    title: 'Project Management for Agencies',
    author: 'Guest instructor',
    blurb: 'Asana, ClickUp, and Notion in a real client delivery pipeline.',
    tint: '#eef4f8',
    fg: '#2b6a8f',
    status: 'open',
    lessons: [
      {
        title: 'Scoping work so the deadline is survivable', minutes: 8,
        body: [
          "Turn the request into deliverables, acceptance criteria, dependencies, review rounds, and a deadline with a time zone. If a client says 'make the site better,' the first task is discovery, not a date pulled from the air.",
          "Ask who supplies copy, assets, access, decisions, and final approval. Put those dependencies in the plan with dates. A project can be late because a logo arrived late, but the project manager should make that visible early.",
          "Estimate the work in small pieces and add room for review. Agencies lose time in the gaps between tasks, not only inside them."
        ]
      },
      {
        title: 'Running standups and status without meeting bloat', minutes: 6,
        body: [
          "A standup needs three things: what moved, what is blocked, and what needs a decision. Async updates in Asana, ClickUp, Linear, or Slack can replace a meeting when the team is distributed and the work is documented.",
          "Keep a weekly client status to scope, completed work, next work, risks, and decisions. Do not paste every internal comment into it.",
          "Cancel a meeting when there is no decision, no handoff, and no new information. People notice when a PM protects their time."
        ]
      },
      {
        title: 'Chasing people politely and relentlessly', minutes: 7,
        body: [
          "Ask for one thing, name the deadline, and say what it blocks. 'Can you approve the homepage copy by Wednesday 3pm Pacific? It blocks design on Thursday' is easier to answer than 'following up.'",
          "Use reminders that change channel only when the work is actually urgent. A daily ping makes the task invisible. Keep the request in the project record so nobody has to reconstruct it from chat.",
          "When someone misses a date, update the plan and tell the affected owner. Do not quietly move the deadline and hope the client never looks."
        ]
      },
      {
        title: 'Risk logs, blockers, and the escalation email', minutes: 8,
        body: [
          "A risk is possible, a blocker is active, and an issue has already caused damage. Track probability, impact, owner, trigger, mitigation, and next review date. The labels matter less than the next action.",
          "Escalate with facts: what changed, what it affects, the options, and your recommendation. Give the recipient a decision to make, not a dramatic account of how the week went.",
          "Keep one risk log per project. Duplicated lists in Notion, ClickUp, and email will disagree eventually."
        ]
      },
      {
        title: 'Post-mortems that change the next project', minutes: 7,
        body: [
          "Run the review after delivery while the details are still available. Ask what was expected, what happened, where time went, and which decision would have helped earlier.",
          "Separate a process problem from a person's mistake. Fix the brief, checklist, estimate, or approval path before blaming the person who met a bad system.",
          "Choose one or two changes with an owner and due date. Current agency PM listings commonly ask for Asana, ClickUp, Notion, client communication, risk tracking, and deadline ownership. The useful portfolio proof is a before-and-after delivery system."
        ]
      }
    ],
  },
  {
    slug: 'bookkeeping-basics',
    niche: 'bookkeeping',
    tag: 'Finance',
    title: 'Bookkeeping Basics (Xero & QBO)',
    author: 'Guest instructor',
    blurb: 'Enough to take on AR/AP work for a small US or AU business.',
    tint: '#e9f6ec',
    fg: '#2f7a45',
    status: 'open',
    lessons: [
      {
        title: 'Debits, credits, and the five account types', minutes: 8,
        body: [
          "You do not need to become an accountant to keep a ledger clean, but you need to know what a transaction is doing. Assets, liabilities, equity, income, and expenses are the five basic account types.",
          "Learn the chart of accounts before posting anything. The same payment can be an expense, an owner draw, a loan payment, or a transfer depending on what actually happened.",
          "Do not guess from the bank description. Ask for the invoice or receipt when the transaction affects the books."
        ]
      },
      {
        title: 'Bank reconciliation without guessing', minutes: 8,
        body: [
          "Reconcile a defined period by matching the bank feed to the ledger, then investigate unmatched items. QuickBooks Online and Xero make matching faster, but the suggested match still needs a human check.",
          "Look for duplicates, transfers entered as income, missing fees, stale checks, and payments posted to the wrong account. Keep a reconciliation report and note the ending balance.",
          "Never plug the difference to miscellaneous income just to make the screen turn green."
        ]
      },
      {
        title: 'Accounts payable and receivable runs', minutes: 7,
        body: [
          "For bills, capture vendor, invoice number, date, due date, amount, tax, approval, and payment status. Dext and Hubdoc can collect receipts and bills, but the coding and approval still belong to an accountable person.",
          "For receivables, issue invoices on the agreed schedule, record payments, and send a short aging report. Separate a customer who has not been billed from one who has been billed and has not paid.",
          "Payment reminders should be factual. Include invoice number, due date, amount, and a link to pay."
        ]
      },
      {
        title: 'Month-end close checklist', minutes: 8,
        body: [
          "Close in the same order each month: reconcile accounts, collect missing documents, review uncategorised transactions, check accounts receivable and payable, post recurring entries, and review unusual changes.",
          "For ecommerce clients, confirm how Shopify, Stripe, PayPal, Amazon, or a connector such as A2X or Link My Books maps payouts and fees. A bank deposit is not always the day's sales.",
          "Keep a close checklist with owner, status, evidence, and reviewer. A month-end close is finished when someone can review it, not when the last task is clicked."
        ]
      },
      {
        title: 'Talking to an accountant in their language', minutes: 7,
        body: [
          "Bring a question with the account, period, amount, source document, and what you already checked. 'What do I do with this?' creates more work than a well-framed question.",
          "Know the difference between a report, a reconciliation, an adjusting entry, and a tax filing. Do not prepare or sign filings outside your training or the client's authorisation.",
          "Current PH guides commonly place bookkeeping VA work around $800 to $1,600 monthly depending on QBO or Xero skill, complexity, and review responsibility. Certification helps, but clean reconciliations and a careful audit trail are the proof."
        ]
      }
    ],
  },
  {
    slug: 'web-and-no-code',
    niche: 'web',
    tag: 'Build',
    title: 'Web Development & No-Code Builds',
    author: 'Guest instructor',
    blurb: 'Webflow, WordPress, and enough code to fix things yourself.',
    tint: '#f1efec',
    fg: '#4a4845',
    status: 'open',
    lessons: [
      {
        title: 'Picking the right platform for the client, not for you', minutes: 7,
        body: [
          "Start with editing needs, content model, integrations, budget, accessibility, and who will maintain the site. Webflow, WordPress, Framer, Wix, Shopify, and a simple Carrd page solve different jobs.",
          "Ask whether the client needs a CMS, a shop, a member area, a blog, or only a few pages. Do not sell a complicated stack to a business that needs a contact page and reliable updates.",
          "Write down hosting, domain, analytics, form, and account ownership before you build."
        ]
      },
      {
        title: 'Page speed and Core Web Vitals in practice', minutes: 8,
        body: [
          "Check real pages in PageSpeed Insights and Search Console, then look at the page itself. Large images, third-party scripts, web fonts, sliders, and unused apps are common causes of slow loads.",
          "Compress and size images, remove scripts that do not earn their place, and test mobile on a real connection. A green lab score is not the same as a good experience for every visitor.",
          "Record the before number, the change, and the after number. Do not promise a perfect score when the platform controls part of the page."
        ]
      },
      {
        title: 'Forms, integrations, and where they break', minutes: 8,
        body: [
          "Test the whole path: form submission, confirmation, notification, CRM record, autoresponder, and analytics event. A form that says 'sent' while the lead sits nowhere is not working.",
          "Zapier, Make, HubSpot, Airtable, and native integrations each need an owner and an error alert. Keep a test record and a manual fallback for important leads.",
          "Check spam folders, sender authentication, required fields, duplicate submissions, and mobile keyboard behaviour."
        ]
      },
      {
        title: 'Handover, backups, and maintenance retainers', minutes: 7,
        body: [
          "The handover should include domains, hosting, CMS access, plugin or app list, analytics, forms, backups, licenses, and a short edit guide. Put passwords in the client's vault, not the handover document.",
          "Back up before updates and keep a restore test, not only a backup icon. WordPress sites need particular attention to plugins, themes, admin accounts, and database storage.",
          "A maintenance retainer needs a defined number of hours or changes, response time, exclusions, and a process for larger work."
        ]
      },
      {
        title: 'The HTML and CSS worth learning first', minutes: 8,
        body: [
          "Learn semantic HTML, headings, links, images, forms, lists, classes, and the box model. Those basics let you fix a broken section instead of waiting for a developer for every small change.",
          "Then learn flexbox, grid, responsive units, media queries, and browser dev tools. Inspect the problem before adding another CSS rule.",
          "Current no-code listings often pair Webflow or WordPress with forms, integrations, page-speed checks, and basic HTML and CSS. Build a small site, document the decisions, and charge for maintenance only after you can restore it."
        ]
      }
    ],
  },
  {
    slug: 'ecommerce-operations',
    niche: 'ecommerce',
    tag: 'Ecommerce',
    title: 'Ecommerce Store Operations',
    author: 'Guest instructor',
    blurb: 'Shopify listings, inventory, fulfilment, and the daily store checklist.',
    tint: '#fdf0e8',
    fg: '#b5581f',
    status: 'open',
    lessons: [
      {
        title: 'Product listings that convert and stay accurate', minutes: 8,
        body: [
          "A product page needs a correct title, clear benefit, specs, variants, price, stock state, delivery information, photos, and a useful call to action. Shopify fields should match the source catalogue, not a copy in someone's Downloads folder.",
          "Write for the shopper's question first. Use search terms naturally, but do not turn the description into a pile of keywords. Check every variant, image, size chart, and bundle before publishing.",
          "Use a bulk editor or import only after testing a small batch. One wrong column can change hundreds of products."
        ]
      },
      {
        title: 'Inventory, suppliers, and stockout drills', minutes: 7,
        body: [
          "Track SKU, available stock, committed stock, reorder point, supplier, lead time, and last checked date. Shopify inventory is not a substitute for a real replenishment rule when stock lives in more than one place.",
          "Run a stockout drill: what happens when an item sells out, a supplier is late, an order is split, or a shipment arrives short? Write the customer message and escalation owner before the emergency.",
          "Keep purchase orders and supplier conversations linked to the SKU. A vague note saying 'supplier confirmed' will not help next week."
        ]
      },
      {
        title: 'Order issues, refunds, and chargebacks', minutes: 8,
        body: [
          "Work from the order record, fulfillment status, tracking, policy, and customer history. Gorgias, Shopify, ShipStation, and a 3PL dashboard may each show part of the answer.",
          "Refunds and replacements need an approval limit and a reason code. Do not make up a delivery promise because the customer is angry. State what you know and when you will check again.",
          "For chargebacks, preserve the order, tracking, communication, policy, and evidence of delivery in the format the payment processor requests."
        ]
      },
      {
        title: 'Apps, theme edits, and what not to touch', minutes: 7,
        body: [
          "Before installing an app, identify the job, data access, monthly cost, theme impact, and uninstall path. Ask whether an existing Shopify feature or a small manual process is enough.",
          "Never edit a live theme without a duplicate, a backup, and a rollback note. Test cart, checkout, product options, discount codes, mobile layout, and analytics after the change.",
          "Keep a change log with date, person, app or file, reason, and result. Store owners remember the sale that broke more than the hundred edits that worked."
        ]
      },
      {
        title: 'Reading store analytics for what to fix next', minutes: 8,
        body: [
          "Start with sessions, conversion rate, add-to-cart, checkout started, purchase, average order value, returns, and contribution after discounts and shipping. Shopify reports are useful, but attribution can overlap with Klaviyo, Meta, and Google.",
          "Look at product, device, traffic source, and cohort patterns before changing the whole store. A low conversion rate on a product with bad stock or slow delivery needs an operations fix, not a new homepage.",
          "Recent Shopify VA listings combine order fulfillment, customer support, product updates, apps, SEO, and supplier work. PH ecommerce guides place specialist VA pay around PHP 45,000 to PHP 100,000 monthly, with paid ads, inventory ownership, and team management above that."
        ]
      }
    ],
  },
];

/**
 * The three foundation courses everyone gets. Everything else is a paid track.
 *
 * This is display and server-render gating only: the lesson bodies of a premium
 * course are never sent to a browser without paid access (see the course page),
 * so the label and the lock always agree.
 */
export const BASIC_COURSE_SLUGS = new Set([
  'complete-va-starter',
  'applications-that-get-replies',
  'pricing-and-negotiation',
]);

/**
 * Fold the extras (checklists, quiz, templates, project, job posts, walkthroughs)
 * onto each course. Checklists are index-aligned to `lessons`; scripts/check-extras.mjs
 * fails the build if a course ever gains or loses a lesson without its checklist.
 */
/**
 * Four niche tracks were superseded by the longer written versions. Keep the
 * slugs alive as redirects, but drop them from the listings so the same subject
 * never appears twice.
 */
export const SUPERSEDED_BY_DEEP_TRACK: Record<string, string> = {
  'seo-for-vas': 'seo-specialist',
  'social-media-management': 'social-media-manager',
  'ecommerce-operations': 'ecommerce-va',
  'operations-lead': 'becoming-an-ops-lead',
};

export const COURSES: Course[] = BASE_COURSES.filter(
  (base) => !(base.slug in SUPERSEDED_BY_DEEP_TRACK),
).map((base) => {
  const course: Course = { ...base, premium: !BASIC_COURSE_SLUGS.has(base.slug) };
  const extra = EXTRAS[course.slug];
  if (!extra) return course;
  return {
    ...course,
    lessons: course.lessons?.map((lesson, i) => ({
      ...lesson,
      checklist: extra.checklists[i],
    })),
    quiz: extra.quiz,
    templates: extra.templates,
    practiceProject: extra.practiceProject,
    clientLooksFor: extra.clientLooksFor,
    walkthroughs: extra.walkthroughs,
  };
});

/**
 * Learn track 01 is literally the first four lessons of the starter course —
 * same words, one source. /learn/start hands off to the course for the rest.
 */
export const TRACK_ONE: Lesson[] = (
  COURSES.find((c) => c.slug === 'complete-va-starter')?.lessons ?? STARTER
).slice(0, 4);

export function courseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export const OPEN_COURSES = COURSES.filter((c) => c.status === 'open');
export const BASIC_COURSES = COURSES.filter((c) => !c.premium);
export const PREMIUM_COURSES = COURSES.filter((c) => c.premium);
export const SOON_COURSES = COURSES.filter((c) => c.status === 'soon');

/** "8 lessons · 49 min" for open courses, "5 lessons planned" for the rest. */
export function courseLength(c: Course): string {
  if (c.lessons?.length) {
    const minutes = c.lessons.reduce((n, l) => n + l.minutes, 0);
    const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
    return `${c.lessons.length} lessons · ${time}`;
  }
  return `${c.outline?.length ?? 0} lessons planned`;
}
