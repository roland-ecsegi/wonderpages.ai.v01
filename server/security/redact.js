/** P1-T04 — secrets never reach the log: tokens, keys, passwords in URLs and cookies are masked. */
const PATTERNS = [
  [/\b(sk-(?:ant-|proj-)?[A-Za-z0-9_-]{8,})/g, 'sk-***'],
  [/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1***'],
  [/(postgres(?:ql)?:\/\/[^:/\s]+:)[^@\s]+@/gi, '$1***@'],
  [/("?(?:access_token|refresh_token|id_token|client_secret|password|api[_-]?key|authorization)"?\s*[:=]\s*"?)[^"\s,}]+/gi, '$1***'],
  [/(wp_session=)[a-f0-9]{16,}/gi, '$1***']
];
export function redact(text) { let s = String(text); for (const [re, rep] of PATTERNS) s = s.replace(re, rep); return s; }
let installed = false;
export function installConsoleRedaction() {
  if (installed) return; installed = true;
  for (const level of ['log', 'warn', 'error', 'info']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => orig(...args.map(a => typeof a === 'string' ? redact(a) : a instanceof Error ? Object.assign(new Error(redact(a.message)), { stack: redact(a.stack || '') }) : a && typeof a === 'object' ? safeObj(a) : a));
  }
}
function safeObj(o) { try { return JSON.parse(redact(JSON.stringify(o))); } catch { return o; } }
