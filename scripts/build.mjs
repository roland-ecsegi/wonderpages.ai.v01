/** Production verification for the unbundled JavaScript app; no generated source replacement. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checked=0;
async function check(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())await check(rel);else if(/\.(js|mjs|cjs)$/.test(e.name)){const r=spawnSync(process.execPath,['--check',path.join(root,rel)],{encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(rel+'\n'+r.stderr);checked++;}else if(e.name.endsWith('.json'))JSON.parse(await fs.readFile(path.join(root,rel),'utf8'));}}
for(const dir of ['server','public/app','scripts','tests','blueprints','seeds','agents'])await check(dir);
/* the app scripts share one global scope: a duplicated top-level name breaks the whole page (P4-T02 regression guard) */
{const seen=new Map();for(const f of (await fs.readdir(path.join(root,'public/app'))).filter(x=>x.endsWith('.js'))){for(const m of (await fs.readFile(path.join(root,'public/app',f),'utf8')).matchAll(/^(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)){if(seen.has(m[1])&&seen.get(m[1])!==f+':'+m.index)throw Error(`Nume global duplicat în public/app: ${m[1]} (${seen.get(m[1]).split(':')[0]} și ${f})`);seen.set(m[1],f+':'+m.index);}}}
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')),lock=JSON.parse(await fs.readFile(path.join(root,'package-lock.json'),'utf8'));
if(pkg.version!==lock.version||pkg.version!==lock.packages[''].version)throw Error('Versiunile manifestelor diferă.');
for(const [name,version] of Object.entries(pkg.dependencies))if(lock.packages[''].dependencies[name]!==version)throw Error('Dependency lock mismatch: '+name);
for(const file of ['public/fonts/Andika-Regular.ttf','public/fonts/Andika-Bold.ttf','public/index.html','.env.example','instaleaza.bat'])await fs.access(path.join(root,file));
console.log('PASS: '+checked+' fișiere JavaScript, JSON, lockfile, fonturi și fișiere runtime; '+pkg.edition);
