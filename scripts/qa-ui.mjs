// Isolated UI fixture: all providers simulated, no production credentials or data.
import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wonderpages-ui-')),port=Number(process.env.QA_PORT||4324);
const state=path.join(tmp,'fake.json');fs.writeFileSync(state,'{}');
const env={...process.env,PORT:String(port),STORAGE:'local',DATABASE_URL:'',DATA_DIR:path.join(tmp,'data'),OUTPUT_DIR:path.join(tmp,'out'),WP_FAKE_STATE:state,CODEX_HOME:path.join(tmp,'codex'),CANVA_SPACING_SEC:'0',CANVA_POLL_MS:'30',CANVA_CONCURRENCY:'1',PATH:path.join(root,'tests/mocks/bin')+path.delimiter+process.env.PATH,OPEN_BROWSER:'0',WP_BG:'',WP_TLS_CERT:'',WP_TLS_KEY:''};
const server=spawn(process.execPath,['--import','./tests/loader.mjs','server/start.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>process.stdout.write(d));server.stderr.on('data',d=>process.stderr.write(d));
process.on('SIGINT',()=>{server.kill();process.exit(0);});process.on('exit',()=>server.kill());
const api=async(method,p,body)=>{const r=await fetch('http://localhost:'+port+p,{method,headers:{'x-wp':'1','content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual'});return r;};
for(let i=0;i<100;i++){try{if((await api('GET','/api/state')).ok)break;}catch{}await new Promise(r=>setTimeout(r,300));}
const login=await api('GET','/api/canva/login'),token=new URL(login.headers.get('location')).searchParams.get('state');await api('GET','/oauth/callback?code=good-code&state='+token);
const p=await (await api('POST','/api/projects',{typeSlug:'kids-sc',input:{short_description:'Un dinozaur curios descoperă un indiciu în pajiște',target_age:'3-4',languages:['English','Romanian'],visual_style:'soft3d',page_format:'portrait45',title:'Pilot QA v03'}})).json();
await api('POST','/api/projects/'+p.id+'/start');
for(let gate=0;gate<3;gate++){
  let d;for(let i=0;i<300;i++){d=await(await api('GET','/api/projects/'+p.id)).json();if(d.project.status==='failed')throw Error(d.project.error);if(d.review&&!d.project.running)break;await new Promise(r=>setTimeout(r,100));}
  if(gate===2)break;
  await api('POST','/api/projects/'+p.id+'/items',{decisions:d.review.items.map(it=>({id:it.id,state:'approved'}))});await api('POST','/api/projects/'+p.id+'/gate/complete');
}
console.log(JSON.stringify({url:'http://localhost:'+port+'/#/p/'+p.id+'/review',id:p.id,tmp}));
