/** Production verification for the unbundled JavaScript app; no generated source replacement. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checked=0;
async function check(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())await check(rel);else if(/\.(js|mjs|cjs)$/.test(e.name)){const r=spawnSync(process.execPath,['--check',path.join(root,rel)],{encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(rel+'\n'+r.stderr);checked++;}else if(e.name.endsWith('.json'))JSON.parse(await fs.readFile(path.join(root,rel),'utf8'));}}
for(const dir of ['server','public/app','scripts','tests','blueprints','seeds','agents'])await check(dir);
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')),lock=JSON.parse(await fs.readFile(path.join(root,'package-lock.json'),'utf8'));
if(pkg.version!==lock.version||pkg.version!==lock.packages[''].version)throw Error('Versiunile manifestelor diferă.');
for(const [name,version] of Object.entries(pkg.dependencies))if(lock.packages[''].dependencies[name]!==version)throw Error('Dependency lock mismatch: '+name);
for(const file of ['public/fonts/Andika-Regular.ttf','public/fonts/Andika-Bold.ttf','public/index.html','.env.example','instaleaza.bat'])await fs.access(path.join(root,file));
console.log('PASS: '+checked+' fișiere JavaScript, JSON, lockfile, fonturi și fișiere runtime; '+pkg.edition);
