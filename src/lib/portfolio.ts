/**
 * Public portfolios — vrsfd.com/p/<username>.
 *
 * Same discipline as profile.ts: everything in `config` and `theme` was typed
 * by a user and is rendered onto a public page, so parsing never trusts a
 * shape, clamps every string, and allow-lists every enum. A corrupt row
 * degrades to a plain portfolio rather than a crash (or an XSS).
 */

import { cleanBlock, cleanLine, cleanUrl } from '@/lib/cover-letter-rules';

/* ------------------------------------------------------------------ */
/* username                                                            */
/* ------------------------------------------------------------------ */

export const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/** Route names and words that would be confusing or abusive as a /p/ handle. */
export const RESERVED_USERNAMES = new Set([
  'admin', 'verse', 'vrsfd', 'api', 'app', 'www', 'jobs', 'courses', 'tools',
  'pricing', 'help', 'about', 'login', 'signup', 'settings', 'dashboard',
  'profile', 'portfolio', 'support', 'official', 'team', 'staff', 'mod',
]);

export function cleanUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const u = value.trim().toLowerCase();
  if (!USERNAME_RE.test(u) || RESERVED_USERNAMES.has(u)) return null;
  return u;
}

/* ------------------------------------------------------------------ */
/* sections                                                            */
/* ------------------------------------------------------------------ */

export const SECTION_META = [
  { id: 'about', label: 'About', note: 'Your bio, straight from the profile.' },
  { id: 'skills', label: 'Skills & niches', note: 'The niches picked on your profile.' },
  { id: 'courses', label: 'Courses completed', note: 'Finished Verse courses with quiz scores as proof.' },
  { id: 'samples', label: 'Work samples', note: 'Up to six pieces of real work.' },
  { id: 'rates', label: 'Rates', note: 'Hourly and monthly, from your profile.' },
  { id: 'links', label: 'Links', note: 'Portfolio links from your profile.' },
  { id: 'contact', label: 'Contact', note: 'Your contact email as a button.' },
] as const;

export type SectionId = (typeof SECTION_META)[number]['id'];
export const SECTION_IDS = SECTION_META.map((s) => s.id);

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && (SECTION_IDS as string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/* config: samples + course snapshot + toggles                         */
/* ------------------------------------------------------------------ */

export type PortfolioSample = {
  title: string;
  blurb: string;
  /** Link to the live work. Optional. */
  url: string;
  /** Image in our own storage (or any https image). Optional. */
  imageUrl: string;
};

export type CourseProof = {
  slug: string;
  title: string;
  /** Modules finished / total, from the learner's own browser at sync time. */
  done: number;
  total: number;
  /** Summed quiz score across modules, as proof of understanding. */
  quizScore: number;
  quizTotal: number;
};

export type PortfolioConfig = {
  sections: Record<SectionId, boolean>;
  samples: PortfolioSample[];
  courses: CourseProof[];
};

export const PORTFOLIO_LIMITS = {
  maxSamples: 6,
  maxSampleTitle: 80,
  maxSampleBlurb: 240,
  maxCourses: 12,
  maxCourseTitle: 90,
  maxVibe: 240,
} as const;

export const DEFAULT_SECTIONS: Record<SectionId, boolean> = {
  about: true,
  skills: true,
  courses: true,
  samples: true,
  rates: true,
  links: true,
  contact: true,
};

function httpsOnly(value: unknown): string {
  const url = cleanUrl(typeof value === 'string' ? value : '');
  return url && url.startsWith('https://') ? url : '';
}

function parseSamples(value: unknown): PortfolioSample[] {
  if (!Array.isArray(value)) return [];
  const out: PortfolioSample[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const raw = entry as Record<string, unknown>;
    const sample: PortfolioSample = {
      title: cleanLine(typeof raw.title === 'string' ? raw.title : '', PORTFOLIO_LIMITS.maxSampleTitle),
      blurb: cleanBlock(typeof raw.blurb === 'string' ? raw.blurb : '', PORTFOLIO_LIMITS.maxSampleBlurb),
      url: httpsOnly(raw.url),
      imageUrl: httpsOnly(raw.imageUrl),
    };
    if (!sample.title && !sample.imageUrl) continue; // nothing to show
    out.push(sample);
    if (out.length >= PORTFOLIO_LIMITS.maxSamples) break;
  }
  return out;
}

function clampInt(value: unknown, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, Math.round(n));
}

