#!/usr/bin/env node
// SIMULARE a Codex CLI pentru teste: imagini și apeluri text prin `codex exec`.
const fs = require('fs'); const path = require('path'); const os = require('os');
const S = require('../state.cjs'); const PNG = require('../png.cjs');
const { answer } = require('./claude.cjs');
const a = process.argv.slice(2); const st = S.read(); const mode = st.codex || 'ok';
if(a[0]==='app-server'){
 require('readline').createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line);if(m.method==='initialize')console.log(JSON.stringify({id:m.id,result:{}}));if(m.method==='account/rateLimits/read')console.log(JSON.stringify({id:m.id,result:{rateLimits:{primary:{usedPercent:mode==='ratelimit'?100:1,resetsAt:Math.floor(Date.now()/1000)+3600},secondary:{usedPercent:1,resetsAt:Math.floor(Date.now()/1000)+86400},credits:{hasCredits:true,balance:'100'},planType:'plus'}}}));});
}else{
if (a[0] === '--version') { console.log('codex-cli 0.0.0-test'); process.exit(0); }
if (a[0] === 'login' && a[1] === 'status') { console.log(mode === 'noauth' ? 'Not logged in' : 'Logged in using ChatGPT'); process.exit(0); }
let input = ''; process.stdin.on('data', d => { input += d; }); process.stdin.on('end', () => {
  const text = a.includes('--output-last-message');
  S.log('codex', { kind: text ? 'text' : 'image', model: a.includes('--model') ? a[a.indexOf('--model') + 1] : null,
    reasoning: a.includes('-c') ? a[a.indexOf('-c') + 1] : null, schema: a.includes('--output-schema'),
    apiKeyInEnv: !!process.env.OPENAI_API_KEY || !!process.env.CODEX_API_KEY, refs: a.filter((x, i) => a[i - 1] === '-i').length });
  if (text) {
    if (mode === 'ratelimit') { console.error('You have reached your usage limit. Try again later.'); process.exit(1); }
    const result = answer(input, st);
    const body = mode === 'badjson' ? 'This is not JSON.' : result.text ?? JSON.stringify(result.json);
    fs.writeFileSync(a[a.indexOf('--output-last-message') + 1], body);
    console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: body } }));
    console.log(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: Math.ceil(input.length / 4), output_tokens: 200 } }));
    process.exit(0);
  }
  if (mode === 'pause' && S.bump('codex_pause') <= (st.pauseTimes || 1)) { console.error('You have reached your image usage limit, try again later'); process.exit(1); }
  const dir = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'generated_images', 'sess'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `img-${Date.now()}-${Math.random().toString(36).slice(2)}.png`), /colouring-book|black-and-white/i.test(input) ? PNG.lineart() : PNG.colour(7));
  if (st.codexForeignImage) fs.writeFileSync(path.join(dir, `foreign-${Date.now()}.png`), PNG.colour(3));   // P3-T04: another client writes into the same folder during our run
  console.log('DONE');
});
}
