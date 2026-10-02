/**
 * Regulatorul de consum pentru abonamentul Pro.
 * - buget pe o fereastră de 5 ore (setabil în Setări): înainte de limita reală, generarea așteaptă singură;
 * - un singur proiect odată (setabil); la limita reală, pauză până la ora de resetare anunțată de Claude.
 */
let storage; let calls = []; let gptTextCalls = []; let gptImageCalls = []; let saveT = null; let settings = {};
const HOUR = 3600e3;
export const govConfig = {
  maxParallel: Math.max(1, Number(process.env.MAX_PARALLEL_PROJECTS || 1)),
  cooldownMin: Math.max(5, Number(process.env.LIMIT_COOLDOWN_MIN || 60)),
  budget5h: Math.max(10, Number(process.env.PRO_CALLS_PER_5H || 90)),
  budget7d: Math.max(0, Number(process.env.PRO_CALLS_PER_WEEK || 0))     // v19 (plan 2.5): 0 = not known yet; learned from the first weekly limit
};
export async function initGovernor(s) {
  storage = s; const u = (await storage.readJSON('usage.json', {})) || {};
  calls = (u.calls || []).filter(t => Math.abs(t) > Date.now() - 8 * 24 * HOUR);
  gptTextCalls = (u.gptTextCalls || []).filter(t => t > Date.now() - 8 * 24 * HOUR);
  gptImageCalls = (u.gptImageCalls || []).filter(t => t > Date.now() - 8 * 24 * HOUR);
  settings = u.settings || {}; if (settings.budget5h) govConfig.budget5h = settings.budget5h; if (settings.budget7d != null) govConfig.budget7d = settings.budget7d;
  if (settings.canva) applyCanvaSettings(settings.canva);
}
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => storage.writeJSON('usage.json', { calls: calls.slice(-20000), gptTextCalls: gptTextCalls.slice(-20000), gptImageCalls: gptImageCalls.slice(-20000), settings }).catch(e => console.error('[usage persistence]', e.message)), 2000); };
export function recordCall(kind = 'text') {
  if (kind === 'text_gpt') gptTextCalls.push(Date.now());
  else if (kind === 'image_gpt') gptImageCalls.push(Date.now());
  else calls.push(kind === 'image' ? -Date.now() : Date.now());
  persist();
}
export async function setBudget(n) { govConfig.budget5h = Math.max(10, Math.min(1000, Number(n) || 90)); settings.budget5h = govConfig.budget5h; persist(); return govConfig.budget5h; }
export async function setWeeklyBudget(n) { const v = Math.max(0, Math.min(20000, Math.round(Number(n) || 0))); govConfig.budget7d = v; settings.budget7d = v; settings.budget7dManual = v > 0; persist(); return v; }
const textIn5h = () => { const t = Date.now() - 5 * HOUR; return calls.filter(x => x > t); };
/* waits (without consuming anything) until the 5-hour budget has room again; callers see it as a pause */
export async function beforeCall(signal) {
  const used = textIn5h();
  if (used.length >= govConfig.budget5h) {
    const freeAt = used.sort((a, b) => a - b)[used.length - govConfig.budget5h] + 5 * HOUR;
    throw { code: 'rate_limited', resetAt: freeAt, budget: true, message: `Bugetul de ${govConfig.budget5h} apeluri pe 5 ore a fost atins; generarea se reia singură.` };
  }
  if (govConfig.budget7d > 0) {                                        // v19 (plan 2.5): the weekly window of the Pro plan
    const week = calls.filter(x => x > Date.now() - 7 * 24 * HOUR).sort((a, b) => a - b);
    if (week.length >= govConfig.budget7d) throw { code: 'rate_limited', resetAt: week[week.length - govConfig.budget7d] + 7 * 24 * HOUR, budget: true, weekly: true, message: `Bugetul săptămânal de ${govConfig.budget7d} apeluri a fost atins; proiectul se reia singur când se eliberează.` };
  }
}
/* a real limit from Claude whose reset is more than 5 hours away is the weekly one: remember how many calls fitted (plan 2.5) */
export function afterCall(e) {
  if (e?.code !== 'rate_limited' || e.budget || !e.resetAt || e.resetAt - Date.now() < 5.25 * HOUR) return;
  const week = calls.filter(x => x > Date.now() - 7 * 24 * HOUR).length;
  settings.weeklyObserved = { calls: week, at: Date.now(), resetAt: e.resetAt };
  if (!settings.budget7dManual && week >= 20) { govConfig.budget7d = Math.floor(week * 0.95); settings.budget7d = govConfig.budget7d; }
  persist();
}
export const weeklyInfo = () => ({ budget7d: govConfig.budget7d, manual: !!settings.budget7dManual, observed: settings.weeklyObserved || null });
export function usage() {
  const now = Date.now(); const t = calls.filter(x => x > 0), img = calls.filter(x => x < 0).map(x => -x);
  const used = t.filter(x => x > now - 5 * HOUR);
  return {
    text5h: used.length, text24h: t.filter(x => x > now - 24 * HOUR).length, text7d: t.filter(x => x > now - 7 * 24 * HOUR).length,
    images24h: img.filter(x => x > now - 24 * HOUR).length, gptText5h: gptTextCalls.filter(x => x > now - 5 * HOUR).length,
    gptText24h: gptTextCalls.filter(x => x > now - 24 * HOUR).length, gptText7d: gptTextCalls.filter(x => x > now - 7 * 24 * HOUR).length,
    gptImages24h: gptImageCalls.filter(x => x > now - 24 * HOUR).length,
    maxParallel: govConfig.maxParallel, cooldownMin: govConfig.cooldownMin, budget5h: govConfig.budget5h,
    budget7d: govConfig.budget7d, budget7dManual: !!settings.budget7dManual, weeklyObserved: settings.weeklyObserved || null
  };
}

