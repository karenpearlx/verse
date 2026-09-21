#!/usr/bin/env node
/**
 * Generates src/lib/deep-courses/ai-marketing-and-aeo.ts — the AI Marketing &
 * AEO premium track. All prose is original Verse content; external facts are
 * linked to their sources in the Keep learning section rather than quoted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/lib/deep-courses/ai-marketing-and-aeo.ts');

/* ------------------------------- primitives ------------------------------- */

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

const badge = (text, tone) => {
  const tones = {
    leaf: 'bg-leaf-wash text-leaf',
    accent: 'bg-accent-soft text-accent-deep',
    paper: 'bg-paper-2 text-ink-2',
    clay: 'bg-clay-wash text-clay',
  };
  return `<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide ${tones[tone]} border-transparent">${text}</span>`;
};

const para = (t) => `<p class="text-[1.0625rem] leading-[1.75] text-ink-2">${t}</p>`;
const lead = (t) => `<p class="text-[1.1875rem] leading-[1.7] text-ink">${t}</p>`;
const h2 = (t) => `<h2 class="font-display text-[1.75rem] font-semibold text-ink">${t}</h2>`;
const h4 = (t) => `<h4 class="font-display text-[1.0625rem] font-semibold leading-snug text-ink">${t}</h4>`;
const bullet = (t) =>
  `<li class="flex gap-3"><span aria-hidden="true" class="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-soft"></span><span class="text-[0.9375rem] leading-relaxed text-ink-2">${t}</span></li>`;
const bullets = (items) => `<ul class="space-y-3">${items.map(bullet).join('')}</ul>`;

const th = (t) => `<th scope="col" class="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted first:pl-0 last:pr-0">${t}</th>`;
const rowTh = (t) => `<th scope="row" class="whitespace-nowrap py-2.5 pl-0 pr-3 text-[0.875rem] font-semibold text-ink">${t}</th>`;
const td = (t) => `<td class="px-3 py-2.5 text-[0.875rem] leading-snug text-ink-2">${t}</td>`;
const table = (minWidth, headers, rows) =>
  `<div class="mt-4"><p class="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-2 sm:hidden">Swipe the table sideways \u2192</p><div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><div style="min-width:${minWidth}"><table class="w-full border-collapse text-left"><thead><tr class="border-b border-line-2">${headers.map(th).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr class="border-b border-line last:border-0">${rowTh(r[0])}${r.slice(1).map(td).join('')}</tr>`)
    .join('')}</tbody></table></div></div></div>`;

const workedExample = (label, monoLines) =>
  `<div class="rounded-xl border p-4 sm:p-5 border-line-2 bg-paper-2"><p class="eyebrow mb-2.5 text-muted">${label}</p><div class="rounded-lg border border-line-2 bg-card p-3.5">${monoLines
    .map((l) => `<p class="font-mono text-[0.8125rem] leading-relaxed text-ink-2">${l}</p>`)
    .join('')}</div></div>`;

const templateBlock = (title, note, body) =>
  `<div class="overflow-hidden rounded-lg border border-line bg-card" data-template-block><div class="flex items-start gap-3 border-b border-line bg-paper-2/70 px-3.5 py-2.5"><div class="min-w-0 flex-1"><p class="text-[0.875rem] font-semibold leading-snug text-ink">${title}</p><p class="mt-0.5 text-[0.75rem] leading-snug text-muted">${note}</p></div><button type="button" data-copy-template class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] transition-colors border-line-input bg-card text-muted hover:border-ink hover:text-ink">Copy<span class="sr-only"> template to clipboard</span></button></div><pre class="overflow-x-auto px-3.5 py-3 font-mono text-[0.78125rem] leading-relaxed text-ink-2"><code class="whitespace-pre-wrap break-words" data-template-body>${esc(body)}</code></pre></div>`;

const checklistItem = (t) =>
  `<li><label class="flex cursor-pointer gap-2.5 text-[0.875rem] leading-relaxed text-ink-2 hover:text-ink"><span class="mt-0.5 shrink-0"><span class="inline-flex h-4 w-4 rounded border border-line-3 bg-card"></span></span><input type="checkbox" class="sr-only"/><span class="">${t}</span></label></li>`;

const exercise = (task, handIn, mins, checks) =>
  `<div class="rounded-xl border p-4 sm:p-5 border-teal-pale bg-teal-wash/60"><p class="eyebrow mb-2.5 text-muted">Do this</p><p class="text-[0.9375rem] leading-relaxed text-ink">${task}</p><div class="mt-3.5 flex flex-wrap items-center gap-2">${badge(`Hand in: ${handIn}`, 'accent')}${badge(`\u2248 ${mins} min`, 'paper')}</div><p class="eyebrow mt-4 mb-2 text-muted">Check before you call it done</p><ul class="space-y-1.5">${checks.map(checklistItem).join('')}</ul></div>`;

const factRow = (dt, dd) =>
  `<div class="grid gap-1 px-5 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-6 sm:py-4"><dt class="eyebrow pt-0.5 text-muted">${dt}</dt><dd class="text-[0.9375rem] leading-relaxed text-ink">${dd}</dd></div>`;

const timelineItem = (eyebrow, title, body, last = false) =>
  `<li class="relative flex gap-5 pb-6 last:pb-0"><div class="flex flex-col items-center"><span aria-hidden="true" class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-teal bg-paper"></span>${last ? '' : '<span aria-hidden="true" class="w-px flex-1 bg-line-2"></span>'}</div><div class="min-w-0 pb-1"><p class="eyebrow text-clay">${eyebrow}</p><p class="mt-1 font-display text-[1.0625rem] font-semibold text-ink">${title}</p><p class="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">${body}</p></div></li>`;

const toolCard = (name, tag, tone, body) =>
  `<li class="rounded-xl border border-line bg-card p-4 shadow-tile"><div class="flex items-start justify-between gap-3"><p class="font-display text-[0.9375rem] font-semibold text-ink">${name}</p>${badge(tag, tone)}</div><p class="mt-2 text-[0.875rem] leading-relaxed text-ink-2">${body}</p></li>`;

const navLink = (href, label) =>
  `<li><a href="#${href}" class="inline-flex whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium text-muted transition-colors hover:bg-paper-3 hover:text-ink">${label}</a></li>`;

