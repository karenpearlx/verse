// Registry of the deep course tracks — bodies load per slug so one course page
// does not pull every multi-hundred-KB module into the first JS chunk.
import type { DeepCourse } from '../deep-course-types';

/** Free tracks anyone can open fully. Everything else is Pro. */
const FREE_DEEP_SLUGS = new Set([
  'complete-va-starter',
  'applications-that-get-replies',
  'pricing-and-negotiation',
]);

export const DEEP_COURSE_FLAGS: Record<string, { premium: boolean; previewCount: number }> = {
  'ai-marketing-and-aeo': { premium: true, previewCount: 3 },
  'applications-that-get-replies': { premium: false, previewCount: 3 },
  'becoming-an-ops-lead': { premium: true, previewCount: 3 },
  'bookkeeping-basics': { premium: true, previewCount: 3 },
  'complete-va-starter': { premium: false, previewCount: 3 },
  'customer-support': { premium: true, previewCount: 3 },
  'data-and-research': { premium: true, previewCount: 3 },
  'ecommerce-va': { premium: true, previewCount: 3 },
  'email-marketing': { premium: true, previewCount: 3 },
  'executive-assistant': { premium: true, previewCount: 3 },
  'general-va': { premium: true, previewCount: 3 },
  'graphic-design': { premium: true, previewCount: 3 },
  'pricing-and-negotiation': { premium: false, previewCount: 3 },
  'project-management': { premium: true, previewCount: 3 },
  'real-estate-va': { premium: true, previewCount: 3 },
  'sales-development': { premium: true, previewCount: 3 },
  'seo-specialist': { premium: true, previewCount: 3 },
  'social-media-manager': { premium: true, previewCount: 3 },
  'video-editing': { premium: true, previewCount: 3 },
  'web-and-no-code': { premium: true, previewCount: 3 },
  'writing-for-clients': { premium: true, previewCount: 3 },
};

const LOADERS: Record<string, () => Promise<{ default: DeepCourse }>> = {
  'ai-marketing-and-aeo': () => import('./ai-marketing-and-aeo'),
  'applications-that-get-replies': () => import('./applications-that-get-replies'),
  'becoming-an-ops-lead': () => import('./becoming-an-ops-lead'),
  'bookkeeping-basics': () => import('./bookkeeping-basics'),
  'complete-va-starter': () => import('./complete-va-starter'),
  'customer-support': () => import('./customer-support'),
  'data-and-research': () => import('./data-and-research'),
  'ecommerce-va': () => import('./ecommerce-va'),
  'email-marketing': () => import('./email-marketing'),
  'executive-assistant': () => import('./executive-assistant'),
  'general-va': () => import('./general-va'),
  'graphic-design': () => import('./graphic-design'),
  'pricing-and-negotiation': () => import('./pricing-and-negotiation'),
  'project-management': () => import('./project-management'),
  'real-estate-va': () => import('./real-estate-va'),
  'sales-development': () => import('./sales-development'),
  'seo-specialist': () => import('./seo-specialist'),
  'social-media-manager': () => import('./social-media-manager'),
  'video-editing': () => import('./video-editing'),
  'web-and-no-code': () => import('./web-and-no-code'),
  'writing-for-clients': () => import('./writing-for-clients'),
};

export const DEEP_COURSE_SLUGS = Object.keys(LOADERS);

export function deepCourseFlags(slug: string) {
  return DEEP_COURSE_FLAGS[slug] ?? {
    premium: !FREE_DEEP_SLUGS.has(slug),
    previewCount: 3,
  };
}

export function premiumDeepCourseCount() {
  return Object.values(DEEP_COURSE_FLAGS).filter((f) => f.premium).length;
}

export async function getDeepCourse(slug: string): Promise<DeepCourse | undefined> {
  const load = LOADERS[slug];
  if (!load) return undefined;
  const mod = await load();
  return mod.default;
}
