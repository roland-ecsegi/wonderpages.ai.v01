/**
 * P1-T04 — security baseline (OUTPUT-26): transport policy for LAN, Origin check, posture report.
 *
 * Transport modes:
 *   local-only          LAN off; the app listens on loopback only.
 *   lan-https           LAN on with the operator's TLS certificate: approvals/secrets travel encrypted.
 *   lan-restricted      LAN on WITHOUT TLS (default): other devices may follow production and comment,
 *                       but cannot approve, decide, edit, deliver or change settings.
 *   lan-plain-accepted  LAN on without TLS, explicitly accepted by the operator on the laptop (documented risk);
 *                       restores the v04 behaviour (remote approvals over plain HTTP).
 */
export function transportMode({ lanEnabled, tlsEnabled, acceptPlainLan }) {
  if (!lanEnabled) return 'local-only';
  if (tlsEnabled) return 'lan-https';
  return acceptPlainLan ? 'lan-plain-accepted' : 'lan-restricted';
}
/* remote mutations that need a verified transport (approvals, decisions, edits, delivery, exports) */
const REMOTE_SENSITIVE = [
  /^\/api\/projects\/[^/]+\/(items|items\/apply|gate\/complete|decide|task|deliver|package|exports|gdrive|blueprint-upgrade|options|archive)$/,
  /^\/api\/projects\/[^/]+\/artifacts\/[^/]+(\/restore|\/media)?$/,
  /^\/api\/projects\/[^/]+\/(start|run|switch|pause|stop)$/
];
export function remoteMutationBlocked({ mode, local, method, pathname }) {
  if (local || method === 'GET' || mode !== 'lan-restricted') return false;
  return REMOTE_SENSITIVE.some(re => re.test(pathname));
}
/** Same-origin check for state-changing requests that carry an Origin header (browsers always send it on cross-site POST). */
export function originAllowed(req) {
  const origin = req.headers.origin; if (!origin || req.method === 'GET') return true;
  try { const o = new URL(origin); return o.host.toLowerCase() === String(req.headers.host || '').toLowerCase(); } catch { return false; }
}
export function postureReport({ mode, bindHost, storage, legacyDbCredentials, tlsEnabled, lanStatus, secretKeyPresent }) {
  const checks = [
    { id: 'BIND', ok: mode !== 'local-only' || bindHost === '127.0.0.1', detail: `ascultă pe ${bindHost}` },
    { id: 'TRANSPORT', ok: mode === 'local-only' || mode === 'lan-https', warn: mode === 'lan-plain-accepted', detail: { 'local-only': 'doar pe acest calculator', 'lan-https': 'LAN cu HTTPS', 'lan-restricted': 'LAN fără HTTPS: dispozitivele din rețea pot urmări și comenta, nu pot aproba', 'lan-plain-accepted': 'LAN fără HTTPS acceptat explicit de operator (risc documentat)' }[mode] },
    { id: 'DB_CREDENTIALS', ok: !legacyDbCredentials, warn: !!legacyDbCredentials, detail: legacyDbCredentials ? 'bază locală conectată cu credențiale legacy cunoscute (doar loopback); migrează la o parolă generată, fără rotație automată' : 'credențiale configurate' },
    { id: 'STORAGE', ok: true, detail: storage },
    { id: 'SECRETS_AT_REST', ok: secretKeyPresent !== false, detail: 'tokenurile Canva/Drive sunt criptate cu cheia locală din folderul de date' },
    { id: 'PUBLIC_EXPOSURE', ok: true, detail: 'nicio expunere publică; SaaS public interzis înainte de P9-B' }
  ];
  return { mode, tlsEnabled: !!tlsEnabled, lan: lanStatus, checks, ok: checks.every(c => c.ok || c.warn), at: Date.now() };
}
