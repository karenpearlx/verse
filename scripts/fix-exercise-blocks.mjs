/**
 * Repairs the generated "Do this exercise" blocks (8 courses, 36 blocks,
 * 768 steps). The generator had two bugs and one bad habit:
 *
 *  - It jammed the lowercased module title mid-sentence: "Choose one real or
 *    simulated deliverability is the floor task." Now quoted properly.
 *  - It hardcoded "1. / 2. / 3." inside an <ol class="list-decimal">, so
 *    every step was numbered twice.
 *  - All three steps were the same sentence with a different tool pasted in.
 *    Each label (Open, Check, Compare, Record, Pause, Confirm) now has its
 *    own distinct instruction that still features the module's tool.
 *
 * Idempotent: the patterns it fixes no longer exist after one run.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/lib/deep-courses';

const STEP_TEXT = {
  Open: (tool) =>
    `Open the task and start from the client’s stated outcome, not the instruction list. Verify the inputs before touching anything, and write down the one assumption you are making — this is the step where ${tool} comes in.`,
  Check: (tool) =>
    `Check your own output before anyone else sees it: could another VA follow your trace without asking you a single question? Use ${tool} to verify instead of trusting memory.`,
  Compare: (tool) =>
    `Compare what you produced against the worked example earlier in this module, and name one difference out loud. ${tool} will usually show you why they differ.`,
  Record: (tool) =>
    `Record what you decided and why, right next to the output — the source, the rule you applied, and what would change your mind. ${tool} is a fine place to keep it.`,
  Pause: (tool) =>
    `Pause before sending and re-read it as the client. If anything needs a judgement call you are not authorised to make, flag it — with the evidence from ${tool} — instead of improvising.`,
  Confirm: (tool) =>
    `Confirm it the professional way: one short message saying what was done, what you assumed, and the single question you need answered. Attach what ${tool} shows.`,
};

const LI_RE =
  /<li><strong>\d+\. ([^:<]+):<\/strong> Work through a realistic [\s\S]+? request\. Start with the client’s stated outcome, then verify the inputs, note the assumption you are making, and leave a trace another person could follow\. At this step, use ([\s\S]+?) to decide whether to proceed, ask one focused question, or hand the item to the named owner\. Do not improve the brief silently; make the trade-off visible\.<\/li>/g;

const INTRO_RE = /Choose one real or simulated ([\s\S]{3,80}?) task\./g;

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.ts') && !f.startsWith('index') && f !== 'module-counts.ts');

let steps = 0;
let intros = 0;

for (const f of files) {
  const file = path.join(DIR, f);
  let src = fs.readFileSync(file, 'utf8');

  src = src.replace(LI_RE, (whole, label, tool) => {
    const build = STEP_TEXT[label.trim()];
    if (!build) return whole; // unknown label: leave it rather than guess
    steps++;
    return `<li><strong>${label.trim()}:</strong> ${build(tool.trim())}</li>`;
  });

  src = src.replace(INTRO_RE, (_whole, topic) => {
    intros++;
    return `Choose one real or simulated “${topic.trim()}” task.`;
  });

  fs.writeFileSync(file, src);
}

console.log(`Rewrote ${steps} exercise steps and quoted ${intros} intro topics.`);
