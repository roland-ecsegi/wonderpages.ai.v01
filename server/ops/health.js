/**
 * P8-T01 — sanitized application health, separate from provider status.
 * The app is "ok" when its own parts work (database, writable output, required runtime resources). A provider that is
 * absent, logged out or at its limit is reported in `providers` and never turns the app unhealthy: production waits,
 * the app stays usable. Nothing private is exposed (no paths, emails, tokens, keys, hostnames or raw error text).
 */
export const HEALTH_SCHEMA = 'wonderpages.health/1';
export const REQUIRED_RESOURCES = ['public/fonts/Andika-Regular.ttf', 'public/fonts/Andika-Bold.ttf', 'public/fonts/andika-metrics.json', 'public/app/layout-measure.js', 'node_modules/jspdf/dist/jspdf.umd.min.js'];
const STATES = new Set(['available', 'limited', 'needs_login', 'absent', 'unknown']);

/** provider facts → one coarse state; anything unexpected is "unknown", never free text */
export function providerState({ installed, auth, limited } = {}) {
  if (installed === false) return 'absent';
  if (auth === false) return 'needs_login';
  if (limited === true) return 'limited';
  if (installed && auth === true) return 'available';
  return 'unknown';
}

export function healthReport({ database = { ok: false }, output = { ok: false }, resources = {}, providers = {}, schemaVersion = null, version = null, at = new Date().toISOString() } = {}) {
  const missing = REQUIRED_RESOURCES.filter(r => resources[r] !== true);
  const components = { database: { ok: database.ok === true, kind: ['postgres', 'local'].includes(database.kind) ? database.kind : null }, output: { ok: output.ok === true }, resources: { ok: !missing.length, missing } };
  const status = !components.database.ok ? 'down' : !components.output.ok || !components.resources.ok ? 'degraded' : 'ok';
  const prov = Object.fromEntries(Object.entries(providers).map(([k, v]) => [k, STATES.has(v) ? v : 'unknown']));
  const usable = Object.values(prov).filter(v => v === 'available').length;
  return { schema: HEALTH_SCHEMA, at, app: { status, version, schemaVersion, components }, providers: { ...prov, summary: usable ? (usable === Object.keys(prov).length ? 'all_available' : 'partial') : 'none_available', note: 'Starea furnizorilor nu schimbă sănătatea aplicației: producția așteaptă, aplicația rămâne utilizabilă.' } };
}