const redFlag = (title, body) =>
  `<li class="rounded-xl border border-[#f0d5cd] bg-clay-wash/60 p-4 sm:p-5"><p class="flex gap-2.5 font-display text-[1rem] font-semibold text-ink"><span class="mt-1.5 shrink-0 text-clay"><svg aria-hidden="true" viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"></path></svg></span>${title}</p><p class="mt-1.5 pl-6 text-[0.875rem] leading-relaxed text-ink-2">${body}</p></li>`;

const rateBand = (label, range, pct, note, monthly) =>
  `<div><div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p class="font-display text-[1.0625rem] font-semibold text-ink">${label}</p><p class="font-display text-[1.0625rem] font-semibold tabular-nums text-teal-deep">${range}<span class="text-[0.8125rem] font-medium text-muted"> / hr</span></p></div><div class="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-paper-3"><div class="absolute inset-y-0 rounded-full bg-gradient-to-r from-teal-soft to-teal" style="left:${pct[0]}%;width:${pct[1]}%"></div></div><div class="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"><p class="text-[0.8125rem] leading-relaxed text-muted">${note}</p><p class="text-[0.75rem] tabular-nums text-muted-2">\u2248 ${monthly}/mo full-time</p></div></div>`;

/* --------------------------------- modules -------------------------------- */

const M = [];

M.push({
  n: 1, title: 'What AI actually changed (and what it did not)', minutes: 25,
  outcome: 'You can explain to a client which of their marketing tasks AI genuinely speeds up, which it quietly ruins, and where you fit.',
  badges: ['Foundations', 'Client conversations'],
  html:
    `<div class="space-y-6">` +
    lead('The AI-literate VA is not competing with ChatGPT. You are competing with VAs who either refuse to use it or paste its output unread. Both lose. The job clients are actually hiring for in 2026 is judgment: knowing what to ask, what to keep, and what to catch before it publishes.') +
    para('Large language models — ChatGPT, Claude, Gemini — predict text. They are extraordinary at structure, tone, summarising, reformatting and first drafts. They are unreliable at facts, numbers, names and anything that happened recently, and they will state a wrong answer with the same confidence as a right one. That failure mode has a name, hallucination, and managing it is most of the professional skill.') +
    table('42rem', ['Task', 'AI alone', 'VA + AI', 'Why'], [
      ['First draft of a blog post', 'Generic, confident, sometimes wrong', 'Strong', 'You supply the brief, the facts and the edit. AI supplies speed.'],
      ['Client\u2019s monthly report numbers', 'Dangerous', 'AI drafts the commentary only', 'Numbers come from the source. AI never touches them unverified.'],
      ['Social caption variations', 'Fine', 'Faster and on-brand', 'Low-stakes, high-volume. Perfect AI territory with a tone example.'],
      ['Legal, medical, financial claims', 'Never', 'Human sources, AI polishes wording', 'One made-up statistic in a YMYL niche can end the client\u2019s business.'],
      ['Research on a new market', 'Starting point only', 'AI maps the terrain, you verify', 'Every claim needs a primary source before it reaches the client.'],
    ]) +
    bullets([
      'Say &#x27;AI-assisted&#x27; honestly. Most clients now expect it; the ones who forbid it are telling you something useful about the engagement.',
      'The market shifted, not shrank: fewer &#x27;write 10 articles&#x27; jobs, more &#x27;run our content system&#x27; jobs. Systems pay better than articles.',
      'Free tiers of ChatGPT and Claude are enough for this whole course. Do not buy anything yet.',
    ]) +
    exercise(
      'Take a real business you know and list ten of its recurring marketing tasks. Sort each into: AI-safe, AI-with-review, human-only. Write one sentence per row justifying the sort.',
      'The ten-row sorted list with justifications.',
      40,
      ['Every AI-safe row is genuinely low-stakes if the output is mediocre', 'At least two rows are human-only, with the risk named', 'You could defend each sort to a sceptical client'],
    ) +
    `</div>`,
});

M.push({
  n: 2, title: 'Prompting like a professional', minutes: 35,
  outcome: 'You can turn a vague client request into a prompt that produces a usable draft on the first or second try.',
  badges: ['Workflow', '1 template'],
  html:
    `<div class="space-y-6">` +
    lead('A prompt is a brief. Everything you already know about briefing a writer applies: audience, purpose, format, tone, length, examples, and what to avoid. Vague briefs produce vague drafts, from humans and models alike.') +
    bullets([
      'Be precise about the deliverable. &#x27;Write a blog intro&#x27; is a wish. &#x27;Write a 120-word intro for Filipino freelancers who already know what SEO is, ending with a question&#x27; is a brief.',
      'Name the audience and what they already know. The single biggest quality lever in any prompt.',
      'Give it a role and a tone example. Two sentences of the client\u2019s actual writing beats any adjective list.',
      'Constrain the format: word count, structure, headings, what to exclude. Models follow structure instructions well.',
      'Iterate instead of restarting. &#x27;Keep the structure, make paragraph two more specific, remove the clich\u00e9s&#x27; is the real workflow.',
      'Save what works. A prompt library is a genuine client deliverable — agencies bill for them.',
    ]) +
    h4('The brief \u2192 prompt \u2192 edit loop') +
    workedExample('Worked example — Baler Coffee blog intro, second pass', [
      'v1 prompt \u2192 &#x27;write an intro about storing coffee beans&#x27; \u2192 generic, could be any site',
      'v2 prompt \u2192 role + audience (QC coffee buyers) + tone sample + 120 words + end on a question',
      'v2 output \u2192 usable after a two-minute edit: one clich\u00e9 cut, one local detail added',
      'saved to library as &#x27;blog-intro.md&#x27; with a note on what the tone sample was',
    ]) +
    templateBlock(
      'Reusable content prompt (fill the brackets)',
      'Works in ChatGPT, Claude and Gemini. Keep one per content type in your library.',
      `You are [role: e.g. a content writer for a specialty coffee roaster in Quezon City].

Audience: [who they are and what they already know]
Task: [exact deliverable, e.g. a 120-word blog introduction about X]
Tone: match this sample of our writing: "[paste 2\u20133 sentences]"
Must include: [facts, keywords, the one point that matters]
Must avoid: [clich\u00e9s, competitor names, claims we can\u2019t back]
Format: [structure, length, headings]

If any information you need is missing, ask me instead of inventing it.`,
    ) +
    exercise(
      'Pick one real piece of content you have seen a client publish. Reverse-engineer the brief, write the prompt using the template, run it, then iterate twice. Keep all three outputs.',
      'The prompt, the three outputs, and two sentences on what each iteration fixed.',
      45,
      ['Your prompt names audience, tone, format and exclusions', 'The final output needed less than five minutes of hand editing', 'The last line of the template (ask, don\u2019t invent) is still in your prompt'],
    ) +
    `</div>`,
});

