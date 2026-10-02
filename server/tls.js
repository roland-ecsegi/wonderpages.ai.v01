import https from 'node:https';import fs from 'node:fs/promises';
export const tlsEnabled=()=>!!process.env.WP_TLS_CERT&&!!process.env.WP_TLS_KEY;
export async function startTls(handler,{port,host='0.0.0.0'}={}) {
  if(!tlsEnabled())return null;
  const server=https.createServer({cert:await fs.readFile(process.env.WP_TLS_CERT),key:await fs.readFile(process.env.WP_TLS_KEY),minVersion:'TLSv1.2'},handler);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port||Number(process.env.WP_TLS_PORT||4322),host,resolve);});
  return server;
}
