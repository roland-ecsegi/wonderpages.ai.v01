import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SHIM = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shim', 'client');
export async function resolve(spec, ctx, next) {
  const m = spec.match(/^@modelcontextprotocol\/sdk\/client\/(index|streamableHttp|auth)\.js$/);
  if (m) return { url: pathToFileURL(path.join(SHIM, m[1] + '.js')).href, shortCircuit: true };
  return next(spec, ctx);
}
