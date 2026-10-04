/**
 * Complete release from a source allowlist; no installed data or credentials.
 * P8-T01: a package is produced ONLY from a passing release gate (scripts/enterprise/release-gate.mjs) for exactly these
 * sources. `--evidence=<file>` reuses a gate run whose source digest matches; otherwise the full gate runs here.
 * The release carries RELEASE-EVIDENCE.json (code/schema/policy/tool versions + the checks that actually ran) and the
 * staged copy is scanned again by the secret sentinel before anything is zipped.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { zipDir } from '../server/output.js';
import { RELEASE_INCLUDE, runGate, sourceDigest, secretSentinel, shipped } from './enterprise/release-gate.mjs';
import { licenseReport, noticesMarkdown } from './enterprise/licenses.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg=name=>process.argv.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3);
let parent=path.dirname(app);
while(parent!==path.parse(parent).root){try{await fs.access(path.join(parent,'app.kit.versions'));break;}catch{parent=path.dirname(parent);}}
const versions=path.resolve(arg('output')||path.join(parent,'app.kit.versions'));
const include = RELEASE_INCLUDE;

/* release gate: a failed or missing required check blocks the package before anything is written */
const evidenceArg = arg('evidence'), digest0 = sourceDigest(app, include);
let evidence;
if (evidenceArg) { evidence = JSON.parse(await fs.readFile(path.resolve(evidenceArg), 'utf8')); if (evidence.source?.sha256 !== digest0.sha256) { console.error('Dovada porții de release este pentru alte surse (digest diferit): rulează din nou poarta.'); process.exit(1); } }
else evidence = await runGate({ root: app });
if (!evidence.ok) { console.error(`Pachet refuzat: poarta de release este ${evidence.status}.`); for (const c of evidence.checks || []) if (c.required && c.status !== 'PASS') console.error(`  ${c.status} ${c.id}: ${c.detail}`); process.exit(1); }

await fs.mkdir(versions,{recursive:true});
const mixed = process.argv.includes('--edition=claude-gpt');
const pattern = mixed ? /^wonderpages-ai\.claude-gpt\.v(\d{2})\.zip$/ : /^wonderpages-ai\.v(\d{3})\.zip$/;
const current = (await fs.readdir(versions)).map(x => pattern.exec(x)).filter(Boolean)
  .map(x => Number(x[1]));
const next = arg('version') || String(Math.max(0, ...current) + 1).padStart(mixed ? 2 : 3, '0');
if(!new RegExp(mixed?'^\\d{2}$':'^\\d{3}$').test(next))throw Error('Număr de versiune invalid.');
const name=mixed?`wonderpages-ai.claude-gpt.v${next}`:`wonderpages-ai.v${next}`;
const folder=path.join(versions,name),dest=folder+'.zip',previous=folder+'.previous';
const pending = dest + '.part';
/* P8-T03: one timestamp for the whole release (the gate's, or --at / SOURCE_DATE_EPOCH): same sources + evidence → same bytes */
const releasedAt = arg('at') || (process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : evidence.at);
const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpages-release-'));
const forbidden=new Set(['node_modules','.git','.env','data','_backup','.cache']);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function inventory(dir,base=dir,list=[]){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(forbidden.has(e.name)||e.isSymbolicLink())throw Error('Fișier privat sau legătură în release: '+e.name);const file=path.join(dir,e.name);if(e.isDirectory())await inventory(file,base,list);else{if(/\.(log|part|tmp|bak)$/.test(e.name)||/^\.env\./.test(e.name)&&e.name!=='.env.example')throw Error('Fișier temporar în release: '+e.name);const bytes=await fs.readFile(file);list.push({path:path.relative(base,file).split(path.sep).join('/'),bytes:bytes.length,sha256:digest(bytes)});}}return list;}
try {
  for (const item of include) await fs.cp(path.join(app, item), path.join(stage, item), { recursive: true, dereference:false, filter:src=>shipped(path.relative(app,src).split(path.sep).join('/')) });
  const pkg=JSON.parse(await fs.readFile(path.join(stage,'package.json'),'utf8'));
  const staged=secretSentinel(stage,await fs.readdir(stage));
  if(!staged.ok)throw Error('Santinela de secrete a oprit release-ul: '+staged.hits.slice(0,3).map(h=>h.file+' ('+h.reason+')').join('; '));
  await fs.writeFile(path.join(stage,'RELEASE-EVIDENCE.json'),JSON.stringify({...evidence,release:name},null,2));
  await fs.writeFile(path.join(stage,'THIRD-PARTY-NOTICES.md'),noticesMarkdown(licenseReport(app),app));   // P8-T03
  await fs.writeFile(path.join(stage,'RELEASE-MANIFEST.json'),JSON.stringify({edition:pkg.edition,version:pkg.version,release:name,at:releasedAt,gate:{status:evidence.status,at:evidence.at,source:evidence.source},versions:evidence.versions,files:(await inventory(stage)).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)},null,2));
  const result=await zipDir(stage,pending,name,{mtime:releasedAt});
  if(path.dirname(previous)!==versions)throw Error('Destinație de release invalidă.');
  await fs.rm(previous,{recursive:true,force:true});
  try{await fs.access(folder);await fs.rename(folder,previous);}catch(e){if(e.code!=='ENOENT')throw e;}
  try{await fs.cp(stage,folder,{recursive:true});await fs.rename(pending,dest);}catch(e){await fs.rm(folder,{recursive:true,force:true});try{await fs.rename(previous,folder);}catch(rollback){if(rollback.code!=='ENOENT')throw rollback;}throw e;}
  await fs.rm(previous,{recursive:true,force:true});
  await fs.writeFile(dest+'.sha256',digest(await fs.readFile(dest))+'  '+path.basename(dest)+'\n');
  console.log(JSON.stringify({folder,zip:dest,...result,edition:pkg.edition}));
} finally {
  await fs.rm(pending, { force: true });
  await fs.rm(stage, { recursive: true, force: true });
}
