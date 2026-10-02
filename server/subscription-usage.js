import { spawn } from 'node:child_process';
import { APP_VERSION } from './config.js';
export function includedQuota(result, at=Date.now()) {
  const limit=result?.rateLimitsByLimitId?.codex || result?.rateLimits;
  const windows=[limit?.primary,limit?.secondary].filter(Boolean);
  if(!windows.length || windows.some(w=>!Number.isFinite(w.usedPercent)))throw {code:'quota_unknown',message:'Limita inclusă ChatGPT nu poate fi verificată. Nu pornesc generarea; verifică abonamentul și reîncearcă.'};
  const blocked=windows.filter(w=>w.usedPercent>=100);
  if(blocked.length || result.ordinaryUsageAllowed===false || limit.spendControlReached)throw {code:'rate_limited',provider:'codex',resetAt:Math.max(at+60000,...blocked.map(w=>Number(w.resetsAt||0)*1000)),message:'Limita Codex inclusă în ChatGPT a fost atinsă. Aștept resetarea; soldul de credite nu este folosit pentru continuare.'};
  return {checkedAt:at,primary:limit.primary,secondary:limit.secondary,planType:limit.planType,creditsContinuation:false};
}
export async function checkIncludedQuota({cli=null,env=process.env,signal}={}) {
  const args=cli?[cli,'app-server','--stdio']:['app-server','--stdio'];
  const clean={...env};for(const key of ['OPENAI_API_KEY','CODEX_API_KEY','AZURE_OPENAI_API_KEY','OPENAI_BASE_URL'])delete clean[key];
  return new Promise((resolve,reject)=>{
    let line='',done=false;
    const child=spawn(cli?process.execPath:'codex',args,{env:clean,shell:!cli&&process.platform==='win32',stdio:['pipe','pipe','pipe'],windowsHide:true});
    const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);child.stdin.end();child.kill();error?reject(error):resolve(result);};
    const abort=()=>finish({code:'stopped',message:'Oprit.'});
    const timer=setTimeout(()=>finish({code:'quota_unknown',message:'Verificarea cotei ChatGPT nu a răspuns; generarea este oprită.'}),20000);
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)return abort();
    const send=m=>child.stdin.write(JSON.stringify(m)+'\n');child.stdin.on('error',()=>{});child.stderr.resume();
    child.on('error',()=>finish({code:'quota_unknown',message:'Verificarea oficială a cotei Codex nu poate porni.'}));
    child.on('close',()=>{if(!done)finish({code:'quota_unknown',message:'Verificarea cotei Codex s-a închis fără rezultat.'});});
    child.stdout.on('data',data=>{line+=data;let end;while((end=line.indexOf('\n'))>=0){const raw=line.slice(0,end);line=line.slice(end+1);let m;try{m=JSON.parse(raw);}catch{continue;}if(m.id===1){if(m.error)return finish({code:'quota_unknown',message:'Inițializarea verificării Codex a fost refuzată.'});send({method:'initialized',params:{}});send({id:2,method:'account/rateLimits/read',params:{}});}if(m.id===2){if(m.error)return finish({code:'quota_unknown',message:'Cota inclusă ChatGPT nu este disponibilă. Generarea este oprită.'});try{finish(null,includedQuota(m.result));}catch(e){finish(e);}}}});
    send({id:1,method:'initialize',params:{clientInfo:{name:'wonderpages-quota',version:APP_VERSION}}});
  });
}