M.push({
  n: 3, title: 'A content workflow that keeps quality', minutes: 35,
  outcome: 'You can run an AI-assisted content pipeline a client can trust, with the fact-check built in rather than promised.',
  badges: ['Workflow', 'Quality control'],
  html:
    `<div class="space-y-6">` +
    lead('Speed without a checking stage is just faster mistakes. The workflow below is what separates a VA who &#x27;uses ChatGPT&#x27; from one who runs a content operation.') +
    table('44rem', ['Stage', 'Who does it', 'Time', 'What can go wrong here'], [
      ['1 · Brief', 'You, with the client', '15 min', 'Skipping it. The model fills every gap you leave with generic filler.'],
      ['2 · Outline', 'AI drafts, you approve', '10 min', 'Approving an outline that answers the wrong search intent.'],
      ['3 · Draft', 'AI', '5 min', 'Nothing — this is the safe part. Generate two versions.'],
      ['4 · Fact-check', 'You, against primary sources', '20 min', 'The stage everyone skips. Every number, name, date and claim gets a source or gets cut.'],
      ['5 · Humanise', 'You', '15 min', 'Leaving the tells: &#x27;delve&#x27;, &#x27;in today\u2019s fast-paced world&#x27;, perfectly parallel paragraphs, no opinions.'],
      ['6 · Publish + log', 'You', '10 min', 'Not logging the prompt and sources. The log is what makes the system saleable.'],
    ]) +
    bullets([
      'Fact-check against primary sources, not against the model. Asking the same model &#x27;are you sure?&#x27; is not verification.',
      'Keep a kill list of AI tells for the client\u2019s niche and edit them out on every pass.',
      'One honest disclosure line in your contract — &#x27;drafts are AI-assisted, every fact is human-verified&#x27; — prevents the awkward conversation later.',
      'A 75-minute pipeline producing a verified article is the honest pitch. Anyone promising 20 articles a day is selling the mistakes stage.',
    ]) +
    workedExample('Worked example — the fact-check log for one Baler Coffee post', [
      'claim: &#x27;beans stale within 2\u20134 weeks of roasting&#x27; \u2192 verified, two roaster sources linked',
      'claim: &#x27;the Philippines is the world\u2019s 4th largest coffee producer&#x27; \u2192 WRONG, cut (model invention)',
      'claim: &#x27;freezing beans is fine if airtight&#x27; \u2192 verified with caveat, rewritten to include it',
      'log saved next to the draft \u2192 client can audit any line',
    ]) +
    exercise(
      'Run the full six-stage pipeline on one 600-word post for any real local business. Time each stage honestly.',
      'The published-ready post, the fact-check log, and your six timings.',
      75,
      ['Every retained claim in the log has a primary source link', 'At least one AI claim was caught and cut — if none, check harder', 'Total time is under two hours; note which stage you can compress next time'],
    ) +
    `</div>`,
});

M.push({
  n: 4, title: 'AEO: how AI answers choose their sources', minutes: 30,
  outcome: 'You understand where AI Overviews, ChatGPT and Perplexity get their answers, and why classic SEO is still the entry ticket.',
  badges: ['AEO', 'How it works'],
  html:
    `<div class="space-y-6">` +
    lead('A growing share of searches now ends in an AI-written answer instead of ten blue links. Answer Engine Optimisation — AEO, also sold as GEO — is the work of making sure your client is the source that answer cites. The good news for you: it is mostly rigorous SEO wearing a new name.') +
    bullets([
      'AI assistants do not know the live web. They use RAG — retrieval augmented generation: search first (Google, Bing), then write an answer from what they retrieved. If a page cannot rank, it cannot be retrieved; if it cannot be retrieved, it cannot be cited.',
      'Google\u2019s AI Overviews pull from the same index as normal search. There is no separate &#x27;AI index&#x27; to optimise for, and Google says so in its official guidance.',
      'When an AI Overview appears, clicks to the pages below it drop sharply. The client strategy shifts from &#x27;win the click&#x27; to &#x27;be the citation&#x27; — the brand named inside the answer.',
      'AI answers fan the query out into related sub-questions and pull sources per sub-question. Pages that answer a cluster of related questions win more citations than pages chasing one keyword.',
      'The most-cited domains in AI answers are heavyweights like YouTube and Reddit. A presence there is now part of search strategy, not a separate channel.',
    ]) +
    table('40rem', ['Surface', 'Where its answers come from', 'What gets you cited'], [
      ['Google AI Overviews', 'Google\u2019s own index', 'Ranking + answer-first formatting + structured data'],
      ['ChatGPT (browsing)', 'Bing retrieval + training data', 'Bing indexing, brand mentions across the web'],
      ['Perplexity', 'Live retrieval, citations shown', 'Clear, factual pages that answer one question fully'],
      ['Gemini', 'Google index', 'Same playbook as AI Overviews'],
    ]) +
    workedExample('Worked example — why Baler Coffee lost the click but won the customer', [
      'query \u2192 &#x27;how long do coffee beans stay fresh&#x27; shows an AI Overview',
      'overview cites balercoffee.ph/blog/store-coffee-beans as source 2 of 3',
      'clicks to the post drop \u2192 but branded searches for &#x27;baler coffee&#x27; rise that month',
      'report line \u2192 &#x27;we are the named source in the answer 6,000 people read&#x27;',
    ]) +
    exercise(
      'Run ten real searches in your client\u2019s (or any local business\u2019s) niche. Record which trigger AI Overviews, which sources get cited, and whether the business appears anywhere in the chain.',
      'A ten-row sheet: query, AI answer shown?, cited sources, client present?',
      40,
      ['At least three informational and three transactional queries tested', 'Every cited domain is logged, not just the client\u2019s absence', 'One paragraph: where are the citations coming from in this niche?'],
    ) +
    `</div>`,
});

