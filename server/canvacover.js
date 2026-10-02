/**
 * Coperta și paginile fixe din șabloanele tale de brand Canva (plan 2.7–2.10), toate incluse în Canva Pro:
 *  - câmpurile șablonului se completează din volumul aprobat (autofill), coperta ilustrată intră în câmpul de imagine;
 *  - verificările automate rămân ca un comentariu pe design; înainte de export se citesc comentariile deschise;
 *  - exportul PDF și formatele de promovare (redimensionare) se salvează la proiect și intră în pachetul de livrare.
 * Nimic nu consumă generări de imagine: șablonul se completează, nu se desenează.
 */
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ROLES = [
  ['collection', /(subtit|colect|collection|serie|series)/],
  ['volume', /(volum|volume|numar|number|^nr)/],
  ['blurb', /(blurb|spate|back|descri|rezumat|summary)/],
  ['author', /(autor|author|editur|publisher)/],
  ['title', /(titl|title|nume|name)/]
];
export function roleOf(name) { const n = norm(name); for (const [r, re] of ROLES) if (re.test(n)) return r; return null; }

export function coverValues(p, art, v) {
  const f = art[`final_${v}`]?.content || {}; const brief = art.brief?.content || {};
  return { title: f.title || '', collection: brief.collection_title || p.title || '', volume: `${f.labels?.volume || 'Volume'} ${v + 1}`, blurb: f.back_cover_blurb || '', author: p.input?.author || '' };
}

export async function makeCover({ repo, canva, p, v, templateId }) {
  if (!templateId) throw { status: 400, message: 'Alege întâi un șablon de brand Canva pentru copertă.' };
  const art = await repo.artifacts(p.id); if (!art[`final_${v}`]) throw { status: 400, message: 'Volumul nu are text final.' };
  const fields = await canva.templateFields(templateId);
  if (!Object.keys(fields).length) throw { status: 400, message: 'Șablonul ales nu are câmpuri de completat automat. În Canva, deschide șablonul de brand și marchează textele și imaginea ca „câmpuri de date” (Bulk create / Data autofill).' };
  const vals = coverValues(p, art, v); const data = {}; const filled = [], skipped = [];
  let imageDone = false;
  for (const [name, type] of Object.entries(fields)) {
    if (type === 'text') { const r = roleOf(name); const t = r ? vals[r] : ''; if (t) { data[name] = { type: 'text', text: t }; filled.push(name); } else skipped.push(name); }
    else if (type === 'image' && !imageDone) {
      const cover = art[`ill_${v}_0`]?.content;
      if (cover?.color) { const asset = cover.mediaId || await canva.upload(await repo.readFile(p.id, cover.color)); data[name] = { type: 'image', asset_id: String(asset) }; filled.push(name); imageDone = true; } else skipped.push(name);
    } else skipped.push(name);
  }
  if (!filled.length) throw { status: 400, message: `Nu am recunoscut niciun câmp al șablonului (${Object.keys(fields).join(', ')}). Denumește câmpurile, de exemplu: titlu, colectie, volum, spate, coperta.` };
  const d = await canva.autofill(templateId, data, `${vals.collection}: ${vals.title}`);
  const pre = (art.preflight?.content?.checks || []).filter(c => c.status !== 'pass').map(c => `${c.label}: ${c.detail}`);
  const qa = art[`ill_${v}_0`]?.content?.qa;
  const notes = [...pre, ...(qa && !qa.ok ? [`Coperta, verificarea vizuală: ${(qa.issues || []).join(' ')}`] : [])];
  if (notes.length) await canva.comment(d.designId, `[WonderPages] Verificări automate de văzut înainte de tipar:\n- ${notes.join('\n- ')}`).catch(() => {});
  const content = { designId: d.designId, link: d.link, templateId, filled, skipped, notes, at: Date.now(), pdf: null, promo: [] };
  await repo.writeArtifact(p.id, `canva_${v}`, content, { note: 'Coperta din șablonul de brand Canva' });
  return exportCover({ repo, canva, p, v, force: true });
}

export async function exportCover({ repo, canva, p, v, force = false }) {
  const art = await repo.artifacts(p.id); const c = art[`canva_${v}`]?.content; if (!c?.designId) throw { status: 400, message: 'Creează întâi coperta din șablon.' };
  const comments = await canva.comments(c.designId).catch(() => []);
  const open = comments.filter(x => x.resolved === false && !/^\[WonderPages\]/.test(x.text));
  if (open.length && !force) { const b = { ...c, blocked: true, comments }; await repo.writeArtifact(p.id, `canva_${v}`, b, { note: 'Export oprit: comentarii nerezolvate în Canva' }); return b; }
  const pdf = await canva.exportDesign(c.designId, { type: 'pdf', export_quality: 'pro' });
  if (!pdf.buffer.subarray(0, 5).toString().startsWith('%PDF')) throw { status: 502, message: 'Canva a trimis un fișier care nu e PDF.' };
  const rel = await repo.saveFile(p.id, `canva/coperta-vol${v + 1}-${Date.now().toString(36)}.pdf`, pdf.buffer);
  const next = { ...c, pdf: rel, exportedAt: Date.now(), comments, blocked: false };
  await repo.writeArtifact(p.id, `canva_${v}`, next, { note: 'Export PDF din Canva' });
  return next;
}

export async function makePromo({ repo, canva, p, v, formats }) {
  const art = await repo.artifacts(p.id); const c = art[`canva_${v}`]?.content; if (!c?.designId) throw { status: 400, message: 'Creează întâi coperta din șablon.' };
  const promo = [];
  for (const f of formats || []) {
    const id = await canva.resize(c.designId, f.width, f.height);
    const img = await canva.exportDesign(id, { type: 'png', width: f.width, height: f.height });
    promo.push({ key: f.key, label: f.label, designId: id, file: await repo.saveFile(p.id, `canva/promo-vol${v + 1}-${f.key}.png`, img.buffer) });
  }
  const next = { ...c, promo, promoAt: Date.now() };
  await repo.writeArtifact(p.id, `canva_${v}`, next, { note: 'Formate de promovare din Canva' });
  return next;
}
