// Continues the disposable UI fixture; refuses paths without its marker.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const tmp=process.argv[2],port=process.argv[3]||'4326';
if(!tmp||!path.basename(tmp).startsWith('wonderpages-ui-')||!fs.existsSync(path.join(tmp,'fake.json')))throw Error('Only disposable QA fixtures are accepted.');
const env={...process.env,PORT:port,STORAGE:'local',DATABASE_URL:'',DATA_DIR:path.join(tmp,'data'),OUTPUT_DIR:path.join(tmp,'out'),WP_FAKE_STATE:path.join(tmp,'fake.json'),CODEX_HOME:path.join(tmp,'codex'),CANVA_SPACING_SEC:'0',CANVA_POLL_MS:'30',CANVA_CONCURRENCY:'1',PATH:path.resolve('tests/mocks/bin')+path.delimiter+process.env.PATH,OPEN_BROWSER:'0',WP_BG:'',WP_TLS_CERT:'',WP_TLS_KEY:''};
const child=spawn(process.execPath,['--import','./tests/loader.mjs','server/start.js'],{env,stdio:['ignore','inherit','inherit'],windowsHide:true});process.on('SIGINT',()=>child.kill());child.on('close',code=>process.exit(code||0));
