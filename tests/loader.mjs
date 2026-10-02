// npm test: Canva simulat — importurile @modelcontextprotocol/sdk/client/* duc la dublura din tests/shim.
import { register, syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
const actualSpawn=childProcess.spawn;
childProcess.spawn=(command,args=[],options={})=> {
  if(command===process.execPath && /[\\/]@openai[\\/]codex[\\/]bin[\\/]codex\.js$/.test(args[0]||''))return actualSpawn(command,[fileURLToPath(new URL('./mocks/bin/codex.cjs',import.meta.url)),...args.slice(1)],options);
  return actualSpawn(command,args,options);
};
syncBuiltinESMExports();
register('./hooks.mjs', import.meta.url);
