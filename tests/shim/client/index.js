import http from 'node:http';
import { createRequire } from 'node:module';
import { UnauthorizedError } from './auth.js';
const require = createRequire(import.meta.url); const S = require('../../mocks/state.cjs'); const PNG = require('../../mocks/png.cjs');
let uploadServer = null; let UPORT = 0;
function ensureUpload() { if (uploadServer) return uploadServer.ready; uploadServer = http.createServer((req, res) => { if (req.method === 'GET' && req.url.startsWith('/export/')) { const png = req.url.endsWith('.png'); res.writeHead(200, { 'content-type': png ? 'image/png' : 'application/pdf' }); res.end(png ? PNG.colour(3) : Buffer.from('%PDF-1.4\n% fake canva cover\n%%EOF')); return; } let n = 0; req.on('data', d => n += d.length); req.on('end', () => { const id = 'm-upl-' + S.bump('canva_upload'); S.log('canva', { op: 'upload', bytes: n, id }); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ asset: { id } })); }); }); uploadServer.ready = new Promise(r => uploadServer.listen(0, '127.0.0.1', () => { UPORT = uploadServer.address().port; r(); })); uploadServer.unref(); return uploadServer.ready; }
const JOBS = new Map();
export class Client {
  constructor(info) { this.info = info; }
  async connect(t) { this.t = t; const m = S.read().canva || 'ok'; if (m === 'down') throw new Error('ECONNREFUSED fake canva down'); await t._ensureAuth(); S.log('canva', { op: 'connect' }); }
  async close() {}
  async listTools() {
    const st = S.read(); if ((st.canva || 'ok') === 'unauthorized') throw new UnauthorizedError('token expired');
    const names = ['generate-image', 'get-generate-image-job', 'create-upload-url', 'list-brand-kits', 'search-brand-templates', 'get-brand-template-dataset', 'autofill-design', 'resize-design', 'export-design', 'comment-on-design', 'list-comments'];
    const drop = st.canvaToolsDrop || [];
    return { tools: names.filter(n => !drop.includes(n)).map(name => ({ name, inputSchema: { type: 'object', properties: st.canvaToolSchemaVariant && name === 'generate-image' ? { prompt: { type: 'string' }, extra: { type: 'string' } } : { prompt: { type: 'string' } } } })) };
  }
  async callTool({ name, arguments: a }) {
    const st = S.read(); const mode = st.canva || 'ok';
    S.log('canva', { op: 'callTool', name, mode, prompt: (a?.prompt || '').slice(0, 160), refs: (a?.imageReferences || []).length });
    if (mode === 'unauthorized') throw new UnauthorizedError('token expired');
    if (name === 'create-upload-url') { await ensureUpload(); return { content: [{ type: 'text', text: JSON.stringify({ upload_url: `http://127.0.0.1:${UPORT}/upload` }) }] }; }
    if (name === 'generate-image') {
      if (mode === 'pause' && S.bump('canva_pause_hits') <= (st.pauseTimes || 1)) throw new Error('Rate limit reached, please try again later');
      if (mode === 'refuse') return { isError: true, content: [{ type: 'text', text: 'Request violates content policy' }] };
      const id = 'job-' + S.bump('canva_jobs'); JOBS.set(id, { prompt: a.prompt, polls: 0 });
      return { content: [{ type: 'text', text: JSON.stringify({ job: { jobId: id, status: 'IN_PROGRESS' } }) }] };
    }
    if (name === 'get-generate-image-job') {
      const j = JOBS.get(a.jobId); if (!j) return { content: [{ type: 'text', text: JSON.stringify({ status: 'FAILED', failureMessage: 'unknown job' }) }] };
      if (j.polls++ < 1) return { content: [{ type: 'text', text: JSON.stringify({ status: 'IN_PROGRESS' }) }] };
      if (mode === 'jobfail') return { content: [{ type: 'text', text: JSON.stringify({ status: 'FAILED', failureMessage: 'generation failed' }) }] };
      const isLine = /colouring-book|coloring-book|black-and-white/i.test(j.prompt);
      const greyOnce = st.greyLineOnce && isLine && S.bump('grey_line') === 1;
      const buf = isLine ? PNG.lineart(400, 500, { grey: greyOnce }) : PNG.colour(Number(a.jobId.split('-')[1]));
      return { structuredContent: { status: 'SUCCESS', media_id: 'm-' + a.jobId }, content: [{ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' }, { type: 'text', text: JSON.stringify({ status: 'SUCCESS', media_id: 'm-' + a.jobId, url: 'https://www.canva.com/design/fake-' + a.jobId }) }] };
    }
    /* v19: brand kits, brand templates + autofill, export, resize, comments (Canva Pro) */
    const T = o => ({ content: [{ type: 'text', text: JSON.stringify(o) }] });
    if (name === 'list-brand-kits') return T({ items: [{ brand_kit_id: 'kit-1', name: 'WonderPages' }] });
    if (name === 'search-brand-templates') return T({ items: [{ brand_template_id: 'tpl-cover', title: 'Copertă KDP 8.5x11' }] });
    if (name === 'get-brand-template-dataset') return T({ dataset: { titlu: { type: 'text' }, colectie: { type: 'text' }, volum: { type: 'text' }, 'text spate': { type: 'text' }, coperta: { type: 'image' }, sigla: { type: 'text' } } });
    if (name === 'autofill-design') { S.log('canva', { op: 'autofill', data: a.data }); return T({ design: { design_id: 'DAF' + String(S.bump('designs')).padStart(8, '0'), urls: { edit_url: 'https://www.canva.com/design/DAFx/edit' } } }); }
    if (name === 'resize-design') return T({ design: { design_id: 'DRS' + String(S.bump('designs')).padStart(8, '0') } });
    if (name === 'export-design') { await ensureUpload(); return T({ job: { status: 'success', urls: [`http://127.0.0.1:${UPORT}/export/${a.design_id}.${a.format?.type === 'png' ? 'png' : 'pdf'}`] } }); }
    if (name === 'comment-on-design') { S.log('canva', { op: 'comment', text: a.message_plaintext }); return T({ comment: { id: 'c-' + S.bump('comments') } }); }
    if (name === 'list-comments') return T({ items: (st.canvaComments || []).map((c, i) => ({ id: 'cm' + i, message_plaintext: c.text, resolved: c.resolved })) });
    return { isError: true, content: [{ type: 'text', text: 'unknown tool ' + name }] };
  }
}