M.push({
  n: 5, title: 'Making a client citable', minutes: 40,
  outcome: 'You can restructure a page so both Google and AI assistants can lift the answer — and attribute it to your client.',
  badges: ['AEO', 'On-page', '1 template'],
  html:
    `<div class="space-y-6">` +
    lead('AI answers are assembled from pages that make extraction easy. Buried answers get skipped; clear ones get cited. This module is the on-page work of AEO, and it doubles as good SEO everywhere else.') +
    bullets([
      'Answer first. The question the page targets gets answered plainly in the first 40\u201360 words under the heading. Context and nuance come after, not before.',
      'One page, one question cluster. Cover the sub-questions AI fans out to — cost, how long, alternatives, is it worth it — as their own H2s.',
      'Use existing structured data: FAQ, Article, Product, Review, LocalBusiness. Google is explicit that no new AI-specific schema exists; anyone selling &#x27;AI schema&#x27; is selling smoke.',
      'Show a named human. Author bylines, credentials, first-hand photos and honest experience are the E-E-A-T signals that separate citable pages from content farms.',
      'Keep facts fresh and dated. AI features favour pages that state when a number was last checked.',
      'Be present where AI already looks: a helpful YouTube video and honest Reddit participation in the niche often earn citations faster than another blog post.',
    ]) +
    h4('The citable-page checklist') +
    table('40rem', ['Element', 'Citable page', 'Invisible page'], [
      ['Opening', 'Direct 40\u201360 word answer under the H1', 'Three paragraphs of warm-up before the point'],
      ['Structure', 'H2 per sub-question, scannable', 'One 2,000-word wall of prose'],
      ['Evidence', 'Named sources, dates, first-hand photos', '&#x27;Studies show&#x27; with no study'],
      ['Author', 'Real person, credentials, bio page', 'Anonymous or &#x27;admin&#x27;'],
      ['Schema', 'FAQ/Article markup that matches the visible text', 'None, or markup for content that isn\u2019t on the page'],
    ]) +
    templateBlock(
      'AEO page brief (fill the brackets)',
      'Hand this to a writer — or to module 2\u2019s prompt template — for any answer-first page.',
      `Target question: [the exact question, as people ask it]
Direct answer (40\u201360 words, goes right under the H1): [draft it first]
Sub-questions to cover as H2s: [3\u20136, from People Also Ask and AI answers]
Facts to include, with sources: [each claim + primary source URL]
Author: [named person + one-line credential]
Schema: [FAQ / Article / LocalBusiness — matching visible content only]
Freshness line: "Last checked [month, year]"`,
    ) +
    exercise(
      'Take one existing page from a real business and rewrite its opening plus heading structure using the brief template. Do not write the whole page — restructure it.',
      'Before/after of the opening 100 words and the heading outline, plus the filled brief.',
      50,
      ['The direct answer survives being read out of context — that is how AI will use it', 'Every H2 maps to a sub-question someone actually asks', 'No schema is promised for content the page does not visibly contain'],
    ) +
    `</div>`,
});

M.push({
  n: 6, title: 'AI agents and automations without the horror stories', minutes: 35,
  outcome: 'You can set up small, safe automations — custom GPTs, Zapier steps — and know exactly which tasks must keep a human in the loop.',
  badges: ['Automation', 'Tools'],
  html:
    `<div class="space-y-6">` +
    lead('The step past prompting is packaging: turning your best prompts into reusable assistants and wiring them into the tools a client already uses. Done small and reviewed, this is the highest-leverage hour you can sell. Done carelessly, it emails a hallucination to 4,000 subscribers.') +
    bullets([
      'A custom GPT (or a Claude project) is just your prompt library with a memory: the client\u2019s tone guide, product facts and rules, saved once, reused by anyone on the team.',
      'Zapier, Make and n8n connect triggers to actions: form submitted \u2192 draft reply; new review \u2192 draft response; article published \u2192 caption variants drafted.',
      'The safety rule is one word: draft. Automations that draft for human review are safe. Automations that send are where the horror stories live.',
      'Log everything the automation does. When the client asks &#x27;where did this reply come from&#x27;, you want an answer.',
      'Price this as setup + a monthly &#x27;keep it working&#x27; retainer. Automations rot when tools update; maintenance is recurring revenue.',
    ]) +
    table('42rem', ['Task', 'Automate?', 'Design'], [
      ['Review responses', 'Draft only', 'New review \u2192 AI drafts in brand voice \u2192 human approves and posts'],
      ['Social captions from a blog post', 'Yes, with review', 'Publish \u2192 5 caption variants to a Sheet \u2192 human picks'],
      ['Support email replies', 'Draft only', 'AI suggests, human sends. Refunds and complaints: human writes.'],
      ['Invoice amounts, prices, promises', 'Never', 'No generated numbers reach a customer without a human check.'],
      ['Weekly report commentary', 'Draft only', 'Numbers pulled by the tool, prose drafted by AI, verified by you'],
    ]) +
    workedExample('Worked example — Baler Coffee\u2019s review responder', [
      'trigger \u2192 new Google review lands',
      'step 1 \u2192 AI drafts a reply: brand voice file + the review text + rules (no discounts, no arguing)',
      'step 2 \u2192 draft posts to a private Slack channel, never to Google',
      'step 3 \u2192 owner taps approve or edits \u2192 you post it. Ten minutes saved per review, zero risk.',
    ]) +
    exercise(
      'Design (on paper — no tools needed) one draft-only automation for a real business: trigger, steps, the exact prompt, the review gate, and the log.',
      'A one-page automation spec a client could approve.',
      45,
      ['Nothing in the design sends anything without human approval', 'The prompt includes the brand voice sample and the rules list', 'You wrote down what breaks it — tool changes, weird inputs — and who notices'],
    ) +
    `</div>`,
});