function parseCourses(value: unknown): CourseProof[] {
  if (!Array.isArray(value)) return [];
  const out: CourseProof[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const raw = entry as Record<string, unknown>;
    const slug = typeof raw.slug === 'string' ? raw.slug.slice(0, 80) : '';
    const title = cleanLine(typeof raw.title === 'string' ? raw.title : '', PORTFOLIO_LIMITS.maxCourseTitle);
    if (!slug || !title || seen.has(slug)) continue;
    seen.add(slug);
    const total = clampInt(raw.total, 50);
    const quizTotal = clampInt(raw.quizTotal, 200);
    out.push({
      slug,
      title,
      done: Math.min(clampInt(raw.done, 50), total),
      total,
      quizScore: Math.min(clampInt(raw.quizScore, 200), quizTotal),
      quizTotal,
    });
    if (out.length >= PORTFOLIO_LIMITS.maxCourses) break;
  }
  return out;
}

export function parseConfig(value: unknown): PortfolioConfig {
  const raw = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
  const rawSections = (raw.sections && typeof raw.sections === 'object' ? raw.sections : {}) as Record<string, unknown>;
  const sections = { ...DEFAULT_SECTIONS };
  for (const id of SECTION_IDS) {
    if (typeof rawSections[id] === 'boolean') sections[id] = rawSections[id] as boolean;
  }
  return { sections, samples: parseSamples(raw.samples), courses: parseCourses(raw.courses) };
}

/* ------------------------------------------------------------------ */
/* theme                                                               */
/* ------------------------------------------------------------------ */

export type ThemeVars = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
};

export const THEME_PRESETS = [
  {
    id: 'paper',
    label: 'Paper',
    note: 'Warm, light, the Verse look.',
    vars: { bg: '#f7f6f4', surface: '#ffffff', ink: '#21201e', muted: '#67645f', line: '#e5e2dc', accent: '#097769', accentInk: '#ffffff' },
  },
  {
    id: 'ink',
    label: 'Ink',
    note: 'Dark, editorial, serious.',
    vars: { bg: '#15140f', surface: '#201e18', ink: '#f2efe8', muted: '#a8a496', line: '#37342b', accent: '#e8c15a', accentInk: '#15140f' },
  },
  {
    id: 'studio',
    label: 'Studio',
    note: 'Cream and clay, portfolio-gallery feel.',
    vars: { bg: '#f5efe6', surface: '#fdfaf4', ink: '#2b2017', muted: '#7a6a58', line: '#e6dcc9', accent: '#a94f1b', accentInk: '#ffffff' },
  },
  {
    id: 'mist',
    label: 'Mist',
    note: 'Cool grey-blue, calm and corporate.',
    vars: { bg: '#f0f3f5', surface: '#ffffff', ink: '#1d242b', muted: '#5c6b77', line: '#dde4e9', accent: '#2c5d8f', accentInk: '#ffffff' },
  },
  {
    id: 'bold',
    label: 'Bold',
    note: 'High contrast, big accent energy.',
    vars: { bg: '#fffdf5', surface: '#ffffff', ink: '#171512', muted: '#55524b', line: '#171512', accent: '#e0362c', accentInk: '#ffffff' },
  },
  {
    id: 'moss',
    label: 'Moss',
    note: 'Deep green, natural and grounded.',
    vars: { bg: '#f2f5ef', surface: '#ffffff', ink: '#1d251c', muted: '#5d6b58', line: '#dfe6d9', accent: '#2f7a45', accentInk: '#ffffff' },
  },
] as const;

export type ThemePresetId = (typeof THEME_PRESETS)[number]['id'];

export const FONT_PAIRS = [
  { id: 'classic', label: 'Classic', note: 'Fraunces headings, modern sans body.' },
  { id: 'editorial', label: 'Editorial', note: 'Serif all the way through, like a magazine.' },
  { id: 'modern', label: 'Modern', note: 'Geometric sans headings, clean and techy.' },
] as const;

export type FontPairId = (typeof FONT_PAIRS)[number]['id'];

/** Custom accent swatches offered in the editor (any of these pass the parser). */
export const ACCENT_SWATCHES = [
  '#097769', '#2c5d8f', '#a94f1b', '#8a3ab9', '#c2275e', '#2f7a45', '#b88a00', '#e0362c', '#4453b8', '#1f8a8a',
];

export type PortfolioTheme = {
  preset: ThemePresetId;
  /** Overrides the preset accent when set. */
  accent: string | null;
  font: FontPairId;
  order: SectionId[];
};

export const DEFAULT_THEME: PortfolioTheme = {
  preset: 'paper',
  accent: null,
  font: 'classic',
  order: [...SECTION_IDS],
};

const HEX_RE = /^#[0-9a-f]{6}$/;