/* ---------------- Canva (imagini) ----------------
 * Canva Pro: alocare lunară de AI (se resetează la data de facturare). După ce o consumi, Canva nu blochează,
 * ci impune pauze scurte între generări. Aplicația:
 *  - numără generările din luna curentă de facturare;
 *  - lasă o distanță minimă între generări (una câte una);
 *  - după alocare, trece singură în „ritm lent” (o generare la câteva minute);
 *  - când Canva cere pauză, așteaptă și reia aceeași imagine, fără să oprească proiectul.
 */
export const canvaCfg = {
  allowance: Math.max(1, Number(process.env.CANVA_MONTHLY_ALLOWANCE || 200)),
  resetDay: Math.min(31, Math.max(1, Number(process.env.CANVA_RESET_DAY || 1))),
  spacingSec: Math.max(0, Number(process.env.CANVA_SPACING_SEC || 12)),
  pauseMin: Math.max(1, Number(process.env.CANVA_PAUSE_MIN || 4)),
  maxWaitMin: Math.max(5, Number(process.env.CANVA_MAX_WAIT_MIN || 45))
};
let lastImage = 0; let pauseUntil = 0;
export function applyCanvaSettings(s = {}) { for (const k of ['allowance', 'resetDay', 'spacingSec', 'pauseMin']) if (s[k] != null && Number.isFinite(Number(s[k]))) canvaCfg[k] = Number(s[k]); }
export async function setCanvaSettings(patch) { applyCanvaSettings(patch); settings.canva = { allowance: canvaCfg.allowance, resetDay: canvaCfg.resetDay, spacingSec: canvaCfg.spacingSec, pauseMin: canvaCfg.pauseMin }; persist(); return canvaUsage(); }
function cycleStart(t = Date.now()) {
  const d = new Date(t); const day = (y, m) => Math.min(canvaCfg.resetDay, new Date(y, m + 1, 0).getDate());
  let s = new Date(d.getFullYear(), d.getMonth(), day(d.getFullYear(), d.getMonth()));
  if (s.getTime() > t) { const pm = d.getMonth() - 1; s = new Date(d.getFullYear(), pm, day(d.getFullYear(), pm)); }
  return s.getTime();
}
export function canvaUsage() {
  const start = cycleStart(); const used = calls.filter(x => x < 0 && -x >= start).length;
  const next = (() => { const d = new Date(start); const nm = d.getMonth() + 1; return new Date(d.getFullYear(), nm, Math.min(canvaCfg.resetDay, new Date(d.getFullYear(), nm + 1, 0).getDate())).getTime(); })();
  return { used, allowance: canvaCfg.allowance, remaining: null, quotaKnown: false, estimatedRemaining: Math.max(0, canvaCfg.allowance - used), budgetReached: used >= canvaCfg.allowance, slow: used >= canvaCfg.allowance, resetsAt: next, pauseUntil: pauseUntil > Date.now() ? pauseUntil : null, spacingSec: canvaCfg.spacingSec, pauseMin: canvaCfg.pauseMin, resetDay: canvaCfg.resetDay };
}
const nap = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal?.addEventListener('abort', () => { clearTimeout(t); rej({ code: 'stopped' }); }, { once: true }); });
/* one image at a time, spaced; slower once the monthly allowance is used */
let chain = Promise.resolve();
export function beforeImage(signal, onWait) {
  const turn = chain.then(async () => {
    const u = canvaUsage(); if (u.budgetReached) throw {code:'rate_limited',provider:'canva',resetAt:u.resetsAt,budget:true,message:'Bugetul local estimativ Canva a fost atins. Soldul real este necunoscut; verifică în cont înainte de reluare.'}; const gap = canvaCfg.spacingSec * 1000;
    const until = Math.max(lastImage + gap, pauseUntil);
    if (until > Date.now()) { onWait?.(until, u.slow ? 'ritm lent: alocarea Canva a lunii e consumată' : pauseUntil > Date.now() ? 'pauză cerută de Canva' : ''); await nap(until - Date.now(), signal); }
    lastImage = Date.now();
  });
  chain = turn.catch(() => {});
  return turn;
}
export function canvaPaused() { pauseUntil = Date.now() + canvaCfg.pauseMin * 60e3; return pauseUntil; }

export async function flushGovernor(){clearTimeout(saveT);if(storage)await storage.writeJSON('usage.json',{calls:calls.slice(-20000),gptTextCalls:gptTextCalls.slice(-20000),gptImageCalls:gptImageCalls.slice(-20000),settings});}