M.push({
  n: 7, title: 'Measuring AI visibility and reporting it', minutes: 30,
  outcome: 'You can show a client whether AI answers mention them, track it monthly, and report it without overclaiming.',
  badges: ['Reporting', 'Retention'],
  html:
    `<div class="space-y-6">` +
    lead('Clients keep paying for what they can see. AI visibility is new enough that most agencies report nothing — which makes a simple, honest monthly section your edge.') +
    bullets([
      'Build a fixed query set: 20\u201330 searches that matter to the client (their services, their questions, their brand). Same list every month, or the trend means nothing.',
      'Track three things per query: does an AI answer appear, is the client cited or mentioned, and who else is. A spreadsheet is enough to start.',
      'Watch the second-order signals in the tools you already have: branded search impressions in Search Console, direct traffic, &#x27;how did you hear about us&#x27; answers mentioning ChatGPT or Google\u2019s answer.',
      'Semrush and Ahrefs both track AI Overview presence now; use them when the client already pays, but never report a number you cannot explain.',
      'Report honestly: AI answers vary by user and day. Frame results as &#x27;observed on our tracked set&#x27;, not as rankings.',
    ]) +
    table('40rem', ['Report section', 'What goes in it', 'Cadence'], [
      ['AI answer presence', 'X of 25 tracked queries showed AI answers; client cited in Y', 'Monthly'],
      ['Citation movement', 'New citations won and lost, with the page that earned them', 'Monthly'],
      ['Second-order signals', 'Branded impressions, direct traffic, attribution mentions', 'Monthly'],
      ['Actions', 'Three next moves, each tied to a finding above', 'Monthly'],
    ]) +
    workedExample('Worked example — one honest report line', [
      'BAD \u2192 &#x27;We now rank #1 in ChatGPT&#x27; (not a thing; varies per user)',
      'GOOD \u2192 &#x27;On our 25-query set, AI answers appeared for 14; Baler was cited in 4,',
      '        up from 1 last month. All three new citations point to the storage guide',
      '        we restructured in module 5. Next: same treatment for the brewing page.&#x27;',
    ]) +
    exercise(
      'Build the tracking sheet for a real business: 25 queries, run them once, log AI presence and citations, and write the four report sections for month zero.',
      'The sheet plus a half-page month-zero report.',
      60,
      ['Queries cover services, questions and the brand — not just one type', 'Every number in the report traces to a row in the sheet', 'The actions section has three moves a client could approve tomorrow'],
    ) +
    `</div>`,
});

M.push({
  n: 8, title: 'Capstone: the Baler Coffee AI content system', minutes: 50,
  outcome: 'A portfolio piece: a documented, priced AI content system — prompt library, one citable page, one automation spec, one measurement plan.',
  badges: ['Capstone', 'Portfolio'],
  html:
    `<div class="space-y-6">` +
    lead('Everything in one deliverable. You are handing Baler Coffee (or a real business you substitute) a system they could run without you — which is exactly why they will pay you to run it.') +
    bullets([
      'Part 1 — the prompt library: five prompts from module 2\u2019s template (blog intro, full post, captions, review reply, report commentary), each with the tone sample embedded and a one-line usage note.',
      'Part 2 — one citable page: a full AEO brief from module 5 plus the finished, fact-checked page using the module 3 pipeline, with the fact-check log attached.',
      'Part 3 — one automation spec: the draft-only review responder (or your own), specced to module 6\u2019s standard.',
      'Part 4 — the measurement plan: the 25-query set and a month-zero baseline from module 7.',
      'Part 5 — the one-page proposal: what the system does, what it costs monthly, and the honest line about AI assistance and human verification.',
    ]) +
    table('38rem', ['Part', 'Time', 'Proves to a client'], [
      ['Prompt library', '60 min', 'You have a system, not a habit'],
      ['Citable page + log', '90 min', 'Quality control is built in, not promised'],
      ['Automation spec', '45 min', 'You think about risk before tools'],
      ['Measurement plan', '45 min', 'You expect to be held accountable'],
      ['Proposal', '30 min', 'You can sell it — this is the page they forward to their partner'],
    ]) +
    exercise(
      'Assemble all five parts into one folder (Drive or Notion). Then record a five-minute Loom walking a pretend client through it.',
      'The folder link and the Loom. This pair is your interview answer to &#x27;what can you do with AI?&#x27;',
      270,
      ['A stranger could run the system from the folder alone', 'The fact-check log shows at least one caught error', 'The proposal names a monthly price and defends it in one sentence', 'The Loom is under six minutes and never says &#x27;um, so basically&#x27;'],
    ) +
    `</div>`,
});

/* ---------------------------------- quiz ---------------------------------- */

const quiz = [
  {
    q: 'A client wants 20 AI-written articles published this week, no review step. What do you do?',
    options: [
      'Deliver — the client is always right',
      'Refuse to use AI at all',
      'Propose the six-stage pipeline and show what the fact-check catches',
      'Publish them but add a disclaimer',
    ],
    answer: 2,
    explain: 'Volume without verification publishes hallucinations under the client\u2019s name. Show the pipeline, show a caught error, and let the client choose speed with eyes open. Refusing AI entirely just loses you the client to someone worse.',
  },
  {
    q: 'Why does a page that cannot rank in normal search almost never get cited by AI assistants?',
    options: [
      'AI assistants only cite paid partners',
      'They retrieve sources through search engines first (RAG), so unranked pages are never retrieved',
      'AI assistants only read social media',
      'They only cite pages with special AI schema',
    ],
    answer: 1,
    explain: 'Assistants search first and write second — retrieval augmented generation. If the page is invisible to the retrieval step, it cannot appear in the answer. Classic SEO is the entry ticket to AEO.',
  },
  {
    q: 'An AI Overview now appears above your client\u2019s #1 ranking and clicks dropped. The honest strategic move is:',
    options: [
      'Report the ranking and hide the click drop',
      'Restructure the page answer-first so the client becomes the cited source inside the answer',
      'Buy ads to compensate forever',
      'Ask Google to remove the AI Overview',
    ],
    answer: 1,
    explain: 'The Overview is not going away and you cannot opt a competitor\u2019s query out of it. The winnable position is being the citation — answer-first structure, sub-question coverage, named author, honest sourcing.',
  },
  {
    q: 'Which prompt will produce the most usable first draft?',
    options: [
      '&#x27;Write a blog post about coffee storage&#x27;',
      '&#x27;Write 800 words, SEO optimised, engaging, viral&#x27;',
      'A prompt with audience, tone sample, format limits, required facts, and &#x27;ask instead of inventing&#x27;',
      'The same request pasted five times for five options',
    ],
    answer: 2,
    explain: 'A prompt is a brief. Audience, tone example, structure and exclusions are what the model can actually follow; adjectives like &#x27;engaging&#x27; and &#x27;viral&#x27; are noise.',
  },
  {
    q: 'A vendor offers the client &#x27;proprietary AI schema markup that makes ChatGPT recommend you&#x27;. This is:',
    options: [
      'A smart early-adopter move',
      'Smoke — no AI-specific schema exists; existing types (FAQ, Article, Product) already serve AI features',
      'Required by Google since 2025',
      'Fine if it is cheap',
    ],
    answer: 1,
    explain: 'Google\u2019s own guidance says generative features use the same index and the same structured data types as regular search. Anyone selling secret AI markup is selling the client\u2019s ignorance back to them.',
  },
  {
    q: 'The AI draft says &#x27;the Philippines is the world\u2019s 4th largest coffee producer&#x27;. Before publishing you:',
    options: [
      'Keep it — it sounds plausible and specific',
      'Ask the same model to confirm it',
      'Find a primary source; if none exists, cut the claim',
      'Soften it to &#x27;one of the largest&#x27; so it can\u2019t be wrong',
    ],
    answer: 2,
    explain: 'Models state inventions with full confidence, and asking the same model to check itself is not verification. Every number, name and date gets a primary source or gets cut — that log is your professional value.',
  },
];