export function parseTheme(value: unknown): PortfolioTheme {
  const raw = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
  const preset = THEME_PRESETS.some((p) => p.id === raw.preset) ? (raw.preset as ThemePresetId) : 'paper';
  const accentRaw = typeof raw.accent === 'string' ? raw.accent.toLowerCase() : null;
  const font = FONT_PAIRS.some((f) => f.id === raw.font) ? (raw.font as FontPairId) : 'classic';
  const order: SectionId[] = [];
  if (Array.isArray(raw.order)) {
    for (const id of raw.order) if (isSectionId(id) && !order.includes(id)) order.push(id);
  }
  for (const id of SECTION_IDS) if (!order.includes(id)) order.push(id);
  return { preset, accent: accentRaw && HEX_RE.test(accentRaw) ? accentRaw : null, font, order };
}

export function isDefaultTheme(theme: PortfolioTheme) {
  return (
    theme.preset === DEFAULT_THEME.preset &&
    theme.accent === null &&
    theme.font === DEFAULT_THEME.font &&
    JSON.stringify(theme.order) === JSON.stringify(DEFAULT_THEME.order)
  );
}

export function themeVars(theme: PortfolioTheme): ThemeVars {
  const preset = THEME_PRESETS.find((p) => p.id === theme.preset) ?? THEME_PRESETS[0];
  return { ...preset.vars, ...(theme.accent ? { accent: theme.accent } : null) };
}

/* ------------------------------------------------------------------ */
/* "vibe" styling                                                      */
/* ------------------------------------------------------------------ */

/**
 * Turns a plain-words description ("dark, editorial, big serif headers") into
 * a theme — deterministically, with no model call and nothing executable, so
 * there is no way to inject code through it. Every word maps to the same
 * allow-listed preset, accent or font pair the manual pickers use.
 */
export function vibeToTheme(prompt: string, base: PortfolioTheme = DEFAULT_THEME): { theme: PortfolioTheme; heard: string[] } {
  const text = prompt.toLowerCase().slice(0, PORTFOLIO_LIMITS.maxVibe);
  const heard: string[] = [];
  const theme: PortfolioTheme = { ...base, order: [...base.order] };

  const PRESET_WORDS: [RegExp, ThemePresetId, string][] = [
    [/\b(dark|black|night|moody|noir)\b/, 'ink', 'dark'],
    [/\b(editorial|magazine|gallery|studio|cream|warm|vintage|classy|elegant)\b/, 'studio', 'editorial warmth'],
    [/\b(corporate|professional|calm|cool|blue|trust)\b/, 'mist', 'calm and professional'],
    [/\b(bold|loud|strong|punchy|brutalist|high.?contrast)\b/, 'bold', 'bold'],
    [/\b(green|nature|natural|earth|moss|forest|organic)\b/, 'moss', 'natural green'],
    [/\b(light|clean|minimal|simple|white|airy)\b/, 'paper', 'light and minimal'],
  ];
  for (const [re, preset, label] of PRESET_WORDS) {
    if (re.test(text)) {
      theme.preset = preset;
      heard.push(label);
      break;
    }
  }

  const ACCENT_WORDS: [RegExp, string, string][] = [
    [/\b(teal|emerald)\b/, '#097769', 'teal accent'],
    [/\b(blue|navy|ocean)\b/, '#2c5d8f', 'blue accent'],
    [/\b(purple|violet|lavender)\b/, '#8a3ab9', 'purple accent'],
    [/\b(pink|rose|magenta)\b/, '#c2275e', 'pink accent'],
    [/\b(red|crimson)\b/, '#e0362c', 'red accent'],
    [/\b(orange|clay|terracotta|rust)\b/, '#a94f1b', 'clay accent'],
    [/\b(gold|yellow|mustard|amber)\b/, '#b88a00', 'gold accent'],
    [/\b(indigo)\b/, '#4453b8', 'indigo accent'],
  ];
  for (const [re, hex, label] of ACCENT_WORDS) {
    if (re.test(text)) {
      theme.accent = hex;
      heard.push(label);
      break;
    }
  }

  if (/\b(serif|editorial|magazine|book|literary)\b/.test(text)) {
    theme.font = 'editorial';
    heard.push('serif type');
  } else if (/\b(modern|techy|geometric|startup|futur|sleek)\b/.test(text)) {
    theme.font = 'modern';
    heard.push('modern type');
  } else if (/\b(classic|traditional)\b/.test(text)) {
    theme.font = 'classic';
    heard.push('classic type');
  }

  // "work first" style requests reorder samples to the top.
  if (/\b(work first|samples first|portfolio first|show.{0,12}work)\b/.test(text)) {
    theme.order = ['samples', ...theme.order.filter((s) => s !== 'samples')];
    heard.push('work samples first');
  }

  return { theme, heard };
}
