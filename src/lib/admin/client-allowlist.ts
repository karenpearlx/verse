/**
 * Client-side hint for showing Admin in menus. The real gate is still
 * server-side (`ADMIN_EMAILS` + `admin_users`) — this only decides whether
 * the link is worth rendering for a signed-in user.
 *
 * Stored as SHA-256 hashes so the bundle never ships a readable address.
 * Regenerate with:
 *   node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('email@example.com')).then(b => console.log(Buffer.from(b).toString('hex')))"
 */
const CLIENT_ADMIN_EMAIL_HASHES = new Set([
  // kp***99@…
  '4223b2d5219223803f3eb1ba0469dfe6c603ef91b452e8edd71cd2430b503403',
  // ka***xz@…
  'ec11f575ed162022bfd900dcc29031927f38b3480685dd3151aea9c906024bc1',
]);

export async function isClientAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email || typeof crypto === 'undefined' || !crypto.subtle) return false;
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return CLIENT_ADMIN_EMAIL_HASHES.has(hex);
}