/* -------------------------------- glossary -------------------------------- */

const glossary = [
  { term: 'LLM', def: 'Large language model — ChatGPT, Claude, Gemini. Predicts text from patterns; brilliant at structure and tone, unreliable at facts.' },
  { term: 'Prompt', def: 'The instruction you give a model. Professionally: a brief, with audience, tone, format and exclusions.' },
  { term: 'System prompt', def: 'Standing instructions a model follows across a whole conversation or tool — where the brand voice and rules live.' },
  { term: 'Token', def: 'The unit models read and bill by; roughly three-quarters of a word in English.' },
  { term: 'Context window', def: 'How much text the model can consider at once. Paste more than it holds and the start silently falls out.' },
  { term: 'Hallucination', def: 'A confident, fluent, wrong statement. Not a rare glitch — a standing property you design the workflow around.' },
  { term: 'AI Overviews', def: 'Google\u2019s AI-written answer above the results, assembled from the normal search index with sources cited.' },
  { term: 'AEO', def: 'Answer engine optimisation — the work of becoming the source AI answers cite. Also marketed as GEO or LLMO.' },
  { term: 'GEO', def: 'Generative engine optimisation. Same discipline as AEO, different acronym on the invoice.' },
  { term: 'RAG', def: 'Retrieval augmented generation: the assistant searches first, then writes from what it retrieved. Why ranking still matters.' },
  { term: 'Entity', def: 'A thing search engines recognise — a business, person, place. Consistent naming everywhere is how a small brand becomes one.' },
  { term: 'Structured data', def: 'Schema markup (FAQ, Article, Product, LocalBusiness) that labels page content for machines. No AI-specific type exists.' },
  { term: 'E-E-A-T', def: 'Experience, expertise, authoritativeness, trust — the qualities that separate citable pages from content farms.' },
  { term: 'Query fan-out', def: 'AI answers expand one question into related sub-questions and pull sources for each. Cover the cluster, win more citations.' },
  { term: 'Zero-click search', def: 'A search that ends on the results page. The metric shifts from clicks won to citations earned.' },
  { term: 'Custom GPT', def: 'A packaged assistant carrying your prompts, tone files and rules — a prompt library the whole team can use.' },
];

/* --------------------------------- chunks --------------------------------- */

const NAV = `<nav aria-label="Course sections" class="sticky top-16 z-20 border-b border-line bg-paper/90 backdrop-blur-md"><div class="mx-auto w-full px-5 sm:px-8 max-w-6xl"><ul class="-mx-1 flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">${[
  ['the-job', 'The job'],
  ['tools', 'Tools'],
  ['modules', 'Modules'],
  ['keep-learning', 'Resources'],
  ['rates', 'Rates'],
  ['first-client', 'First client'],
  ['quiz', 'Quiz'],
  ['glossary', 'Glossary'],
  ['red-flags', 'Red flags'],
  ['faq', 'FAQ'],
].map(([h, l]) => navLink(h, l)).join('')}</ul></div></nav>`;

