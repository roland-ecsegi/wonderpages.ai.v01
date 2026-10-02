import { fingerprint } from './contracts.js';
export function deliveryFingerprint(project, bp, art, vol) {
  const volumes = vol == null ? Array.from({ length: bp.structure.volumes }, (_, i) => i) : [vol];
  const content = volumes.map(v => ({ v, text: art[`final_${v}`]?.content, adaptation: art[`tr_${v}`]?.content, images: Array.from({ length: bp.structure.pages + 1 }, (_, p) => { const c = art[`ill_${v}_${p}`]?.content; return [p, c?.color, c?.lineart]; }) }));
  return fingerprint({ input: project.input, options: { images: project.options?.images }, blueprint: bp, bible: art.bible?.content, brief: art.brief?.content, references: art.anchors?.content?.prompts?.map(r => [r.ref, r.image]), content });
}
export function requiredBooks(project, bp) {
  return (bp.structure.books || []).flatMap(book => book.per_language && project.input?.second_language ? [{ book: book.key, lang: 'first' }, { book: book.key, lang: 'second' }] : [{ book: book.key, lang: 'first' }]);
}
export function currentReceipts(project, bp, art, vol) {
  const current = deliveryFingerprint(project, bp, art, vol), exports = art[`delivery_${vol}`]?.content?.exports || [];
  const base = requiredBooks(project, bp).map(book => exports.find(e => e.book === book.book && e.lang === book.lang && e.fingerprint === current && e.kind === 'final')).filter(Boolean);
  if (new Set(base.map(e => e.preset)).size > 1) return [];
  return base[0]?.preset === 'kdp' ? [...base, ...base.map(e => exports.find(c => c.book === e.book + '-cover' && c.lang === e.lang && c.preset === 'kdp' && c.fingerprint === current && c.kind === 'final')).filter(Boolean)] : base;
}
export function deliveryComplete(project, bp, receipts) {
  const count = requiredBooks(project, bp).length;
  return receipts.length === count * (receipts[0]?.preset === 'kdp' ? 2 : 1);
}
