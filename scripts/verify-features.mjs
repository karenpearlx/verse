/**
 * Focused interaction check for the three features added on top of the redesign:
 * follow-up bell, cover-letter modes, auth forms.
 * Run against the dev server on 3050. Not part of `verify:ui`, which is a
 * whole-site layout sweep.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3050';
const fails = [];
const ok = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails.push(label);
};

const browser = await chromium.launch();

for (const [vname, width, height, touch] of [
  ['desktop', 1440, 900, false],
  ['mobile', 390, 844, true],
]) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  // Seed three applications, two of them long overdue.
  await page.goto(BASE + '/tracker', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const d = (n) => {
      const x = new Date();
      x.setDate(x.getDate() - n);
      return x.toISOString().slice(0, 10);
    };
    localStorage.setItem('ally-followup-days', '5');
    localStorage.setItem(
      'ally-applications',
      JSON.stringify([
        { id: 'a', role: 'Ops Lead', company: 'Acme', url: '', status: 'Applied', notes: '', appliedAt: d(12) },
        { id: 'b', role: 'SEO Manager', company: 'Peakline', url: '', status: 'Interviewing', notes: '', appliedAt: d(9) },
        { id: 'c', role: 'Fresh One', company: 'New Co', url: '', status: 'Applied', notes: '', appliedAt: d(0) },
      ]),
    );
  });
  await page.goto(BASE + '/jobs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bell = page.getByRole('button', { name: /Follow-ups/ });
  ok(`${vname}: bell present`, await bell.isVisible());
  ok(`${vname}: badge counts 2`, (await bell.getAttribute('aria-label'))?.includes('2 waiting'), await bell.getAttribute('aria-label'));

  await bell.click();
  const panel = page.getByRole('dialog', { name: /follow-up/i });
  ok(`${vname}: panel opens`, await panel.isVisible());
  ok(`${vname}: lists overdue role`, (await panel.textContent())?.includes('Ops Lead'));
  ok(`${vname}: shows age`, /silent 12 days/.test((await panel.textContent()) ?? ''));

  const box = await panel.boundingBox();
  ok(`${vname}: panel inside viewport`, box && box.x >= 0 && box.x + box.width <= width + 1, JSON.stringify(box));

  await page.keyboard.press('Escape');
  ok(`${vname}: escape closes`, !(await panel.isVisible().catch(() => false)));

  // Deep link
  await bell.click();
  await panel.getByRole('link', { name: /Open the tracker/i }).click();
  await page.waitForURL(/filter=followup/);
  await page.waitForTimeout(400);
  const chip = page.getByRole('button', { name: /Needs follow-up/ });
  ok(`${vname}: tracker opens on followup filter`, (await chip.getAttribute('data-on')) === 'true');

  // Same-tab sync: changing the threshold must move the badge with no reload.
  await page.selectOption('select:near(:text("Remind me after"))', '14').catch(async () => {
    await page.getByLabel(/Remind me after/).selectOption('14');
  });
  await page.waitForTimeout(400);
  const after = await page.getByRole('button', { name: /Follow-ups/ }).getAttribute('aria-label');
  ok(`${vname}: badge reacts same-tab`, after?.includes('nothing waiting'), after ?? '');

  // ---- cover letter ----
  await page.goto(BASE + '/cover-letter', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // hydration, otherwise React never sees the fill
  await page.fill('#listing', 'We are hiring an SEO Manager to own keyword research in Ahrefs and Semrush for our Shopify store. Contact Marco to apply.');
  await page.waitForTimeout(300);
  ok(`${vname}: niche auto-matched to SEO`, await page.getByRole('radio', { name: /SEO/ }).getAttribute('aria-checked') === 'true');
  await page.fill('#n', 'Maria Santos');
  await page.getByRole('button', { name: 'Write my letter' }).click();
  await page.waitForTimeout(500);
  const letter = await page.inputValue('#letter');
  ok(`${vname}: template letter generated`, letter.length > 200);
  ok(`${vname}: letter is niche-specific`, /keyword|rank|audit/i.test(letter));
  ok(`${vname}: greets detected contact`, letter.startsWith('Hi Marco,'), letter.slice(0, 20));
  ok(`${vname}: names detected tools`, /Ahrefs/.test(letter));

  // switch niche -> different letter
  await page.getByRole('radio', { name: /Executive assistant/ }).click();
  await page.getByRole('button', { name: 'Write my letter' }).click();
  await page.waitForTimeout(400);
  const ea = await page.inputValue('#letter');
  ok(`${vname}: niches produce different letters`, ea !== letter && /calendar|judgement/i.test(ea));

  // AI mode
  await page.getByRole('radio', { name: 'Use AI' }).click();
  await page.waitForTimeout(200);
  ok(`${vname}: api key input is a password field`, (await page.getAttribute('#apikey', 'type')) === 'password');
  await page.fill('#apikey', 'sk-test-1234567890abcdef');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(300);
  const stored = await page.evaluate(() => localStorage.getItem('ally-ai-settings-v1'));
  ok(`${vname}: key stored under versioned key`, !!stored && stored.includes('sk-test'));
  const bodyText = await page.locator('main, body').first().innerText();
  ok(`${vname}: key not shown in plaintext`, !bodyText.includes('sk-test-1234567890abcdef'));
  ok(`${vname}: masked key shown`, /sk-•+cdef/.test(bodyText) || /••••/.test(bodyText));

  // ---- auth ----
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  ok(`${vname}: login google button`, await page.getByRole('button', { name: /Continue with Google/ }).isVisible());
  ok(`${vname}: login has or divider`, (await page.locator('body').innerText()).toLowerCase().includes('\nor\n'));
  await page.fill('#email', 'nobody@example.com');
  await page.fill('#password', 'wrongpassword');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForSelector('p[role="alert"]', { timeout: 20000 });
  ok(`${vname}: bad login shows an error`, !!(await page.locator('p[role="alert"]').textContent()));

  await page.goto(BASE + '/signup', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.fill('#name', 'Test Person');
  await page.fill('#email', 'nobody@example.com');
  await page.fill('#password', 'short');
  await page.getByRole('button', { name: /Create free account/ }).click();
  await page.waitForTimeout(400);
  ok(`${vname}: signup validates password length`, /8 characters/.test((await page.locator('p[role="alert"]').textContent()) ?? ''));

  ok(`${vname}: no console errors`, errors.filter((e) => !/favicon|Failed to load resource/i.test(e)).length === 0, errors.join(' | ').slice(0, 300));
  await ctx.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join(', ')}` : '\nall good');
process.exit(fails.length ? 1 : 0);