const HERO =
  `<section class="px-5 pt-28 md:px-8 md:pt-40"><div class="mx-auto max-w-5xl"><p class="eyebrow">Specialism · Pro</p><h1 class="display-lg mt-4">AI Marketing &amp; AEO<span class="dot" aria-hidden="true">.</span></h1><p class="lede mt-5 max-w-xl">Use ChatGPT and Claude like a professional, and learn AEO — getting clients cited inside AI answers — before most agencies have.</p><div class="mt-8"><div class="flex flex-wrap items-center gap-2.5">${badge('Premium course', 'leaf')}${badge('8 modules', 'accent')}${badge('4h 40m of reading and doing', 'paper')}${badge('8 portfolio pieces', 'clay')}</div><p class="mt-4 mb-2 text-[0.8125rem] text-muted">Course content is based on active job listings and industry hiring patterns. These are practical guides, not formal certifications.</p></div></div></section>` +
  NAV +
  `<div class="mx-auto w-full px-5 sm:px-8 max-w-5xl py-14 sm:py-20"><section id="the-job" class="scroll-mt-32"><div class="space-y-5">` +
  lead('Every client is being sold AI right now — by tools, by agencies, by their nephew. Almost none of them have someone who can run it calmly: good prompts, verified facts, honest reporting. That person gets paid more than the person who types faster.') +
  para('This track teaches two connected skills. First, AI-assisted marketing execution: prompting, content pipelines with the fact-check built in, and small safe automations. Second, AEO — answer engine optimisation — the work of making a business the source that Google\u2019s AI Overviews, ChatGPT and Perplexity actually cite. The second skill is brand new, agencies are still improvising it, and a VA who can do it credibly is very hard to replace.') +
  para('You will work on the same fictional client as the SEO track: Baler Coffee Roasters in Quezon City. If you took that track, this one builds on it. If you did not, everything you need is explained where it appears.') +
  `</div><dl class="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-tile">` +
  factRow('Also posted as', 'AI content VA, AI marketing assistant, GEO/AEO specialist, marketing automation VA') +
  factRow('Core loop', 'Brief \u2192 prompt \u2192 draft \u2192 verify \u2192 publish \u2192 measure \u2192 report') +
  factRow('Pays more than general VA by', 'Roughly 30\u201360% at the same experience level, more with automation setup work') +
  factRow('Hardest part', 'Telling a client their 20-posts-a-week plan will hurt them, and having the workflow to prove it') +
  factRow('Easiest way in', 'A documented content system with a fact-check log — module 8 builds exactly that') +
  `</dl></section><section class="mt-16">` +
  h2('What a shift actually looks like') +
  `<ol class="mt-6 space-y-0">` +
  timelineItem('Start of shift', 'Draft queue review', 'Approve, edit or bounce the AI drafts your pipeline produced overnight. Nothing publishes unread.') +
  timelineItem('Morning block', 'Deep work: briefs and citable pages', 'Write the AEO briefs and restructure pages while your judgment is fresh.') +
  timelineItem('Mid-shift', 'Production runs', 'Run the prompt library: posts, captions, review replies. Fact-check as you go, log as you finish.') +
  timelineItem('Weekly', 'Automation check', 'Read the automation logs, fix what tool updates broke, note time saved for the report.') +
  timelineItem('Monthly', 'AI visibility report', 'Run the tracked query set, log citations won and lost, write the three next moves.', true) +
  `</ol></section></div>` +
  `<section id="tools" class="scroll-mt-32 border-y border-line bg-paper-2/70 py-14 sm:py-20"><div class="mx-auto w-full px-5 sm:px-8 max-w-5xl">` +
  h2('The tools, and why each one exists') +
  `<p class="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">The free tiers cover this entire course. Learn the workflow first; upgrade only when a client\u2019s volume demands it.</p><div class="mt-8 space-y-8"><div><p class="eyebrow text-muted">Non-negotiable, and free</p><ul class="mt-3.5 grid gap-3 sm:grid-cols-2">` +
  toolCard('ChatGPT', 'Free tier', 'accent', 'The model most clients already talk about. Learn its strengths and its confident lies first.') +
  toolCard('Claude', 'Free tier', 'accent', 'Stronger long-document work and tone matching. Your second opinion on every important draft.') +
  toolCard('Google Search Console', 'Free', 'leaf', 'Where the second-order AEO signals show up: branded impressions, query changes.') +
  toolCard('Google Sheets', 'Free', 'leaf', 'The prompt library, the fact-check log, the query tracker. The system lives here.') +
  `</ul></div><div><p class="eyebrow text-muted">Understand before you need them</p><ul class="mt-3.5 grid gap-3 sm:grid-cols-2">` +
  toolCard('Zapier / Make / n8n', 'Free tier', 'accent', 'The wiring for module 6\u2019s draft-only automations. n8n is the free-forever self-hosted option.') +
  toolCard('Semrush / Ahrefs', 'Paid', 'paper', 'Both now track AI Overview presence. Use the client\u2019s licence; know the vocabulary before the interview.') +
  toolCard('Perplexity', 'Free tier', 'accent', 'The assistant that shows its citations openly — the best free window into how retrieval picks sources.') +
  toolCard('Schema validator', 'Free', 'leaf', 'validator.schema.org — check every piece of markup you ship against what the page visibly says.') +
  `</ul></div></div></div></section>`;

const RATES =
  `<section class="border-y border-line bg-paper-2/70 py-14 sm:py-20"><div class="mx-auto w-full px-5 sm:px-8 max-w-5xl"><section id="rates" class="scroll-mt-32">` +
  h2('What this actually pays') +
  `<p class="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">Ranges assembled from 2026 OnlineJobs.ph listings for AI content and marketing automation roles, cross-checked against agency rate cards. The spread depends on whether you execute prompts or own a system with a report attached.</p><div class="mt-7 rounded-2xl border border-line bg-card p-6 shadow-tile sm:p-7"><div class="space-y-7">` +
  rateBand('Beginner', '5\u20137', [20, 15], 'Running someone else\u2019s prompt library, caption production, draft queues under review.', '800\u20131,120') +
  rateBand('Intermediate', '8\u201314', [33, 25], 'Owning the pipeline end to end: briefs, fact-check, publishing, the monthly report.', '1,280\u20132,240') +
  rateBand('Specialist', '15\u201325', [55, 40], 'AEO strategy, automation builds with maintenance retainers, and reporting a founder forwards to investors.', '2,400\u20134,000') +
  `</div></div><p class="mt-4 text-[0.8125rem] leading-relaxed text-muted">Setup projects (prompt library + one automation) commonly go for $300\u2013800 flat on top of hourly work.</p></section>` +
  `<section id="first-client" class="mt-16 scroll-mt-32">` +
  h2('Landing the first client') +
  `<ol class="mt-6 space-y-0">` +
  timelineItem('Week 1', 'Build the capstone for a real business', 'Do module 8 for an actual local business — unasked. The folder is your portfolio; the Loom is your pitch.') +
  timelineItem('Week 2', 'Send it to that business', 'Short message: here is a system I built around your content, here is the five-minute walkthrough, want the library?') +
  timelineItem('Weeks 2\u20133', 'Apply with the artefact, not adjectives', 'On job posts, skip &#x27;proficient in ChatGPT&#x27;. Link the folder and say &#x27;I caught three factual errors AI made about your industry; here is the log.&#x27;') +
  timelineItem('Ongoing', 'Let the report renew the contract', 'The monthly AI-visibility section is the retention engine — it shows movement nobody else is even measuring.', true) +
  `</ol></section></div></section>`;

