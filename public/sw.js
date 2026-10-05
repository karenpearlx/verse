/* Ally service worker.
 *
 * Caching policy, and why:
 *
 *  - Navigations (HTML): NETWORK FIRST, cache as fallback.
 *    Cache-first on HTML is the classic PWA footgun — you ship a change and
 *    users keep seeing last week's page until they clear storage. Fresh when
 *    online, last-known-good when not.
 *
 *  - /_next/static/**: CACHE FIRST, immutable.
 *    These filenames are content-hashed by the build, so a given URL can never
 *    change meaning. Safe to keep forever; new builds simply request new URLs.
 *
 *  - Images/fonts: STALE WHILE REVALIDATE. Instant, quietly refreshed.
 *
 *  - Everything else (API, auth, admin): NETWORK ONLY, never cached.
 *    /auth/callback exchanges a one-time OAuth code. A duplicate fetch
 *    (classic with navigation preload + early-return) burns the code and
 *    surfaces "invalid flow state". These paths must hit the network once.
 *
 * Bump SW_VERSION to roll every cache at once.
 */

const SW_VERSION = 'v3';
const SHELL = `ally-shell-${SW_VERSION}`;
const STATIC = `ally-static-${SW_VERSION}`;
const ASSETS = `ally-assets-${SW_VERSION}`;
const OFFLINE_URL = '/offline';

/** Paths that must never be cached and must not be double-fetched. */
const NETWORK_ONLY = [/^\/api\//, /^\/auth\//, /^\/admin(\/|$)/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Only the offline page is precached. Precaching a route list is a
      // maintenance trap: it goes stale the moment someone adds a page.
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, STATIC, ASSETS]);
      const names = await caches.keys();
      await Promise.all(names.map((n) => (keep.has(n) ? null : caches.delete(n))));

      // Navigation preload + an early-return fetch handler double-hits
      // /auth/callback and burns the one-time OAuth code. Keep it off.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.disable();
      }
      await self.clients.claim();
    })()
  );
});

// Let the page tell a waiting worker to take over immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ----------------------------- push notifications ------------------------ */

// Payloads come from our own senders (the subscribe route's welcome push and
// the daily job digest), always JSON: { title, body, url, tag }.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* an unparseable push still shows something rather than nothing */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Verse', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/maskable-192.png',
      tag: data.tag || 'verse',
      data: { url: data.url || '/jobs' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

function cacheable(response) {
  return response && response.status === 200 && response.type === 'basic';
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(request);
    if (cacheable(fresh)) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (cacheable(fresh)) cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (cacheable(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is safe to replay from cache.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Leave cross-origin alone; we can't reason about those responses.
  if (url.origin !== self.location.origin) return;

  // Range requests (media seeking) break if answered with a full cached body.
  if (request.headers.has('range')) return;

  // Auth/API/admin: one network fetch, no cache. respondWith so the browser
  // does not also issue a second navigation request beside a preload.
  if (NETWORK_ONLY.some((re) => re.test(url.pathname))) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (['image', 'font', 'style'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
  }
});
