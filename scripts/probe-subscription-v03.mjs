import {runCodexText,checkCodexText} from '../server/codextext.js';
import {checkClaudeAuth,runClaudeCode} from '../server/claudecode.js';
const claude=await checkClaudeAuth(),codex=await checkCodexText();console.log(JSON.stringify({claude,codex}));
if(claude.ok===true){try{const r=await runClaudeCode('Reply with the single word OK.',{model:'haiku',timeoutMs:120000});console.log('Claude Pro real: '+(/^OK[.!]?$/i.test(r.trim())?'PASS':'Unexpected response'));}catch(e){console.error(JSON.stringify(e));process.exitCode=1;}}
if(codex.ready){try{const r=await runCodexText('Reply with exactly OK.');console.log('Codex text real: '+(/^OK[.!]?$/i.test(r.trim())?'PASS':'Unexpected response'));}catch(e){console.error(JSON.stringify(e));process.exitCode=1;}}