const RED_FLAGS_FAQ =
  `<div class="mx-auto w-full px-5 sm:px-8 max-w-5xl py-14 sm:py-20"><section id="red-flags" class="scroll-mt-32">` +
  h2('Walk away when you see these') +
  `<p class="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">Not every one is a scam. Some are just engagements that end with your name on someone else\u2019s mess.</p><ul class="mt-7 space-y-3">` +
  redFlag('&#x27;We need 100 posts a month, no review step&#x27;', 'Volume without verification publishes hallucinations at scale. When one goes viral for being wrong, the VA is the first name mentioned.') +
  redFlag('&#x27;Use AI to write our reviews / testimonials&#x27;', 'Fake reviews are illegal in the client\u2019s market and yours. This client will also lie to you about payment.') +
  redFlag('&#x27;Guarantee ChatGPT recommends us&#x27;', 'Nobody controls model outputs per user. You can improve citation odds and measure honestly — anyone guaranteeing placement is lying.') +
  redFlag('Medical, legal or financial content with no expert reviewer', 'YMYL content needs a qualified human sign-off. AI-drafting it without one risks real harm and real liability.') +
  redFlag('&#x27;Pass it off as our in-house expert\u2019s writing&#x27; in expertise niches', 'Ghost-writing is normal; fabricating credentials and first-hand experience is not. E-E-A-T fraud eventually gets caught by readers or by Google.') +
  redFlag('No access to analytics or Search Console', 'You cannot measure AI visibility or anything else. A client who withholds data wants deliverables, not outcomes — priced accordingly or declined.') +
  redFlag('Pay per AI-generated word', 'The unit is wrong. Words are free now; verification, judgment and systems are what you sell. Per-word AI pricing races to the bottom by design.') +
  `</ul></section><section id="faq" class="mt-16 scroll-mt-32">` +
  h2('Questions people actually ask') +
  `<dl class="mt-7 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-tile">` +
  factRow('Do I need the SEO track first?', 'No, but they compound. AEO sits on top of SEO — if you plan to do both, the SEO track first is the better order.') +
  factRow('Will AI take this job?', 'AI took the typing. The judgment — briefs, verification, systems, honest reporting — got more valuable, not less. That is what this track teaches.') +
  factRow('Do I need paid tools?', 'No. Free tiers of ChatGPT, Claude and Perplexity plus Google\u2019s free stack cover every module including the capstone.') +
  factRow('Is AEO real or a fad acronym?', 'The acronym will churn; the work is durable. AI answers cite sources, someone decides how citable a business is, and clients pay that someone.') +
  factRow('Can I sell this to Filipino businesses too?', 'Yes — local businesses are being pitched AI constantly and trust a calm, honest operator. The capstone works for a Manila caf\u00e9 exactly as well as a US client.') +
  `</dl></section></div>`;

/* -------------------------- keep-learning section -------------------------- */

const videoCard = (v) =>
  `<div class="overflow-hidden rounded-2xl border border-line bg-card shadow-tile"><div class="aspect-video"><iframe class="h-full w-full" src="https://www.youtube-nocookie.com/embed/${v.id}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="px-4 py-3"><p class="font-display text-[0.9375rem] font-semibold text-ink">${esc(v.title)}</p><p class="mt-0.5 text-[0.8125rem] text-muted">${esc(v.by)} · YouTube</p></div></div>`;

const linkCard = (l) =>
  `<li class="h-full"><a href="${l.href}" target="_blank" rel="noopener noreferrer" class="block h-full rounded-xl border border-line bg-card p-4 shadow-tile transition-colors hover:border-ink"><div class="flex items-start justify-between gap-3"><p class="font-display text-[0.9375rem] font-semibold text-ink">${esc(l.title)}</p><span aria-hidden="true" class="text-[0.875rem] text-muted">\u2197</span></div><p class="mt-2 text-[0.875rem] leading-relaxed text-ink-2">${esc(l.note)}</p></a></li>`;

const KEEP_LEARNING =
  `<div class="mx-auto w-full px-5 sm:px-8 max-w-5xl py-14 sm:py-20"><section id="keep-learning" class="scroll-mt-32">` +
  `<h2 class="font-display text-[1.75rem] font-semibold text-ink">Keep learning<span class="dot" aria-hidden="true">.</span></h2>` +
  `<p class="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">Hand-picked and free. These open in a new tab \u2014 official docs, academies and channels that go deeper on what this track teaches. No affiliate links, no sign-up walls.</p>` +
  `<div class="mt-8"><p class="eyebrow text-muted">Watch first</p><div class="mt-3.5 grid gap-4 sm:grid-cols-2">` +
  videoCard({ id: 'TIypxl5_v5Y', title: 'Generative engine optimization, explained', by: 'Semrush' }) +
  `</div></div>` +
  `<ul class="mt-8 grid gap-3 sm:grid-cols-2">` +
  [
    { href: 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide', title: 'Google\u2019s AI features optimization guide', note: 'The official word on AI Overviews and AI Mode. Short, and it debunks most paid GEO advice.' },
    { href: 'https://ahrefs.com/blog/geo-generative-engine-optimization/', title: 'Ahrefs — GEO strategies and metrics', note: 'Data-backed numbers on AI Overviews you can quote in client reports.' },
    { href: 'https://platform.openai.com/docs/guides/prompt-engineering', title: 'OpenAI prompt engineering guide', note: 'First-party prompting techniques — the source behind most paid prompt courses.' },
    { href: 'https://docs.anthropic.com/', title: 'Anthropic docs — prompting with Claude', note: 'The other first-party guide. The overlap between the two is the real curriculum.' },
    { href: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', title: 'Google SEO Starter Guide', note: 'AEO sits on SEO. This is the baseline the retrieval step judges you against.' },
    { href: 'https://validator.schema.org/', title: 'Schema.org validator', note: 'Paste a URL, check the markup. Use it on every page you touch in module 5.' },
  ].map(linkCard).join('') +
  `</ul></section></div>`;

/* --------------------------------- course --------------------------------- */

const WRAP_5XL = [{ tag: 'div', class: 'mx-auto w-full px-5 sm:px-8 max-w-5xl py-14 sm:py-20' }];

const course = {
  slug: 'ai-marketing-and-aeo',
  title: 'AI Marketing & AEO.',
  premium: true,
  previewCount: 3,
  chunks: [
    { kind: 'html', value: HERO },
    { kind: 'slot', value: 'MODULES', wrappers: WRAP_5XL },
    { kind: 'html', value: KEEP_LEARNING },
    { kind: 'html', value: RATES },
    { kind: 'slot', value: 'QUIZ', wrappers: WRAP_5XL },
    { kind: 'html', value: '' },
    {
      kind: 'slot',
      value: 'GLOSSARY',
      wrappers: [
        { tag: 'section', class: 'border-y border-line bg-paper-2/70 py-14 sm:py-20' },
        { tag: 'div', class: 'mx-auto w-full px-5 sm:px-8 max-w-5xl' },
      ],
    },
    { kind: 'html', value: RED_FLAGS_FAQ },
  ],
  modules: M,
  quiz,
  glossary,
};

const out =
  `// Generated from the Verse deep-course source. Do not edit by hand.\n` +
  `import type { DeepCourse } from '../deep-course-types';\n\n` +
  `const course: DeepCourse = ${JSON.stringify(course)} as DeepCourse;\n\n` +
  `export default course;\n`;
fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(out.length / 1024).toFixed(0)} KB, ${M.length} modules, ${quiz.length} quiz, ${glossary.length} glossary)`);
