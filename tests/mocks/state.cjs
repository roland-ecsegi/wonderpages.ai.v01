// Starea comună a serviciilor simulate (fișier JSON indicat de WP_FAKE_STATE), ca testele să schimbe modul lor.
const fs = require('fs');
const F = () => process.env.WP_FAKE_STATE;
const read = () => { try { return JSON.parse(fs.readFileSync(F(), 'utf8')); } catch { return {}; } };
const write = s => fs.writeFileSync(F(), JSON.stringify(s, null, 1));
const bump = k => { const s = read(); s.counters = s.counters || {}; s.counters[k] = (s.counters[k] || 0) + 1; write(s); return s.counters[k]; };
const log = (who, e) => { try { fs.appendFileSync(F() + '.' + who + '.log', JSON.stringify({ at: Date.now(), ...e }) + '\n'); } catch {} };
module.exports = { read, write, bump, log };
